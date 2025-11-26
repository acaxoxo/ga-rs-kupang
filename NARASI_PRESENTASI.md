# NARASI PRESENTASI
## Optimasi Rute Antar Rumah Sakit di Kupang Menggunakan Floyd-Warshall

---

## 1. PEMBUKAAN (1 menit)

"Selamat pagi/siang Bapak/Ibu Dosen. Saya mempresentasikan implementasi algoritma Floyd-Warshall untuk optimasi rute antar Rumah Sakit di Kota Kupang. 

Sistem ini menyelesaikan masalah **All-Pairs Shortest Path** - yaitu mencari jalur terpendek antara SEMUA pasangan Rumah Sakit sekaligus. Ini berbeda dengan algoritma seperti Dijkstra yang hanya menghitung dari satu titik asal."

---

## 2. LATAR BELAKANG MASALAH (1 menit)

"Di Kupang terdapat 12 Rumah Sakit dengan berbagai tipe dan lokasi. Masalah yang diselesaikan:

1. **Rujukan Pasien Antar RS**: RS kecil perlu merujuk ke RS besar dengan rute optimal
2. **Distribusi Logistik Medis**: Ambulans/obat/vaksin perlu rute efisien
3. **Analisis Aksesibilitas**: Identifikasi RS yang paling 'strategis' dalam jaringan

**Key Point**: Ini bukan sekadar mencari jarak dari satu titik, tapi memahami SELURUH jaringan konektivitas RS."

---

## 3. REPRESENTASI SEBAGAI GRAF (2 menit)

"Sistem memodelkan jaringan RS sebagai **Graf Berarah Berbobot**:

### Komponen Graf:
- **Node (Vertex)**: 12 Rumah Sakit
- **Edge**: Koneksi jalan antar RS
- **Bobot (Weight)**: Jarak dalam meter atau waktu dalam detik

### Klasifikasi Jalan Arteri:
Kami menambahkan informasi klasifikasi jalan untuk menggambarkan bobot berbeda:

1. **Arteri Primer** (Merah): Jalan utama kota
   - Contoh: RSUP Dr. Ben Mboi, RSUD W.Z. Johannes
   - Akses cepat, lalu lintas lancar

2. **Arteri Sekunder** (Orange): Jalan penghubung kawasan
   - Contoh: Siloam Hospitals, RSUD S.K. Lerik
   - Akses sedang

3. **Jalan Lokal** (Biru): Jalan lingkungan
   - Contoh: RSU Mamami, RS Kartini
   - Akses terbatas, kecepatan rendah

**Visualisasi**: [Tunjukkan tombol 'Lihat Graf Berarah']
- Setiap node diberi warna sesuai klasifikasi jalan
- Edge menunjukkan koneksi langsung dengan panah (menunjukkan arah)
- Bobot edge = jarak aktual dari OpenRouteService API"

---

## 4. ALGORITMA FLOYD-WARSHALL (3 menit)

### Konsep Dasar:
"Floyd-Warshall adalah algoritma **Dynamic Programming** yang mencoba setiap node sebagai **perantara** untuk memperpendek jalur antar dua node lain.

### Pseudocode:
```
// Inisialisasi
for i, j:
    if ada edge langsung: dist[i][j] = bobot
    else: dist[i][j] = ∞

// Triple Loop - INTI ALGORITMA
for k dari 0 sampai n-1:        // k = node perantara
    for i dari 0 sampai n-1:    // i = node asal
        for j dari 0 sampai n-1:  // j = node tujuan
            // Relaksasi: cek apakah lewat k lebih pendek
            if dist[i][k] + dist[k][j] < dist[i][j]:
                dist[i][j] = dist[i][k] + dist[k][j]
                next[i][j] = next[i][k]  // Simpan hop pertama
```

### Penjelasan Per Tahap:

**Iterasi K (Loop Luar)**:
- K=0: Coba semua jalur yang melewati RS ke-0 (RSUP Dr. Ben Mboi)
- K=1: Coba semua jalur yang melewati RS ke-1 (RSUD W.Z. Johannes)
- ... dan seterusnya sampai K=11

**Contoh Konkrit**:
```
Awal: Jarak RS Kartini → RS Mamami = 800m (langsung)

Iterasi K=2 (Siloam):
  Cek: RS Kartini → Siloam → RS Mamami
       = 350m + 200m = 550m
  
  550m < 800m → UPDATE!
  dist[Kartini][Mamami] = 550m
  next[Kartini][Mamami] = Siloam (simpan bahwa hop pertama ke Siloam)
```

### Mengapa Simpan `next[i][k]` bukan `k`?
"Kunci path reconstruction: kita simpan **hop pertama** dari jalur i→k, bukan k itu sendiri. Ini memungkinkan rekonstruksi jalur lengkap secara iteratif."

### Kompleksitas:
- **Waktu**: O(n³) = O(12³) = 1,728 operasi
- **Memori**: O(n²) untuk 3 matriks (dist, next, changes) = ~4 KB
- **Praktis**: Eksekusi < 1ms di browser modern

---

## 5. IMPLEMENTASI TEKNIS (2 menit)

### Arsitektur:
```
Backend (Python/Flask)
  ├─ generate_matriks_ors.py: Ambil data dari OpenRouteService API
  ├─ app.py: Server API
  └─ Data: distance_matrix.csv, duration_matrix.csv, dataset.json

Frontend (JavaScript)
  ├─ floydWarshall.js: Implementasi algoritma
  ├─ graphVisualization.js: Visualisasi graf canvas
  ├─ app.js: Logika aplikasi + integrasi Leaflet
  └─ index.html: UI
```

### Alur Data:
```
1. OFFLINE: Script Python panggil ORS Matrix API
   → Matriks 12×12 tersimpan

2. RUNTIME: 
   Frontend load matriks → Jalankan Floyd-Warshall
   → Rekonstruksi path → Ambil geometri dari ORS Directions API
   → Visualisasi di peta + graf
```

### Keunggulan:
- **Data Real**: Jarak aktual dari jaringan jalan, bukan Haversine
- **Client-side Computation**: Algoritma jalan di browser, server tidak terbebani
- **Multi-visualization**: Peta interaktif + Graf berarah + Matriks hasil

---

## 6. DEMO LIVE (3 menit)

### Tahap 1: Tampilkan Graf
"[Klik 'Lihat Graf Berarah']
- 12 node (RS) tersusun melingkar untuk clarity
- Edge dengan panah menunjukkan arah dan bobot
- Warna node = klasifikasi jalan arteri"

### Tahap 2: Hitung Rute
"[Pilih: Dari RSUP Dr. Ben Mboi → Ke RSU Leona]
[Klik 'Hitung Rute Tercepat']

Proses:
1. Floyd-Warshall jalan 1,728 iterasi
2. Rekonstruksi path: [0] → [1] → [9] (misal)
3. Fetch geometri jalur dari ORS
4. Gambar polyline merah di peta
5. Highlight path di graf"

### Tahap 3: Lihat Matriks
"[Klik 'Lihat Matriks']
- Hijau: Jarak langsung (tidak berubah)
- Kuning: Jarak dioptimalkan via perantara
- Hover untuk detail: jarak asli vs hasil optimasi"

### Tahap 4: Semua Jalur
"[Klik 'Lihat Semua Jalur']
- Tabel 132 pasangan (12×11)
- Kolom 'Jalur' menunjukkan path konkret
- Badge 'Tidak Langsung' untuk hasil optimasi Floyd-Warshall"

---

## 7. HASIL & INSIGHT (1 menit)

### Contoh Optimasi Terdeteksi:
```
RSUP Dr. Ben Mboi → RSU Leona
  Langsung: 8.2 km
  Via RSUD W.Z. Johannes: 6.7 km
  HEMAT: 1.5 km (18%)
```

### Analisis Sentralitas:
"Dari matriks hasil, kita hitung rata-rata jarak setiap RS ke semua RS lain:
- RS dengan rata-rata terendah = paling 'sentral'
- Cocok untuk hub logistik/ambulans
- Misal: RSUD W.Z. Johannes (avg: 5.2 km)"

---

## 8. PERBANDINGAN ALGORITMA (1 menit)

| Algoritma | Kompleksitas | Use Case | Kelebihan | Kekurangan |
|-----------|-------------|----------|-----------|------------|
| **Dijkstra** | O(n² log n) per source | Single-source | Efisien untuk 1 sumber | Perlu n kali untuk all-pairs |
| **Bellman-Ford** | O(nm) per source | Bobot negatif | Handle negative weights | Lambat untuk dense graph |
| **Floyd-Warshall** | O(n³) | All-pairs | Simple, dapat semua pasangan sekaligus | Tidak cocok graph besar (n>1000) |

**Kesimpulan**: Floyd-Warshall optimal untuk kasus ini karena:
1. Jumlah RS kecil (12 node)
2. Butuh semua pasangan sekaligus
3. Implementasi sederhana, mudah dipahami

---

## 9. KETERBATASAN & PENGEMBANGAN (1 menit)

### Keterbatasan:
- **Statis**: Data jarak tidak update real-time (kemacetan)
- **Asumsi Graf Lengkap**: Tidak semua RS punya koneksi langsung dalam visualisasi
- **Bobot Tunggal**: Belum mempertimbangkan multi-kriteria (waktu + biaya + kapasitas)

### Pengembangan:
1. **Real-time Traffic**: Integrasi API traffic untuk bobot dinamis
2. **Multi-objective**: Kombinasi jarak + waktu + kapasitas RS
3. **Clustering**: Bagi RS ke zona untuk skalabilitas lebih besar
4. **Vehicle Routing**: Ekstensi ke TSP/VRP untuk rute multi-RS
5. **Centrality Analysis**: Betweenness/Closeness centrality untuk identifikasi hub

---

## 10. PENUTUP (30 detik)

"Sistem ini mendemonstrasikan penerapan algoritma Floyd-Warshall klasik pada data spasial real. Dengan visualisasi graf berarah, klasifikasi jalan arteri, dan matriks interaktif, kami menunjukkan:

1. ✅ Pemahaman algoritma dynamic programming
2. ✅ Implementasi all-pairs shortest path
3. ✅ Integrasi data geospasial real (OpenRouteService)
4. ✅ Visualisasi multi-layer (peta + graf + matriks)
5. ✅ Aplikasi praktis: optimasi rujukan RS

Terima kasih. Saya siap menerima pertanyaan."

---

## ANTISIPASI PERTANYAAN DOSEN

### Q1: "Kenapa tidak pakai Dijkstra saja?"
**A**: "Dijkstra efisien untuk single-source, tapi untuk mendapat semua 132 pasangan perlu dipanggil 12 kali. Floyd-Warshall sekali jalan langsung dapat semua, dan untuk n=12 masih sangat cepat (O(n³) = 1,728 operasi)."

### Q2: "Bagaimana path reconstruction bekerja?"
**A**: "Matriks `next[i][j]` menyimpan node berikutnya dari i ke j. Kita loop: `while i ≠ j: i = next[i][j]`, hasilnya path lengkap. Kuncinya simpan `next[i][k]` bukan k saat relaksasi."

### Q3: "Apa bedanya graf berarah vs tidak berarah di kasus ini?"
**A**: "Secara teori jalan bisa satu arah (one-way). Kami pakai graf berarah untuk akurasi, tapi karena data ORS Matrix API default bidirectional, banyak edge simetris. Visualisasi panah tetap menunjukkan arah eksplisit."

### Q4: "Apa fungsi klasifikasi jalan arteri?"
**A**: "Menunjukkan heterogenitas bobot edge. RS di arteri primer punya akses lebih cepat (bobot waktu lebih kecil meski jarak sama). Ini relevan kalau kita switch dari optimasi jarak ke waktu."

### Q5: "Apakah ada negative cycle?"
**A**: "Tidak relevan untuk domain jarak fisik. Semua bobot non-negatif. Tapi secara teoritis Floyd-Warshall bisa deteksi dengan cek `dist[i][i] < 0` setelah selesai."

### Q6: "Bagaimana skalabilitas untuk lebih banyak RS?"
**A**: "O(n³) tumbuh cepat. Untuk n=100 → 1 juta operasi (masih ok). n=1000 → 1 miliar (lambat). Solusi: clustering wilayah atau switch ke Johnson's Algorithm (reweight + Dijkstra) untuk sparse graph."

### Q7: "Kenapa pakai OpenRouteService, tidak hitung manual?"
**A**: "Rumus Haversine hanya jarak garis lurus (as-the-crow-flies). ORS memberikan jarak aktual mengikuti jaringan jalan, termasuk belokan dan hambatan. Lebih realistis."

---

## TIPS PRESENTASI

1. **Jangan Baca Slide**: Pakai slide sebagai visual aid, narasi dari memori
2. **Demo Interaktif**: Lebih menarik dari teori saja
3. **Siapkan Fallback**: Jika demo gagal, punya screenshot/video
4. **Timing**: Latih agar pas 15 menit (termasuk Q&A buffer)
5. **Kontak Mata**: Jangan selalu lihat layar
6. **Antusiasme**: Tunjukkan bahwa Anda paham dan excited tentang project ini

**SEMANGAT! 🚀**
