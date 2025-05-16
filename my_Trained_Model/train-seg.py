from ultralytics import YOLO

# This loads the YOLOv11 model for segmentation
model = YOLO("yolo11s-seg.pt")  

# This will train the model on my dataset
train_results = model.train(
    data="data.yaml",
    epochs=100,
    imgsz=640,
    device="mps"
)


# This will validate the model after training
metrics = model.val()

# Run inference on a test image
results = model("/Users/nicktamang/UniversityY3/Computing_project/CW2/22march-dataset/PPE-detection-sharad.v1i.yolov11/test/images/IMG_9539_PNG.rf.3688b901d290954ffefc96d3a07320ba.jpg")

# Show the results
results[0].show()

# Export the trained model to ONNX format
path = model.export(format="onnx")  #This is the Path to exported model
