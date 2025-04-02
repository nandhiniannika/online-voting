from flask import Flask, request, jsonify
import face_recognition
import cv2
import pickle
import os

app = Flask(__name__)

# ✅ Create necessary directories
UPLOAD_FOLDER = "./uploads"
DATA_FOLDER = "./data"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATA_FOLDER, exist_ok=True)

FACES_DATA_PATH = os.path.join(DATA_FOLDER, "faces_data.pkl")
NAMES_DATA_PATH = os.path.join(DATA_FOLDER, "names.pkl")

# ✅ Load existing encodings
if os.path.exists(FACES_DATA_PATH) and os.path.exists(NAMES_DATA_PATH):
    with open(FACES_DATA_PATH, "rb") as f:
        known_encodings = pickle.load(f)
    with open(NAMES_DATA_PATH, "rb") as f:
        known_names = pickle.load(f)
else:
    known_encodings = []
    known_names = []

@app.route("/api/add_face", methods=["POST"])
def add_face():
    if "image" not in request.files or "voter_id" not in request.form:
        return jsonify({"error": "Voter ID and Image required!"}), 400

    voter_id = request.form["voter_id"]
    image_file = request.files["image"]
    
    # ✅ Save image
    image_path = os.path.join(UPLOAD_FOLDER, f"{voter_id}.jpg")
    image_file.save(image_path)

    # ✅ Load image and convert
    image = cv2.imread(image_path)
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # ✅ Detect face
    face_locations = face_recognition.face_locations(rgb_image, model="hog")
    if not face_locations:
        return jsonify({"error": "No face detected! Try another image."}), 400

    # ✅ Encode face
    encodings = face_recognition.face_encodings(rgb_image, face_locations)
    if not encodings:
        return jsonify({"error": "Face encoding failed! Try again."}), 400

    # ✅ Store new encoding
    known_encodings.append(encodings[0])
    known_names.append(voter_id)

    # ✅ Save updated encodings
    with open(FACES_DATA_PATH, "wb") as f:
        pickle.dump(known_encodings, f)
    with open(NAMES_DATA_PATH, "wb") as f:
        pickle.dump(known_names, f)

    return jsonify({"message": f"Successfully stored face encoding for {voter_id}!"}), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
