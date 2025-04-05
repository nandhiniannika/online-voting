from flask import Flask, Response
import cv2

app = Flask(__name__)

# Initialize webcam
camera = cv2.VideoCapture(0)

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

@app.route('/')
def home():
    return "🎥 Video Stream Server is Running! Access <a href='/video_feed'>/video_feed</a> to view the feed."

# Properly release camera on shutdown
import atexit
@atexit.register
def cleanup():
    print("📷 Releasing camera...")
    if camera.isOpened():
        camera.release()

if __name__ == "__main__":
    try:
        app.run(host='0.0.0.0', port=5001, debug=False)  # Disable auto-reload
    except KeyboardInterrupt:
        print("📷 Camera released.")
        camera.release()
