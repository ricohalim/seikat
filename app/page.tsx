
import Link from 'next/link'
import { ArrowRight, Users, Calendar, Award } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  // Fetch Active Alumni Count via RPC (bypassing RLS for public view)
  const { data: activeCount } = await supabase.rpc('get_active_alumni_count')

  // Default to a realistic number/placeholder if fetch fails or is 0
  const displayCount = activeCount || 0

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-800">

      {/* Navbar */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-navy tracking-tight">SEIKAT</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/check-account" className="text-sm font-semibold text-navy hover:text-azure transition flex items-center gap-2">
              Cek Akun
            </Link>
            <Link href="/auth/register" className="text-sm font-semibold text-navy hover:text-azure transition flex items-center gap-2">
              Daftar
            </Link>
            <Link href="/auth/login" className="bg-navy text-white text-sm font-bold px-4 py-2 rounded-full hover:bg-navy/90 transition shadow-sm">
              Masuk
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-white"></div>

          <div className="max-w-4xl mx-auto px-6 text-center">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-azure px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-6">
              <Award size={14} /> Resmi Ikatan Alumni
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold text-navy leading-tight mb-6">
              Terhubung Kembali dengan <span className="text-transparent bg-clip-text bg-gradient-to-r from-azure to-blue-400">Keluarga Beswan Djarum</span>
            </h1>

            {/* Dynamic Stats Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50/50 backdrop-blur-sm border border-blue-100 text-azure px-5 py-2.5 rounded-full text-base font-semibold shadow-sm mb-8 hover:bg-blue-50 transition cursor-default">
              <Users size={18} />
              <span>Bergabunglah dengan <span className="font-bold text-navy">{displayCount} Alumni</span> lainnya</span>
            </div>

            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Portal resmi untuk berjejaring, berbagi peluang, dan mengenang masa-masa indah bersama penerima Djarum Beasiswa Plus dari seluruh angkatan.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/login"
                className="group bg-orange text-white text-lg font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl hover:bg-orange/90 transition-all flex items-center gap-2"
              >
                Masuk ke Portal
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/check-account" className="text-navy font-semibold hover:text-azure transition px-6">
                Cek Status Akun
              </Link>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="bg-white py-20 border-t border-gray-50">
          <div className="max-w-4xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-azure mx-auto mb-6">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">Direktori Alumni</h3>
              <p className="text-gray-500 leading-relaxed">
                Temukan kontak rekan seangkatan atau senior di berbagai industri dan perusahaan ternama.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange/10 rounded-2xl flex items-center justify-center text-orange mx-auto mb-6">
                <Calendar size={32} />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">Agenda Kegiatan</h3>
              <p className="text-gray-500 leading-relaxed">
                Jangan lewatkan reuni, seminar, dan kegiatan sosial eksklusif untuk anggota IKADBP.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-navy py-12 text-white/80 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <span className="text-2xl font-bold text-white tracking-tight block mb-2">SEIKAT</span>
            <p className="text-sm opacity-60">© 2025 Ikatan Alumni Djarum Beasiswa Plus. All rights reserved.</p>
          </div>
          <div className="flex gap-6 text-sm font-medium items-center">
            <a href="mailto:sekretariat.ikadbp@gmail.com" className="hover:text-white transition flex items-center gap-2">
              Email Kami
            </a>
            <a
              href="https://wa.me/6282398243245?text=Halo%20saya%20ingin%20bertanya%20terkait%20IKADBP"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full hover:bg-white/20"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
