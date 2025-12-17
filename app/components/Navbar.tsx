
import Link from 'next/link'

export default function Navbar() {
    return (
        <>
            {/* Header Utama matching style original */}
            <div className="bg-navy text-white text-center py-6 border-b-4 border-orange">
                <h1 className="text-2xl font-bold uppercase tracking-wider m-0">SEIKAT</h1>
                <p className="text-sm opacity-80 mt-1">Sentra Informasi dan Kegiatan Alumni Terpadu</p>
            </div>

            {/* Navigation Tabs (Sticky) */}
            <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm px-4 py-3">
                <div className="max-w-3xl mx-auto flex gap-2 overflow-x-auto no-scrollbar">
                    <Link href="/" className="px-4 py-2 rounded-full border border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100 font-semibold text-sm whitespace-nowrap transition-colors">
                        🏠 Beranda
                    </Link>
                    <Link href="/check" className="px-4 py-2 rounded-full border border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100 font-semibold text-sm whitespace-nowrap transition-colors">
                        🔍 Cek Status
                    </Link>
                    <Link href="/auth/login" className="px-4 py-2 rounded-full border border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100 font-semibold text-sm whitespace-nowrap transition-colors">
                        👤 Ruang Alumni
                    </Link>
                    <Link href="/auth/register" className="px-4 py-2 rounded-full border border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100 font-semibold text-sm whitespace-nowrap transition-colors">
                        📝 Pendaftaran
                    </Link>
                </div>
            </div>
        </>
    )
}
