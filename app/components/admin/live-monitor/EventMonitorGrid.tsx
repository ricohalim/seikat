import { EventMonitorCard } from './EventMonitorCard'

interface EventMonitorGridProps {
    events: any[]
    onQuickAdd: (event: any) => void
    loading: boolean
}

export function EventMonitorGrid({ events, onQuickAdd, loading }: EventMonitorGridProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-[350px] bg-gray-50 rounded-xl animate-pulse border border-gray-100"></div>
                ))}
            </div>
        )
    }

    if (events.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-gray-400 font-bold">Tidak ada event aktif saat ini.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
            {events.map(event => (
                <EventMonitorCard
                    key={event.id}
                    event={event}
                    onQuickAdd={onQuickAdd}
                />
            ))}
        </div>
    )
}
