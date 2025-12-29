# KITAB PROYEK SEIKAT (The Standard)

Dokumen ini berisi "Hukum & Aturan" yang wajib diikuti dalam pengembangan aplikasi SEIKAT.

## 1. Aturan Data (Database & Input)

### 1.1. Hybrid Uppercase Strategy
Untuk menjaga kerapian data tanpa mengorbankan estetika, kita menerapkan aturan **Hybrid Uppercase**:

*   **Wajib UPPERCASE (Identity Data)**: Field yang bersifat identitas resmi/administratif harus disimpan dalam HURUF KAPITAL.
    *   *Contoh*: `full_name`, `birth_place`, `university`, `faculty`, `major`, `company_name`, `job_position`, `domicile_city`.
    *   *Implementasi*: Gunakan `.toUpperCase()` pada `onChange` di Frontend.
*   **Normal Case (Descriptive Data)**: Field yang bersifat cerita atau deskripsi bebas dibiarkan apa adanya.
    *   *Contoh*: `hobbies`, `interests`, `business_desc`, `bio`.
*   **Lowercase**: Field teknis.
    *   *Contoh*: `email`, `website`, `linkedin_url`.

## 2. Aturan Autentikasi (Auth & Security)

### 2.1. Login Gatekeeper
User dengan status `Pending` **DILARANG** masuk ke Dashboard.
*   **Login Flow**: Jika user login dan statusnya `Pending` -> Force Logout -> Redirect ke halaman `/auth/verification-pending`.
*   **Dashboard Guard**: Jika user memaksa masuk via URL `/dashboard` -> Redirect ke `/auth/verification-pending`.

### 2.2. Redirect Preservation
Saat user yang belum login mengakses halaman deep-link (misal: `/dashboard/change-password`), sistem **WAJIB** mengembalikan user ke halaman tersebut setelah login sukses.
*   *Mekanisme*: Gunakan parameter `?next=/tujuan` pada URL Login.

## 3. Aturan Status Akun

### 3.1. User Registration Flow
*   **Step 1**: User Daftar -> Masuk ke table `profiles` dengan status `Pending`.
*   **Step 2**: User Login -> Diarahkan ke halaman "Menunggu Verifikasi".
*   **Step 3**: Admin Approve -> Status berubah jadi `Active` -> User bisa akses Dashboard.

### 3.2. Status Enum Standard
Untuk menjaga konsistensi, nilai `account_status` yang valid adalah:
*   `Active` (Bukan 'Aktif', 'active', atau 'Live')
*   `Pending`
*   `Rejected`
*   `Suspended`

*Catatan: Jika menemukan data 'Aktif', segera migrasikan ke 'Active'.*

## 4. Design Guidelines (Estetika)

*   **Style**: Premium Glassmorphism.
*   **Color Palette**: Navy Blue (Dominan), Orange/Gold (Accent), White/Glass (Cards).
*   **Vibe**: Professional, Modern, "Gen Z" but Corporate.
