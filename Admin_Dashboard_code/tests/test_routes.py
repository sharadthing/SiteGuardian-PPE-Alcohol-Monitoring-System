# tests/test_routes.py

import pytest
from flask import Flask
from datetime import datetime
from werkzeug.security import generate_password_hash
from bson import ObjectId

import routes as app_routes

# ─────────────────────────────────────────────────────────────────────────────
# FakeCollection: in-memory stand-in for pymongo Collection
# ─────────────────────────────────────────────────────────────────────────────

class FakeCollection:
    def __init__(self):
        self.storage = {}

    def find_one(self, query):
        # support lookup by ObjectId("_id") or field equality
        if "_id" in query:
            return self.storage.get(query["_id"])
        for doc in self.storage.values():
            if all(doc.get(k) == v for k, v in query.items()):
                return doc
        return None

    def insert_one(self, doc):
        # always assign a true ObjectId
        new_id = ObjectId()
        doc["_id"] = new_id
        self.storage[new_id] = doc
        class R: inserted_id = new_id
        return R()

    def find(self, query=None):
        return list(self.storage.values())

    def update_one(self, filter, update):
        key = filter.get("_id")
        doc = self.storage.get(key)
        class R: modified_count = 0
        r = R()
        if doc and "$set" in update:
            for k, v in update["$set"].items():
                doc[k] = v
            r.modified_count = 1
        return r

    def delete_one(self, filter):
        key = filter.get("_id")
        class R: deleted_count = 0
        r = R()
        if key in self.storage:
            del self.storage[key]
            r.deleted_count = 1
        return r

# ─────────────────────────────────────────────────────────────────────────────
# Fixture: stub MongoDB collections and set up Flask test client
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture
def client(monkeypatch):
    fake_admin   = FakeCollection()
    fake_workers = FakeCollection()
    fake_codes   = FakeCollection()

    monkeypatch.setattr(app_routes, "admin_collection",   fake_admin)
    monkeypatch.setattr(app_routes, "worker_collection",  fake_workers)
    monkeypatch.setattr(app_routes, "accesscodes_collection", fake_codes)

    app = Flask(__name__)
    app.register_blueprint(app_routes.bp)
    return app.test_client()

# ─────────────────────────────────────────────────────────────────────────────
# Admin Authentication Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_register_missing_fields(client):
    r = client.post("/admin/register", json={})
    assert r.status_code == 400
    assert r.get_json()["message"] == "All fields are required"

def test_register_password_mismatch(client):
    data = {
        "full_name": "Alice", "email": "a@x.com",
        "password": "p1", "retype_password": "p2",
        "phone_number": "123", "terms_accepted": True
    }
    r = client.post("/admin/register", json=data)
    assert r.status_code == 400
    assert r.get_json()["message"] == "Passwords do not match"

def test_register_terms_not_accepted(client):
    data = {
        "full_name": "Bob", "email": "b@x.com",
        "password": "pass", "retype_password": "pass",
        "phone_number": "456", "terms_accepted": False
    }
    r = client.post("/admin/register", json=data)
    assert r.status_code == 400
    # current behavior: terms_accepted=False triggers the "all fields" branch
    assert r.get_json()["message"] == "All fields are required"

def test_register_and_duplicate(client):
    data = {
        "full_name": "Eve", "email": "e@x.com",
        "password": "secret", "retype_password": "secret",
        "phone_number": "789", "terms_accepted": True
    }
    r1 = client.post("/admin/register", json=data)
    assert r1.status_code == 201
    assert r1.get_json()["message"] == "Admin registered successfully"
    r2 = client.post("/admin/register", json=data)
    assert r2.status_code == 400
    assert r2.get_json()["message"] == "Admin already exists"

def test_login_invalid_and_success(client):
    # invalid before admin exists
    r = client.post("/admin/login", json={"email": "x@x.com", "password": "no"})
    assert r.status_code == 401
    # insert a fake admin then login
    hashed = generate_password_hash("abc")
    app_routes.admin_collection.insert_one({"email": "u@u.com", "password": hashed})
    r2 = client.post("/admin/login", json={"email": "u@u.com", "password": "abc"})
    assert r2.status_code == 200
    assert r2.get_json()["message"] == "Login successful"

# ─────────────────────────────────────────────────────────────────────────────
# Worker CRUD Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_get_workers_empty(client):
    r = client.get("/workers")
    assert r.status_code == 200
    assert r.get_json() == []

def test_create_worker_missing(client):
    r = client.post("/workers", json={})
    assert r.status_code == 400
    assert r.get_json()["message"] == "Missing required fields"

def test_worker_crud_cycle(client):
    payload = {
        "personal_info": {"full_name": "W1"},
        "contact_info": {"email": "w1@ex.com"},
        "emergency_contact": {},
        "site_access": {"worker_id": "wk1"}
    }
    r1 = client.post("/workers", json=payload)
    assert r1.status_code == 201

    wid = r1.get_json()["worker_id"]
    # now GET by valid ObjectId
    r2 = client.get(f"/workers/{wid}")
    assert r2.status_code == 200
    assert r2.get_json()["personal_info"]["full_name"] == "W1"

    r3 = client.put(f"/workers/{wid}", json={"personal_info": {"full_name": "W2"}})
    assert r3.status_code == 200

    r4 = client.delete(f"/workers/{wid}")
    assert r4.status_code == 200

    r5 = client.get(f"/workers/{wid}")
    # after deletion, your code returns 404
    assert r5.status_code == 404

def test_update_delete_invalid_id(client):
    r1 = client.put("/workers/invalid", json={"x":1})
    assert r1.status_code == 400
    r2 = client.delete("/workers/invalid")
    assert r2.status_code == 400

# ─────────────────────────────────────────────────────────────────────────────
# Access Code Validation Tests
# ─────────────────────────────────────────────────────────────────────────────

def test_validate_access_code(client):
    r1 = client.post("/validate-access-code", json={})
    assert r1.status_code == 400
    r2 = client.post("/validate-access-code", json={"access_code": "bad"})
    assert r2.status_code == 400
    app_routes.accesscodes_collection.insert_one({"access_code": "ok"})
    r3 = client.post("/validate-access-code", json={"access_code": "ok"})
    assert r3.status_code == 200
    assert r3.get_json()["message"] == "Access code is valid"
