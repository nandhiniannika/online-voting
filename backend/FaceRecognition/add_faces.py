import face_recognition
import cv2
import pickle
import os
import time
import sys

# ✅ Define output directory for storing encodings
OUTPUT_DIR = "C:/Users/nandh/OneDrive/Desktop/Online_Voting/online-voting/backend/FaceRecognition/data"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ✅ Check if Voter ID is provided as an argument
if len(sys.argv) < 2:
    print("❌ ERROR: No Voter ID provided!")
    sys.exit(1)

voter_id = sys.argv[1]  # Get Voter ID from Node.js
print(f"🆔 Received Voter ID: {voter_id}")

# ✅ Initialize webcam with delay for proper startup
print("📷 Starting camera... Please wait...")
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)  # CAP_DSHOW helps in Windows

time.sleep(2)  # Give the camera some time to initialize

if not cap.isOpened():
    print("❌ ERROR: Camera not found or in use! Check permissions.")
    sys.exit(1)

# ✅ Capture an image
print("📸 Capturing image in 3 seconds... Please face the camera.")
time.sleep(3)

ret, frame = cap.read()
if not ret:
    print("❌ ERROR: Cannot capture frame")
    cap.release()
    sys.exit(1)

# ✅ Show captured image for verification (optional)
cv2.imshow("Captured Image", frame)
cv2.waitKey(2000)  # Display image for 2 seconds
cv2.destroyAllWindows()

# ✅ Release camera after capturing
cap.release()

# ✅ Convert frame to RGB (Face Recognition works on RGB images)
rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

# ✅ Detect faces in the captured frame
face_locations = face_recognition.face_locations(rgb_frame, model="hog")
if len(face_locations) == 0:
    print("❌ No face detected! Try again.")
    sys.exit(1)

print(f"✅ Detected {len(face_locations)} face(s). Encoding...")

# ✅ Get face encodings
encodings = face_recognition.face_encodings(rgb_frame, face_locations)

# ✅ Load existing encodings if they exist
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

# ✅ Store the new face encoding
if len(encodings) > 0:
    known_encodings.append(encodings[0])
    known_names.append(voter_id)
    print(f"✅ Face encoding stored for Voter ID: {voter_id}")
else:
    print("❌ Face encoding failed!")
    sys.exit(1)

# ✅ Save updated encodings
with open(faces_data_path, "wb") as f:
    pickle.dump(known_encodings, f)

with open(names_data_path, "wb") as f:
    pickle.dump(known_names, f)

print(f"🎉 Successfully stored {len(known_encodings)} face encodings for Voter ID: {voter_id}!")
sys.exit(0)  # Exit successfully
