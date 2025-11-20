# Optimasi Rute Rumah Sakit Kupang

Aplikasi web GIS untuk optimasi rute menuju rumah sakit rujukan di Kota Kupang menggunakan **Algoritma Floyd-Warshall**.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Python](https://img.shields.io/badge/python-3.8+-green.svg)
![Flask](https://img.shields.io/badge/flask-2.0+-red.svg)
![License](https://img.shields.io/badge/license-MIT-yellow.svg)

---

## Daftar Isi

- [Tentang Proyek](#tentang-proyek)
- [Fitur Utama](#fitur-utama)
- [Teknologi](#teknologi)
- [Struktur Proyek](#struktur-proyek)
- [Instalasi](#instalasi)
- [Cara Menggunakan](#cara-menggunakan)
- [Algoritma Floyd-Warshall](#algoritma-floyd-warshall)
- [API Documentation](#api-documentation)
- [Screenshot](#screenshot)
- [Pengembangan](#pengembangan)
- [Troubleshooting](#troubleshooting)
- [Kontributor](#kontributor)
- [Lisensi](#lisensi)

---

## Tentang Proyek

Dalam situasi darurat medis, **waktu adalah hal yang sangat krusial**. Aplikasi ini membantu masyarakat menemukan rute tercepat menuju rumah sakit rujukan di Kota Kupang dengan memanfaatkan algoritma Floyd-Warshall untuk optimasi jalur.

### Masalah yang Diselesaikan

- Kesulitan menentukan rumah sakit terdekat dari lokasi saat ini
- Tidak ada sistem yang membantu mencari rute tercepat secara otomatis
- Jalur alternatif yang lebih efisien melalui titik perantara tidak teridentifikasi

### Solusi

- Visualisasi 13 lokasi (1 rumah + 12 rumah sakit) pada peta interaktif
- Perhitungan rute optimal menggunakan algoritma Floyd-Warshall
- Identifikasi jalur tidak langsung yang lebih cepat
- Informasi detail jarak dan estimasi waktu tempuh

---

## Fitur Utama

### Peta Interaktif

- Visualisasi menggunakan Leaflet.js
- Marker berbeda untuk rumah (oranye) dan rumah sakit (biru)
- Zoom, pan, dan navigasi peta yang smooth

### Pencarian Rute Optimal

- Pilih lokasi awal dan tujuan dari dropdown
- Algoritma Floyd-Warshall menghitung jalur tercepat
- Visualisasi rute dengan polyline merah di peta
- Auto-zoom ke area rute

### Matriks Floyd-Warshall

- Tampilan matriks hasil optimasi
- Toggle antara matriks jarak (km) dan waktu (menit)
- Color coding:
  - **Biru muda**: Jalur langsung
  - **Kuning**: Jalur dioptimasi via titik perantara
  - **Abu-abu**: Diagonal (lokasi sama)

### Tabel All-Pairs Shortest Path

- Daftar lengkap semua pasangan jalur terpendek
- Detail path reconstruction (jalur yang dilalui)
- Badge untuk membedakan jalur langsung vs tidak langsung
- Sortable table untuk analisis data

### Informasi Detail Rute

- Total jarak dalam kilometer
- Estimasi waktu tempuh dalam menit
- Step-by-step directions untuk setiap segment
- Jumlah perhentian/titik perantara

### Reset Rute

- Hapus rute dari peta
- Reset view ke posisi awal
- Bersihkan info panel

---

## Teknologi

### Backend
- **Flask 2.0+** - Web framework Python
- **Flask-CORS** - Cross-Origin Resource Sharing
- **Requests** - HTTP library untuk API calls
- **Pandas** - Data manipulation (optional)

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling dengan flexbox
- **Vanilla JavaScript** - Logic tanpa framework
- **Leaflet.js 1.9.4** - Interactive maps

### External API
- **OpenRouteService (ORS)** - Distance matrix & routing API
  - Matrix API: Generate distance/duration matrix
  - Directions API: Get route geometry

### Algorithm
- **Floyd-Warshall** - All-Pairs Shortest Path
  - Kompleksitas: O(n³)
  - Dynamic Programming approach

---

## Struktur Proyek

```
gis-rs-kupang/
│
├── backend/
│   ├── app.py                          # Flask server utama
│   ├── requirements.txt                 # Python dependencies
│   │
│   ├── data/
│   │   ├── dataset_with_matrix.json    # Data lokasi + matriks
│   │   ├── distance_matrix.csv         # Matriks jarak (CSV)
│   │   └── duration_matrix.csv         # Matriks waktu (CSV)
│   │
│   └── scripts/
│       └── generate_matriks_ors.py     # Script generate matriks dari ORS
│
├── frontend/
│   ├── index.html                       # Main HTML
│   ├── app.js                          # Main application logic
│   ├── floydWarshall.js                # Floyd-Warshall algorithm
│   └── styles.css                       # Styling
│
├── README.md                            # Dokumentasi ini
└── SCRIPT_PRESENTASI.md                # Script presentasi
```

---

## Instalasi

### Prasyarat

- **Python 3.8+** terinstall
- **pip** (Python package manager)
- **Git** (optional)
- Koneksi internet (untuk API calls)

### Langkah Instalasi

#### 1. Clone Repository
```bash
git clone <repository-url>
cd gis-rs-kupang
```

#### 2. Setup Virtual Environment (Recommended)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

#### 3. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

#### 4. (Optional) Generate Matrix Baru
Jika ingin regenerate matriks dengan data terbaru:
```bash
cd backend/scripts
python generate_matriks_ors.py
```
**Note:** Butuh ORS API key yang valid (sudah tersedia di script)

#### 5. Run Server
```bash
cd backend
python app.py
```

Server akan berjalan di: **http://127.0.0.1:5000**

#### 6. Buka di Browser
```
http://127.0.0.1:5000
```

---

## Cara Menggunakan

### 1. Memilih Lokasi
- **Dari Lokasi**: Pilih titik awal (default: Rumah - Jalan Srikandi No.10)
- **Ke Lokasi**: Pilih rumah sakit tujuan dari dropdown

### 2. Hitung Rute

- Klik tombol **"Hitung Rute Tercepat"**
- Tunggu beberapa detik untuk proses perhitungan
- Rute akan muncul sebagai garis merah di peta

### 3. Lihat Informasi

- Panel info di kiri menampilkan:
  - Detail setiap segment rute
  - Total jarak (km)
  - Estimasi waktu (menit)
  - Jumlah perhentian

### 4. Eksplorasi Matriks

- Klik **"Lihat Matriks"** untuk melihat hasil Floyd-Warshall
- Toggle antara tab "Jarak (km)" dan "Waktu (menit)"
- Hover pada cell untuk detail tooltip

### 5. Lihat Semua Jalur

- Klik **"Lihat Semua Jalur"** untuk tabel lengkap
- Filter berdasarkan jarak atau waktu
- Lihat path reconstruction untuk setiap pasangan

### 6. Reset
- Klik **"Reset Rute"** untuk menghapus rute dan mulai lagi

---

## Algoritma Floyd-Warshall

### Konsep

Floyd-Warshall adalah algoritma **Dynamic Programming** untuk mencari **All-Pairs Shortest Path** (jalur terpendek antara semua pasangan vertex) dalam graf berbobot.

### Pseudocode

```
FloydWarshall(dist):
    n = jumlah vertex
    
    // Inisialisasi matriks next untuk path reconstruction
    for i = 0 to n-1:
        for j = 0 to n-1:
            if dist[i][j] < ∞:
                next[i][j] = j
    
    // Triple nested loop - core algorithm
    for k = 0 to n-1:              // Vertex perantara
        for i = 0 to n-1:          // Vertex asal
            for j = 0 to n-1:      // Vertex tujuan
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
                    next[i][j] = next[i][k]
    
    return dist, next
```

### Implementasi JavaScript

```javascript
function floydWarshall(dist) {
    const n = dist.length;
    const next = Array.from({ length: n }, () => Array(n).fill(null));
    const changes = Array.from({ length: n }, () => Array(n).fill(false));

    // Inisialisasi
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (dist[i][j] < Infinity) {
                next[i][j] = j;
            }
        }
    }

    // Core algorithm
    for (let k = 0; k < n; k++) {
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                    next[i][j] = next[i][k];
                    changes[i][j] = true;
                }
            }
        }
    }

    return { dist, next, changes };
}
```

### Path Reconstruction

```javascript
function reconstructPath(next, i, j) {
    if (next[i][j] === null) return [];
    
    let path = [i];
    while (i !== j) {
        i = next[i][j];
        path.push(i);
    }
    return path;
}
```

### Kompleksitas

- **Time Complexity**: O(n³) - dimana n = jumlah vertex
  - Untuk 13 lokasi: 13³ = 2,197 operasi (sangat cepat!)
  
- **Space Complexity**: O(n²)
  - Matriks dist: 13×13 = 169 cells
  - Matriks next: 13×13 = 169 cells

### Contoh Optimasi

**Sebelum Floyd-Warshall:**
```
Lokasi 0 → Lokasi 5: 8.5 km (jalur langsung)
```

**Setelah Floyd-Warshall:**
```
Lokasi 0 → Lokasi 6 → Lokasi 5: 7.8 km
Penghematan: 0.7 km ✅
```

Algoritma menemukan bahwa melewati Lokasi 6 sebagai perantara lebih efisien.

---

## API Documentation

### Backend Endpoints

#### 1. **GET `/api/dataset`**

Mendapatkan data lokasi dan matriks jarak/waktu.

**Response:**
```json
{
  "meta": {
    "generated_by": "generate_matriks_ors.py",
    "n_locations": 13,
    "notes": "locations order = origin (0) then hospitals (1..N)"
  },
  "locations": {
    "0": {
      "id": 0,
      "name": "Rumah - Jalan Srikandi No.10",
      "lat": -10.152226672958543,
      "lng": 123.62438508228742
    }
  },
  "hospitals": {
    "1": {
      "id": 1,
      "name": "RSUP Dr. Ben Mboi",
      "lat": -10.22096445896242,
      "lng": 123.57796417364386
    },
    ...
  },
  "matrices": {
    "distances_m": [[0, 9834, ...], [9834, 0, ...], ...],
    "durations_s": [[0, 1423, ...], [1423, 0, ...], ...]
  }
}
```

---

#### 2. **POST `/api/route`**

Mendapatkan geometri rute dari OpenRouteService.

**Request Body:**
```json
{
  "coordinates": [
    [123.62438508228742, -10.152226672958543],
    [123.61037555345156, -10.157098533430371]
  ]
}
```

**Response:**
```json
{
  "type": "success",
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [123.62438, -10.15222],
      [123.62410, -10.15245],
      ...
    ]
  }
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "status": 500
}
```

---

### External API (OpenRouteService)

#### Matrix API
```
POST https://api.openrouteservice.org/v2/matrix/driving-car
```

**Headers:**
```
Authorization: <API_KEY>
Content-Type: application/json
```

**Body:**
```json
{
  "locations": [[lng1, lat1], [lng2, lat2], ...],
  "metrics": ["distance", "duration"],
  "units": "m"
}
```

#### Directions API
```
POST https://api.openrouteservice.org/v2/directions/driving-car/geojson
```

**Body:**
```json
{
  "coordinates": [[lng1, lat1], [lng2, lat2]],
  "instructions": false,
  "geometry": true
}
```

---

## Screenshot

### Tampilan Utama
![Main View](docs/screenshot-main.png)
*Peta interaktif dengan marker rumah dan rumah sakit*

### Hasil Rute
![Route Result](docs/screenshot-route.png)
*Visualisasi rute tercepat dengan info detail*

### Matriks Floyd-Warshall
![Matrix View](docs/screenshot-matrix.png)
*Matriks hasil optimasi dengan color coding*

### Tabel All-Pairs
![All Pairs Table](docs/screenshot-table.png)
*Tabel lengkap semua jalur terpendek*

---

## Pengembangan

### Data Lokasi

Dataset mencakup **13 lokasi** di Kota Kupang:

| ID | Nama | Latitude | Longitude |
|----|------|----------|-----------|
| 0 | Rumah - Jl. Srikandi No.10 | -10.152227 | 123.624385 |
| 1 | RSUP Dr. Ben Mboi | -10.220964 | 123.577964 |
| 2 | RSUD W. Z. Johannes | -10.168121 | 123.585788 |
| 3 | Siloam Hospitals Kupang | -10.157099 | 123.610376 |
| 4 | RSUD S. K. Lerik | -10.149674 | 123.608812 |
| 5 | RSU Mamami | -10.153394 | 123.609183 |
| 6 | RS Kartini Kupang | -10.156561 | 123.628247 |
| 7 | RSIA Dedari | -10.165508 | 123.627679 |
| 8 | RS St. Carolus Borromeus | -10.214981 | 123.620588 |
| 9 | RS Jiwa Naimata | -10.178839 | 123.639063 |
| 10 | RSU Leona | -10.170494 | 123.627402 |
| 11 | RSAL Samuel J. Moeda | -10.175598 | 123.555662 |
| 12 | RS Tk. III Wirasakti | -10.166161 | 123.583353 |

### Menambah Lokasi Baru

1. Edit `backend/scripts/generate_matriks_ors.py`
2. Tambahkan koordinat ke array `hospitals`:
```python
{"id": 13, "name": "Nama RS Baru", "lat": -10.xxx, "lng": 123.xxx}
```
3. Jalankan ulang script:
```bash
python generate_matriks_ors.py
```
4. Restart server Flask

### Kustomisasi

#### Ganti Warna Rute
Edit `frontend/app.js`:
```javascript
polylineLayer = L.polyline(coords, {
    color: "#4caf50",  // Ganti warna (default: #f44336)
    weight: 5,
    opacity: 0.7
});
```

#### Ganti Icon Marker
Edit `frontend/app.js` pada bagian `homeIcon` atau `hospitalIcon`:
```javascript
const customIcon = L.icon({
    iconUrl: 'path/to/icon.png',
    iconSize: [30, 40],
    iconAnchor: [15, 40]
});
```

#### Ganti Basemap
Edit `frontend/app.js`:
```javascript
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19
}).addTo(map);

// Alternatif basemap:
// CartoDB: https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png
// Satellite: https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}
```

---

## Troubleshooting

### Error: `ModuleNotFoundError: No module named 'flask'`
**Solusi:**
```bash
pip install -r backend/requirements.txt
```

### Error: `dataset JSON not found`
**Solusi:**
```bash
cd backend/scripts
python generate_matriks_ors.py
```

### Error: `ORS API error 403`
**Penyebab:** API key invalid atau quota habis

**Solusi:**
1. Daftar API key baru di [openrouteservice.org](https://openrouteservice.org/)
2. Update di `backend/app.py` dan `backend/scripts/generate_matriks_ors.py`

### Error: `CORS policy`
**Solusi:** Pastikan Flask-CORS terinstall
```bash
pip install flask-cors
```

### Peta tidak muncul
**Solusi:**
1. Cek koneksi internet (Leaflet tiles butuh internet)
2. Buka console browser (F12) untuk lihat error
3. Pastikan file `frontend/app.js` di-load dengan benar

### Rute tidak muncul setelah klik "Hitung Rute"
**Solusi:**
1. Cek console browser untuk error
2. Pastikan backend server running
3. Test endpoint `/api/dataset` di browser
4. Cek koneksi internet untuk ORS API

---

## Deployment

### Heroku
```bash
# Install Heroku CLI
heroku login
heroku create gis-rs-kupang

# Add Procfile
echo "web: python backend/app.py" > Procfile

# Deploy
git add .
git commit -m "Deploy to Heroku"
git push heroku main
```

### Docker
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 5000
CMD ["python", "backend/app.py"]
```

```bash
docker build -t gis-rs-kupang .
docker run -p 5000:5000 gis-rs-kupang
```

---

## Kontributor

- **Cantika** - Developer & Researcher
- **Dosen Pembimbing** - Guidance & Review

---

## Lisensi

Proyek ini menggunakan lisensi **MIT License**.

```
MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## Kontak & Dukungan

Jika ada pertanyaan atau masalah:

- **Email**: [email-anda@example.com]
- **GitHub Issues**: [Link ke repository issues]
- **Documentation**: Lihat file ini dan `SCRIPT_PRESENTASI.md`

---

## Acknowledgments

- **OpenRouteService** - Untuk API routing dan matrix yang powerful
- **Leaflet.js** - Library mapping yang luar biasa
- **Flask** - Web framework yang simple dan elegant
- **OpenStreetMap** - Data peta open source

---

## Referensi

1. Floyd, R. W. (1962). "Algorithm 97: Shortest Path". Communications of the ACM.
2. Warshall, S. (1962). "A Theorem on Boolean Matrices". Journal of the ACM.
3. Cormen, T. H., et al. (2009). "Introduction to Algorithms" (3rd ed.). MIT Press.
4. OpenRouteService Documentation: https://openrouteservice.org/dev/
5. Leaflet Documentation: https://leafletjs.com/reference.html

---

<div align="center">

**Star this repository if you find it helpful!**

Made for Analisis Algoritma Course

</div>
