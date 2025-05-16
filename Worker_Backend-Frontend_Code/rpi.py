from flask import Flask, Response, jsonify
import cv2
import serial
import RPi.GPIO as GPIO
from datetime import datetime
import time
from flask_cors import CORS

# This will start the Flask app and allow cross-origin requests
app = Flask(__name__)
CORS(app)

# --- GPIO Setup ---

GPIO.setmode(GPIO.BCM)

# Define GPIO pins for LEDs and Buzzer
LED_R = 17
LED_G = 27
LED_B = 22
BUZZER_PIN = 18

# This will set the pin modes
GPIO.setup(LED_R, GPIO.OUT)
GPIO.setup(LED_G, GPIO.OUT)
GPIO.setup(LED_B, GPIO.OUT)
GPIO.setup(BUZZER_PIN, GPIO.OUT)

# Set default LED state (Blue on startup)
GPIO.output(LED_R, GPIO.LOW)
GPIO.output(LED_G, GPIO.LOW)
GPIO.output(LED_B, GPIO.HIGH)
GPIO.output(BUZZER_PIN, GPIO.LOW)

# --- Camera Configuration ---

CAMERA_WIDTH = 1280
CAMERA_HEIGHT = 720
TARGET_FPS = 10
JPEG_QUALITY = 40

# --- Serial Setup for Arduino communication ---

# This will open the serial port to read alcohol data
ser = serial.Serial('/dev/arduino', 9600, timeout=1)

buzzed = False  # Prevent repeated buzzer alerts
alcohol_streaming = True  # Flag to control the alcohol stream endpoint

# ===== Camera Stream Function =====

def generate_frames():
    # This will open the camera and configure resolution and frame rate
    camera = cv2.VideoCapture(0)
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, CAMERA_WIDTH)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, CAMERA_HEIGHT)
    camera.set(cv2.CAP_PROP_FPS, TARGET_FPS)
    camera.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    camera.set(cv2.CAP_PROP_AUTOFOCUS, 0)

    while True:
        success, frame = camera.read()
        if not success:
            break

        # This will encode the frame as JPEG
        ret, buffer = cv2.imencode('.jpg', frame, [
            int(cv2.IMWRITE_JPEG_QUALITY), JPEG_QUALITY,
            int(cv2.IMWRITE_JPEG_OPTIMIZE), 1
        ])

        # Yielding the image to the browser as part of a multipart response
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

    camera.release()


@app.route('/cam-rpi')
def video_feed():
    # This will return the video stream from Raspberry Pi
    return Response(generate_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

#Alcohol Detection Helper Functions

# This will turn the buzzer ON for a given duration and then OFF
def trigger_buzzer(duration=2):
    GPIO.output(BUZZER_PIN, GPIO.HIGH)
    time.sleep(duration)
    GPIO.output(BUZZER_PIN, GPIO.LOW)

# This will parse the alcohol % value from serial data
def parse_alcohol(line):
    try:
        if "Alcohol:" in line:
            percent_str = line.split(':')[1].strip().replace('%', '')
            return float(percent_str)
    except:
        return None
    return None

# This will continuously stream alcohol data and trigger buzzer based on threshold
def generate_alcohol_data():
    global buzzed, alcohol_streaming
    alcohol_streaming = True  # Allow stream to start/restart

    while alcohol_streaming:
        try:
            line = ser.readline().decode('utf-8', errors='replace').strip()
            alcohol = parse_alcohol(line)

            if alcohol is not None:
                print(f"Alcohol: {alcohol}%")

                # This will buzz once when alcohol % is 20 or higher
                if alcohol >= 20.0 and not buzzed:
                    print("High alcohol detected! Buzzing...")
                    trigger_buzzer(2)
                    buzzed = True

                # This resets the buzzed flag when alcohol drops below threshold
                elif alcohol < 20.0:
                    buzzed = False

                # This sends the data in SSE format to frontend
                yield f"data: {datetime.now().strftime('%H:%M:%S')} - Alcohol: {alcohol}%\n\n"

        except Exception as e:
            print(f"Error: {e}")
            time.sleep(1)

# ===== Flask Routes =====


@app.route('/set_led/<color>')
def set_led(color):
    # This will control the LED color based on the route
    GPIO.output(LED_R, GPIO.LOW)
    GPIO.output(LED_G, GPIO.LOW)
    GPIO.output(LED_B, GPIO.LOW)

    if color == 'red':
        GPIO.output(LED_R, GPIO.HIGH)
    elif color == 'green':
        GPIO.output(LED_G, GPIO.HIGH)
    elif color == 'blue':
        GPIO.output(LED_B, GPIO.HIGH)

    return jsonify({"status": "success", "color": color})

@app.route('/alcohol_trigger')
def alcohol_stream():
    # This will start alcohol detection data stream
    return Response(generate_alcohol_data(), mimetype='text/event-stream')

@app.route('/stop_alcohol_trigger')
def stop_alcohol_trigger():
    # This will stop the alcohol stream
    global alcohol_streaming
    alcohol_streaming = False
    return jsonify({'message': 'Alcohol trigger stopped'})

# ===== Main Entry Point =====

if __name__ == '__main__':
    try:
        print("Starting combined Flask server - Camera and Alcohol Detection")
        app.run(host='0.0.0.0', port=5000, threaded=True)
    except KeyboardInterrupt:
        print("Shutting down...")
    finally:
        # This will safely close GPIO and serial port on exit
        GPIO.cleanup()
        ser.close()
        print("GPIO and serial port closed.")