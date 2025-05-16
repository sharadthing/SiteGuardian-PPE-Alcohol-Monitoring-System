# tests/test_worker_routes.py

import pytest
import base64
import json
from datetime import datetime
from flask import Flask
import numpy as np

# Autouse fixture to push a Flask app context for jsonify()
@pytest.fixture(autouse=True)
def app_context():
    app = Flask(__name__)
    with app.app_context():
        yield

# Now import your application logic
import routes_logic as logic

# ─────────────────────────────────────────────────────────────────────────────
# Fixtures to stub out MongoDB collections and PPE detector
# ─────────────────────────────────────────────────────────────────────────────

class FakeCollection:
    def __init__(self, initial=None):
        self.docs = initial or {}
        self.last_update = None

    def find_one(self, filter, projection=None):
        worker_id = filter.get("site_access.worker_id")
        return self.docs.get(worker_id)

    def update_one(self, filter, update):
        worker_id = filter["site_access.worker_id"]
        self.last_update = (filter, update)
        doc = self.docs[worker_id]
        if "$set" in update:
            for k, v in update["$set"].items():
                doc[k] = v
        if "$push" in update:
            for field, event in update["$push"].items():
                date = field.split(".", 1)[1]
                doc.setdefault("daily_records", {}).setdefault(date, []).append(event)

        return

@pytest.fixture(autouse=True)
def stub_db_and_detector(monkeypatch):
    # Prepare two fake workers
    today = datetime.utcnow().strftime("%Y-%m-%d")
    worker_on = {
        "site_access": {"worker_id": "w_on", "working_status": "on"},
        "personal_info": {"full_name": "Alice"},
        "daily_records": {today: []}
    }
    worker_off = {
        "site_access": {"worker_id": "w_off", "working_status": "off"},
        "personal_info": {"full_name": "Bob"},
        "daily_records": {today: []}
    }
    fake_workers = FakeCollection({"w_on": worker_on, "w_off": worker_off})

    # Add top-level working_status so logic reads it correctly
    for doc in fake_workers.docs.values():
        doc["working_status"] = doc["site_access"]["working_status"]

    # Stub out get_db_collections()
    def fake_get_db_collections():
        return {
            "workers": fake_workers,
            "clock_events": None,
            "ppe_records": None
        }
    monkeypatch.setattr(logic, "get_db_collections", fake_get_db_collections)

    # Stub out the PPE detector (avoids real model calls)
    def fake_detect(frame):
        return ({"Gloves": True, "Goggles": False, "Helmet": True, "Vest": True}, frame)
    monkeypatch.setattr(logic.ppe_detector, "detect", fake_detect)

    return {"workers": fake_workers}


# ─────────────────────────────────────────────────────────────────────────────
# Tests for core logic functions
# ─────────────────────────────────────────────────────────────────────────────

def test_get_worker_status_found():
    resp, status = logic.get_worker_status_logic("w_off")
    assert status == 200
    body = resp.get_json()
    assert body["success"] is True
    assert body["data"]["worker_id"] == "w_off"
    assert body["data"]["full_name"] == "Bob"
    assert "working_status" in body["data"]

def test_get_worker_status_not_found():
    resp, status = logic.get_worker_status_logic("no_such")
    assert status == 404
    body = resp.get_json()
    assert body["success"] is False
    assert body["message"] == "Worker not found"

def test_handle_clock_event_missing_fields():
    resp, status = logic.handle_clock_event_logic({})
    assert status == 400
    assert resp.get_json()["message"] == "Missing required fields"

def test_handle_clock_event_worker_not_found():
    resp, status = logic.handle_clock_event_logic({"worker_id":"none","event_type":"clock-in"})
    assert status == 404
    assert resp.get_json()["message"] == "Worker not found"

def test_handle_clock_event_already_in():
    # w_on is already clocked in (top-level working_status='on')
    resp, status = logic.handle_clock_event_logic({"worker_id":"w_on","event_type":"clock-in"})
    assert status == 400
    assert "Already clocked in" in resp.get_json()["message"]

def test_handle_clock_event_already_out():
    # w_off is off, so clock-out invalid
    resp, status = logic.handle_clock_event_logic({"worker_id":"w_off","event_type":"clock-out"})
    assert status == 400
    assert "Not clocked in" in resp.get_json()["message"]

def test_handle_clock_event_success_clock_in(stub_db_and_detector):
    fake_workers = stub_db_and_detector["workers"]
    resp, status = logic.handle_clock_event_logic({"worker_id":"w_off","event_type":"clock-in"})
    assert status == 200
    body = resp.get_json()
    assert "clock-in recorded successfully" in body["message"]

    # Verify DB update called
    filt, update = fake_workers.last_update
    assert filt["site_access.worker_id"] == "w_off"
    assert update["$set"]["working_status"] == "on"

    # Verify event was pushed
    today = datetime.utcnow().strftime("%Y-%m-%d")
    assert len(fake_workers.docs["w_off"]["daily_records"][today]) == 1

def test_handle_ppe_scan_missing_fields():
    # No worker_id or detected_ppe key
    resp, status = logic.handle_ppe_scan_logic({})
    assert status == 400
    assert resp.get_json()["message"] == "Missing required fields"

def test_handle_ppe_scan_worker_not_found():
    # Provide a non-empty detected_ppe so we hit the 404 branch
    resp, status = logic.handle_ppe_scan_logic({
        "worker_id": "none",
        "detected_ppe": {"Helmet": False}
    })
    assert status == 404
    assert resp.get_json()["message"] == "Worker not found"

def test_handle_ppe_scan_success(stub_db_and_detector):
    fake_workers = stub_db_and_detector["workers"]
    data = {"worker_id":"w_off","detected_ppe":{"Helmet":True,"Vest":True}}
    resp, status = logic.handle_ppe_scan_logic(data)
    assert status == 200
    assert resp.get_json()["message"] == "PPE scan recorded successfully"

    # Ensure event was recorded
    today = datetime.utcnow().strftime("%Y-%m-%d")
    records = fake_workers.docs["w_off"]["daily_records"][today]
    assert any(e["event_type"] == "ppe-scan" for e in records)


# ─────────────────────────────────────────────────────────────────────────────
# Flask-route tests for simple endpoints
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def client(stub_db_and_detector):
    app = Flask(__name__)
    app.register_blueprint(logic.worker_bp)
    return app.test_client()

def test_status_endpoint(client):
    resp = client.get("/worker/w_off/status")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert data["data"]["full_name"] == "Bob"

def test_clock_endpoint(client):
    resp = client.post("/clock", json={"worker_id":"w_off","event_type":"clock-in"})
    assert resp.status_code == 200
    assert resp.get_json()["message"].startswith("clock-in recorded successfully")

def test_reset_and_check_ppe(client):
    # Reset PPE state
    r = client.get("/reset_ppe")
    assert r.status_code == 200
    assert r.get_json()["success"] is True

    # By default no detections => incomplete
    r2 = client.get("/check_ppe_complete")
    assert r2.status_code == 200
    j = r2.get_json()
    assert j["complete"] is False
    assert "missing_items" in j

def test_get_ppe_results_before_any(client):
    logic.current_detections = {}
    r = client.get("/get_ppe_results")
    assert r.status_code == 503
    assert r.get_json()["message"] == "No PPE detections available yet"
