import requests
import json
import time
import csv
import os

API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjE5YTZjMzhkZjI1MjQ5ZWJiOWJmNmY2NjZhM2NkMjExIiwiaCI6Im11cm11cjY0In0="  
SCRIPT_DIR = os.path.dirname(__file__)
DATA_DIR = os.path.abspath(os.path.join(SCRIPT_DIR, "..", "data"))
os.makedirs(DATA_DIR, exist_ok=True)

OUTPUT_JSON = os.path.join(DATA_DIR, "dataset_with_matrix.json")
OUTPUT_DISTANCE_CSV = os.path.join(DATA_DIR, "distance_matrix.csv")
OUTPUT_DURATION_CSV = os.path.join(DATA_DIR, "duration_matrix.csv")

# Data Rumah Sakit di Kupang dengan klasifikasi jalan arteri
data = {
    "hospitals": [
        {"id": 0, "name": "RSUP Dr. Ben Mboi", "lat": -10.22096445896242, "lng": 123.57796417364386, "type": "RS Tipe A", "road_class": "arteri_primer"},
        {"id": 1, "name": "RSUD W. Z. Johannes", "lat": -10.168121004087805, "lng": 123.58578843996008, "type": "RS Tipe B", "road_class": "arteri_primer"},
        {"id": 2, "name": "Siloam Hospitals Kupang", "lat": -10.157098533430371, "lng": 123.61037555345156, "type": "RS Swasta", "road_class": "arteri_sekunder"},
        {"id": 3, "name": "RSUD S. K. Lerik", "lat": -10.149673927555247, "lng": 123.60881218414033, "type": "RS Tipe C", "road_class": "arteri_sekunder"},
        {"id": 4, "name": "RSU Mamami", "lat": -10.153394416963508, "lng": 123.60918282646814, "type": "RS Swasta", "road_class": "jalan_lokal"},
        {"id": 5, "name": "RS Kartini Kupang", "lat": -10.156560593706855, "lng": 123.62824713810701, "type": "RS Swasta", "road_class": "jalan_lokal"},
        {"id": 6, "name": "RSIA Dedari", "lat": -10.16550778376316, "lng": 123.62767863995991, "type": "RS Ibu & Anak", "road_class": "jalan_lokal"},
        {"id": 7, "name": "RS St. Carolus Borromeus", "lat": -10.214981102159177, "lng": 123.62058767091062, "type": "RS Swasta", "road_class": "arteri_sekunder"},
        {"id": 8, "name": "RS Jiwa Naimata", "lat": -10.17883917027184, "lng": 123.63906288228785, "type": "RS Jiwa", "road_class": "jalan_lokal"},
        {"id": 9, "name": "RSU Leona", "lat": -10.170493642836085, "lng": 123.62740173625463, "type": "RS Swasta", "road_class": "arteri_sekunder"},
        {"id": 10, "name": "RSAL Samuel J. Moeda", "lat": -10.175598307798651, "lng": 123.55566159392686, "type": "RS TNI AL", "road_class": "arteri_primer"},
        {"id": 11, "name": "RS Tk. III Wirasakti Kupang", "lat": -10.166161123698505, "lng": 123.58335268043491, "type": "RS TNI AD", "road_class": "arteri_primer"},
    ]
}

locations = []
for h in data["hospitals"]:
    locations.append([h["lng"], h["lat"]])

n = len(locations)
print(f"Preparing matrix for {n} hospitals")

body = {
    "locations": locations,
    "metrics": ["distance", "duration"],
    "units": "m"
}

headers = {
    "Authorization": API_KEY,
    "Content-Type": "application/json"
}

matrix_url = "https://api.openrouteservice.org/v2/matrix/driving-car"

print("Sending request to ORS Matrix API...")
r = requests.post(matrix_url, json=body, headers=headers, timeout=60)

if r.status_code != 200:
    print("ERROR: ORS returned status", r.status_code)
    print("Response:", r.text)
    raise SystemExit("ORS request failed. Check API key, quota, and request format.")

resp = r.json()

distances = resp.get("distances")
durations = resp.get("durations")

if distances is None or durations is None:
    print("ERROR: Unexpected ORS response structure.")
    print(json.dumps(resp, indent=2))
    raise SystemExit("Missing distances/durations in response.")

# Create CSVs under backend/data
print(f"Writing CSV files to {DATA_DIR}...")
with open(OUTPUT_DISTANCE_CSV, "w", newline="", encoding="utf-8") as fdist, \
    open(OUTPUT_DURATION_CSV, "w", newline="", encoding="utf-8") as fdur:
    writer_dist = csv.writer(fdist)
    writer_dur = csv.writer(fdur)

    header = ["loc_index"] + [f"to_{i}" for i in range(n)]
    writer_dist.writerow(header)
    writer_dur.writerow(header)

    for i in range(n):
        writer_dist.writerow([f"from_{i}"] + distances[i])
        writer_dur.writerow([f"from_{i}"] + durations[i])

result = {
    "meta": {
        "generated_by": "generate_matriks_ors.py",
        "n_locations": n,
        "notes": "Jaringan Rumah Sakit Kupang - Data untuk Optimasi TSP dengan GA, SA, dan DE",
        "road_classes": {
            "arteri_primer": "Jalan utama kota dengan akses cepat (Jl. El Tari, Jl. Timor Raya)",
            "arteri_sekunder": "Jalan penghubung antar kawasan",
            "jalan_lokal": "Jalan lingkungan/perumahan"
        }
    },
    "hospitals": {str(h["id"]): h for h in data["hospitals"]},
    "matrices": {
        "distances_m": distances,
        "durations_s": durations
    }
}

with open(OUTPUT_JSON, "w", encoding="utf-8") as fo:
    json.dump(result, fo, indent=2, ensure_ascii=False)

print("Done.")
print(f"Outputs: {OUTPUT_JSON}, {OUTPUT_DISTANCE_CSV}, {OUTPUT_DURATION_CSV}")
