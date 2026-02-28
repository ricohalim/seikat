'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Trophy, Clock, Medal, Users, AlertCircle, ChevronDown, CheckCircle, Sparkles } from 'lucide-react'
import Image from 'next/image'

interface Participant {
    id: string
    user_id: string
    status: string
    checked_in_at: string
    profiles: {
        full_name: string
        photo_url: string | null
        generation: string
        university: string | null
    }
}

interface EventData {
    id: string
    title: string
    date_start: string
    location: string
}

export default function LiveLeaderboardPage() {
    const params = useParams()
    const eventId = params.id as string

    const [event, setEvent] = useState<EventData | null>(null)
    const [participants, setParticipants] = useState<Participant[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
    const [currentPage, setCurrentPage] = useState(0)
    const ITEMS_PER_PAGE = 12

    useEffect(() => {
        if (!eventId) return

        const fetchInitialData = async () => {
            try {
                // Fetch event details
                const { data: eventData, error: eventError } = await supabase
                    .from('events')
                    .select('id, title, date_start, location')
                    .eq('id', eventId)
                    .single()

                if (eventError) throw eventError
                setEvent(eventData)

                // Fetch checked-in participants
                const { data: participantsData, error: participantsError } = await supabase
                    .from('event_participants')
                    .select(`
                        id, user_id, status, checked_in_at,
                        profiles:user_id ( full_name, photo_url, generation, university )
                    `)
                    .eq('event_id', eventId)
                    .not('checked_in_at', 'is', null)
                    .order('checked_in_at', { ascending: true }) // Earliest first

                if (participantsError) throw participantsError

                // Sort client-side just to be absolutely sure
                const sorted = (participantsData as any[]).sort((a, b) =>
                    new Date(a.checked_in_at).getTime() - new Date(b.checked_in_at).getTime()
                )
                setParticipants(sorted)

            } catch (err: any) {
                console.error("Error fetching leaderboard data:", err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchInitialData()

        // Realtime Subscription
        const channel = supabase
            .channel(`public-leaderboard-${eventId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE', // We only care when status/checked_in_at changes
                    schema: 'public',
                    table: 'event_participants',
                    filter: `event_id=eq.${eventId}`
                },
                async (payload) => {
                    // Re-fetch everything to ensure profiles relation is loaded correctly
                    // and sorting is perfect. For a public display board, accuracy is key.
                    const { data } = await supabase
                        .from('event_participants')
                        .select(`
                            id, user_id, status, checked_in_at,
                            profiles:user_id ( full_name, photo_url, generation, university )
                        `)
                        .eq('event_id', eventId)
                        .not('checked_in_at', 'is', null)
                        .order('checked_in_at', { ascending: true })

                    if (data) {
                        setParticipants(data as any)
                        setLastUpdated(new Date())
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [eventId])

    // Auto-pagination timer
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPage((prev) => prev + 1)
        }, 8000) // Pindah halaman setiap 8 detik
        return () => clearInterval(interval)
    }, [])


    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white">
                <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-xl font-bold font-mono text-yellow-500">MEMUAT LEADERBOARD...</h2>
            </div>
        )
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-white p-8 text-center">
                <AlertCircle size={64} className="text-red-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Event Tidak Ditemukan</h2>
                <p className="text-neutral-400">{error || 'Event ID tidak valid atau telah dihapus.'}</p>
            </div>
        )
    }

    const top3 = participants.slice(0, 3)
    const others = participants.slice(3)

    const totalPages = Math.ceil(others.length / ITEMS_PER_PAGE)
    const activePage = totalPages > 0 ? currentPage % totalPages : 0
    const visibleOthers = others.slice(activePage * ITEMS_PER_PAGE, (activePage + 1) * ITEMS_PER_PAGE)

    return (
        <div className="min-h-screen bg-neutral-950 text-white selection:bg-yellow-500 selection:text-black font-sans pb-20">
            {/* Header */}
            <header className="fixed top-0 inset-x-0 z-50 bg-neutral-950/80 backdrop-blur-md border-b border-white/5 p-4 md:p-6 lg:px-12 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-500 border border-yellow-500/20">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-black tracking-tight text-white uppercase">{event.title}</h1>
                        <p className="text-sm text-neutral-400 font-mono tracking-wider">LIVE ARRIVAL LEADERBOARD</p>
                    </div>
                </div>
                <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-full font-mono text-xs text-neutral-300">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    LIVE SYNC: {lastUpdated.toLocaleTimeString('id-ID')}
                </div>
            </header>

            <main className="pt-32 px-4 md:px-8 max-w-6xl mx-auto space-y-16">

                {participants.length === 0 ? (
                    <div className="text-center py-32 space-y-6">
                        <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center mx-auto border border-neutral-800">
                            <Clock size={48} className="text-neutral-600" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-neutral-300">BELUM ADA YANG HADIR</h2>
                            <p className="text-neutral-500 mt-2 font-mono">Pintu masuk sudah dibuka? Siapa yang akan naik podium pertama?</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* THE PODIUM */}
                        <section className="relative">
                            <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/5 to-transparent rounded-3xl blur-3xl -z-10"></div>

                            <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-8 h-auto md:h-96 pt-12">

                                {/* 2ND PLACE (SILVER) */}
                                {top3[1] && (
                                    <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-700 w-full md:w-64 order-2 md:order-1">
                                        <div className="relative mb-3">
                                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-400/20 p-1 backdrop-blur-sm border-2 border-slate-300 shadow-[0_0_30px_rgba(203,213,225,0.2)]">
                                                <div className="w-full h-full rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center text-slate-300 text-3xl font-black">
                                                    {top3[1].profiles.photo_url ? (
                                                        <Image src={top3[1].profiles.photo_url} alt={top3[1].profiles.full_name} width={128} height={128} className="object-cover" />
                                                    ) : top3[1].profiles.full_name.substring(0, 2).toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-slate-300 rounded-full border-4 border-neutral-950 flex items-center justify-center text-neutral-900" title="Juara 2">
                                                <Medal size={20} className="fill-slate-100" />
                                            </div>
                                        </div>
                                        <div className="text-center w-[90%] md:w-full bg-gradient-to-b from-slate-400/20 to-slate-400/5 backdrop-blur-md border border-slate-400/20 rounded-t-2xl p-4 md:p-5 h-40 md:h-44 flex flex-col items-center shadow-lg">
                                            <h3 className="font-black text-sm md:text-base text-slate-100 text-center uppercase leading-tight line-clamp-2">{top3[1].profiles.full_name}</h3>
                                            <p className="text-xs font-mono text-slate-400 mt-1 mb-4">Beswan {top3[1].profiles.generation}</p>
                                            <div className="mt-auto bg-black/50 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2 text-sm font-mono text-slate-300">
                                                <Clock size={14} /> {new Date(top3[1].checked_in_at).toLocaleTimeString('id-ID')}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 1ST PLACE (GOLD) */}
                                {top3[0] && (
                                    <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-1000 w-full md:w-72 relative z-10 order-1 md:order-2 mb-8 md:mb-0">
                                        <div className="absolute -top-16 text-yellow-400 animate-bounce">
                                            <CrownIcon />
                                        </div>
                                        <div className="relative mb-4">
                                            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-yellow-400/20 p-1.5 backdrop-blur-sm border-2 border-yellow-400 shadow-[0_0_50px_rgba(250,204,21,0.4)]">
                                                <div className="w-full h-full rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center text-yellow-400 text-5xl font-black">
                                                    {top3[0].profiles.photo_url ? (
                                                        <Image src={top3[0].profiles.photo_url} alt={top3[0].profiles.full_name} width={200} height={200} className="object-cover" />
                                                    ) : top3[0].profiles.full_name.substring(0, 2).toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-4 -right-2 w-12 h-12 bg-yellow-400 rounded-full border-4 border-neutral-950 flex items-center justify-center text-neutral-950" title="Juara 1">
                                                <Trophy size={24} className="fill-yellow-200" />
                                            </div>
                                        </div>
                                        <div className="text-center w-full md:w-[110%] bg-gradient-to-b from-yellow-500/20 to-yellow-500/5 backdrop-blur-md border border-yellow-500/30 rounded-t-2xl p-5 h-48 md:h-52 flex flex-col items-center shadow-[0_-10px_40px_rgba(250,204,21,0.1)]">
                                            <span className="bg-yellow-500 text-black text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-2">Pertama Hadir</span>
                                            <h3 className="font-black text-base md:text-lg text-yellow-400 text-center uppercase leading-tight line-clamp-2">{top3[0].profiles.full_name}</h3>
                                            <p className="text-xs font-mono text-yellow-500/70 mt-1 mb-4">Beswan {top3[0].profiles.generation}</p>
                                            <div className="mt-auto bg-black/50 px-4 py-2 rounded-lg border border-yellow-500/20 flex items-center gap-2 text-sm font-black font-mono text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                                                <Clock size={16} /> {new Date(top3[0].checked_in_at).toLocaleTimeString('id-ID')}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 3RD PLACE (BRONZE) */}
                                {top3[2] && (
                                    <div className="flex flex-col items-center animate-in slide-in-from-bottom-2 duration-500 w-full md:w-64 order-3">
                                        <div className="relative mb-3">
                                            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-amber-700/20 p-1 backdrop-blur-sm border-2 border-amber-600 shadow-[0_0_30px_rgba(217,119,6,0.2)]">
                                                <div className="w-full h-full rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center text-amber-600 text-3xl font-black">
                                                    {top3[2].profiles.photo_url ? (
                                                        <Image src={top3[2].profiles.photo_url} alt={top3[2].profiles.full_name} width={128} height={128} className="object-cover" />
                                                    ) : top3[2].profiles.full_name.substring(0, 2).toUpperCase()}
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-amber-600 rounded-full border-4 border-neutral-950 flex items-center justify-center text-neutral-950" title="Juara 3">
                                                <Medal size={20} className="fill-amber-400" />
                                            </div>
                                        </div>
                                        <div className="text-center w-[90%] md:w-full bg-gradient-to-b from-amber-700/20 to-amber-700/5 backdrop-blur-md border border-amber-700/20 rounded-t-2xl p-4 md:p-5 h-36 md:h-40 flex flex-col items-center">
                                            <h3 className="font-black text-sm md:text-base text-amber-500 text-center uppercase leading-tight line-clamp-2">{top3[2].profiles.full_name}</h3>
                                            <p className="text-xs font-mono text-amber-700 mt-1 mb-4">Beswan {top3[2].profiles.generation}</p>
                                            <div className="mt-auto bg-black/50 px-3 py-1.5 rounded-lg border border-white/5 flex items-center gap-2 text-sm font-mono text-amber-500">
                                                <Clock size={14} /> {new Date(top3[2].checked_in_at).toLocaleTimeString('id-ID')}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* LIVE FEED GRID */}
                        {others.length > 0 && (
                            <section className="mt-20 border-t border-white/10 pt-12 relative pb-8">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-950 border border-white/10 px-6 py-2 rounded-full flex items-center gap-2 text-neutral-400 font-mono text-sm uppercase font-bold z-10">
                                    <Users size={16} /> Total Hadir: <span className="text-white">{participants.length}</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[300px]">
                                    {visibleOthers.map((p, index) => (
                                        <div key={p.id} className="bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl p-4 flex items-center gap-4 transition-colors animate-in fade-in slide-in-from-bottom-2">
                                            <div className="w-12 h-12 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-neutral-400 border border-white/5 shrink-0 overflow-hidden">
                                                {p.profiles.photo_url ? (
                                                    <Image src={p.profiles.photo_url} alt={p.profiles.full_name} width={48} height={48} className="object-cover" />
                                                ) : index + 4}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-neutral-200 truncate">{p.profiles.full_name}</h4>
                                                <p className="text-xs text-neutral-500 font-mono">B.{p.profiles.generation} • {p.profiles.university || 'Univ N/A'}</p>
                                            </div>
                                            <div className="text-right shrink-0 pl-2">
                                                <div className="text-sm font-mono font-bold text-green-400 flex items-center gap-1 justify-end">
                                                    <CheckCircle size={12} />
                                                    {new Date(p.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pagination Indicator */}
                                {totalPages > 1 && (
                                    <div className="flex justify-center mt-8 gap-2">
                                        {Array.from({ length: totalPages }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={`w-2 h-2 rounded-full transition-all duration-500 ${i === activePage ? 'bg-yellow-500 w-6' : 'bg-white/20'}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}
                    </>
                )}
            </main>
        </div>
    )
}

function CrownIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <path d="M2 22h20a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1zm4.84-5.32c.2-.09.43-.17.65-.25.5-.18.72-.73.49-1.2l-2.06-4.12 2.5 1.25a1.14 1.14 0 0 0 1.48-.56l2.36-5.18 2.36 5.18a1.14 1.14 0 0 0 1.48.56l2.5-1.25-2.06 4.12c-.22.46.01 1.02.49 1.2.22.08.45.16.65.25v.32H6.84v-.32zM12 2L9.2 8.16l-3.2-1.6 2.45 4.9L3.55 13 6 18h12l2.45-5-4.9-1.55 2.45-4.9-3.2 1.6L12 2z" />
        </svg>
    )
}
