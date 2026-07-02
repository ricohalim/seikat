'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, AlertCircle, Lock, LayoutList, History } from 'lucide-react'
import { calculateProfileCompleteness } from '@/lib/utils'
import Link from 'next/link'
import { UserEventCard, UserEventSkeleton } from '@/app/components/events/UserEventCard'
import { EventTermsModal } from '@/app/components/events/EventTermsModal'
import { CancellationModal } from '@/app/components/events/CancellationModal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Event {
    id: string
    title: string
    description: string
    date_start: string
    location: string
    status: string
    quota: number
    participants?: { status: string, user_id?: string, registered_at?: string }[]
    scope?: string
    province?: string[] // Changed to array
    is_online?: boolean
}

export default function EventsPage() {

    const router = useRouter()
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [userRegistrations, setUserRegistrations] = useState<Record<string, string>>({})
    const [userWaitlistReasons, setUserWaitlistReasons] = useState<Record<string, string | null>>({})
    const [userCancellationStatus, setUserCancellationStatus] = useState<Record<string, string | null>>({})
    const [userCheckInStatus, setUserCheckInStatus] = useState<Record<string, boolean>>({}) // Menyimpan status kehadiran
    const [staffEventIds, setStaffEventIds] = useState<string[]>([])
    const [userSurveyStatus, setUserSurveyStatus] = useState<Record<string, { hasSurvey: boolean; completed: boolean }>>({})

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
            .select('*, participants:event_participants(user_id, status, registered_at)')
            .order('date_start', { ascending: false })

        if (!isAdmin) {
            eventQuery = eventQuery.neq('status', 'Draft')
        }

        const [eventsRes, registrationsRes, staffRes] = await Promise.all([
            eventQuery,
            currentUser ? supabase.from('event_participants').select('event_id, status, waitlist_reason, cancellation_status, check_in_time').eq('user_id', currentUser.id).neq('status', 'Cancelled').neq('status', 'Permitted') : Promise.resolve({ data: [] }),
            currentUser ? supabase.from('event_staff').select('event_id').eq('user_id', currentUser.id) : Promise.resolve({ data: [] })
        ])

        if (eventsRes.data) setEvents(eventsRes.data)
        if (registrationsRes.data) {
            const map = registrationsRes.data.reduce((acc: any, r: any) => ({ ...acc, [r.event_id]: r.status }), {})
            const cancelMap = registrationsRes.data.reduce((acc: any, r: any) => ({ ...acc, [r.event_id]: r.cancellation_status }), {})
            const reasonMap = registrationsRes.data.reduce((acc: any, r: any) => ({ ...acc, [r.event_id]: r.waitlist_reason ?? null }), {})
            const checkInMap = registrationsRes.data.reduce((acc: any, r: any) => ({ ...acc, [r.event_id]: !!r.check_in_time }), {})
            setUserRegistrations(map)
            setUserCancellationStatus(cancelMap)
            setUserWaitlistReasons(reasonMap)
            setUserCheckInStatus(checkInMap)
        }
        if (staffRes.data) setStaffEventIds(staffRes.data.map((s: any) => s.event_id))

        // Fetch survey status for attended events
        const attendedEventIds = (registrationsRes.data || []).filter((r: any) => r.check_in_time).map((r: any) => r.event_id)
        if (attendedEventIds.length > 0 && currentUser) {
            const { data: surveys } = await supabase
                .from('event_surveys')
                .select('id, event_id, status')
                .in('event_id', attendedEventIds)
                .eq('status', 'active')

            if (surveys && surveys.length > 0) {
                const surveyIds = surveys.map((s: any) => s.id)
                const { data: responses } = await supabase
                    .from('survey_responses')
                    .select('event_survey_id')
                    .eq('user_id', currentUser.id)
                    .in('event_survey_id', surveyIds)

                const completedSurveyIds = new Set((responses || []).map((r: any) => r.event_survey_id))
                const surveyMap: Record<string, { hasSurvey: boolean; completed: boolean }> = {}
                surveys.forEach((s: any) => {
                    surveyMap[s.event_id] = { hasSurvey: true, completed: completedSurveyIds.has(s.id) }
                })
                setUserSurveyStatus(surveyMap)
            }
        }

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
                toast.error(result.message)
                return
            }

            const status = result.status as string
            setUserRegistrations(prev => ({ ...prev, [selectedEventId]: status }))

            if (status === 'Waiting List') {
                toast.info(result.message)
            } else {
                toast.success(result.message)
            }

            router.refresh()
            setTermsModalOpen(false)
        } catch (error: any) {
            toast.error('Gagal mendaftar: ' + error.message)
        } finally {
            setRegisteringId(null)
            setSelectedEventId(null)
        }
    }

    // Cancellation: Click -> Check Deadline -> Open Modal
    const handleCancelClick = (eventId: string) => {
        const event = events.find(e => e.id === eventId)
        if (!event) return

        // Check H-2 Deadline - Set deadline to the end of the day H-2
        const eventDate = new Date(event.date_start)
        const today = new Date()
        const deadline = new Date(eventDate)
        deadline.setHours(0, 0, 0, 0)
        deadline.setDate(deadline.getDate() - 2)
        deadline.setHours(23, 59, 59, 999)

        if (today > deadline) {
            toast.error("Gagal: Pembatalan hanya bisa dilakukan maksimal H-2 acara.")
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
            const { data, error } = await supabase.rpc('request_event_cancellation', {
                p_event_id: selectedEventId,
                p_reason: reason
            })

            if (error) throw error

            const result = data as { success: boolean; message: string }
            if (!result.success) throw new Error(result.message)

            // Optimistic update
            setUserCancellationStatus(prev => ({
                ...prev,
                [selectedEventId]: 'pending'
            }))

            toast.info("Permohonan izin dikirim. Menunggu persetujuan admin.")
            setCancellationModalOpen(false)
        } catch (error: any) {
            toast.error("Gagal mengirim izin: " + error.message)
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
            <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in fade-in duration-500">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center max-w-md w-full">
                    <div className="w-14 h-14 bg-navy/6 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock size={26} className="text-navy/50" />
                    </div>
                    <h2 className="text-lg font-black text-navy mb-1">Akses Terkunci</h2>
                    <p className="text-gray-400 text-sm mb-5">Fitur Events hanya tersedia untuk anggota dengan profil 90% (Verified).</p>
                    <div className="bg-orange/5 border border-orange/15 p-3.5 rounded-xl flex items-start gap-2.5 text-left mb-5">
                        <AlertCircle className="text-orange flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-sm text-gray-500">Lengkapi data kontak, pekerjaan, dan akademik hingga 90% untuk mengakses fitur ini.</p>
                    </div>
                    <Link href="/dashboard/profile" className="block w-full bg-navy text-white py-3 rounded-xl font-bold hover:bg-[#1a3561] transition-all text-sm">
                        Lengkapi Profil →
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-5 pb-20 animate-in fade-in duration-500">

            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-navy/8 flex items-center justify-center flex-shrink-0">
                    <Calendar size={18} className="text-navy" />
                </div>
                <div>
                    <h1 className="text-xl font-black text-navy tracking-tight">Agenda Kegiatan</h1>
                    <p className="text-sm text-gray-400">Event dan acara mendatang untuk alumni</p>
                </div>
            </div>

            {/* Tabs — pill style */}
            <div className="flex gap-1.5 bg-gray-100/60 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('upcoming')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'upcoming'
                            ? 'bg-white text-navy shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                    <LayoutList size={15} />
                    Agenda Baru
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                        activeTab === 'history'
                            ? 'bg-white text-navy shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                    }`}
                >
                    <History size={15} />
                    Riwayat
                </button>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[...Array(4)].map((_, i) => <UserEventSkeleton key={i} />)}
                </div>
            ) : displayedEvents.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Calendar size={22} className="text-gray-300" />
                    </div>
                    <p className="text-gray-400 text-sm font-medium">
                        {activeTab === 'upcoming' ? 'Belum ada agenda kegiatan baru.' : 'Anda belum mendaftar kegiatan apapun.'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {displayedEvents.map((event) => {
                        // Hitung nomor antrean
                        let queueNumber = undefined;
                        if (userRegistrations[event.id] && event.participants && currentUser) {
                            const activeParticipants = event.participants.filter(p => p.status === 'Registered' || p.status === 'Waiting List');
                            activeParticipants.sort((a, b) => new Date(a.registered_at || 0).getTime() - new Date(b.registered_at || 0).getTime());
                            const index = activeParticipants.findIndex(p => p.user_id === currentUser.id);
                            if (index !== -1) queueNumber = index + 1;
                        }

                        return (
                            <UserEventCard
                                key={event.id}
                                event={event}
                                isRegistered={!!userRegistrations[event.id]}
                                registrationStatus={userRegistrations[event.id]}
                                waitlistReason={userWaitlistReasons[event.id] as 'quota_full' | 'sanction' | null}
                                cancellationStatus={userCancellationStatus[event.id] || undefined}
                                isCheckedIn={userCheckInStatus[event.id]}
                                queueNumber={queueNumber}
                                isClosed={event.status !== 'Open'}
                                isStaff={staffEventIds.includes(event.id)}
                                isRegistering={false}
                                onRegister={() => handleRegisterClick(event.id)}
                                onCancel={() => handleCancelClick(event.id)}
                                hasSurvey={userSurveyStatus[event.id]?.hasSurvey}
                                surveyCompleted={userSurveyStatus[event.id]?.completed}
                            />
                        )
                    })}
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
