import face_recognition
import numpy as np
import pickle
import sys
import os
import cv2
import time
import requests
import imutils

# ✅ Define paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  
DATA_DIR = os.path.join(BASE_DIR, "data")  

faces_data_path = os.path.join(DATA_DIR, "faces_data.pkl")
names_path = os.path.join(DATA_DIR, "names.pkl")

# ✅ Check if face data exists
if not os.path.exists(faces_data_path) or not os.path.exists(names_path):
    print("❌ ERROR: Face data files not found! Run `add_faces.py` first.")
    sys.exit(1)

# ✅ Load known encodings & names
with open(faces_data_path, "rb") as f:
    known_encodings = pickle.load(f)

with open(names_path, "rb") as f:
    known_names = pickle.load(f)

# ✅ Ensure voter_id is provided
if len(sys.argv) < 2:
    print("❌ ERROR: Missing voter ID! Usage: python recognize_faces.py <voter_id>")
    sys.exit(1)

voter_id = sys.argv[1]

# ✅ Define Flask video stream URL
FLASK_STREAM_URL = "http://127.0.0.1:5000/video_feed"  # Change this to your Railway URL if deployed

# ✅ Open Flask stream
print(f"🔄 Connecting to Flask video stream at {FLASK_STREAM_URL}...")
stream = requests.get(FLASK_STREAM_URL, stream=True)

if stream.status_code != 200:
    print("❌ ERROR: Could not connect to video stream! Ensure Flask is running.")
    sys.exit(1)

# ✅ Processing frames
recognized_voter_id = None
start_time = time.time()
RECOGNITION_TIME = 5  # Camera stays open for exactly 5 seconds
THRESHOLD = 0.5  

detected_ids = []  # Store recognized voter IDs
buffer = b""  # Buffer to store incoming bytes

for chunk in stream.iter_content(chunk_size=1024):
    buffer += chunk
    a = buffer.find(b'\xff\xd8')  # Start of JPEG
    b = buffer.find(b'\xff\xd9')  # End of JPEG

    if a != -1 and b != -1:
        jpg = buffer[a:b+2]  # Extract JPEG
        buffer = buffer[b+2:]  # Remove processed frame from buffer

        # ✅ Decode frame
        frame = cv2.imdecode(np.frombuffer(jpg, dtype=np.uint8), cv2.IMREAD_COLOR)
        frame = imutils.resize(frame, width=640)  # Resize for better processing
        
        # ✅ Convert to RGB for face recognition
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # ✅ Detect and encode faces
        face_locations = face_recognition.face_locations(rgb_frame)
        face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

        # ✅ Draw rectangles on detected faces
        for (top, right, bottom, left) in face_locations:
            cv2.rectangle(frame, (left, top), (right, bottom), (0, 255, 0), 2)

        cv2.imshow("Face Recognition - Align your face", frame)  # Show camera feed

        # ✅ Process recognition
        for captured_encoding in face_encodings:
            face_distances = face_recognition.face_distance(known_encodings, captured_encoding)
            best_match_index = np.argmin(face_distances)

            match_distance = face_distances[best_match_index]
            matched_id = known_names[best_match_index]

            if match_distance < THRESHOLD:
                detected_ids.append(matched_id)  # Store recognized IDs

        cv2.waitKey(1)  # Allow OpenCV to process GUI events

    # ✅ Stop after 5 seconds
    if time.time() - start_time > RECOGNITION_TIME:
        break

# ✅ Cleanup
cv2.destroyAllWindows()

# ✅ Final authentication check
if voter_id in detected_ids:
    print(f"✅ MATCH: {voter_id}")
    sys.exit(0)  # Success
else:
    print("❌ Authentication failed! Face not recognized within 5 seconds.")
    sys.exit(1)  # Failure
