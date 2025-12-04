# Optimasi Rute Rumah Sakit Kupang - TSP

Aplikasi web untuk optimasi rute kunjungan rumah sakit di Kota Kupang menggunakan **Genetic Algorithm (GA)**, **Simulated Annealing (SA)**, dan **Differential Evolution (DE)** dengan visualisasi interaktif.

---

## 📋 Tentang Proyek

Sistem TSP (Travelling Salesman Problem) untuk mencari rute optimal mengunjungi **12 rumah sakit** di Kupang dengan jarak minimum. Cocok untuk monitoring kesehatan, distribusi medis, atau survei fasilitas.

**Fitur:**
- ✅ 3 algoritma optimasi (GA, SA, DE) dengan parameter advanced
- ✅ Visualisasi peta interaktif + grafik konvergensi real-time
- ✅ Perbandingan performa algoritma
- ✅ Multi-run benchmark untuk analisis statistik
- ✅ Export hasil (JSON, CSV, PNG)
- ✅ Reproducibility dengan global RNG seed

---

## 🚀 Algoritma

#### Genetic Algorithm (GA)
- **Operators**: Tournament/Roulette/Rank selection, OX/PMX/ERX crossover, Swap/Inversion/Scramble mutation
- **Advanced Features**:
  - Adaptive mutation rate berdasarkan diversity
  - 2-opt local search untuk improvement
  - Greedy initialization (nearest neighbor)
  - Diversity tracking dan automatic restart
  - Stagnation detection
- **Configurable**: Population size, generations, mutation/crossover rates, elitism

#### Simulated Annealing (SA)
- **Cooling Schedules**: Geometric (default), Linear, Exponential, Logarithmic
- **Advanced Features**:
  - Reheating mechanism untuk escape local optima
  - Early stopping berdasarkan improvement threshold
  - Acceptance rate diagnostics
  - Temperature history tracking
- **Configurable**: Initial/final temperature, cooling rate, iterations per temperature

#### Differential Evolution (DE)
- **Strategies**: DE/rand/1 (default), DE/best/1, DE/current-to-best/1
- **Crossover Types**: Binomial (default), Exponential
- **Advanced Features**:
  - Self-adaptive F dan CR (jDE)
  - Position-based encoding untuk TSP
  - Automatic tour repair mechanism
- **Configurable**: Population size, generations, F (mutation factor), CR (crossover probability)

**1. Genetic Algorithm (GA)**
- Selection: Tournament, Roulette Wheel, Rank-Based
- Crossover: Order (OX), PMX, Edge Recombination (ERX)
- Mutation: Swap, Inversion, Scramble
- Features: Elitism, adaptive mutation, 2-opt local search, diversity tracking

**2. Simulated Annealing (SA)**
- Cooling Schedules: Geometric, Linear, Exponential, Logarithmic
- Features: Reheating mechanism, early stopping

**3. Differential Evolution (DE)**
- Strategies: rand/1, best/1, current-to-best/1
- Crossover: Binomial, Exponential
- Features: Self-adaptive F/CR (jDE)

---

## 🛠️ Teknologi

**Backend:** Python 3.8+ • Flask • OpenRouteService API

**Frontend:** HTML5 • CSS3 • JavaScript • Leaflet.js • Canvas API

---

## 📦 Instalasi & Menjalankan Program

### Langkah 1: Setup Backend (Server Python)

```bash
# 1. Masuk ke folder backend
cd backend

# 2. Install library yang dibutuhkan
pip install -r requirements.txt

# 3. Jalankan server
python app.py
```

**Server akan berjalan di:** `http://localhost:5000`

> **Catatan:** API Key OpenRouteService sudah tersedia di kode, tidak perlu setup manual.

### Langkah 2: Buka Frontend (Aplikasi Web)

**Ada 2 cara:**

**Cara 1 - Langsung buka file (PALING MUDAH):**
```bash
# Buka file ini di browser (Chrome/Firefox/Edge):
frontend/index.html
```

**Cara 2 - Menggunakan HTTP server:**
```bash
cd frontend
python -m http.server 8080
# Lalu buka browser ke: http://localhost:8080
```

### ✅ Cek Program Sudah Jalan

- Backend ✓ → Terminal menampilkan "Running on http://127.0.0.1:5000"
- Frontend ✓ → Browser menampilkan peta Kupang dengan 12 rumah sakit

---

## 📖 Cara Menggunakan Program (Untuk Presentasi)

## 📖 Cara Menggunakan Program (Untuk Presentasi)

### 🎯 Demo 1: Jalankan Satu Algoritma (3 menit)

**Tujuan:** Menunjukkan cara kerja salah satu algoritma

**Langkah-langkah:**
1. **Pilih Algoritma** → Misalnya "Genetic Algorithm (GA)"
2. **Pilih RS Awal** → Misalnya "RSUD Prof. Dr. W.Z. Johannes"
3. **Klik "Jalankan Optimasi"** (tombol hijau)
4. **Tunggu proses** → Akan muncul animasi visualisasi
5. **Lihat Hasil:**
   - **Box Hasil** → Jarak total (km), waktu tempuh, waktu komputasi
   - **Canvas Kiri** → Visualisasi tour (garis biru menghubungkan RS)
   - **Grafik Kanan** → Konvergensi algoritma (perbaikan rute per iterasi)
   - **Peta Bawah** → Rute nyata di Kota Kupang

**Penjelasan saat presentasi:**
- "Algoritma mencari rute terpendek untuk mengunjungi 12 RS"
- "Grafik menunjukkan algoritma terus memperbaiki solusi"
- "Hasil akhir: rute dengan jarak X km, waktu Y menit"

---

### 🏆 Demo 2: Bandingkan Semua Algoritma (5 menit)

**Tujuan:** Menunjukkan performa GA vs SA vs DE

**Langkah-langkah:**
1. **Klik "Bandingkan Semua Algoritma"** (tombol biru)
2. **Tunggu proses** → 3 algoritma dijalankan bersamaan
3. **Lihat Tabel Perbandingan:**
   - Jarak terbaik (km)
   - Waktu eksekusi (ms)
   - Tour hasil masing-masing

**Penjelasan saat presentasi:**
- "Kita jalankan 3 algoritma dengan parameter sama"
- "Bisa lihat mana yang lebih cepat dan lebih optimal"
- Contoh: "GA mendapat jarak X km dalam Y detik, sementara SA..."

---

### 📊 Demo 3: Benchmark Multi-Run (7 menit)

**Tujuan:** Analisis statistik untuk validasi ilmiah

**Langkah-langkah:**
1. **Klik "Benchmark (Multi-Run)"** (tombol kuning)
2. **Pilih:**
   - Algoritma: GA / SA / DE
   - Jumlah trials: 10-30 (untuk presentasi, jangan terlalu banyak)
3. **Klik "Jalankan Benchmark"**
4. **Lihat Statistik:**
   - Mean (rata-rata)
   - Median (nilai tengah)
   - Std Dev (konsistensi)
   - Min/Max (range hasil)
   - Tabel semua trial

**Penjelasan saat presentasi:**
- "Kita jalankan algoritma 30 kali untuk uji konsistensi"
- "Std dev kecil = algoritma stabil, hasil tidak random"
- "Bisa bandingkan 3 algoritma: mana yang paling konsisten"

---

### ⚙️ Demo 4: Atur Parameter (Advanced - Opsional)

**Tujuan:** Menunjukkan fleksibilitas parameter

**Langkah-langkah:**
1. **Klik "Atur Parameter"**
2. **Ubah parameter** (contoh untuk GA):
   - Population: 100 → 200 (lebih banyak solusi kandidat)
   - Generations: 200 → 500 (lebih banyak iterasi)
   - Mutation rate: 0.01 → 0.05 (lebih eksploratif)
3. **Jalankan dan bandingkan dengan parameter default**

**Penjelasan saat presentasi:**
- "Parameter mempengaruhi performa algoritma"
- "Population besar → lebih bagus tapi lebih lambat"
- "Ini menunjukkan trade-off antara kualitas dan kecepatan"

---

### 🔄 Demo 5: Reproducibility dengan Seed

**Tujuan:** Menunjukkan hasil bisa direproduksi (penting untuk penelitian)

**Langkah-langkah:**
1. **Input seed** (angka apa saja, misalnya: `12345`)
2. **Centang checkbox "Gunakan"**
3. **Jalankan algoritma** → Catat hasilnya
4. **Klik Reset**
5. **Input seed yang sama** → Jalankan lagi
6. **Hasil akan IDENTIK 100%**

**Penjelasan saat presentasi:**
- "Seed memastikan hasil bisa diulang"
- "Penting untuk validasi ilmiah dan debugging"
- "Seed sama = random number sequence sama = hasil sama"

---

### 💾 Demo 6: Export Hasil

**Langkah-langkah:**
1. **Setelah jalankan algoritma**
2. **Klik "Export Hasil"**
3. **Akan download 5 file:**
   - `results.json` → Data lengkap
   - `tour.csv` → Urutan RS
   - `convergence.csv` → Data grafik
   - `tour.png` → Gambar visualisasi tour
   - `chart.png` → Gambar grafik konvergensi

**Penjelasan saat presentasi:**
- "Hasil bisa di-export untuk analisis lebih lanjut"
- "Format CSV bisa dibuka di Excel"
- "Gambar PNG bisa dimasukkan ke laporan"

---

## 💡 Tips Presentasi

### ✅ Yang Harus Ditunjukkan:
1. **Cara kerja algoritma** → Gunakan Demo 1 dengan grafik konvergensi
2. **Perbandingan performa** → Gunakan Demo 2 atau 3
3. **Hasil visualisasi** → Peta + canvas tour sangat visual
4. **Parameter pengaruh hasil** → Demo 4 (jika ada waktu)

### ⚠️ Hindari:
- Jangan jalankan benchmark dengan trials terlalu banyak (>50) saat presentasi
- Jangan ubah terlalu banyak parameter sekaligus (bikin bingung)
- Pastikan backend sudah running SEBELUM presentasi dimulai

### 🎤 Script Pembukaan Presentasi:

> "Kami membuat aplikasi optimasi rute kunjungan rumah sakit di Kupang menggunakan 3 algoritma evolusioner: Genetic Algorithm, Simulated Annealing, dan Differential Evolution. Aplikasi ini mencari rute terpendek untuk mengunjungi 12 rumah sakit dengan visualisasi interaktif. Mari saya demonstrasikan..."

---

## 🏥 Data Rumah Sakit

**12 Rumah Sakit di Kupang:**
- 4 RS di jalan arteri primer (merah)
- 4 RS di jalan arteri sekunder (orange)
- 4 RS di jalan lokal (biru)

Matrix jarak menggunakan OpenRouteService Matrix API.

---

## 🔧 Troubleshooting

### ❌ Backend Tidak Jalan

**Problem:** Error saat `python app.py`

**Solusi:**
```bash
# Install ulang dependencies
pip install flask flask-cors python-dotenv requests

# Atau install dari requirements.txt
pip install -r backend/requirements.txt
```

### ❌ Frontend Tidak Muncul Peta

**Problem:** Halaman putih atau peta tidak tampil

**Solusi:**
1. **Cek koneksi internet** (Leaflet butuh CDN)
2. **Pastikan backend running** di `http://localhost:5000`
3. **Buka browser console** (F12) → lihat error message
4. **Coba browser lain** (Chrome recommended)

### ❌ Algoritma Lambat / Browser Freeze

**Problem:** Loading terlalu lama saat run algoritma

**Solusi:**
```
1. Klik "Atur Parameter"
2. Kurangi nilai:
   - Population: 100 → 50
   - Generations: 200 → 100
   - Trials (benchmark): 30 → 10
```

### ❌ Hasil Tidak Reproducible

**Problem:** Seed sama tapi hasil beda

**Solusi:**
- ✅ Pastikan **checkbox "Gunakan" tercentang**
- ✅ Gunakan parameter yang sama
- ✅ Pilih RS awal yang sama

### ❌ Export Tidak Jalan

**Problem:** Tombol "Export Hasil" disabled

**Solusi:**
- Jalankan algoritma dulu minimal 1x
- Tombol baru aktif setelah ada hasil

---

## 📞 FAQ Presentasi

**Q: Berapa lama waktu eksekusi?**
- GA/SA/DE: 1-5 detik (parameter default)
- Benchmark 30 trials: 30-90 detik
- Tergantung spesifikasi laptop

**Q: Kenapa hasil berbeda setiap kali dijalankan?**
- Algoritma evolusioner menggunakan randomness
- Untuk hasil konsisten, gunakan seed

**Q: Algoritma mana yang terbaik?**
- Tergantung kasus dan parameter
- Jalankan benchmark multi-run untuk perbandingan objektif

**Q: Data rumah sakit real atau simulasi?**
- Data REAL dari OpenStreetMap
- Koordinat GPS asli 12 RS di Kupang
- Jarak dari OpenRouteService API (routing nyata)

**Q: Bisa untuk kota lain?**
- Ya, tinggal ganti koordinat RS di `dataset_with_matrix.json`
- Generate ulang distance matrix dengan `generate_matriks_ors.py`

---

## 📄 License

MIT License - Free for educational use

---

**Made for Algoritma Terinspirasi Evolusi Course**
