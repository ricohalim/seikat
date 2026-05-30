
import Link from 'next/link'
import { ArrowRight, Users, Calendar, MapPin, GraduationCap, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  // Single RPC call — run landing_page_stats_v2.sql first in Supabase
  const { data: stats } = await supabase.rpc('get_landing_stats' as any)

  const alumniCount: number = stats?.alumni_count ?? 0
  const generationCount: number = stats?.generation_count ?? 0
  const universityCount: number = stats?.university_count ?? 0

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">

      {/* ── Navbar ────────────────────────────────────────── */}
      <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-navy rounded-md flex items-center justify-center flex-shrink-0">
              <span className="text-white font-black text-[10px] tracking-tighter">SK</span>
            </div>
            <span className="text-lg font-black text-navy tracking-tight">SEIKAT</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/check-account"
              className="hidden sm:block text-sm font-semibold text-gray-500 hover:text-navy transition"
            >
              Cek Akun
            </Link>
            <Link
              href="/auth/register"
              className="hidden sm:block text-sm font-semibold text-gray-500 hover:text-navy transition"
            >
              Daftar
            </Link>
            <Link
              href="/auth/login"
              className="bg-navy text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-navy/90 transition"
            >
              Masuk
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1">

        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="max-w-3xl">

            {/* Label */}
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-5 bg-orange rounded-full" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Portal Resmi IKADBP
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-[3.75rem] font-black text-navy leading-[1.1] tracking-tight mb-6">
              Satu Tempat untuk<br />
              Semua Alumni<br />
              <span className="text-azure">Beswan Djarum</span>
            </h1>

            <p className="text-lg text-gray-500 leading-relaxed mb-10 max-w-xl">
              Terhubung dengan ribuan penerima Djarum Beasiswa Plus dari seluruh angkatan dan universitas di Indonesia.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-start gap-3">
              <Link
                href="/auth/login"
                className="group inline-flex items-center gap-2 bg-navy text-white font-bold px-6 py-3.5 rounded-xl hover:bg-navy/90 transition text-sm"
              >
                Masuk ke Portal
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 bg-gray-100 text-navy font-bold px-6 py-3.5 rounded-xl hover:bg-gray-200 transition text-sm"
              >
                Daftar Sekarang
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats Bar ─────────────────────────────────────── */}
        <section className="border-y border-gray-100 bg-gray-50/50">
          <div className="max-w-6xl mx-auto px-6 py-10">
            <div className="grid grid-cols-3 gap-8 md:gap-0 md:divide-x md:divide-gray-200">

              <div className="md:px-8 md:first:pl-0">
                <p className="text-3xl md:text-4xl font-black text-navy tabular-nums">
                  {alumniCount > 0 ? alumniCount.toLocaleString('id-ID') : '—'}
                </p>
                <p className="text-sm text-gray-400 font-medium mt-1">Alumni Aktif</p>
              </div>

              <div className="md:px-8">
                <p className="text-3xl md:text-4xl font-black text-navy tabular-nums">
                  {generationCount > 0 ? `${generationCount}+` : '—'}
                </p>
                <p className="text-sm text-gray-400 font-medium mt-1">Angkatan</p>
              </div>

              <div className="md:px-8">
                <p className="text-3xl md:text-4xl font-black text-navy tabular-nums">
                  {universityCount > 0 ? `${universityCount}+` : '—'}
                </p>
                <p className="text-sm text-gray-400 font-medium mt-1">Universitas</p>
              </div>

            </div>
          </div>
        </section>

        {/* ── Features ──────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-6 py-20">
          <div className="mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-navy tracking-tight">
              Semua yang kamu butuhkan<br className="hidden sm:block" /> ada di satu portal
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="w-10 h-10 bg-azure/10 rounded-xl flex items-center justify-center mb-4">
                <Users size={20} className="text-azure" />
              </div>
              <h3 className="font-bold text-navy mb-2">Direktori Alumni</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Cari dan temukan rekan seangkatan maupun senior di berbagai industri dan kota.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="w-10 h-10 bg-orange/10 rounded-xl flex items-center justify-center mb-4">
                <Calendar size={20} className="text-orange" />
              </div>
              <h3 className="font-bold text-navy mb-2">Agenda Kegiatan</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Reuni, seminar, dan kegiatan eksklusif khusus anggota IKADBP dari seluruh wilayah.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="w-10 h-10 bg-navy/8 rounded-xl flex items-center justify-center mb-4">
                <GraduationCap size={20} className="text-navy" />
              </div>
              <h3 className="font-bold text-navy mb-2">Profil Terverifikasi</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Bangun profil profesional yang terverifikasi dan dapat dilihat sesama alumni.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                <Mail size={20} className="text-green-600" />
              </div>
              <h3 className="font-bold text-navy mb-2">Inbox & Pengumuman</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Terima broadcast langsung dari sekretariat IKADBP tanpa terlewat.
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
                <MapPin size={20} className="text-purple-600" />
              </div>
              <h3 className="font-bold text-navy mb-2">Jaringan Nasional</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Alumni aktif tersebar di seluruh penjuru Indonesia — jaringan yang sesungguhnya.
              </p>
            </div>

            {/* CTA Card */}
            <div className="bg-navy rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Sudah terdaftar?</p>
                <h3 className="font-bold text-white text-lg leading-snug mb-4">
                  Masuk dan akses semua fitur sekarang
                </h3>
              </div>
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 bg-white text-navy font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-gray-100 transition w-fit"
              >
                Masuk ke Portal
                <ArrowRight size={14} />
              </Link>
            </div>

          </div>
        </section>

      </main>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="bg-navy py-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-white/10 rounded-md flex items-center justify-center">
                <span className="text-white font-black text-[9px]">SK</span>
              </div>
              <span className="text-white font-black text-base tracking-tight">SEIKAT</span>
            </div>
            <p className="text-white/30 text-xs">
              © {new Date().getFullYear()} Ikatan Alumni Djarum Beasiswa Plus. All rights reserved.
            </p>
          </div>
          <div className="flex gap-4 text-sm">
            <a
              href="mailto:sekretariat.ikadbp@gmail.com"
              className="text-white/50 hover:text-white transition font-medium"
            >
              Email
            </a>
            <a
              href="https://wa.me/6282398243245?text=Halo%20saya%20ingin%20bertanya%20terkait%20IKADBP"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/50 hover:text-white transition font-medium"
            >
              WhatsApp
            </a>
            <Link href="/check-account" className="text-white/50 hover:text-white transition font-medium">
              Cek Akun
            </Link>
          </div>
        </div>
      </footer>

    </div>
  )
}
