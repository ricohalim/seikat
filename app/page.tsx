
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <h1 className="text-4xl font-bold text-navy mb-4">SEIKAT</h1>
      <p className="text-lg text-gray-600 mb-8">
        Portal Alumni Djarum Beasiswa Plus <br />
        <span className="text-sm opacity-60">(Versi Next.js + Supabase)</span>
      </p>

      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100 max-w-md w-full">
        <h2 className="text-xl font-bold text-azure mb-2">Status Deployment</h2>
        <p className="mb-4">Jika Anda melihat halaman ini, artinya koneksi Vercel sudah Berhasil! 🚀</p>

        <Link
          href="/auth/login"
          className="block w-full bg-orange text-white font-bold py-3 px-4 rounded-lg hover:bg-orange/90 transition"
        >
          Coba Login
        </Link>
      </div>

      <footer className="mt-10 text-xs text-gray-400">
        &copy; {new Date().getFullYear()} IKADBP (Migration In Progress)
      </footer>
    </div>
  )
}
