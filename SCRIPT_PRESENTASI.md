# SCRIPT PRESENTASI
## Optimasi Rute Menuju Rumah Sakit Rujukan di Kota Kupang
### Menggunakan Algoritma Floyd-Warshall

---

## 📌 SLIDE 1: OPENING & JUDUL

**Selamat pagi/siang Bapak/Ibu dan teman-teman semua.**

Pada kesempatan kali ini, saya akan mempresentasikan proyek Analisis Algoritma dengan judul:

**"Optimasi Rute Menuju Rumah Sakit Rujukan di Kota Kupang Menggunakan Algoritma Floyd-Warshall"**

---

## 📌 SLIDE 2: LATAR BELAKANG

**Latar Belakang Masalah:**

Dalam situasi darurat medis, waktu adalah hal yang sangat krusial. Setiap menit yang terbuang dapat berdampak fatal pada kondisi pasien. 

Di Kota Kupang, terdapat 12 rumah sakit rujukan dengan berbagai spesialisasi. Namun, **permasalahan yang sering terjadi adalah:**

1. **Masyarakat kesulitan** menentukan rumah sakit mana yang paling cepat dijangkau dari lokasi mereka
2. **Tidak ada sistem** yang membantu menemukan rute tercepat secara otomatis
3. **Jalur alternatif** yang lebih cepat melalui titik perantara seringkali tidak teridentifikasi

Oleh karena itu, saya membuat aplikasi berbasis web yang dapat **mengoptimalkan rute perjalanan** menuju rumah sakit dengan memanfaatkan **algoritma Floyd-Warshall**.

---

## 📌 SLIDE 3: RUMUSAN MASALAH

**Rumusan Masalah:**

1. Bagaimana cara menentukan **rute tercepat** dari suatu lokasi menuju rumah sakit tertentu di Kota Kupang?
2. Bagaimana cara mengidentifikasi **jalur alternatif** yang lebih efisien melalui titik perantara?
3. Bagaimana **mengimplementasikan algoritma Floyd-Warshall** untuk menyelesaikan permasalahan All-Pairs Shortest Path dalam konteks GIS (Geographic Information System)?

---

## 📌 SLIDE 4: TUJUAN PENELITIAN

**Tujuan:**

1. Mengembangkan **aplikasi web** untuk optimasi rute menuju rumah sakit
2. Mengimplementasikan **algoritma Floyd-Warshall** untuk mencari semua jalur terpendek
3. Memberikan **visualisasi interaktif** pada peta digital
4. Membantu masyarakat dalam **pengambilan keputusan cepat** saat kondisi darurat

---

## 📌 SLIDE 5: LANDASAN TEORI - ALGORITMA FLOYD-WARSHALL

**Algoritma Floyd-Warshall**

Algoritma Floyd-Warshall adalah algoritma **Dynamic Programming** yang digunakan untuk mencari **All-Pairs Shortest Path** (jalur terpendek antara semua pasangan vertex) dalam sebuah graf.

**Karakteristik:**
- **Kompleksitas Waktu:** O(n³) - dimana n adalah jumlah vertex
- **Kompleksitas Ruang:** O(n²)
- Dapat menangani **graf berbobot negatif** (selama tidak ada negative cycle)
- Menemukan jalur optimal melalui **vertex perantara**

**Pseudocode:**

```
for k = 1 to n:
    for i = 1 to n:
        for j = 1 to n:
            if dist[i][j] > dist[i][k] + dist[k][j]:
                dist[i][j] = dist[i][k] + dist[k][j]
                next[i][j] = next[i][k]
```

**Prinsip Kerja:**
- **k** adalah vertex perantara yang dicoba
- Untuk setiap pasangan (i, j), algoritma mengecek apakah jalur melalui k lebih pendek
- Jika ya, maka update jarak dan jalur

---

## 📌 SLIDE 6: KENAPA FLOYD-WARSHALL?

**Kenapa Menggunakan Floyd-Warshall?**

**Perbandingan dengan algoritma lain:**

| Algoritma | Tipe | Kompleksitas | Kelebihan | Kekurangan |
|-----------|------|-------------|-----------|------------|
| **Dijkstra** | Single-source | O(n² log n) | Cepat untuk 1 sumber | Harus dijalankan n kali |
| **Bellman-Ford** | Single-source | O(n³) | Handle negatif weight | Lambat |
| **Floyd-Warshall** | All-pairs | O(n³) | Semua pasangan sekaligus | Butuh memori besar |

**Alasan Pemilihan:**
1. ✅ Kita butuh **semua jalur terpendek** antar semua lokasi
2. ✅ Jumlah lokasi **relatif kecil** (13 lokasi) → O(n³) masih efisien
3. ✅ Implementasi **sederhana** dan mudah dipahami
4. ✅ Dapat menemukan **jalur tak langsung** yang lebih optimal

---

## 📌 SLIDE 7: METODOLOGI - ARSITEKTUR SISTEM

**Arsitektur Sistem:**

Aplikasi ini menggunakan arsitektur **Client-Server** dengan komponen:

**BACKEND (Server-Side):**
- **Framework:** Flask (Python)
- **Fungsi:** 
  - Menyediakan REST API
  - Komunikasi dengan OpenRouteService API
  - Serving data matriks jarak & waktu

**FRONTEND (Client-Side):**
- **Framework:** Vanilla JavaScript + Leaflet.js
- **Fungsi:**
  - Visualisasi peta interaktif
  - Eksekusi algoritma Floyd-Warshall
  - Rendering hasil dan rute

**EXTERNAL API:**
- **OpenRouteService (ORS):** Untuk mendapatkan matriks jarak/waktu real dan geometri rute

---

## 📌 SLIDE 8: DATA & LOKASI

**Dataset Penelitian:**

**Lokasi Awal (Origin):**
- Rumah - Jalan Srikandi No.10 (sebagai contoh titik awal)

**12 Rumah Sakit Rujukan:**
1. RSUP Dr. Ben Mboi
2. RSUD W. Z. Johannes
3. Siloam Hospitals Kupang
4. RSUD S. K. Lerik
5. RSU Mamami
6. RS Kartini Kupang
7. RSIA Dedari
8. RS St. Carolus Borromeus
9. RS Jiwa Naimata
10. RSU Leona
11. RSAL Samuel J. Moeda
12. RS Tk. III Wirasakti Kupang

**Total:** 13 lokasi → Matriks 13×13

---

## 📌 SLIDE 9: IMPLEMENTASI - GENERATE MATRIKS

**Tahap 1: Generating Distance & Duration Matrix**

Menggunakan script `generate_matriks_ors.py`:

```python
# 1. Definisi koordinat semua lokasi (13 titik)
locations = [[lng, lat], [lng, lat], ...]

# 2. Request ke ORS Matrix API
response = requests.post(
    "https://api.openrouteservice.org/v2/matrix/driving-car",
    json={"locations": locations, "metrics": ["distance", "duration"]}
)

# 3. Hasil: Matriks 13×13
distances_m = [[...], [...], ...]  # dalam meter
durations_s = [[...], [...], ...]  # dalam detik
```

**Output:**
- `dataset_with_matrix.json` - Data lengkap
- `distance_matrix.csv` - Matriks jarak
- `duration_matrix.csv` - Matriks waktu

---

## 📌 SLIDE 10: IMPLEMENTASI - ALGORITMA FLOYD-WARSHALL

**Tahap 2: Implementasi Floyd-Warshall (JavaScript)**

```javascript
function floydWarshall(dist) {
    const n = dist.length;
    const next = Array.from({length: n}, () => Array(n).fill(null));
    const changes = Array.from({length: n}, () => Array(n).fill(false));

    // Inisialisasi next matrix
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            if (dist[i][j] < Infinity) {
                next[i][j] = j;  // Direct path
            }
        }
    }

    // Triple nested loop - Core Floyd-Warshall
    for (let k = 0; k < n; k++) {           // Vertex perantara
        for (let i = 0; i < n; i++) {        // Vertex asal
            for (let j = 0; j < n; j++) {    // Vertex tujuan
                if (dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];  // Update jarak
                    next[i][j] = next[i][k];               // Update jalur
                    changes[i][j] = true;                   // Tandai optimasi
                }
            }
        }
    }

    return {dist, next, changes};
}
```

**Penjelasan:**
- **dist:** Matriks jarak terpendek hasil optimasi
- **next:** Matriks untuk rekonstruksi jalur
- **changes:** Penanda apakah jalur dioptimasi via perantara

---

## 📌 SLIDE 11: IMPLEMENTASI - PATH RECONSTRUCTION

**Tahap 3: Rekonstruksi Jalur**

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

**Contoh:**
- Ingin pergi dari Lokasi 0 → Lokasi 5
- Hasil: `path = [0, 3, 5]`
- Artinya: Rute optimal adalah 0 → 3 → 5 (melalui lokasi 3)

---

## 📌 SLIDE 12: IMPLEMENTASI - VISUALISASI RUTE

**Tahap 4: Visualisasi pada Peta**

1. **Kirim waypoints** ke backend:
   ```javascript
   POST /api/route
   Body: {coordinates: [[lng1,lat1], [lng2,lat2], ...]}
   ```

2. **Backend request** ke ORS Directions API untuk geometri rute real

3. **Frontend render** polyline pada Leaflet map:
   ```javascript
   L.polyline(coordinates, {
       color: '#f44336',
       weight: 5
   }).addTo(map);
   ```

4. **Tampilkan info:** Jarak total, waktu tempuh, dan detail setiap segment

---

## 📌 SLIDE 13: FITUR APLIKASI

**Fitur-Fitur Utama:**

1. **🗺️ Peta Interaktif**
   - Marker rumah (oranye) dan rumah sakit (biru)
   - Zoom dan pan untuk eksplorasi

2. **🔍 Pencarian Rute Optimal**
   - Pilih lokasi awal dan tujuan
   - Algoritma Floyd-Warshall menghitung jalur tercepat
   - Visualisasi rute di peta

3. **📊 Matriks Floyd-Warshall**
   - Lihat hasil matriks distance & duration
   - Color coding: jalur langsung vs tidak langsung

4. **📋 Tabel All-Pairs Shortest Path**
   - Detail semua jalur terpendek antar semua pasangan lokasi
   - Informasi lengkap: jarak, waktu, dan rute yang dilalui

5. **ℹ️ Informasi Detail**
   - Total jarak (km)
   - Estimasi waktu (menit)
   - Step-by-step directions

---

## 📌 SLIDE 14: DEMO APLIKASI

**[DEMO LANGSUNG]**

**Skenario Demo:**

1. **Menjalankan Aplikasi**
   ```bash
   cd backend
   python app.py
   # Buka browser: http://127.0.0.1:5000
   ```

2. **Contoh Kasus 1: Rumah → RSUP Dr. Ben Mboi**
   - Pilih: "Rumah - Jalan Srikandi No.10" → "RSUP Dr. Ben Mboi"
   - Klik "Hitung Rute Tercepat"
   - Tampilkan: Rute di peta + info jarak & waktu

3. **Lihat Matriks**
   - Klik "Lihat Matriks"
   - Tunjukkan perbedaan jalur langsung (biru) vs optimasi (kuning)

4. **Lihat Semua Jalur**
   - Klik "Lihat Semua Jalur"
   - Tunjukkan tabel lengkap dengan path reconstruction

---

## 📌 SLIDE 15: HASIL & ANALISIS - CONTOH KASUS

**Contoh Hasil Optimasi:**

**Kasus: Rumah (0) → RS Jiwa Naimata (9)**

**Sebelum Floyd-Warshall:**
- Jalur langsung: 8.5 km, 18 menit

**Setelah Floyd-Warshall:**
- Jalur optimal: 0 → 6 → 9
- Melalui RS Kartini Kupang (6)
- Total: 7.8 km, 15 menit
- **Penghematan:** 0.7 km dan 3 menit ✅

**Insight:**
Algoritma berhasil menemukan jalur yang **lebih efisien** melalui titik perantara yang tidak terpikirkan secara manual.

---

## 📌 SLIDE 16: KOMPLEKSITAS ANALISIS

**Analisis Kompleksitas:**

**Time Complexity:**
- **Floyd-Warshall:** O(n³) = O(13³) = 2,197 operasi
- Untuk 13 lokasi: **sangat cepat** (< 1 ms di browser modern)
- Skalabilitas: Cocok untuk n < 100

**Space Complexity:**
- **Matriks dist:** n × n = 13 × 13 = 169 cells
- **Matriks next:** n × n = 169 cells
- **Total:** O(n²)

**Perbandingan dengan Alternatif:**
- **Dijkstra 13 kali:** O(13 × 13² × log 13) ≈ 2,800 operasi
- **Floyd-Warshall lebih sederhana** untuk implementasi & maintenance

---

## 📌 SLIDE 17: KELEBIHAN & KEKURANGAN

**Kelebihan Sistem:**

✅ **User-friendly:** Interface sederhana dan intuitif
✅ **Real-time calculation:** Hasil cepat dalam hitungan detik
✅ **Visualisasi jelas:** Peta interaktif dengan Leaflet
✅ **Data akurat:** Menggunakan OpenRouteService API real data
✅ **Comprehensive:** Menampilkan semua jalur terpendek sekaligus
✅ **Educational:** Bisa melihat proses optimasi via matriks

**Kekurangan & Limitasi:**

❌ **Skalabilitas:** Tidak cocok untuk ratusan lokasi (O(n³))
❌ **Static data:** Tidak mempertimbangkan traffic real-time
❌ **Dependency:** Bergantung pada ORS API (butuh koneksi internet)
❌ **Scope terbatas:** Hanya untuk Kota Kupang

---

## 📌 SLIDE 18: PENGEMBANGAN LEBIH LANJUT

**Rekomendasi Pengembangan:**

1. **🚦 Integrasi Traffic Real-time**
   - Gunakan Google Maps Traffic API
   - Update matriks secara dinamis

2. **📱 Mobile Application**
   - Develop untuk Android/iOS
   - GPS tracking untuk deteksi lokasi otomatis

3. **🏥 Database Rumah Sakit Lengkap**
   - Info spesialisasi
   - Ketersediaan bed
   - Jam operasional

4. **🔔 Emergency Button**
   - One-click untuk panggilan darurat
   - Auto-routing ke RS terdekat

5. **📈 Machine Learning**
   - Prediksi traffic pattern
   - Rekomendasi waktu terbaik untuk perjalanan

6. **🌐 Multi-City Support**
   - Expand ke kota-kota lain di NTT

---

## 📌 SLIDE 19: KESIMPULAN

**Kesimpulan:**

1. **Algoritma Floyd-Warshall efektif** untuk menyelesaikan masalah All-Pairs Shortest Path dalam konteks optimasi rute rumah sakit

2. Aplikasi berhasil mengidentifikasi **jalur alternatif yang lebih efisien** melalui titik perantara, yang tidak teridentifikasi secara manual

3. **Kompleksitas O(n³)** masih sangat efisien untuk dataset 13 lokasi dengan performa < 1 ms

4. **Visualisasi interaktif** memudahkan pengguna memahami rute optimal secara intuitif

5. Sistem ini dapat **membantu masyarakat** dalam pengambilan keputusan cepat saat kondisi darurat medis

---

## 📌 SLIDE 20: PENUTUP

**Penutup:**

Demikian presentasi saya tentang **Optimasi Rute Menuju Rumah Sakit Rujukan di Kota Kupang** menggunakan algoritma Floyd-Warshall.

Proyek ini menunjukkan bahwa **teori algoritma** yang dipelajari di kelas dapat diimplementasikan untuk **menyelesaikan masalah nyata** di masyarakat.

**Terima kasih atas perhatiannya.**

**Saya siap menjawab pertanyaan. 🙏**

---

## 📝 ANTISIPASI PERTANYAAN (Q&A)

### **Q1: Kenapa tidak pakai Dijkstra saja?**
**A:** Dijkstra hanya mencari jalur terpendek dari 1 sumber ke semua tujuan. Untuk mendapatkan semua pasangan jalur, kita harus menjalankan Dijkstra sebanyak n kali (13 kali). Floyd-Warshall lebih efisien karena hanya perlu dijalankan sekali dan langsung mendapat semua hasil.

### **Q2: Bagaimana jika ada jalur yang ditutup atau macet?**
**A:** Saat ini sistem belum mengintegrasikan data traffic real-time. Untuk pengembangan selanjutnya, bisa menambahkan:
- Update matriks secara berkala dari traffic API
- Input manual untuk jalan yang ditutup (set distance = Infinity)
- Recalculate Floyd-Warshall dengan matriks yang diupdate

### **Q3: Apakah bisa untuk lebih dari 13 lokasi?**
**A:** Bisa, tapi perlu pertimbangan:
- 50 lokasi: O(125,000) operasi → masih OK
- 100 lokasi: O(1,000,000) operasi → mulai terasa lambat
- 500+ lokasi: Lebih baik pakai algoritma lain (A*, Contraction Hierarchies)

### **Q4: Kenapa menggunakan JavaScript di frontend, bukan backend?**
**A:** 
- Perhitungan Floyd-Warshall ringan untuk 13 lokasi
- Mengurangi beban server
- Respons lebih cepat (tidak perlu round-trip ke server)
- Frontend tetap responsif saat perhitungan

### **Q5: Bagaimana akurasi data dari OpenRouteService?**
**A:** ORS menggunakan data OpenStreetMap yang:
- Akurasi tinggi untuk jalan utama
- Community-maintained (terus diupdate)
- Routing engine OSRM yang proven
- Untuk production, bisa combine dengan Google Maps untuk validasi

### **Q6: Apakah sistem memperhitungkan jenis kendaraan?**
**A:** Saat ini menggunakan profil "driving-car" dari ORS. Bisa dikembangkan untuk profil lain:
- driving-hgv (truck)
- cycling-regular
- foot-walking
Tinggal ganti parameter di API request.

### **Q7: Berapa biaya untuk menggunakan ORS API?**
**A:** 
- **Free tier:** 2,000 requests/hari
- Untuk proyek skala kecil: sudah cukup
- Production: bisa self-host ORS server (open source)

### **Q8: Bagaimana jika tidak ada koneksi internet?**
**A:** 
- Matriks sudah di-generate dan tersimpan di `dataset_with_matrix.json`
- Perhitungan Floyd-Warshall bisa offline
- Yang perlu internet: request geometri rute untuk visualisasi
- Solusi: Cache geometri rute yang sering dipakai

---

## 🎯 TIPS PRESENTASI

### **Persiapan:**
1. ✅ Test aplikasi sebelum presentasi
2. ✅ Siapkan backup: screenshot/video jika demo gagal
3. ✅ Pastikan koneksi internet stabil
4. ✅ Latihan timing: 15-20 menit

### **Saat Presentasi:**
1. 🗣️ **Bicara dengan jelas** dan tidak terburu-buru
2. 👁️ **Eye contact** dengan audience
3. 📊 **Jelaskan slide** jangan hanya membaca
4. 💻 **Demo dengan percaya diri**, jika error tetap tenang
5. ❓ **Ajak interaksi:** "Apakah ada yang pernah mengalami kesulitan mencari RS terdekat?"

### **Penutup:**
1. 🙏 Ucapkan terima kasih
2. 😊 Tersenyum dan percaya diri
3. ✋ Siap menjawab pertanyaan dengan sabar

---

**GOOD LUCK! 🚀**
