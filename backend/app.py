from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import os
import json
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder="../frontend", static_url_path="")
CORS(app)

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

# Get API key from environment variable, fallback to hardcoded for development
ORS_API_KEY = os.getenv("ORS_API_KEY", "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjE5YTZjMzhkZjI1MjQ5ZWJiOWJmNmY2NjZhM2NkMjExIiwiaCI6Im11cm11cjY0In0=")

@app.route("/api/dataset", methods=["GET"])
def get_dataset():
    try:
        json_path = os.path.join(DATA_DIR, "dataset_with_matrix.json")
        if not os.path.exists(json_path):
            return jsonify({"error": "dataset JSON not found"}), 404
        
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/route", methods=["POST"])
def get_route():
    try:
        coords = request.json.get("coordinates")  
        
        if not coords or len(coords) < 2:
            return jsonify({"error": "At least 2 coordinates required"}), 400
        
        headers = {
            "Authorization": ORS_API_KEY,
            "Content-Type": "application/json"
        }
        
        body = {
            "coordinates": coords,
            "instructions": False,
            "geometry": True
        }
        
        ors_url = "https://api.openrouteservice.org/v2/directions/driving-car/geojson"
        
        response = requests.post(ors_url, json=body, headers=headers, timeout=30)
        
        if response.status_code != 200:
            return jsonify({
                "error": "ORS API error",
                "status": response.status_code,
                "message": response.text
            }), response.status_code
        
        data = response.json()
        
        if data.get("features") and len(data["features"]) > 0:
            geometry = data["features"][0]["geometry"]
            return jsonify({
                "type": "success",
                "geometry": geometry
            })
        else:
            return jsonify({"error": "No route found"}), 404
            
    except requests.exceptions.Timeout:
        return jsonify({"error": "Request timeout to ORS API"}), 504
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Network error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route("/")
def serve_index():
    return send_from_directory("../frontend", "index.html")

@app.route("/<path:path>")
def serve_frontend(path):
    return send_from_directory("../frontend", path)


if __name__ == "__main__":
    print("Running backend server at http://127.0.0.1:5000")
    app.run(debug=True)
