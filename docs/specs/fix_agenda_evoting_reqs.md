# Feature Specs: Agenda & E-Voting

Dokumen ini berisi detail spesifikasi fitur **Agenda Kegiatan** dan **Pemilu Ketua Umum** berdasarkan diskusi dengan Project Owner (User).

## 1. Modul Agenda (Event Management)

### A. Mekanisme Kehadiran (Attendance)
*   **Trigger:** Peserta dianggap "Hadir" hanya jika **QR Anggota** mereka discan oleh Panitia di lokasi acara.
*   **Alat:** Panitia menggunakan Admin Tools di HP untuk scan.
*   **Status Kehadiran:**
    *   `Registered`: Terdaftar, belum hadir.
    *   `Attended`: Berhasil check-in/scan.
    *   `Absent` (Alpha): Event selesai, user tidak scan dan tidak ada alasan.

### B. Logika Sanksi (Strict but Soft)
Tujuan: Mengurangi *No Show Rate* pada event gratisan.
*   **Rule Sanksi:** Jika status `Absent` (Alpha) terjadi **2 kali berturut-turut**.
*   **Efek Sanksi:**
    *   Akun user ditandai dalam periode sanksi.
    *   Saat mendaftar Event ke-3 (dan seterusnya), status pendaftaran otomatis masuk **Waiting List**.
    *   User mendapat pesan peringatan bahwa prioritas diberikan ke orang lain.
*   **Pemutihan (Reset):**
    *   Status sanksi hilang otomatis setelah user berhasil **`Attended`** (Scan QR) pada 1 event.
    *   Pendaftaran event berikutnya kembali normal (`Registered`).

### C. Pembatalan & Izin
*   **Deadline:** User dapat membatalkan pendaftaran atau mengajukan izin maksimal **H-2** sebelum acara.
*   **Approval:** Alasan izin wajib melewati **Approval Admin**. Jika di-approve, status menjadi `Cancelled (Permitted)` dan tidak menghitung counter Alpha.
*   **UX:** Sebelum daftar, muncul **Modal T&C** poin-poin sanksi ini yang wajib disetujui (Centang).

---

## 2. Modul E-Voting (Pemilu Raya)

### A. General Concept
*   **Frekuensi:** Sangat jarang (4-5 tahun sekali).
*   **Visibility:** Fitur bersifat **On/Off**.
    *   **Off:** Menu "Pemilu" tersembunyi total dari Sidebar.
    *   **On:** Menu muncul + Ada **Global Banner/Alert** di Dashboard mengajak user memilih.
*   **Data Lifecycle:** Setiap periode pemilu baru dimulai, Admin bisa "Start New Election" yang mengarsipkan data lama (reset).

### B. Fase 1: Kampanye Digital (Pre-Event)
Fokus pada engagement dan pengenalan calon.
*   **Platform Kandidat (Self-Service):**
    *   Kandidat (Role khusus) login dan edit profil sendiri.
    *   Input: Foto, Slogan, Visi Misi (Rich Text), Video URL, Sosmed.
    *   Riwayat Pendidikan & Pekerjaan: Wajib menggunakan format **Structured List** (bukan teks bebas) agar rapi.
*   **User Interaction:**
    *   **Like/Dukungan:** Aturan **1 User 1 Like**. (Bisa pindah dukungan, tapi tidak bisa like double).
    *   **Aspirasi:** Kolom komentar yang dimoderasi.
*   **Admin Analytics:**
    *   Real-time stats: Jumlah dukungan.
    *   Demografi: Umur, Gender, Wilayah (Domisili) para pendukung.
    *   Kata Kunci Aspirasi.

### C. Fase 2: Hari Pemungutan Suara (Voting Day)
Akan diaktifkan terpisah saat hari H.
*   **Akses:** Hanya member status **Verified**.
*   **Validasi Keamanan:**
    *   Saat klik "Coblos/Pilih", user WAJIB memasukkan **Password Akun** sebagai tanda tangan digital sah.
*   **Audit & Privasi:**
    *   Database menyimpan siapa pilih siapa (`voter_id` -> `candidate_id`) untuk audit trail.
    *   **Restricted View:** Data detail ini **HANYA** boleh dilihat Super Admin. Dashboard publik/admin biasa hanya melihat **Agregat Total Suara**.
*   **Pasca-Vote:**
    *   User tidak bisa memilih lagi (Block).
    *   Redirect ke halaman "Terima Kasih" sederhana.

---
*Dokumen dibuat otomatis pada 30 Des 2025 sebagai arsip diskusi.*
