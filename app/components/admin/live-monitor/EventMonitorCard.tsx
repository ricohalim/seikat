import { MapPin, Users, Calendar, AlertTriangle, UserPlus, CheckCircle2, Clock } from 'lucide-react'

interface EventMonitorCardProps {
    event: any
    onQuickAdd: (event: any) => void
}

export function EventMonitorCard({ event, onQuickAdd }: EventMonitorCardProps) {
    // Calculations
    const totalRegistered = event.registered_count || 0
    const totalCheckedIn = event.checked_in_count || 0
    const quota = event.quota || 0
    const isUnlimited = quota === 0

    // Status Logic
    const isOverQuota = !isUnlimited && totalRegistered > quota
    const isEnded = new Date(event.date_end) < new Date() // Assuming date_end exists or use date_start + duration
    const isLive = !isEnded && new Date(event.date_start) <= new Date()

    // Progress Bar
    const rawPercent = isUnlimited ? 0 : (totalRegistered / quota) * 100
    const progressPercent = isUnlimited ? 100 : Math.min(rawPercent, 100)
    const displayPercent = isUnlimited ? 0 : rawPercent
    const checkInPercent = totalRegistered > 0 ? (totalCheckedIn / totalRegistered) * 100 : 0

    return (
        <div className={`bg-white rounded-xl shadow-sm border flex flex-col h-full transition-all duration-300 ${isOverQuota ? 'border-amber-200 ring-1 ring-amber-100' : 'border-gray-100 hover:border-gray-200'
            }`}>
            {/* Header / Status Bar */}
            <div className={`h-1.5 w-full rounded-t-xl ${isOverQuota ? 'bg-amber-500' :
                isLive ? 'bg-green-500 animate-pulse' :
                    'bg-gray-200'
                }`}></div>

            <div className="p-5 flex flex-col flex-1">
                {/* Title & Badge */}
                <div className="flex justify-between items-start mb-3 gap-2">
                    <h3 className="font-bold text-navy text-base line-clamp-2 leading-tight" title={event.title}>
                        {event.title}
                    </h3>

                    {/* Status Badge */}
                    {isOverQuota ? (
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 whitespace-nowrap">
                            <AlertTriangle size={10} /> Over Quota
                        </span>
                    ) : isLive ? (
                        <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-green-100 text-green-700 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span> Live
                        </span>
                    ) : (
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-400 whitespace-nowrap">
                            {event.status}
                        </span>
                    )}
                </div>

                {/* Meta Info */}
                <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-gray-400" />
                        <span className="truncate">{event.location || 'Online'}</span>
                    </div>
                    {event.date_start && (
                        <div className="flex items-center gap-2">
                            <Calendar size={12} className="text-gray-400" />
                            <span>{new Date(event.date_start).toLocaleString('id-ID', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}</span>
                        </div>
                    )}
                    {event.registration_deadline && (
                        <div className="flex items-center gap-2 text-red-500">
                            <Clock size={12} />
                            <span>Deadline: {new Date(event.registration_deadline).toLocaleString('id-ID', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}</span>
                        </div>
                    )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4 mt-auto">
                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 text-center">
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Pendaftar</p>
                        <p className={`text-lg font-black ${isOverQuota ? 'text-amber-600' : 'text-navy'}`}>
                            {totalRegistered}
                            <span className="text-xs text-gray-400 font-normal ml-0.5">
                                / {isUnlimited ? '∞' : quota}
                            </span>
                        </p>
                    </div>
                    <div className="bg-green-50 p-2 rounded-lg border border-green-100 text-center">
                        <p className="text-[10px] text-green-700/60 uppercase font-bold mb-0.5">Check-in</p>
                        <p className="text-lg font-black text-green-600">{totalCheckedIn}</p>
                    </div>
                </div>

                {/* Progress Bars */}
                <div className="space-y-3 mb-4">
                    {/* Quota Progress */}
                    {!isUnlimited && (
                        <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold text-gray-400">
                                <span>Okupansi ({Math.round(displayPercent)}%)</span>
                            </div>
                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-500 ${isOverQuota ? 'bg-amber-500' : 'bg-navy'}`}
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Check-in Progress */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-gray-400">
                            <span>Kehadiran ({Math.round(checkInPercent)}%)</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-green-500 transition-all duration-500"
                                style={{ width: `${checkInPercent}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <button
                    onClick={() => onQuickAdd(event)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-navy text-white text-xs font-bold rounded-lg hover:bg-navy/90 transition shadow-sm active:scale-95"
                >
                    <UserPlus size={14} /> Quick Add Participant
                </button>
            </div>
        </div>
    )
}
