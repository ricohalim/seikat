'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, AlertCircle, Lock } from 'lucide-react'
import { calculateProfileCompleteness } from '@/lib/utils'
import Link from 'next/link'
import { UserEventCard, UserEventSkeleton } from '@/app/components/events/UserEventCard'

interface Event {
    id: string
    title: string
    description: string
    date_start: string
    location: string
    status: string
}

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([])
    const [staffEventIds, setStaffEventIds] = useState<string[]>([])

    // UI States
    const [registeringId, setRegisteringId] = useState<string | null>(null)

    // Authorization State
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isUserLoading, setIsUserLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)

    // Check Authorization First
    useEffect(() => {
        async function checkAccess() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return
                setCurrentUser(user)

                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

                if (profile) {
                    const percent = calculateProfileCompleteness(profile)
                    if (percent >= 90) {
                        setIsAuthorized(true)
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

        async function fetchData() {
            setLoading(true)

            // Parallel Fetching for smoother experience
            const [eventsRes, registrationsRes, staffRes] = await Promise.all([
                supabase.from('events').select('*').neq('status', 'Draft').order('date_start', { ascending: false }),
                currentUser ? supabase.from('event_participants').select('event_id').eq('user_id', currentUser.id) : Promise.resolve({ data: [] }),
                currentUser ? supabase.from('event_staff').select('event_id').eq('user_id', currentUser.id) : Promise.resolve({ data: [] })
            ])

            if (eventsRes.data) setEvents(eventsRes.data)
            if (registrationsRes.data) setRegisteredEventIds(registrationsRes.data.map((r: any) => r.event_id))
            if (staffRes.data) setStaffEventIds(staffRes.data.map((s: any) => s.event_id))

            setLoading(false)
        }

        if (isAuthorized) {
            fetchData()
        }
    }, [isAuthorized, isUserLoading, currentUser])

    const handleRegister = async (eventId: string) => {
        if (!confirm('Apakah Anda yakin ingin mendaftar kegiatan ini?')) return

        // Optimistic Update
        setRegisteringId(eventId)

        try {
            const { error } = await supabase.from('event_participants').insert({
                event_id: eventId,
                user_id: currentUser.id
            })

            if (error) throw error

            setRegisteredEventIds(prev => [...prev, eventId])
            alert('Berhasil mendaftar kegiatan!')
        } catch (error) {
            alert('Gagal mendaftar. Anda mungkin sudah terdaftar.')
        } finally {
            setRegisteringId(null)
        }
    }

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

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => <UserEventSkeleton key={i} />)}
                </div>
            ) : events.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-100 text-gray-400">
                    <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Belum ada agenda kegiatan saat ini.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {events.map((event) => (
                        <UserEventCard
                            key={event.id}
                            event={event}
                            isRegistered={registeredEventIds.includes(event.id)}
                            isClosed={event.status !== 'Open'}
                            isStaff={staffEventIds.includes(event.id)}
                            isRegistering={registeringId === event.id}
                            onRegister={handleRegister}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
