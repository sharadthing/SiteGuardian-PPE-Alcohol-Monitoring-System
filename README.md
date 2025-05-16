# SiteGuardian - PPE & Alcohol Monitoring System

[System Overview]

A comprehensive safety monitoring system for industrial/construction sites that combines:
- Real-time PPE detection using computer vision
- Alcohol level monitoring
- Centralized admin dashboard
- Worker management system

## Key Features

1. **PPE Detection**:
   - Real-time detection of safety gear (helmet, vest, goggles, gloves)
   - YOLOv12 custom trained model
   - Visual and audible feedback system

2. **Alcohol Monitoring**:
   - MQ135 sensor integration via Arduino
   - Real-time alcohol level detection
   - Buzzer alert for high alcohol levels

3. **Worker Management**:
   - Clock-in/clock-out system
   - PPE compliance tracking
   - Alcohol test records
   - MongoDB database backend

4. **Admin Dashboard**:
   - Live camera feed monitoring
   - Real-time sensor data visualization
   - Worker analytics and reporting

## Hardware Components

- Raspberry Pi 5 (Central Hub)
- Arduino UNO R3 (Sensor Controller)
- MQ135 Alcohol/Gas Sensor
- 1080p USB Camera
- LCD1602 Display Module
- RGB LED Indicator
- Passive Buzzer

## Software Architecture
SiteGuardian/
├── rpi/ # Raspberry Pi code
│ ├── app.py # Main Flask application
│ ├── requirements.txt # Python dependencies
│ └── ...
├── main_server/ # Main processing server
│ ├── ppe_detection.py # YOLO detection logic
│ ├── routes_logic.py # API endpoints
│ ├── app.py # Flask application
│ └── ...
├── admin_dashboard/ # Admin interface
│ ├── app.py # Flask admin app
│ ├── routes.py # Admin API endpoints
│ └── ...
├── models/ # Machine learning models
│ └── best.pt # Custom YOLO model
├── docs/ # Documentation
└── ...


## Installation & Setup

### Raspberry Pi Setup

1. Clone this repository:
   ```bash
   
Install dependencies:

bash
pip install -r requirements.txt
Configure Arduino connection:

Connect Arduino via USB

Ensure serial port permissions are set correctly

Run the application:

bash
python app.py
Main Server Setup
Navigate to main server directory:

bash
cd ../main_server
Install dependencies:

bash
pip install -r requirements.txt
Configure MongoDB connection in routes_logic.py

Run the server:

bash
python app.py
Usage
Worker Flow:

Clock in via web interface

Complete PPE check at station

Take alcohol test

Begin work if compliant

Admin Dashboard:

Monitor live camera feeds

View real-time sensor data

Access worker compliance reports

Manage worker database

API Documentation
The system provides RESTful APIs for:

Worker management (/api/workers)

PPE detection (/api/ppe)

Alcohol monitoring (/api/alcohol)

Clock events (/api/clock)

See API_DOCS.md for detailed documentation.

License
MIT License - See LICENSE for details.

Contributing
Contributions are welcome! Please open an issue or pull request for any improvements.
