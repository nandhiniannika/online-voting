import face_recognition
import pickle
import sys
import os
import cv2

# ✅ Load known face encodings
OUTPUT_DIR = "C:/Users/nandh/OneDrive/Desktop/Online_Voting/online-voting/backend/FaceRecognition/data"
faces_data_path = os.path.join(OUTPUT_DIR, "faces_data.pkl")
names_data_path = os.path.join(OUTPUT_DIR, "names.pkl")

if os.path.exists(faces_data_path) and os.path.exists(names_data_path):
    with open(faces_data_path, "rb") as f:
        known_encodings = pickle.load(f)
    with open(names_data_path, "rb") as f:
        known_names = pickle.load(f)
else:
    print("❌ ERROR: No stored face data found!")
    sys.exit(1)

# ✅ Check for input arguments
if len(sys.argv) < 3:
    print("❌ ERROR: No Voter ID or Image Path provided!")
    sys.exit(1)

voter_id = sys.argv[1]  # Get voter ID
image_path = sys.argv[2]  # Get image path

if not os.path.exists(image_path):
    print(f"❌ ERROR: Image file '{image_path}' not found!")
    sys.exit(1)

print(f"📷 Processing image for voter: {voter_id}")

# ✅ Load the uploaded image
test_image = cv2.imread(image_path)
rgb_test_image = cv2.cvtColor(test_image, cv2.COLOR_BGR2RGB)

# ✅ Detect faces in the image
face_locations = face_recognition.face_locations(rgb_test_image, model="hog")
if len(face_locations) == 0:
    print("❌ No face detected! Try again.")
    sys.exit(1)

# ✅ Get face encodings for the uploaded image
test_encodings = face_recognition.face_encodings(rgb_test_image, face_locations)

# ✅ Compare with known encodings
for test_encoding in test_encodings:
    matches = face_recognition.compare_faces(known_encodings, test_encoding)
    if True in matches:
        matched_index = matches.index(True)
        matched_voter_id = known_names[matched_index]
        
        if matched_voter_id == voter_id:
            print(f"✅ MATCH: {voter_id}")
            sys.exit(0)

print("❌ Face mismatch! Access denied.")
sys.exit(1)
