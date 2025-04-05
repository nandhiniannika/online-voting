from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os

app = Flask(__name__)
CORS(app)

voter_list = []  # Replace with DB if needed

@app.route('/api/users/addvoter', methods=['POST'])
def add_voter():
    data = request.get_json()
    voter_id = data.get('voter_id')

    if not voter_id:
        return jsonify({"success": False, "message": "Voter ID is required"}), 400

    if voter_id in voter_list:
        return jsonify({"success": False, "message": "Voter already exists"}), 409

    voter_list.append(voter_id)
    print(f"📥 Voter ID received: {voter_id}")

    try:
        result = subprocess.run(["python", "add_faces.py", voter_id], capture_output=True, text=True, check=True)
        print("📸 Face captured:", result.stdout)
    except subprocess.CalledProcessError as e:
        print("❌ Face capture failed:", e.stderr)
        return jsonify({"success": False, "message": "Face capture failed"}), 500

    return jsonify({"success": True, "message": "Voter added and face captured"}), 200

@app.route('/shutdown', methods=['POST'])
def shutdown():
    func = request.environ.get('werkzeug.server.shutdown')
    if func:
        func()
        return 'Server shutting down...'
    else:
        return 'Server shutdown failed', 500

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))  # Use env variable
    app.run(host="0.0.0.0", port=port)        # Expose to external requests
