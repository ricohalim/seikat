'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import {
    Shield, Users, CheckCircle, Search, Download,
    Coffee, AlertCircle, Camera, X
} from 'lucide-react'
import Link from 'next/link'

export default function EventStaffPage() {
    const params = useParams()
    const router = useRouter()
    const eventId = params.id as string

    // State
    const [loading, setLoading] = useState(true)
    const [event, setEvent] = useState<any>(null)
    const [myRole, setMyRole] = useState<string | null>(null)
    const [stats, setStats] = useState({ total: 0, checkedIn: 0, percentage: 0 })

    // Tools State
    const [searchQuery, setSearchQuery] = useState('')
    const [participants, setParticipants] = useState<any[]>([])
    const [scanResult, setScanResult] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        checkAccess()
    }, [eventId])

    const checkAccess = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/auth/login')
            return
        }

        // 1. Get Staff Role
        const { data: staff, error } = await supabase
            .from('event_staff')
            .select('role')
            .eq('event_id', eventId)
            .eq('user_id', user.id)
            .single()

        if (error || !staff) {
            alert('Akses Ditolak: Anda bukan panitia event ini.')
            router.push('/dashboard/events')
            return
        }

        setMyRole(staff.role)

        // 2. Get Event Details
        const { data: eventData } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single()
        setEvent(eventData)

        // 3. Get Stats
        fetchStats()

        setLoading(false)
    }

    const fetchStats = async () => {
        // Total
        const { count: total, error: cssErr } = await supabase
            .from('event_participants')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)

        // Checked In
        const { count: checkedIn, error: ciErr } = await supabase
            .from('event_participants')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId)
            .not('check_in_time', 'is', null)

        if (!cssErr && !ciErr) {
            setStats({
                total: total || 0,
                checkedIn: checkedIn || 0,
                percentage: total ? Math.round(((checkedIn || 0) / total) * 100) : 0
            })
        }
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery) return

        setIsProcessing(true)
        const { data } = await supabase
            .from('event_participants')
            .select('*, profiles:user_id(full_name, email, member_id)')
            .eq('event_id', eventId)
            .or(`notes.ilike.%${searchQuery}%, user_id.in.(select id from profiles where full_name ilike '%${searchQuery}%'), user_id.in.(select id from profiles where member_id ilike '%${searchQuery}%')`)
        // Note: Join search is tricky in Supabase basic query, better to search participant_meta if denormalized
        // Fallback: search just by user_id if we rely on profile join. 
        // For now, let's assume we search by raw profile join or just exact Member ID matches if plain query fails?
        // Actually, let's just fetch all and filter in JS for smoother UX if list < 1000

        // Revised Strategy: Simple RPC or Client Filter for MVP
        // Let's use a simpler Client Filter for now as we don't have a dedicated search RPC yet
        const { data: allParts } = await supabase
            .from('event_participants')
            .select('*, profiles:user_id(full_name, email, member_id)')
            .eq('event_id', eventId)

        if (allParts) {
            const filtered = allParts.filter((p: any) =>
                p.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.profiles.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.profiles.member_id && p.profiles.member_id.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            setParticipants(filtered)
        }
        setIsProcessing(false)
    }

    const processAction = async (participantId: string, action: 'CheckIn' | 'Redeem') => {
        setIsProcessing(true)
        setMessage(null)

        try {
            if (action === 'CheckIn') {
                // Use RPC to ensure consistency with Admin Panel & Sanction Reset
                const { error } = await supabase.rpc('check_in_participant', {
                    p_event_id: eventId,
                    p_user_id: participants.find(p => p.id === participantId)?.user_id
                })

                if (error) throw error

                setMessage({ type: 'success', text: 'Berhasil Check-in!' })
                fetchStats()
                // Update local list state
                setParticipants(prev => prev.map(p =>
                    p.id === participantId ? { ...p, check_in_time: new Date().toISOString() } : p
                ))
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Gagal: ' + error.message })
        } finally {
            setIsProcessing(false)
        }
    }

    const downloadReport = async () => {
        const { data: allData } = await supabase
            .from('event_participants')
            .select('check_in_time, profiles:user_id(full_name, email, phone)')
            .eq('event_id', eventId)
            .order('check_in_time', { ascending: false })

        if (!allData) return

        const csv = "Nama,Email,No HP,Waktu Check-in,Status\n" +
            allData.map((row: any) => {
                const status = row.check_in_time ? 'Hadir' : 'Belum';
                const time = row.check_in_time ? new Date(row.check_in_time).toLocaleTimeString() : '-';
                return `"${row.profiles.full_name}","${row.profiles.email}","${row.profiles.phone}","${time}","${status}"`
            }).join("\n")

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Laporan_Kehadiran_${event.title}.csv`
        a.click()
    }

    if (loading) return <div className="p-8 text-center">Memuat konsol panitia...</div>

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in">
            {/* Header */}
            <div className="bg-navy p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <Link href="/dashboard/events" className="text-white/60 text-xs hover:underline mb-1 block">&larr; Kembali ke Daftar Event</Link>
                            <h1 className="text-2xl font-bold">{event.title}</h1>
                            <p className="text-navy-100 text-sm opacity-80">{new Date(event.date_start).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold border border-white/20 backdrop-blur-sm">
                                {myRole}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                    <p className="text-gray-400 text-xs uppercase font-bold">Total Peserta</p>
                    <p className="text-2xl font-bold text-navy">{stats.total}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                    <p className="text-gray-400 text-xs uppercase font-bold">Sudah Hadir</p>
                    <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
                    <p className="text-gray-400 text-xs uppercase font-bold">Kehadiran</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.percentage}%</p>
                </div>
            </div>

            {/* Main Console */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: Input / Action */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-navy mb-4 flex items-center gap-2">
                            <Camera size={20} /> Check-in
                        </h3>

                        {message && (
                            <div className={`p-3 rounded-lg text-sm font-bold mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSearch} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Cari Peserta Manual</label>
                                <div className="flex gap-2 mt-1">
                                    <input
                                        type="text"
                                        className="w-full border rounded-lg p-2 text-sm"
                                        placeholder="Nama / Email..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                    <button type="submit" className="bg-navy text-white p-2 rounded-lg">
                                        <Search size={20} />
                                    </button>
                                </div>
                            </div>
                        </form>


                    </div>

                    <button
                        onClick={downloadReport}
                        className="w-full bg-white border border-gray-200 text-navy py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2 shadow-sm"
                    >
                        <Download size={18} /> Download Laporan
                    </button>
                </div>

                {/* Right: Results List */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-navy">Hasil Pencarian</h3>
                            {participants.length > 0 && <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">{participants.length} ditemukan</span>}
                        </div>

                        <div className="divide-y divide-gray-100">
                            {isProcessing && participants.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">Loading...</div>
                            ) : participants.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">
                                    <Search size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>Cari nama peserta untuk melakukan check-in.</p>
                                </div>
                            ) : (
                                participants.map((p) => (
                                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                                        <div>
                                            <p className="font-bold text-navy">{p.profiles?.full_name}</p>
                                            <p className="text-xs text-gray-500">{p.profiles?.member_id || 'No ID'} • {p.profiles?.email}</p>

                                            {/* Status Badge */}
                                            {p.check_in_time ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-1">
                                                    <CheckCircle size={10} /> Hadir: {new Date(p.check_in_time).toLocaleTimeString()}
                                                </span>
                                            ) : (
                                                <span className="inline-block text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mt-1">
                                                    Belum Hadir
                                                </span>
                                            )}
                                        </div>

                                        {!p.check_in_time && (
                                            <button
                                                onClick={() => processAction(p.id, 'CheckIn')}
                                                disabled={isProcessing}
                                                className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-navy/90 active:scale-95 transition"
                                            >
                                                Check In
                                            </button>
                                        )}
                                        {p.check_in_time && (
                                            <button
                                                disabled
                                                className="bg-green-100 text-green-600 px-4 py-2 rounded-lg text-sm font-bold opacity-50 cursor-not-allowed"
                                            >
                                                Done
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
