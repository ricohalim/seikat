import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface Event {
    id: string
    title: string
    description: string
    date_start: string
    location: string
    status: string
    quota: number
    participants?: { count: number }[]
}

export function useAgendas() {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchEvents = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('events')
                .select(`
                    *,
                    participants:event_participants(count)
                `)
                .order('date_start', { ascending: false })

            if (error) throw error
            if (data) setEvents(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    // Optimistic Delete
    const deleteEvent = async (id: string) => {
        // 1. Optimistic Update
        const previousEvents = [...events]
        setEvents(events.filter(e => e.id !== id))

        try {
            // 2. Server Request
            const { error } = await supabase.from('events').delete().eq('id', id)
            if (error) throw error
        } catch (err: any) {
            // 3. Rollback
            setEvents(previousEvents)
            alert('Gagal menghapus agenda: ' + err.message)
        }
    }

    const fetchEventsSilent = async () => {
        try {
            const { data, error } = await supabase
                .from('events')
                .select(`*, participants:event_participants(count)`)
                .order('date_start', { ascending: false })
            if (error) throw error
            if (data) setEvents(data)
        } catch { /* silent */ }
    }

    // Initial Fetch
    useEffect(() => {
        if (typeof window !== 'undefined') {
            fetchEvents()
        }
    }, [])

    // Auto-refresh setiap 30 detik (silent — tanpa loading spinner)
    useEffect(() => {
        const interval = setInterval(fetchEventsSilent, 30_000)
        return () => clearInterval(interval)
    }, [])

    return {
        events,
        loading,
        error,
        fetchEvents, // Expose for manual refetch if needed (e.g. after edit)
        deleteEvent
    }
}
