from flask import Flask, Response
import cv2
import atexit

app = Flask(__name__)

# Initialize webcam
camera = cv2.VideoCapture(0)

# Route to stream video frames
def generate_frames():
    while True:
        success, frame = camera.read()
        if not success:
            break
        else:
            _, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

@app.route('/video_feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

# Home route
@app.route('/')
def home():
    return "🎥 Video Stream Server is Running! Access <a href='/video_feed'>/video_feed</a> to view the feed."

# ➕ Health check route for backend to verify server status
@app.route('/health')
def health():
    return "OK", 200

# Properly release the camera when the app is shutting down
@atexit.register
def cleanup():
    print("📷 Releasing camera...")
    if camera.isOpened():
        camera.release()

if __name__ == "__main__":
    try:
        app.run(host='0.0.0.0', port=5001, debug=False)
    except KeyboardInterrupt:
        print("📷 Camera released.")
        camera.release()
