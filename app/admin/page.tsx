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


                // 4. Trend Data (Last 7 Days)
                const sevenDaysAgo = new Date()
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6) // Include today
                sevenDaysAgo.setHours(0, 0, 0, 0)

                const { data: trendRaw } = await supabase
                    .from('temp_registrations')
                    .select('submitted_at')
                    .gte('submitted_at', sevenDaysAgo.toISOString())
                    .order('submitted_at', { ascending: true })

                // Process Trend Data
                const dailyCounts: { [key: string]: number } = {}
                // Initialize last 7 days with 0 (Local Time)
                for (let i = 0; i < 7; i++) {
                    const d = new Date()
                    d.setDate(d.getDate() - i)
                    // Use 'en-CA' to get YYYY-MM-DD in LOCAL TIME
                    const dateKey = d.toLocaleDateString('en-CA')
                    dailyCounts[dateKey] = 0
                }

                if (trendRaw) {
                    trendRaw.forEach((item: any) => {
                        // Convert DB timestamp (UTC/ISO) to Local Date Key
                        const dateKey = new Date(item.submitted_at).toLocaleDateString('en-CA')
                        if (dailyCounts.hasOwnProperty(dateKey)) {
                            dailyCounts[dateKey]++
                        }
                    })
                }

                // Convert to Array and Sort
                const trendArray = Object.keys(dailyCounts)
                    .sort()
                    .map(dateKey => {
                        const date = new Date(dateKey)
                        return {
                            date: dateKey,
                            count: dailyCounts[dateKey],
                            label: date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' })
                        }
                    })

                setTrendData(trendArray)

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

            {/* Daily Trend Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-bold text-navy text-lg">Trend Pendaftar Perhari</h3>
                        <p className="text-xs text-gray-400">Total registrasi 7 hari terakhir</p>
                    </div>
                    <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold">
                        Last 7 Days
                    </div>
                </div>

                <div className="h-64 flex items-end justify-between gap-2 md:gap-4 px-2">
                    {loading ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">Loading Chart...</div>
                    ) : (
                        trendData.map((day, index) => {
                            const maxCount = Math.max(...trendData.map(d => d.count), 5); // Min max is 5 for scale
                            const heightPercent = (day.count / maxCount) * 100;
                            const isToday = index === trendData.length - 1;

                            return (
                                <div key={day.date} className="flex flex-col items-center justify-end w-full group">
                                    <div className="relative w-full flex justify-end flex-col items-center h-full">
                                        <div
                                            className={`w-full max-w-[40px] md:max-w-[60px] rounded-t-lg transition-all duration-500 ease-out relative ${isToday ? 'bg-navy' : 'bg-blue-200 group-hover:bg-blue-300'}`}
                                            style={{ height: `${Math.max(heightPercent, 2)}%` }} // Min 2% height
                                        >
                                            {/* Tooltip Content */}
                                            <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded pointer-events-none transition mb-2 shadow-lg whitespace-nowrap z-10">
                                                {day.count} Pendaftar
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`mt-3 text-[10px] md:text-xs font-bold text-center ${isToday ? 'text-navy' : 'text-gray-400'}`}>
                                        {day.label}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
