'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, MapPin, Clock } from 'lucide-react'

interface Event {
    id: string
    title: string
    description: string
    date_start: string
    location: string
    status: string
}

import { calculateProfileCompleteness } from '@/lib/utils'
import Link from 'next/link'
import { Lock, AlertCircle } from 'lucide-react'

// ... 

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([])
    const [registeringId, setRegisteringId] = useState<string | null>(null)

    // Authorization State
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isUserLoading, setIsUserLoading] = useState(true)
    const [currentUser, setCurrentUser] = useState<any>(null)

    // Check Authorization First
    useEffect(() => {
        async function checkAccess() {
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
            setIsUserLoading(false)
        }
        checkAccess()
    }, [])

    useEffect(() => {
        if (!isAuthorized || isUserLoading) return

        async function fetchData() {
            // Fetch Events
            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select('*')
                .neq('status', 'Draft')
                .order('date_start', { ascending: false })

            if (eventsData) setEvents(eventsData)

            // Fetch My Registrations
            if (currentUser) {
                const { data: registrations } = await supabase
                    .from('event_participants')
                    .select('event_id')
                    .eq('user_id', currentUser.id)

                if (registrations) {
                    setRegisteredEventIds(registrations.map(r => r.event_id))
                }
            }
            setLoading(false)
        }

        if (isAuthorized) {
            fetchData()
        }
    }, [isAuthorized, isUserLoading, currentUser])

    const handleRegister = async (eventId: string) => {
        if (!confirm('Apakah Anda yakin ingin mendaftar kegiatan ini?')) return
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

    if (isUserLoading) return <div className="p-8 text-center text-gray-500">Memeriksa akses...</div>

    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6">
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

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl h-64 animate-pulse shadow-sm border border-gray-100"></div>
                ))}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-navy">Agenda Kegiatan</h2>
                <p className="text-gray-500 text-sm">Informasi kegiatan dan acara mendatang untuk alumni.</p>
            </div>

            {events.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-100 text-gray-400">
                    <Calendar size={48} className="mx-auto mb-4 opacity-50" />
                    <p>Belum ada agenda kegiatan saat ini.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {events.map((event) => {
                        const isRegistered = registeredEventIds.includes(event.id)
                        const isClosed = event.status !== 'Open'

                        return (
                            <div key={event.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col">
                                <div className={`h-2 ${isClosed ? 'bg-gray-300' : 'bg-gradient-to-r from-orange to-red-500'}`}></div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-bold text-navy line-clamp-2">{event.title}</h3>
                                        <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${isRegistered ? 'bg-green-100 text-green-700' :
                                                isClosed ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                            {isRegistered ? 'Terdaftar' : event.status}
                                        </span>
                                    </div>

                                    <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                                        {event.description || 'Tidak ada deskripsi.'}
                                    </p>

                                    <div className="mt-auto space-y-3 pt-6 border-t border-gray-50 text-sm text-gray-500">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-azure">
                                                <Calendar size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-gray-400">Tanggal</span>
                                                <span className="font-medium text-gray-700">
                                                    {event.date_start ? new Date(event.date_start).toLocaleDateString('id-ID', {
                                                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                                                    }) : '-'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-orange/10 flex items-center justify-center text-orange">
                                                <MapPin size={16} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] uppercase font-bold text-gray-400">Lokasi</span>
                                                <span className="font-medium text-gray-700">{event.location || 'Online'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleRegister(event.id)}
                                        disabled={isRegistered || isClosed || registeringId === event.id}
                                        className={`w-full mt-6 font-bold py-2 rounded-lg transition text-sm ${isRegistered
                                                ? 'bg-green-100 text-green-700 cursor-default'
                                                : isClosed
                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                    : 'bg-navy text-white hover:bg-navy/90'
                                            }`}
                                    >
                                        {registeringId === event.id ? 'Mendaftarkan...' :
                                            isRegistered ? 'Anda Telah Terdaftar' :
                                                isClosed ? 'Pendaftaran Ditutup' : 'Daftar Kegiatan'}
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
