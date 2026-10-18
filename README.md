# NielCare Dental

Platform manajemen klinik gigi modern terpadu berbasis AI dengan fitur triage analisis keluhan gejala instan (Google Gemini & NVIDIA API), pendaftaran janji temu mandiri tanpa login bagi pasien, portal rekam medis elektronik (EMR) dokter gigi, dan dashboard analitik pendapatan bagi pemilik klinik.

##  Fitur Utama

- **Pasien Mandiri Tanpa Login:** Pasien dapat langsung membuat janji temu dan menganalisis keluhan gigi tanpa repot mendaftar akun atau mengingat kata sandi. Pengenal unik pasien menggunakan nomor telepon aktif (1 nomor HP = 1 pasien).
- **Alur Pasien Baru vs Pasien Lama:**
  - *Pasien Baru:* Mengisi nama lengkap, nomor HP, tanggal lahir, jenis kelamin, serta berat badan (kg) dan tinggi badan (cm) untuk perhitungan dosis medikasi dokter.
  - *Pasien Lama:* Cukup memasukkan nomor HP untuk auto-populate data kunjungan secara otomatis.
- **AI Symptom Triage & Analysis:** Menggunakan AI untuk mendeteksi tingkat kegawatan (*Critical*, *Moderate*, *Routine*), rekomendasi spesialisasi dokter, saran tindakan awal, serta estimasi biaya perawatan transparan sebelum booking. Dilengkapi circuit breaker dan fallback heuristik lokal.
- **Unified Staff Login:** Halaman portal staf `/login` yang aman dan terpadu untuk Dokter dan Owner tanpa indikasi/pilihan role, mencegah penyerang (*attackers*) mengetahui keberadaan akun admin/owner.
- **Rekam Medis Elektronik (EMR):** Dokter dapat mencatat diagnosa klinis, tindakan perawatan, resep obat, serta biaya aktual, dengan peringatan deviasi biaya terhadap estimasi awal AI.
- **Laporan & Analitik Klinik:** Owner dapat memantau pendapatan bulanan, tren kunjungan pasien, dan performa produktivitas dokter.

##  Tech Stack

- **Framework & Runtime:** Next.js 16 (App Router) + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 + Radix UI + Lucide React
- **Database & Auth:** Supabase PostgreSQL dengan Row Level Security (RLS)
- **AI Engine:** Google Gemini Flash (`v1beta`) & NVIDIA NIM API
