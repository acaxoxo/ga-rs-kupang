# RINGKASAN PROJECT - Quick Reference
## Optimasi Rute Antar Rumah Sakit Kupang

---

## 🎯 POINT PENTING UNTUK PRESENTASI

### 1. JUDUL & FOKUS
**"Optimasi Rute ANTAR Rumah Sakit di Kota Kupang Menggunakan Algoritma Floyd-Warshall"**

- ✅ ANTAR RS (bukan dari rumah ke RS)
- ✅ 12 Rumah Sakit sebagai node graf
- ✅ All-Pairs Shortest Path problem

---

### 2. MASALAH YANG DISELESAIKAN

**Use Case Utama:**
1. **Rujukan Antar RS**: RS kecil merujuk pasien ke RS besar dengan rute optimal
2. **Distribusi Logistik**: Rute ambulans, obat, vaksin, darah
3. **Analisis Jaringan**: Identifikasi RS paling strategis (sentralitas tinggi)

---

### 3. FITUR KUNCI YANG MENJAWAB KRITIK DOSEN

#### a. Graf Berarah ✅
- **Visualisasi Canvas**: Node (RS) + Edge (jalan) + Panah (arah)
- **Mode**:
  - Graf Berbobot (tampilkan jarak)
  - Graf Sederhana (hanya struktur)
  - Highlight Jalur (path hasil Floyd-Warshall)
  
**Tombol**: "Lihat Graf Berarah" → menampilkan visualisasi algoritma

#### b. Klasifikasi Jalan Arteri ✅
- **Arteri Primer** 🔴: RSUP Dr. Ben Mboi, RSUD W.Z. Johannes, RSAL, RS TNI AD
  - Jalan utama kota (Jl. El Tari, Jl. Timor Raya)
  
- **Arteri Sekunder** 🟠: Siloam, RSUD S.K. Lerik, RS St. Carolus, RSU Leona
  - Jalan penghubung kawasan
  
- **Jalan Lokal** 🔵: RSU Mamami, RS Kartini, RSIA Dedari, RS Jiwa Naimata
  - Jalan lingkungan/perumahan

**Fungsi**: Menunjukkan heterogenitas bobot edge (RS di arteri primer lebih accessible)

#### c. Fokus "Antar RS" ✅
- Tidak ada lagi konsep "rumah" sebagai origin
- Semua 12 lokasi adalah Rumah Sakit
- User bisa pilih RS mana saja sebagai asal/tujuan

---

### 4. ALGORITMA FLOYD-WARSHALL

**Triple Loop Relaksasi:**
```
for k (node perantara):
  for i (node asal):
    for j (node tujuan):
      if (jarak via k) < (jarak langsung):
         update jarak
         simpan path
```

**Kompleksitas**: O(n³) = O(12³) = 1,728 operasi → < 1ms

**Output**:
- Matriks jarak minimum semua 132 pasangan (12×11)
- Path reconstruction: urutan RS yang dilalui
- Deteksi jalur tidak langsung yang lebih efisien

---

### 5. DATA & TEKNOLOGI

**Backend**:
- Python + Flask
- OpenRouteService API (data jarak real dari jaringan jalan)
- generate_matriks_ors.py → matriks 12×12

**Frontend**:
- JavaScript (floydWarshall.js, graphVisualization.js, app.js)
- Leaflet.js (peta interaktif)
- Canvas API (visualisasi graf)

**Alur**:
```
Koordinat 12 RS → ORS Matrix API → Matriks 12×12
→ Floyd-Warshall → Path → ORS Directions API
→ Visualisasi Peta + Graf
```

---

### 6. DEMO SEQUENCE (5 menit)

1. **[30 detik]** Buka aplikasi → Tampilkan 12 RS di peta dengan warna berbeda
2. **[1 menit]** Klik "Lihat Graf Berarah" → Jelaskan node, edge, panah, warna
3. **[1 menit]** Pilih "Dari: RSUP Dr. Ben Mboi" → "Ke: RSU Leona"
4. **[1 menit]** Klik "Hitung Rute" → Tunjukkan proses, jalur merah di peta
5. **[30 detik]** Tunjukkan info rute: jarak, waktu, step-by-step
6. **[1 menit]** Klik "Lihat Matriks" → Tunjukkan sel kuning (optimasi via perantara)
7. **[30 detik]** Klik "Lihat Semua Jalur" → Scroll, tunjukkan badge "Tidak Langsung"

---

### 7. JAWABAN CEPAT PERTANYAAN DOSEN

**Q: "Kenapa tidak pakai Dijkstra?"**
A: "Dijkstra untuk single-source. Untuk dapat semua 132 pasangan perlu 12× eksekusi. Floyd-Warshall sekali jalan langsung dapat semua."

**Q: "Bagaimana graf berarah diterapkan?"**
A: "Visualisasi graf di canvas menunjukkan edge dengan panah. Secara teoritis jalan bisa one-way, meski data ini mostly bidirectional."

**Q: "Apa fungsi klasifikasi jalan arteri?"**
A: "Menunjukkan bobot edge berbeda. RS di arteri primer lebih accessible (waktu tempuh lebih kecil meski jarak sama). Relevan saat optimasi waktu vs jarak."

**Q: "Mengapa judul 'antar RS' tapi ada 'dari rumah'?"**
A: "SUDAH DIPERBAIKI. Sekarang tidak ada konsep 'rumah'. Semua 12 lokasi adalah RS. User bebas pilih RS mana saja sebagai asal/tujuan."

---

### 8. FILES KUNCI

**Backend**:
- `backend/scripts/generate_matriks_ors.py` → Generate matriks dari ORS API
- `backend/app.py` → Server Flask dengan 2 endpoint

**Frontend**:
- `frontend/floydWarshall.js` → Implementasi algoritma
- `frontend/graphVisualization.js` → Visualisasi graf canvas ⭐ BARU
- `frontend/app.js` → Logika aplikasi + integrasi
- `frontend/index.html` → UI dengan tombol "Lihat Graf Berarah" ⭐ BARU

**Dokumentasi**:
- `NARASI_PRESENTASI.md` → Narasi lengkap 15 menit
- `README.md` → Dokumentasi teknis

---

### 9. PERUBAHAN DARI VERSI SEBELUMNYA

| Aspek | Sebelum | Sekarang |
|-------|---------|----------|
| **Origin** | Rumah - Jl. Srikandi | ❌ Dihapus |
| **Jumlah Node** | 13 (1 rumah + 12 RS) | 12 (semua RS) |
| **Fokus** | Dari rumah ke RS | **Antar RS** ✅ |
| **Visualisasi Graf** | ❌ Tidak ada | Canvas interaktif ✅ |
| **Klasifikasi Jalan** | ❌ Tidak ada | Arteri primer/sekunder/lokal ✅ |
| **Warna Marker** | 2 warna (rumah/RS) | 3 warna (arteri primer/sekunder/lokal) ✅ |

---

### 10. CHECKLIST SEBELUM PRESENTASI

- [ ] Jalankan `python backend/scripts/generate_matriks_ors.py` untuk data terbaru
- [ ] Test aplikasi: `python backend/app.py` → buka `http://127.0.0.1:5000`
- [ ] Cek semua fitur berfungsi:
  - [ ] Peta muncul dengan 12 marker warna berbeda
  - [ ] Dropdown "Dari RS" dan "Ke RS" terisi 12 RS
  - [ ] Tombol "Hitung Rute" menghasilkan jalur merah
  - [ ] Tombol "Lihat Graf Berarah" menampilkan canvas
  - [ ] Tombol "Lihat Matriks" menampilkan tabel dengan warna
  - [ ] Tombol "Lihat Semua Jalur" menampilkan 132 pasangan
- [ ] Siapkan backup: screenshot/video jika demo gagal
- [ ] Baca `NARASI_PRESENTASI.md` minimal 2× untuk hafal
- [ ] Latih timing: target 12-15 menit

---

## 🚀 KALIMAT PEMBUKA PRESENTASI

"Selamat pagi/siang Bapak/Ibu Dosen. Pada kesempatan ini saya mempresentasikan implementasi algoritma Floyd-Warshall untuk optimasi rute ANTAR Rumah Sakit di Kota Kupang. 

Sistem ini menyelesaikan masalah All-Pairs Shortest Path untuk 12 Rumah Sakit yang direpresentasikan sebagai graf berarah berbobot dengan klasifikasi jalan arteri. 

Kami menambahkan visualisasi graf interaktif untuk menggambarkan bagaimana algoritma Floyd-Warshall bekerja, serta menunjukkan perbedaan bobot berdasarkan jenis jalan—arteri primer, arteri sekunder, dan jalan lokal.

Mari kita lihat demo sistem."

---

**SEMANGAT! Semua kritik dosen sudah dijawab dengan fitur konkret. Good luck! 🎓✨**
