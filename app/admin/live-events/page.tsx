'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { EventGlobalStats } from '@/app/components/admin/live-monitor/EventGlobalStats'
import { EventMonitorGrid } from '@/app/components/admin/live-monitor/EventMonitorGrid'
import { Search } from 'lucide-react'

import { QuickAddModal } from '@/app/components/admin/live-monitor/QuickAddModal'


export default function LiveEventsPage() {
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [selectedEvent, setSelectedEvent] = useState<any>(null) // For Quick Add

    // --- Data Fetching ---
    const fetchDashboardData = async () => {
        try {
            // Need a smart way to get counts. using .select with count is okay for now.
            // But for performance, we should probably have a view. 
            // For now, let's fetch events and their participants count.

            const { data, error } = await supabase
                .from('events')
                .select(`
                    *,
                    participants:event_participants(count),
                    checked_in:event_participants(count)
                `)
                .eq('event_participants.check_in_time', 'not.is.null') // This filter on nested resource is tricky in Supabase JS logic
                .order('date_start', { ascending: true })

            // The above query is wrong for 'checked_in' count because we need conditional count.
            // Standard approach: Fetch events, then RPC or separate queries? 
            // Better: Load events, then subscribe. 
            // OR reuse the view if we have one. 

            // Let's use a cleaner approach: Fetch events, then fetch stats using a custom RPC or just aggregate in JS for MVP if dataset is small.
            // Assuming < 100 active events.

            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select('*')
                .order('date_start', { ascending: false })

            if (eventsError) throw eventsError

            // Fetch participants stats manually for now (can optimize later with view)
            const eventsWithStats = await Promise.all(eventsData.map(async (e: any) => {
                const { count: registeredCount } = await supabase
                    .from('event_participants')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', e.id)

                const { count: checkedInCount } = await supabase
                    .from('event_participants')
                    .select('*', { count: 'exact', head: true })
                    .eq('event_id', e.id)
                    .not('check_in_time', 'is', null)

                return {
                    ...e,
                    registered_count: registeredCount || 0,
                    checked_in_count: checkedInCount || 0
                }
            }))

            setEvents(eventsWithStats)
        } catch (err) {
            console.error('Error fetching live data:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboardData()

        // --- Realtime Subscription ---
        const channel = supabase
            .channel('live-dashboard')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'event_participants' },
                (payload) => {
                    // Smart update: instead of refetching all, update local state
                    // payload.new and payload.old
                    console.log('Realtime update:', payload)
                    fetchDashboardData() // For MVP simplicity: just refetch. Optimization can come later.
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    // --- Computed Stats ---
    const totalEvents = events.length
    const totalParticipants = events.reduce((sum, e) => sum + (e.registered_count || 0), 0)
    const totalCheckedIn = events.reduce((sum, e) => sum + (e.checked_in_count || 0), 0)

    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(filter.toLowerCase()) ||
        (e.location && e.location.toLowerCase().includes(filter.toLowerCase()))
    )

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-navy">Live Event Monitor</h1>
                <p className="text-gray-500 text-sm">Real-time tracking of active events across all regions.</p>
            </div>

            {/* Global Stats */}
            <EventGlobalStats
                totalEvents={totalEvents}
                totalParticipants={totalParticipants}
                totalCheckedIn={totalCheckedIn}
            />

            {/* Controls */}
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm sticky top-0 z-10">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Cari Event / Lokasi..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:border-navy outline-none w-64 text-sm bg-gray-50 focus:bg-white transition"
                    />
                </div>
                <div className="flex gap-2">
                    {/* Add Filter buttons here later */}
                    <button onClick={fetchDashboardData} className="px-4 py-2 text-xs font-bold text-navy hover:bg-gray-50 rounded-lg transition">
                        Refresh Data
                    </button>
                </div>
            </div>

            {/* Grid */}
            <EventMonitorGrid
                events={filteredEvents}
                loading={loading}
                onQuickAdd={(e) => setSelectedEvent(e)}
            />

            {/* Quick Add Modal */}
            {selectedEvent && (
                <QuickAddModal
                    isOpen={!!selectedEvent}
                    event={selectedEvent}
                    onClose={() => setSelectedEvent(null)}
                    onSuccess={() => {
                        fetchDashboardData()
                        setSelectedEvent(null)
                    }}
                />
            )}
        </div>
    )
}
