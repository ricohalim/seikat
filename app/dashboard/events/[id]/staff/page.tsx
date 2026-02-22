'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { EventQRModal } from '@/app/components/admin/EventQRModal'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { Search, Users, CheckCircle, Clock, AlertCircle, Camera, QrCode, Download, UserPlus, X } from 'lucide-react'
import Link from 'next/link'

export default function EventStaffPage() {
    const params = useParams()
    const router = useRouter()
    const eventId = params.id as string

    // State
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<'scan' | 'list'>('scan')
    const [isQROpen, setIsQROpen] = useState(false)
    const [event, setEvent] = useState<any>(null)
    const [myRole, setMyRole] = useState<string | null>(null)
    const [stats, setStats] = useState({ total: 0, checkedIn: 0, percentage: 0 })

    // Tools State
    const [searchQuery, setSearchQuery] = useState('')
    const [participants, setParticipants] = useState<any[]>([])
    const [allParticipants, setAllParticipants] = useState<any[]>([])
    const [loadingList, setLoadingList] = useState(false)
    const [scanResult, setScanResult] = useState('')
    const [isProcessing, setIsProcessing] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Walk-in Add State
    const [walkInQuery, setWalkInQuery] = useState('')
    const [walkInResult, setWalkInResult] = useState<any>(null)
    const [walkInLoading, setWalkInLoading] = useState(false)
    const [walkInError, setWalkInError] = useState<string | null>(null)
    const [walkInAdding, setWalkInAdding] = useState(false)

    useEffect(() => {
        checkAccess()
    }, [eventId])

    // Realtime: auto-update saat ada self check-in atau perubahan oleh siapapun
    useEffect(() => {
        if (!eventId) return

        const channel = supabase
            .channel(`staff-console-${eventId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'event_participants',
                    filter: `event_id=eq.${eventId}`
                },
                () => {
                    fetchAllParticipants()
                    fetchStats()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
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

        // 3. Get Stats & Participants
        fetchStats()
        fetchAllParticipants()

        setLoading(false)
    }

    const fetchAllParticipants = async () => {
        setLoadingList(true)
        const { data } = await supabase
            .from('event_participants')
            .select('*, profiles:user_id(full_name, email, member_id, generation)')
            .eq('event_id', eventId)
            .order('check_in_time', { ascending: false, nullsFirst: false })

        if (data) {
            setAllParticipants(data)
        }
        setLoadingList(false)
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

    // Search = live filter dari allParticipants
    const filteredParticipants = searchQuery.trim()
        ? allParticipants.filter(p =>
            p.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.profiles?.member_id?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : allParticipants

    const processAction = async (participantId: string, action: 'CheckIn' | 'Redeem') => {
        setIsProcessing(true)
        setMessage(null)

        try {
            if (action === 'CheckIn') {
                const participant = allParticipants.find(p => p.id === participantId)
                const { error } = await supabase.rpc('check_in_participant', {
                    p_event_id: eventId,
                    p_user_id: participant?.user_id
                })

                if (error) throw error

                setMessage({ type: 'success', text: 'Berhasil Check-in!' })
                fetchStats()
                // Update local list
                setAllParticipants(prev => prev.map(p =>
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
            .select('check_in_time, profiles:user_id(full_name, generation, university)')
            .eq('event_id', eventId)
            .order('check_in_time', { ascending: false })

        if (!allData) return

        const csv = "NAMA,ANGKATAN,UNIVERSITAS,WAKTU CHECK-IN,STATUS\n" +
            allData.map((row: any) => {
                const status = row.check_in_time ? 'Hadir' : 'Belum';
                const time = row.check_in_time ? new Date(row.check_in_time).toLocaleTimeString('id-ID') : '-';
                return `"${row.profiles.full_name}","${row.profiles.generation}","${row.profiles.university}","${time}","${status}"`
            }).join("\n")

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Laporan_Kehadiran_${event.title}.csv`
        a.click()
    }

    // --- Walk-in Logic ---
    const handleWalkInSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!walkInQuery.trim()) return
        setWalkInLoading(true)
        setWalkInError(null)
        setWalkInResult(null)

        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, member_id, generation')
            .or(`email.ilike.%${walkInQuery}%,full_name.ilike.%${walkInQuery}%,member_id.ilike.%${walkInQuery}%`)
            .limit(1)
            .single()

        if (error || !data) {
            setWalkInError('User tidak ditemukan. Coba email, nama, atau Member ID.')
        } else {
            setWalkInResult(data)
        }
        setWalkInLoading(false)
    }

    const handleWalkInAdd = async () => {
        if (!walkInResult) return
        setWalkInAdding(true)

        try {
            // Cek sudah terdaftar
            const { data: existing } = await supabase
                .from('event_participants')
                .select('id, status')
                .eq('event_id', eventId)
                .eq('user_id', walkInResult.id)
                .single()

            if (existing) {
                toast.error(`${walkInResult.full_name} sudah terdaftar (${existing.status})`)
                setWalkInAdding(false)
                return
            }

            // Tambah & auto check-in
            const { error } = await supabase
                .from('event_participants')
                .insert({
                    event_id: eventId,
                    user_id: walkInResult.id,
                    status: 'Registered',
                    check_in_time: new Date().toISOString(),
                    notes: 'Walk-in / On-the-spot (Staff)',
                    tags: ['Walk-in']
                })

            if (error) throw error

            toast.success(`${walkInResult.full_name} berhasil ditambahkan & check-in!`)
            fetchStats()
            fetchAllParticipants()
            setWalkInResult(null)
            setWalkInQuery('')
        } catch (err: any) {
            toast.error('Gagal tambah peserta: ' + err.message)
        } finally {
            setWalkInAdding(false)
        }
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

            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-navy">{event?.title || 'Memuat...'}</h1>
                        <p className="text-gray-500 flex items-center gap-2 text-sm mt-1">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            Live Console Panitia
                        </p>
                    </div>
                    <button
                        onClick={() => setIsQROpen(true)}
                        className="bg-navy/10 text-navy px-4 py-2 rounded-lg text-sm font-bold hover:bg-navy/20 transition flex items-center gap-2"
                    >
                        <QrCode size={18} />
                        Tampilkan QR Event
                    </button>
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

                        <form onSubmit={e => e.preventDefault()} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Filter Peserta</label>
                                <div className="flex gap-2 mt-1">
                                    <div className="relative flex-1">
                                        <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            className="w-full border rounded-lg pl-7 pr-3 py-2 text-sm"
                                            placeholder="Nama / Email / ID..."
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>


                    </div>

                    {/* Walk-in Add Participant */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-green-100">
                        <h3 className="font-bold text-navy mb-4 flex items-center gap-2">
                            <UserPlus size={20} className="text-green-600" /> Tambah Walk-in
                        </h3>
                        <p className="text-xs text-gray-400 mb-3">Daftarkan peserta on-the-spot — langsung terdaftar & check-in.</p>

                        <form onSubmit={handleWalkInSearch} className="space-y-3">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    className="flex-1 border rounded-lg p-2 text-sm"
                                    placeholder="Nama / Email / Member ID..."
                                    value={walkInQuery}
                                    onChange={e => {
                                        setWalkInQuery(e.target.value)
                                        setWalkInResult(null)
                                        setWalkInError(null)
                                    }}
                                />
                                <button
                                    type="submit"
                                    disabled={walkInLoading}
                                    className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                >
                                    <Search size={18} />
                                </button>
                            </div>

                            {walkInError && (
                                <p className="text-red-500 text-xs">{walkInError}</p>
                            )}

                            {walkInResult && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
                                    <div>
                                        <p className="font-bold text-sm text-navy">{walkInResult.full_name}</p>
                                        <p className="text-xs text-gray-500">{walkInResult.email}</p>
                                        <p className="text-xs text-gray-400">Beswan {walkInResult.generation} • {walkInResult.member_id || 'No ID'}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setWalkInResult(null); setWalkInQuery('') }}
                                        className="text-gray-300 hover:text-red-400 transition ml-2"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            {walkInResult && (
                                <button
                                    type="button"
                                    onClick={handleWalkInAdd}
                                    disabled={walkInAdding}
                                    className="w-full bg-green-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-green-700 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-green-600/20"
                                >
                                    <UserPlus size={16} />
                                    {walkInAdding ? 'Menambahkan...' : 'Tambahkan & Check-in'}
                                </button>
                            )}
                        </form>
                    </div>

                    <button
                        onClick={downloadReport}
                        className="w-full bg-white border border-gray-200 text-navy py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition flex items-center justify-center gap-2 shadow-sm"
                    >
                        <Download size={18} /> Download Laporan
                    </button>
                </div>

                {/* Right: Participants List */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px]">
                        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-navy">Daftar Pendaftar</h3>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                                    {filteredParticipants.filter(p => p.check_in_time).length} / {allParticipants.length} Hadir
                                </span>
                                {searchQuery && (
                                    <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                                        {filteredParticipants.length} hasil
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="divide-y divide-gray-100 overflow-y-auto max-h-[600px]">
                            {loadingList ? (
                                <div className="p-8 text-center text-gray-400">Memuat daftar peserta...</div>
                            ) : filteredParticipants.length === 0 ? (
                                <div className="p-12 text-center text-gray-400">
                                    <Users size={48} className="mx-auto mb-4 opacity-20" />
                                    <p>{searchQuery ? 'Tidak ada peserta yang cocok.' : 'Belum ada pendaftar.'}</p>
                                </div>
                            ) : (
                                filteredParticipants.map((p) => (
                                    <div key={p.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-navy truncate">
                                                {p.profiles?.full_name || <span className="text-gray-400 font-normal italic">Nama tidak tersedia</span>}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {p.profiles?.member_id || 'No ID'} • {p.profiles?.email || <span className="italic">Email tidak ada</span>}
                                            </p>

                                            {/* Status Badge */}
                                            <div className="mt-1">
                                                {p.check_in_time ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                        <CheckCircle size={10} /> Hadir {new Date(p.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                ) : p.status === 'Waiting List' ? (
                                                    <span className="inline-block text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">Waiting List</span>
                                                ) : p.status === 'Permitted' || p.status === 'Cancelled' ? (
                                                    <span className="inline-block text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Izin / Batal</span>
                                                ) : (
                                                    <span className="inline-block text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Terdaftar</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Check-in hanya untuk Registered yang belum hadir */}
                                        {p.status === 'Registered' && !p.check_in_time && (
                                            <button
                                                onClick={() => processAction(p.id, 'CheckIn')}
                                                disabled={isProcessing}
                                                className="ml-3 bg-navy text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm hover:bg-navy/90 active:scale-95 transition shrink-0"
                                            >
                                                Check In
                                            </button>
                                        )}
                                        {p.check_in_time && (
                                            <span className="ml-3 text-green-500 shrink-0">
                                                <CheckCircle size={20} />
                                            </span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Modal QR */}
            {event && (
                <EventQRModal
                    isOpen={isQROpen}
                    onClose={() => setIsQROpen(false)}
                    eventName={event.title}
                    eventId={event.id}
                />
            )}
        </div>
    )
}
