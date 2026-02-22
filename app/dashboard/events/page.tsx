'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, AlertCircle, Lock, LayoutList, History } from 'lucide-react'
import { calculateProfileCompleteness } from '@/lib/utils'
import Link from 'next/link'
import { UserEventCard, UserEventSkeleton } from '@/app/components/events/UserEventCard'
import { EventTermsModal } from '@/app/components/events/EventTermsModal'
import { CancellationModal } from '@/app/components/events/CancellationModal'
import { useToast } from '@/app/context/ToastContext'
import { useRouter } from 'next/navigation'

interface Event {
    id: string
    title: string
    description: string
    date_start: string
    location: string
    status: string
    quota: number
    participants?: { status: string }[]
    scope?: string
    province?: string[] // Changed to array
    is_online?: boolean
}

export default function EventsPage() {
    const { addToast } = useToast()
    const router = useRouter()
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [userRegistrations, setUserRegistrations] = useState<Record<string, string>>({})
    const [staffEventIds, setStaffEventIds] = useState<string[]>([])

    // UI States
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming')
    const [registeringId, setRegisteringId] = useState<string | null>(null)
    const [termsModalOpen, setTermsModalOpen] = useState(false)
    const [cancellationModalOpen, setCancellationModalOpen] = useState(false)
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
    const [cancellingId, setCancellingId] = useState<string | null>(null)

    // Authorization & Sanction State
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isUserLoading, setIsUserLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)
    const [consecutiveAbsences, setConsecutiveAbsences] = useState(0)
    const [isAdmin, setIsAdmin] = useState(false)

    // Pisahkan fetchData agar bisa dipanggil dari Realtime callback
    const fetchData = useCallback(async () => {
        if (!isAuthorized) return
        setLoading(true)

        let eventQuery = supabase
            .from('events')
            .select('*, participants:event_participants(status)')
            .order('date_start', { ascending: false })

        if (!isAdmin) {
            eventQuery = eventQuery.neq('status', 'Draft')
        }

        const [eventsRes, registrationsRes, staffRes] = await Promise.all([
            eventQuery,
            currentUser ? supabase.from('event_participants').select('event_id, status').eq('user_id', currentUser.id).neq('status', 'Cancelled').neq('status', 'Permitted') : Promise.resolve({ data: [] }),
            currentUser ? supabase.from('event_staff').select('event_id').eq('user_id', currentUser.id) : Promise.resolve({ data: [] })
        ])

        if (eventsRes.data) setEvents(eventsRes.data)
        if (registrationsRes.data) {
            const map = registrationsRes.data.reduce((acc: any, r: any) => ({ ...acc, [r.event_id]: r.status }), {})
            setUserRegistrations(map)
        }
        if (staffRes.data) setStaffEventIds(staffRes.data.map((s: any) => s.event_id))

        setLoading(false)
    }, [isAuthorized, isAdmin, currentUser])

    // Check Authorization First
    useEffect(() => {
        async function checkAccess() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                setCurrentUser(user)

                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

                if (profile) {
                    setConsecutiveAbsences(profile.consecutive_absences || 0)
                    const percent = calculateProfileCompleteness(profile)
                    // Save user province for filtering
                    if (profile.domicile_province) {
                        setCurrentUser((prev: any) => ({ ...user, domicile_province: profile.domicile_province }))
                    }
                    if (percent >= 90) {
                        setIsAuthorized(true)
                    }
                    if (['admin', 'superadmin'].includes(profile.role)) {
                        setIsAdmin(true)
                    }
                }
            } catch (err) {
                console.error("Auth check failed", err)
            } finally {
                setIsUserLoading(false)
            }
        }
        checkAccess()
    }, [])

    useEffect(() => {
        if (!isAuthorized || isUserLoading) return

        fetchData()
    }, [isAuthorized, isUserLoading, currentUser, isAdmin])

    // Realtime subscription: update kuota langsung saat ada perubahan peserta
    useEffect(() => {
        if (!isAuthorized) return

        const channel = supabase
            .channel('event-participants-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'event_participants' },
                () => {
                    // Re-fetch data saat ada perubahan (daftar/batal/check-in oleh siapapun)
                    fetchData()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [isAuthorized, fetchData])

    // Step 1: Click Register -> Open T&C Modal
    const handleRegisterClick = (eventId: string) => {
        setSelectedEventId(eventId)
        setTermsModalOpen(true)
    }

    // Step 2: Confirm T&C -> Panggil RPC atomik di DB
    const handleConfirmRegistration = async () => {
        if (!selectedEventId || !currentUser) return

        setRegisteringId(selectedEventId)

        try {
            // RPC menentukan status (Registered/Waiting List) secara atomik:
            // - Cek kuota real-time dengan lock (FOR UPDATE) → aman dari race condition
            // - Cek sanksi absensi user
            const { data, error } = await supabase.rpc('register_for_event', {
                p_event_id: selectedEventId,
                p_user_id: currentUser.id,
            })

            if (error) throw error

            const result = data as { success: boolean; status?: string; message: string }

            if (!result.success) {
                addToast(result.message, 'error')
                return
            }

            const status = result.status as string
            setUserRegistrations(prev => ({ ...prev, [selectedEventId]: status }))

            if (status === 'Waiting List') {
                addToast(result.message, 'info')
            } else {
                addToast(result.message, 'success')
            }

            router.refresh()
            setTermsModalOpen(false)
        } catch (error: any) {
            addToast('Gagal mendaftar: ' + error.message, 'error')
        } finally {
            setRegisteringId(null)
            setSelectedEventId(null)
        }
    }

    // Cancellation: Click -> Check Deadline -> Open Modal
    const handleCancelClick = (eventId: string) => {
        const event = events.find(e => e.id === eventId)
        if (!event) return

        // Check H-2 Deadline
        const eventDate = new Date(event.date_start)
        const today = new Date()
        // H-2 deadline: Event Date - 2 days
        const deadline = new Date(eventDate)
        deadline.setDate(deadline.getDate() - 2)

        if (today > deadline) {
            addToast("Gagal: Pembatalan hanya bisa dilakukan maksimal H-2 acara.", "error")
            return
        }

        setSelectedEventId(eventId)
        setCancellationModalOpen(true)
    }

    // Cancellation: Confirm -> Update DB
    const handleConfirmCancellation = async (reason: string) => {
        if (!selectedEventId || !currentUser) return
        setCancellingId(selectedEventId)

        try {
            // Spec says: "Alasan izin wajib melewati Approval Admin."
            const { error } = await supabase
                .from('event_participants')
                .update({
                    cancellation_reason: reason,
                    cancellation_status: 'pending'
                })
                .eq('event_id', selectedEventId)
                .eq('user_id', currentUser.id)

            if (error) throw error

            addToast("Permohonan izin dikirim. Menunggu persetujuan admin.", "info")
            setCancellationModalOpen(false)
        } catch (error: any) {
            addToast("Gagal mengirim izin: " + error.message, "error")
        } finally {
            setCancellingId(null)
            setSelectedEventId(null)
        }
    }

    // --- Filter Logic ---
    const displayedEvents = events.filter(event => {
        if (activeTab === 'upcoming') {
            // Show all future events OR events today (ignore time, just date comparison?)
            // Actually user wants "literally kemarin" gone. So Today is kept.
            // Logic: Event Date >= Today's Start
            const eventDate = new Date(event.date_start)
            const today = new Date()
            today.setHours(0, 0, 0, 0)

            // Date Filter
            if (eventDate < today) return false

            // HIDDEN IF ALREADY REGISTERED:
            if (userRegistrations[event.id]) return false

            // Visibility Filter Logic
            // 1. Online Events -> Visible to ALL
            if (event.is_online) return true

            // 2. National Scope -> Visible to ALL
            if (event.scope === 'nasional') return true

            // 3. Regional Scope -> Visible only if province matches
            if (event.scope === 'regional') {
                // If user has no province data, maybe hide or show? Assuming hide to be strict.
                if (!currentUser?.domicile_province) return false

                // Compare with Array
                // Handle legacy data (string) or new data (array)
                const targetProvinces = Array.isArray(event.province)
                    ? event.province
                    : (event.province ? [event.province] : [])

                return targetProvinces.some((p: string) => p.toUpperCase() === currentUser.domicile_province.toUpperCase())
            }

            // Default fallback (should not reach here if data is clean)
            return true
        } else {
            // History: Show events registered by user
            return !!userRegistrations[event.id]
        }
    })

    if (isUserLoading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {[...Array(4)].map((_, i) => <UserEventSkeleton key={i} />)}
        </div>
    )

    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6 animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-2">
                    <Lock size={40} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-navy">Akses Terkunci</h2>
                    <p className="text-gray-500 max-w-md mx-auto mt-2">
                        Pendaftaran Event hanya dapat diakses oleh anggota yang telah melengkapi profil mereka (Verified Badge).
                    </p>
                </div>
                <div className="bg-orange/5 border border-orange/20 p-4 rounded-xl max-w-md text-left flex items-start gap-3">
                    <AlertCircle className="text-orange flex-shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-gray-600">
                        Profil Anda belum memenuhi syarat 90% kelengkapan. Silakan lengkapi data kontak, pekerjaan, dan akademik Anda.
                    </p>
                </div>
                <Link href="/dashboard/profile" className="bg-navy text-white px-6 py-3 rounded-xl font-bold hover:bg-navy/90 transition shadow-lg hover:shadow-xl hover:-translate-y-1">
                    Lengkapi Profil Sekarang
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold text-navy">Agenda Kegiatan</h2>
                <p className="text-gray-500 text-sm">Informasi kegiatan dan acara mendatang untuk alumni.</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 transition border-b-2 ${activeTab === 'upcoming' ? 'border-navy text-navy' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <LayoutList size={16} />
                    Agenda Baru
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`pb-3 text-sm font-bold flex items-center gap-2 transition border-b-2 ${activeTab === 'history' ? 'border-navy text-navy' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                >
                    <History size={16} />
                    Riwayat / Terdaftar
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => <UserEventSkeleton key={i} />)}
                </div>
            ) : displayedEvents.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-100 text-gray-400">
                    <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                    <p>
                        {activeTab === 'upcoming'
                            ? 'Belum ada agenda kegiatan baru saat ini.'
                            : 'Anda belum mendaftar kegiatan apapun.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {displayedEvents.map((event) => (
                        <UserEventCard
                            key={event.id}
                            event={event}
                            isRegistered={!!userRegistrations[event.id]}
                            registrationStatus={userRegistrations[event.id]}
                            isClosed={event.status !== 'Open'}
                            isStaff={staffEventIds.includes(event.id)}
                            isRegistering={false}
                            onRegister={() => handleRegisterClick(event.id)}
                            onCancel={() => handleCancelClick(event.id)}
                        />
                    ))}
                </div>
            )}

            <EventTermsModal
                isOpen={termsModalOpen}
                onClose={() => setTermsModalOpen(false)}
                onConfirm={handleConfirmRegistration}
                loading={!!registeringId}
                isSanctioned={consecutiveAbsences >= 2}
                consecutiveAbsences={consecutiveAbsences}
            />

            <CancellationModal
                isOpen={cancellationModalOpen}
                onClose={() => setCancellationModalOpen(false)}
                onConfirm={handleConfirmCancellation}
                loading={!!cancellingId}
            />
        </div>
    )
}
