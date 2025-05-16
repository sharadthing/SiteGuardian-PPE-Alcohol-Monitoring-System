from flask import Blueprint, request, jsonify, Response
from pymongo import MongoClient
from datetime import datetime
import uuid
import base64
import cv2
import numpy as np
import time
from ppe_detection import PPEDetector
import requests

# Database setup
# This connects to the MongoDB database and initializes the collections
client = MongoClient('mongodb://localhost:27017/')
db = client['com668_siteguardian']

# Initialize detector and global variables
# This initializes the PPE detector and sets up default detection states
ppe_detector = PPEDetector()
current_detections = {
    "Gloves": False,
    "Goggles": False,
    "Helmet": False,
    "Mask": False,
   # "Boots": False,
    "Vest": False
}  # Initialize with default values

# Create blueprint
# This creates a Flask blueprint for worker-related routes
worker_bp = Blueprint('worker', __name__)

# Helper Functions
# This function retrieves the database collections for workers, clock events, and PPE records
def get_db_collections():
    return {
        'workers': db['Workers'],
        'clock_events': db['ClockEvents'],
        'ppe_records': db['PPERecords']
    }

# This function handles errors and returns a JSON response with the error message
def handle_error(error):
    return jsonify({
        "success": False,
        "error": str(error),
        "message": "An error occurred"
    }), 500

# This function formats a response with optional data, a message, and an HTTP status code
def format_response(data=None, message="Success", status=200):
    response = {
        "success": status >= 200 and status < 300,
        "message": message
    }
    if data: 
        response["data"] = data
    return jsonify(response), status

# Core Logic Functions
# This function retrieves the status of a worker based on their worker ID
def get_worker_status_logic(worker_id):
    collections = get_db_collections()
    worker = collections['workers'].find_one(
        {"site_access.worker_id": worker_id},
        projection={"working_status": 1, "personal_info.full_name": 1}
    )
    if not worker:
        return format_response(message="Worker not found", status=404)
    return format_response({
        "worker_id": worker_id,
        "working_status": worker.get('working_status'),
        "full_name": worker['personal_info']['full_name']
    })

# This function handles clock-in and clock-out events for workers
def handle_clock_event_logic(data):
    collections = get_db_collections()
    worker_id = data.get('worker_id')
    event_type = data.get('event_type')
    
    if not worker_id or not event_type:
        return format_response(message="Missing required fields", status=400)
        
    worker = collections['workers'].find_one({"site_access.worker_id": worker_id})
    if not worker:
        return format_response(message="Worker not found", status=404)
        
    current_status = worker.get('working_status', 'off')
    if event_type == 'clock-in' and current_status == 'on':
        return format_response(message="Already clocked in", status=400)
    if event_type == 'clock-out' and current_status == 'off':
        return format_response(message="Not clocked in", status=400)
        
    new_status = 'on' if event_type == 'clock-in' else 'off'
    today = datetime.utcnow().strftime("%Y-%m-%d")
    clock_event = {
        "event_id": str(uuid.uuid4()),
        "event_type": event_type,
        "timestamp": datetime.utcnow()
    }
    
    # Update the worker's status and add the clock event to their daily records
    collections['workers'].update_one(
        {"site_access.worker_id": worker_id},
        {
            "$set": {"working_status": new_status},
            "$push": {f"daily_records.{today}": clock_event}
        }
    )
    return format_response(message=f"{event_type} recorded successfully")

# This function handles PPE scan events and saves the detected PPE data
def handle_ppe_scan_logic(data):
    collections = get_db_collections()
    worker_id = data.get('worker_id')
    detected_ppe = data.get('detected_ppe')
    
    if not worker_id or not detected_ppe:
        return format_response(message="Missing required fields", status=400)
        
    worker = collections['workers'].find_one({"site_access.worker_id": worker_id})
    if not worker:
        return format_response(message="Worker not found", status=404)
        
    today = datetime.utcnow().strftime("%Y-%m-%d")
    ppe_event = {
        "event_id": str(uuid.uuid4()),
        "event_type": "ppe-scan",
        "timestamp": datetime.utcnow(),
        "detected_items": detected_ppe,
        "compliant": detected_ppe.get("Helmet", False) and detected_ppe.get("Vest", False)
    }
    
    # Save the PPE scan event in the worker's daily records
    collections['workers'].update_one(
        {"site_access.worker_id": worker_id},
        {"$push": {f"daily_records.{today}": ppe_event}}
    )
    return format_response(message="PPE scan recorded successfully")


# Video Frame Generator
# This function generates video frames from the camera and annotates them with PPE detection results
def generate_frames():
    global current_detections
    camera = cv2.VideoCapture("http://192.168.0.30:5000/cam-rpi")
    
    if not camera.isOpened():
        print("Error: Could not open video stream")
        while True:
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + 
                  cv2.imencode('.jpg', np.zeros((480, 640, 3), dtype=np.uint8))[1].tobytes() + 
                  b'\r\n')
            time.sleep(0.1)
    
    while True:
        success, frame = camera.read()
        if not success:
            print("Error: Could not read frame")
            break
        
        try:
            # Detect PPE and annotate the frame
            detections, annotated_frame = ppe_detector.detect(frame)
            current_detections = detections
            
            ret, buffer = cv2.imencode('.jpg', annotated_frame)
            if not ret:
                print("Error: Could not encode frame")
                continue
                
            frame = buffer.tobytes()
            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        except Exception as e:
            print(f"Detection error: {str(e)}")
            continue
    
    camera.release()

# Route Handlers
# This route retrieves the status of a worker
@worker_bp.route('/worker/<string:worker_id>/status', methods=['GET'])
def get_worker_status(worker_id):
    try:
        return get_worker_status_logic(worker_id)
    except Exception as e:
        return handle_error(e)

# This route handles clock-in and clock-out events
@worker_bp.route('/clock', methods=['POST'])
def handle_clock_event():
    try:
        data = request.get_json()
        return handle_clock_event_logic(data)
    except Exception as e:
        return handle_error(e)

# This route streams video frames with PPE detection annotations
@worker_bp.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# This route retrieves the current PPE detection results
@worker_bp.route('/get_ppe_results')
def get_ppe_results():
    try:
        worker_id = request.args.get('worker_id')
        if not current_detections:
            return jsonify({
                "success": False,
                "message": "No PPE detections available yet"
            }), 503
            
        return jsonify({
            "success": True,
            "detections": current_detections,
            "compliant": all(current_detections.values())
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# This route handles PPE scan requests and processes the image data
@worker_bp.route('/ppe/scan', methods=['POST'])
def handle_ppe_scan():
    try:
        data = request.get_json()
        worker_id = data.get('worker_id')
        image_data = data.get('image')
        
        if not worker_id or not image_data:
            return format_response(message="Missing worker_id or image", status=400)
        
        # Decode the image and run PPE detection
        image_bytes = base64.b64decode(image_data.split(',')[1])
        frame = cv2.imdecode(np.frombuffer(image_bytes, np.uint8), cv2.IMREAD_COLOR)
        detected_ppe, _ = ppe_detector.detect(frame)
        
        # Prepare data for the logic handler
        request_data = {
            'worker_id': worker_id,
            'detected_ppe': detected_ppe
        }
        
        return handle_ppe_scan_logic(request_data)
        
    except Exception as e:
        return handle_error(e)
    
# This route resets the PPE detection state
@worker_bp.route('/reset_ppe')
def reset_ppe():
    global current_detections
    ppe_detector.persistent_detections = {name: False for name in ppe_detector.ppe_classes.values()}
    current_detections = {name: False for name in current_detections}
    return jsonify({"success": True, "message": "PPE state reset"})

# This route checks if all required PPE items have been detected
@worker_bp.route('/check_ppe_complete')
def check_ppe_complete():
    try:
        if all(current_detections.values()):
            return jsonify({
                "success": True,
                "complete": True,
                "message": "All required PPE detected"
            })
        else:
            return jsonify({
                "success": True,
                "complete": False,
                "message": "PPE incomplete",
                "missing_items": [k for k,v in current_detections.items() if not v]
            })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# This route approves a PPE record (placeholder for future functionality)
@worker_bp.route('/ppe/approve', methods=['POST'])
def approve_ppe_record():
    try:
        data = request.get_json()
        return jsonify({"success": True, "message": "PPE approved"})
    except Exception as e:
        return handle_error(e)
    

# This route retrieves alcohol data from the Raspberry Pi
@worker_bp.route('/get_alcohol_data')
def get_alcohol_data():
    try:
        # Fetch data from RPi Flask endpoint
        response = requests.get('http://192.168.0.30:5000/alcohol_trigger')
        if response.status_code == 200:
            # Process the response (assuming format is "data: 23:46:48 - Alcohol: 3.0%")
            lines = [line for line in response.text.split('\n') if line.startswith('data: ')]
            if lines:
                latest_data = lines[-1].replace('data: ', '').strip()
                return jsonify({'data': latest_data})
        return jsonify({'error': 'No data received'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    


# This route streams the live video feed with PPE detection annotations
@worker_bp.route('/detected_livestream')
def detected_livestream():
    """Stream the live video feed with PPE detection annotations from RPi camera"""
    return Response(generate_annotated_frames_from_rpi(), 
                  mimetype='multipart/x-mixed-replace; boundary=frame')

# This function generates annotated frames from the Raspberry Pi camera
def generate_annotated_frames_from_rpi():
    """Generator function that yields frames from RPi with PPE detection"""
    # Connect to RPi's video stream
    camera = cv2.VideoCapture("http://192.168.0.30:5000/cam-rpi")
    
    # Set desired frame size (adjust as needed)
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
    
    try:
        while True:
            success, frame = camera.read()
            if not success:
                print("Error reading frame from RPi camera")
                time.sleep(0.1)
                continue
                
            # Detect PPE and get annotated frame
            detections, annotated_frame = ppe_detector.detect(frame)
            
            # Update global detections
            global current_detections
            current_detections = detections
            
            # Encode frame as JPEG
            ret, buffer = cv2.imencode('.jpg', annotated_frame, [
                int(cv2.IMWRITE_JPEG_QUALITY), 70,
                int(cv2.IMWRITE_JPEG_OPTIMIZE), 1
            ])
            
            if not ret:
                continue
                
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            
    finally:
        camera.release()
        print("RPi camera stream released")