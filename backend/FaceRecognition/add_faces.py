import face_recognition
import cv2
import pickle
import os
import sys

# ✅ Ensure required arguments
if len(sys.argv) < 3:
    print("❌ ERROR: Missing arguments. Usage: python add_faces.py <voter_id> <image_path>")
    sys.exit(1)

voter_id = sys.argv[1]
image_path = sys.argv[2]

# ✅ Check if the image exists
if not os.path.exists(image_path):
    print(f"❌ ERROR: Image {image_path} not found!")
    sys.exit(1)

print(f"🆔 Processing image for Voter ID: {voter_id}")

# ✅ Load image from file instead of capturing from a camera
image = cv2.imread(image_path)
rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

# ✅ Detect faces
face_locations = face_recognition.face_locations(rgb_image)
if not face_locations:
    print("❌ No faces detected!")
    sys.exit(1)

# ✅ Encode face
face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
if not face_encodings:
    print("❌ Failed to encode face.")
    sys.exit(1)

# ✅ Save encoding
encodings_file = "FaceRecognition/data/faces_data.pkl"
names_file = "FaceRecognition/data/names.pkl"

known_encodings = []
known_names = []

if os.path.exists(encodings_file):
    with open(encodings_file, "rb") as f:
        known_encodings = pickle.load(f)
if os.path.exists(names_file):
    with open(names_file, "rb") as f:
        known_names = pickle.load(f)

known_encodings.append(face_encodings[0])
known_names.append(voter_id)

with open(encodings_file, "wb") as f:
    pickle.dump(known_encodings, f)
with open(names_file, "wb") as f:
    pickle.dump(known_names, f)

print(f"✅ Successfully stored face encoding for Voter ID: {voter_id}")
sys.exit(0)
