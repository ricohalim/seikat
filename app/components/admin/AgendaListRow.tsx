import { Calendar, MapPin, Users } from 'lucide-react'

interface AgendaListRowProps {
    event: any
    isSelected: boolean
    isDetailOpen: boolean
    onClick: () => void
}

function statusBadgeClass(status: string) {
    if (status === 'Open') return 'bg-green-100 text-green-700'
    if (status === 'Draft') return 'bg-gray-100 text-gray-500'
    return 'bg-red-100 text-red-600'
}

function dotClass(status: string) {
    if (status === 'Open') return 'bg-green-500'
    if (status === 'Draft') return 'bg-gray-400'
    return 'bg-red-500'
}

function formatDate(dateStr: string) {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function AgendaListRow({ event, isSelected, isDetailOpen, onClick }: AgendaListRowProps) {
    const isRegional = event.scope === 'regional'

    return (
        <tr
            onClick={onClick}
            className={`cursor-pointer border-b border-gray-50 transition-colors duration-100 group
                ${isSelected
                    ? 'bg-indigo-50/70'
                    : 'hover:bg-gray-50/80'
                }`}
        >
            {/* Checkbox */}
            <td className="w-9 pl-3 pr-0">
                <div className={`w-3.5 h-3.5 rounded border flex-shrink-0 transition-colors
                    ${isSelected
                        ? 'bg-indigo-600 border-indigo-600'
                        : 'border-gray-300 group-hover:border-gray-400'
                    }`}
                />
            </td>

            {/* Title column — always visible */}
            <td className="py-2.5 px-3 w-[300px]">
                {/* Selected highlight bar */}
                <div className="flex items-start gap-2">
                    {isSelected && (
                        <div className="w-0.5 h-full bg-indigo-600 rounded-full absolute left-0 top-0" />
                    )}
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotClass(event.status)}`} />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate leading-snug">
                            {event.title}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                ${isRegional ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                                {isRegional ? 'REGIONAL' : 'NASIONAL'}
                            </span>
                            {/* Show status inline when detail is open (replaces hidden columns) */}
                            {isDetailOpen && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${statusBadgeClass(event.status)}`}>
                                    {event.status}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </td>

            {/* Date — hidden when detail panel is open */}
            {!isDetailOpen && (
                <td className="py-2.5 px-3 w-[155px]">
                    <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="text-xs whitespace-nowrap">{formatDate(event.date_start)}</span>
                    </div>
                </td>
            )}

            {/* Location — hidden when detail panel is open */}
            {!isDetailOpen && (
                <td className="py-2.5 px-3 w-[170px]">
                    <div className="flex items-center gap-1.5 text-gray-600">
                        <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="text-xs truncate max-w-[130px]">{event.location || 'Online'}</span>
                    </div>
                </td>
            )}

            {/* Status — hidden when detail panel is open */}
            {!isDetailOpen && (
                <td className="py-2.5 px-3 w-[90px]">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusBadgeClass(event.status)}`}>
                        {event.status}
                    </span>
                </td>
            )}

            {/* Participants — hidden when detail panel is open */}
            {!isDetailOpen && (
                <td className="py-2.5 px-3 w-[80px]">
                    <div className="flex items-center gap-1.5 text-gray-600">
                        <Users size={12} className="text-gray-400 flex-shrink-0" />
                        <span className="text-xs">{event.participants?.[0]?.count ?? 0}</span>
                    </div>
                </td>
            )}
        </tr>
    )
}

export function AgendaListRowSkeleton({ isDetailOpen }: { isDetailOpen: boolean }) {
    return (
        <tr className="border-b border-gray-50 animate-pulse">
            <td className="w-9 pl-3 pr-0"><div className="w-3.5 h-3.5 rounded bg-gray-200" /></td>
            <td className="py-3 px-3">
                <div className="h-3.5 bg-gray-200 rounded w-48 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-16" />
            </td>
            {!isDetailOpen && <td className="py-3 px-3"><div className="h-3 bg-gray-200 rounded w-28" /></td>}
            {!isDetailOpen && <td className="py-3 px-3"><div className="h-3 bg-gray-200 rounded w-24" /></td>}
            {!isDetailOpen && <td className="py-3 px-3"><div className="h-4 bg-gray-200 rounded-full w-14" /></td>}
            {!isDetailOpen && <td className="py-3 px-3"><div className="h-3 bg-gray-200 rounded w-8" /></td>}
        </tr>
    )
}
