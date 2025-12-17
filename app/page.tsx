
import Navbar from './components/Navbar'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <Navbar />

      <main className="max-w-3xl mx-auto px-5 pt-5 space-y-6">

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-navy to-azure text-white rounded-xl p-8 text-center shadow-lg">
          <h2 className="text-2xl font-bold mb-3">Selamat Datang di SEIKAT</h2>
          <p className="text-sm opacity-90 mb-6 leading-relaxed">
            Wadah digital resmi untuk silaturahmi, pendataan, dan kolaborasi Ikatan Alumni Djarum Beasiswa Plus.
          </p>
          <Link
            href="/auth/register"
            className="inline-block bg-orange text-white font-bold py-3 px-8 rounded-lg shadow-md hover:bg-orange/90 transition transform hover:scale-105"
          >
            Daftar Anggota Sekarang
          </Link>
        </div>

        {/* Info Cards */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-navy font-bold text-lg border-l-4 border-orange pl-3 mb-4">
            Tentang Kami
          </h3>
          <p className="text-sm text-gray-600 text-justify leading-relaxed">
            Platform ini dirancang untuk memudahkan alumni dalam memperbarui data diri, mencari rekan seangkatan, serta mendaftar pada kegiatan-kegiatan eksklusif alumni. Pastikan data Anda selalu mutakhir untuk tetap terhubung.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
          <h3 className="text-navy font-bold text-lg mb-4">Pusat Bantuan</h3>
          <p className="text-sm text-gray-600 mb-4">Mengalami kendala?</p>
          <div className="flex justify-center gap-4 text-sm font-bold text-azure">
            <a href="mailto:sekretariat.ikadbp@gmail.com" className="hover:underline">Email</a>
            <span className="text-gray-300">|</span>
            <a href="https://wa.me/6282398243245" target="_blank" className="hover:underline">WhatsApp</a>
          </div>
        </div>

      </main>

      <footer className="text-center text-xs text-gray-400 mt-10 pb-5">
        © {new Date().getFullYear()} Ikatan Alumni Djarum Beasiswa Plus.<br />
        Didukung oleh Sekretariat IKADBP.
      </footer>
    </div>
  )
}
