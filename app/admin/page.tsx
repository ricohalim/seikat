'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, UserPlus, Clock, TrendingUp } from 'lucide-react'

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        totalActive: 0,
        totalPending: 0,
        todayCount: 0 // Renamed from pendingToday to reflect it's TOTAL registrations
    })
    const [trendData, setTrendData] = useState<{ date: string, count: number, label: string }[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 1. Total Active Profiles
                const { count: activeCount } = await supabase
                    .from('profiles')
                    .select('*', { count: 'exact', head: true })
                    .eq('account_status', 'Active')

                // 2. Total Pending in Temp Registrations
                const { count: pendingCount } = await supabase
                    .from('temp_registrations')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'Pending')

                // 3. New Registrations Today (ALL Statuses)
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const { count: todayCount } = await supabase
                    .from('temp_registrations')
                    .select('*', { count: 'exact', head: true })
                    .gte('submitted_at', today.toISOString())


                setStats({
                    totalActive: activeCount || 0,
                    totalPending: pendingCount || 0,
                    todayCount: todayCount || 0
                })

            } catch (error) {
                console.error("Error fetching admin stats:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [])

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            <header>
                <h1 className="text-3xl font-bold text-navy">Monitoring Dashboard</h1>
                <p className="text-gray-500">Ringkasan aktivitas dan status keanggotaan real-time.</p>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Pending Verification (Actionable) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-orange shadow-orange/10 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition">
                        <Clock size={80} className="text-orange" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Butuh Verifikasi</p>
                        <h2 className="text-4xl font-extrabold text-navy mt-2">{loading ? '-' : stats.totalPending}</h2>
                        <p className="text-xs text-orange font-bold mt-2">Menunggu Persetujuan</p>
                    </div>
                </div>

                {/* Card 2: Total Active Members */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-blue-500 shadow-blue-500/10 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition">
                        <Users size={80} className="text-blue-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Alumni Aktif</p>
                        <h2 className="text-4xl font-extrabold text-navy mt-2">{loading ? '-' : stats.totalActive}</h2>
                        <p className="text-xs text-green-600 font-bold mt-2 flex items-center gap-1">
                            <TrendingUp size={12} /> Anggota Terverifikasi
                        </p>
                    </div>
                </div>

                {/* Card 3: Growth (Total Today) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border-l-4 border-purple-500 shadow-purple-500/10 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition">
                        <UserPlus size={80} className="text-purple-500" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Pendaftar Baru</p>
                        <h2 className="text-4xl font-extrabold text-navy mt-2">{loading ? '-' : stats.todayCount}</h2>
                        <p className="text-xs text-purple-600 font-bold mt-2">+{stats.todayCount} Hari Ini</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions / Recent Flow */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-navy mb-4 text-lg">Aktivitas Terkini</h3>
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-xl bg-gray-50">
                    Belum ada aktivitas tercatat hari ini.
                </div>
            </div>
        </div>
    )
}
