import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Users, UserPlus, Clock, TrendingUp, LayoutDashboard } from 'lucide-react'
import DownloadAlumniButton from '@/app/components/admin/DownloadAlumniButton'
import { hasAdminAccess } from '@/lib/roles'

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

    // Role guard: hanya admin & superadmin yang boleh akses halaman ini
    if (!selfProfile || !hasAdminAccess(selfProfile.role)) {
        if (selfProfile?.role === 'korwil') redirect('/admin/agendas')
        redirect('/dashboard')
    }

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
        <div className="space-y-6 pb-10 animate-in fade-in duration-500">

            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-navy/8 flex items-center justify-center flex-shrink-0">
                        <LayoutDashboard size={18} className="text-navy" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-navy tracking-tight">Monitoring Dashboard</h1>
                        <p className="text-sm text-gray-400">Ringkasan aktivitas dan status keanggotaan real-time</p>
                    </div>
                </div>
                <DownloadAlumniButton />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pending */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-orange relative overflow-hidden group">
                    <div className="absolute right-3 top-3 opacity-[0.07] group-hover:opacity-[0.12] transition">
                        <Clock size={72} className="text-orange" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Butuh Verifikasi</p>
                    <h2 className="text-4xl font-black text-navy">{pendingCount ?? 0}</h2>
                    <p className="text-xs text-orange font-bold mt-2">Menunggu Persetujuan</p>
                </div>

                {/* Active */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-azure relative overflow-hidden group">
                    <div className="absolute right-3 top-3 opacity-[0.07] group-hover:opacity-[0.12] transition">
                        <Users size={72} className="text-azure" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Alumni Aktif</p>
                    <h2 className="text-4xl font-black text-navy">{activeCount ?? 0}</h2>
                    <p className="text-xs text-azure font-bold mt-2 flex items-center gap-1">
                        <TrendingUp size={11} /> Anggota Terverifikasi
                    </p>
                </div>

                {/* Today */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm border-l-4 border-l-purple-500 relative overflow-hidden group">
                    <div className="absolute right-3 top-3 opacity-[0.07] group-hover:opacity-[0.12] transition">
                        <UserPlus size={72} className="text-purple-500" />
                    </div>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2">Pendaftar Baru</p>
                    <h2 className="text-4xl font-black text-navy">{todayCount ?? 0}</h2>
                    <p className="text-xs text-purple-500 font-bold mt-2">+{todayCount ?? 0} Hari Ini</p>
                </div>
            </div>

            {/* Demographics */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-xl bg-navy/8 flex items-center justify-center flex-shrink-0">
                        <Users size={17} className="text-navy" />
                    </div>
                    <div>
                        <h3 className="font-black text-navy tracking-tight">Demografi Alumni</h3>
                        <p className="text-[11px] text-gray-400">{activeCount ?? 0} alumni aktif terdaftar</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-azure inline-block" />
                            Distribusi Generasi
                        </p>
                        {generations.length > 0
                            ? <BarChart data={generations} color="#2563eb" />
                            : <p className="text-xs text-gray-300">Belum ada data.</p>
                        }
                    </div>

                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                            Top 5 Sektor Industri
                        </p>
                        {industries.length > 0
                            ? <BarChart data={industries} color="#22c55e" />
                            : <p className="text-xs text-gray-300">Belum ada data.</p>
                        }
                    </div>

                    <div>
                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                            Top 5 Provinsi Domisili
                        </p>
                        {provinces.length > 0
                            ? <BarChart data={provinces} color="#a855f7" />
                            : <p className="text-xs text-gray-300">Belum ada data.</p>
                        }
                    </div>
                </div>
            </div>
        </div>
    )
}
