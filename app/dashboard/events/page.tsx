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

export default function EventsPage() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchEvents() {
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('date_start', { ascending: false }) // Newest first

            if (error) {
                console.error('Error fetching events:', error)
            } else {
                setEvents(data || [])
            }
            setLoading(false)
        }

        fetchEvents()
    }, [])

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
                    {events.map((event) => (
                        <div key={event.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col">
                            <div className="h-2 bg-gradient-to-r from-orange to-red-500"></div>
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-navy line-clamp-2">{event.title}</h3>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${event.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                        {event.status}
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

                                {event.status === 'Open' && (
                                    <button className="w-full mt-6 bg-navy text-white font-bold py-2 rounded-lg hover:bg-navy/90 transition text-sm">
                                        Daftar Kegiatan
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
