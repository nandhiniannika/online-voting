import face_recognition
import cv2
import pickle
import os
import sys
import requests
import numpy as np
import imutils

# ✅ Define output directory for storing encodings
OUTPUT_DIR = "/app/FaceRecognition/data"  # Update this to match your Docker path
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ✅ Check if Voter ID is provided
if len(sys.argv) < 2:
    print("❌ ERROR: No Voter ID provided!")
    sys.exit(1)

voter_id = sys.argv[1]  # Get Voter ID from Node.js
print(f"🆔 Received Voter ID: {voter_id}")

# ✅ Define Flask video stream URL
FLASK_STREAM_URL = "http://192.168.229.213:5000/video_feed"
  # Use host.docker.internal to access host from Docker

# ✅ Connect to Flask stream
print(f"🔄 Connecting to Flask video stream at {FLASK_STREAM_URL}...")
try:
    stream = requests.get(FLASK_STREAM_URL, stream=True, timeout=10)
except Exception as e:
    print(f"❌ ERROR: Could not connect to video stream!\n{e}")
    sys.exit(1)

if stream.status_code != 200:
    print("❌ ERROR: Stream not responding with 200 OK. Make sure Flask is running.")
    sys.exit(1)

# ✅ Processing frames
buffer = b""
captured_frame = None

for chunk in stream.iter_content(chunk_size=1024):
    buffer += chunk
    a = buffer.find(b'\xff\xd8')  # Start of JPEG
    b = buffer.find(b'\xff\xd9')  # End of JPEG

    if a != -1 and b != -1:
        jpg = buffer[a:b+2]
        buffer = buffer[b+2:]

        frame = cv2.imdecode(np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR)
        frame = imutils.resize(frame, width=640)

        captured_frame = frame
        break  # Stop after first valid frame

if captured_frame is None:
    print("❌ ERROR: No valid frame captured!")
    sys.exit(1)

# ✅ Convert frame to RGB
rgb_frame = cv2.cvtColor(captured_frame, cv2.COLOR_BGR2RGB)

# ✅ Detect faces
face_locations = face_recognition.face_locations(rgb_frame, model="hog")
if len(face_locations) == 0:
    print("❌ No face detected! Try again.")
    sys.exit(1)

print(f"✅ Detected {len(face_locations)} face(s). Encoding...")

# ✅ Get encodings
encodings = face_recognition.face_encodings(rgb_frame, face_locations)

# ✅ Load existing encodings
faces_data_path = os.path.join(OUTPUT_DIR, "faces_data.pkl")
names_data_path = os.path.join(OUTPUT_DIR, "names.pkl")

if os.path.exists(faces_data_path) and os.path.exists(names_data_path):
    with open(faces_data_path, "rb") as f:
        known_encodings = pickle.load(f)
    with open(names_data_path, "rb") as f:
        known_names = pickle.load(f)
else:
    known_encodings = []
    known_names = []

# ✅ Store new encoding
if len(encodings) > 0:
    known_encodings.append(encodings[0])
    known_names.append(voter_id)
    print(f"✅ Face encoding stored for Voter ID: {voter_id}")
else:
    print("❌ Face encoding failed!")
    sys.exit(1)

# ✅ Save encodings
with open(faces_data_path, "wb") as f:
    pickle.dump(known_encodings, f)
with open(names_data_path, "wb") as f:
    pickle.dump(known_names, f)

print(f"🎉 Successfully stored {len(known_encodings)} face encodings!")
sys.exit(0)
