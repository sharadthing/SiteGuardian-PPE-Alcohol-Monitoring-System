from ultralytics import YOLO
import cv2
import requests
import time

class PPEDetector:
    def __init__(self):
        # Initialize the YOLO model for PPE detection
        self.model = YOLO("best.pt")  # our PPE detection model
        self.conf_thresh = 0.85  # only detect if confidence is above this threshold
        
        # Define the PPE classes that the model can detect
        self.ppe_classes = {
             1: "Gloves",
             2: "Goggles", 
             3: "Helmet",
            # 4: "Safety_Boots",  // disabled for now 
             5: "Vest"
        }
        
        # IP address of the Raspberry Pi for LED control
        self.rpi_ip = "192.168.0.30"  # raspberry pi IP
        
        # Variables to manage message timing
        self.last_message_time = time.time()
        self.current_message = 0
        
        # Dictionary to track if each PPE item has ever been detected
        self.persistent_detections = {name: False for name in self.ppe_classes.values()}

    def update_led_status(self, detections):
        """Toggles the LED on the Pi based on detections"""
        try:
            # Define the required PPE items for compliance
            required_items = ["Helmet", "Vest", "Goggles", "Gloves"]
            
            # Check if all required items are detected
            all_detected = all(detections.get(item, False) for item in required_items)
            
            # Send a request to the Raspberry Pi to set the LED color
            if all_detected:
                requests.get(f"http://{self.rpi_ip}:5000/set_led/green", timeout=1)  # green LED for compliance
            else:
                requests.get(f"http://{self.rpi_ip}:5000/set_led/red", timeout=1)  # red LED for non-compliance
        except requests.exceptions.RequestException as e:
            # Log any errors that occur while updating the LED
            print(f"Failed to update LED: {e}")  # fails quietly

    def detect(self, frame):
        # Initialize a dictionary to store detections for the current frame
        current_detections = {name: False for name in self.ppe_classes.values()}
        
        # Run the YOLO model on the input frame
        results = self.model(frame, conf=self.conf_thresh, imgsz=640)
        
        # Process the detection results
        for r in results:
            if r.masks is not None:  # Check if segmentation masks are available
                for box, mask in zip(r.boxes, r.masks):
                    if box.conf >= self.conf_thresh:  # Only consider detections above the confidence threshold
                        class_id = int(box.cls) + 1  # Adjust class index to match PPE classes
                        if class_id in self.ppe_classes:
                            # Mark the detected class as True in the current detections
                            current_detections[self.ppe_classes[class_id]] = True
        
        # Update the persistent detections dictionary
        for item in current_detections:
            if current_detections[item]:
                self.persistent_detections[item] = True
        
        # Update the LED status based on the persistent detections
        self.update_led_status(self.persistent_detections)
        
        # Annotate the frame with detection results
        annotated_frame = results[0].plot(
            masks=True,
            boxes=True,
            labels=True,
            conf=True
        )
        
        # Display the detection status for each PPE item on the frame
        y_offset = 30  # Initial vertical offset for text
        for ppe_item, detected in self.persistent_detections.items():
            # Create a status message for each PPE item
            status = f"{ppe_item}: {'DETECTED' if detected else 'MISSING'}"
            color = (0, 255, 0) if detected else (0, 0, 255)  # Green for detected, red for missing
            
            # Draw the status message on the frame
            cv2.putText(annotated_frame, status, (20, y_offset), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
            y_offset += 30  # Increment the vertical offset for the next item
        
        # Generate help messages for missing PPE items
        missing_items = [item for item, detected in self.persistent_detections.items() if not detected]
        if missing_items:
            instructions = []
            # Add specific instructions based on the missing items
            if "Helmet" in missing_items or "Goggles" in missing_items:
                instructions.append("Please come closer to the camera.")  # Suggest moving closer
            if "Gloves" in missing_items:
                instructions.append("Please make your hands visible.")  # Suggest showing hands
            if "Vest" in missing_items:
                instructions.append("Please wear your reflective Vest.")  # Suggest wearing a vest
            
            # Configure the display settings for the instructions
            message_color = (0, 165, 255)  # Orange color for instructions
            font_scale = 1.0
            line_height = 40  # Space between lines of text
            y_offset = annotated_frame.shape[0] - (len(instructions) * line_height) - 20
            
            # Make the instructions blink on the screen
            current_time = time.time()
            blink_on = int(current_time * 2) % 2 == 0  # Blink every 0.5 seconds
            
            if blink_on:  # Only display instructions when blinking is "on"
                for instruction in instructions:
                    # Calculate the size and position of the text
                    text_size = cv2.getTextSize(instruction, cv2.FONT_HERSHEY_SIMPLEX, font_scale, 2)[0]
                    text_x = (annotated_frame.shape[1] - text_size[0]) // 2  # Center the text horizontally
                    
                    # Draw the instruction on the frame
                    cv2.putText(annotated_frame, instruction, 
                                (text_x, y_offset), 
                                cv2.FONT_HERSHEY_SIMPLEX, font_scale, message_color, 2)
                    y_offset += line_height  # Increment the vertical offset for the next instruction
        
        # Return the updated persistent detections and the annotated frame
        return self.persistent_detections.copy(), annotated_frame