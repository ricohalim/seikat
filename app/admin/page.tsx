import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, UserPlus, Clock, TrendingUp } from 'lucide-react'
import DownloadAlumniButton from '@/app/components/admin/DownloadAlumniButton'

// Helper: count occurrences and return sorted top-N entries
function topEntries(arr: string[], n: number): { label: string; count: number }[] {
    const freq: Record<string, number> = {}
    for (const val of arr) {
        const key = val?.trim()
        if (key) freq[key] = (freq[key] || 0) + 1
    }
    return Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([label, count]) => ({ label, count }))
}

// Simple horizontal bar chart (pure CSS, zero JS)
function BarChart({ data, color }: { data: { label: string; count: number }[]; color: string }) {
    const max = data[0]?.count || 1
    return (
        <ul className="space-y-2">
            {data.map(({ label, count }) => (
                <li key={label}>
                    <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs text-gray-600 truncate max-w-[70%]">{label}</span>
                        <span className="text-xs font-bold text-gray-800">{count}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${(count / max) * 100}%`, backgroundColor: color }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    )
}

export default async function AdminDashboardPage() {
    const supabase = await createClient()

    // Auth guard
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: selfProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (selfProfile?.role === 'korwil') redirect('/admin/agendas')

    // ── All data fetched in PARALLEL — single round trip ──────────────────────
    const [
        { count: activeCount },
        { count: pendingCount },
        { count: todayCount },
        { data: demoData },
    ] = await Promise.all([
        // 1. Total active profiles
        supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('account_status', 'Active'),

        // 2. Pending verifications
        supabase
            .from('temp_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'Pending'),

        // 3. New registrations today
        supabase
            .from('temp_registrations')
            .select('*', { count: 'exact', head: true })
            .gte('submitted_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),

        // 4. Demographic data — only 3 lightweight columns
        supabase
            .from('profiles')
            .select('generation, industry_sector, domicile_province')
            .eq('account_status', 'Active'),
    ])

    // Aggregate demographics server-side (no client bundle cost)
    const generations = topEntries((demoData || []).map(d => d.generation), 10)
    const industries = topEntries((demoData || []).map(d => d.industry_sector), 5)
    const provinces = topEntries((demoData || []).map(d => d.domicile_province), 5)

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <header>
                <h1 className="text-3xl font-bold text-navy">Monitoring Dashboard</h1>
                <p className="text-gray-500">Ringkasan aktivitas dan status keanggotaan real-time.</p>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pending */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-orange shadow-orange/10 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition">
                        <Clock size={80} className="text-orange" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Butuh Verifikasi</p>
                        <h2 className="text-4xl font-extrabold text-navy mt-2">{pendingCount ?? 0}</h2>
                        <p className="text-xs text-orange font-bold mt-2">Menunggu Persetujuan</p>
                    </div>
                </div>

                {/* Active */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-500 shadow-blue-500/10 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition">
                        <Users size={80} className="text-blue-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Alumni Aktif</p>
                        <h2 className="text-4xl font-extrabold text-navy mt-2">{activeCount ?? 0}</h2>
                        <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                            <TrendingUp size={12} /> Anggota Terverifikasi
                        </p>
                    </div>
                </div>

                {/* Today */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-purple-500 shadow-purple-500/10 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition">
                        <UserPlus size={80} className="text-purple-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Pendaftar Baru</p>
                        <h2 className="text-4xl font-extrabold text-navy mt-2">{todayCount ?? 0}</h2>
                        <p className="text-xs text-purple-600 font-bold mt-2">+{todayCount ?? 0} Hari Ini</p>
                    </div>
                </div>
            </div>

            {/* Demographics */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-bold text-navy text-lg">Demografi Alumni</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{activeCount ?? 0} alumni aktif</p>
                    </div>
                    <DownloadAlumniButton />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Generasi */}
                    <div>
                        <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                            Distribusi Generasi
                        </p>
                        {generations.length > 0
                            ? <BarChart data={generations} color="#3b82f6" />
                            : <p className="text-xs text-gray-400">Belum ada data.</p>
                        }
                    </div>

                    {/* Sektor Industri */}
                    <div>
                        <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                            Top 5 Sektor Industri
                        </p>
                        {industries.length > 0
                            ? <BarChart data={industries} color="#22c55e" />
                            : <p className="text-xs text-gray-400">Belum ada data.</p>
                        }
                    </div>

                    {/* Provinsi Domisili */}
                    <div>
                        <p className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                            Top 5 Provinsi Domisili
                        </p>
                        {provinces.length > 0
                            ? <BarChart data={provinces} color="#a855f7" />
                            : <p className="text-xs text-gray-400">Belum ada data.</p>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}
