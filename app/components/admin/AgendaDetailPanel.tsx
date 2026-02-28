import {
    X, Edit2, Users, Shield, CheckSquare, Trash2,
    Calendar, MapPin, Clock, Map, QrCode, Trophy
} from 'lucide-react'

interface AgendaDetailPanelProps {
    event: any
    onClose: () => void
    onEdit: (event: any) => void
    onDelete: (id: string) => void
    onViewParticipants: (id: string, title: string) => void
    onManageStaff: (event: any) => void
    onShowQR: (id: string, title: string) => void
    onFinalize: (id: string) => void
}

function formatDate(dateStr: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })
}

function statusBadgeClass(status: string) {
    if (status === 'Open') return 'bg-green-100 text-green-700'
    if (status === 'Draft') return 'bg-gray-100 text-gray-500'
    return 'bg-red-100 text-red-600'
}

export function AgendaDetailPanel({
    event, onClose, onEdit, onDelete,
    onViewParticipants, onManageStaff, onShowQR, onFinalize
}: AgendaDetailPanelProps) {
    const participantCount = event.participants?.[0]?.count ?? 0
    const quota = event.quota ?? 0
    const fillPct = quota > 0 ? Math.min(Math.round((participantCount / quota) * 100), 100) : 0
    const isRegional = event.scope === 'regional'
    const provinces: string[] = Array.isArray(event.province) ? event.province : []

    return (
        <div className="flex flex-col h-full animate-in slide-in-from-right-2 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-navy text-sm leading-tight mb-2 line-clamp-2">
                            {event.title}
                        </h2>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
                                ${isRegional ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'}`}>
                                {isRegional ? 'REGIONAL' : 'NASIONAL'}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${statusBadgeClass(event.status)}`}>
                                {event.status}
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition flex-shrink-0"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Description */}
                {event.description && (
                    <p className="text-xs text-gray-500 leading-relaxed">{event.description}</p>
                )}

                {/* Info rows */}
                <div className="space-y-3">
                    <InfoRow icon={<Calendar size={14} className="text-gray-400" />} label="Tanggal">
                        {formatDate(event.date_start)}
                    </InfoRow>

                    {event.registration_deadline && (
                        <InfoRow icon={<Clock size={14} className="text-red-500" />} label="Deadline Daftar">
                            <span className="text-red-600 font-semibold">
                                {formatDate(event.registration_deadline)}
                            </span>
                        </InfoRow>
                    )}

                    <InfoRow icon={<MapPin size={14} className="text-gray-400" />} label="Lokasi">
                        {event.is_online ? (
                            <span className="text-green-700 font-medium">Online</span>
                        ) : (
                            event.location || '-'
                        )}
                    </InfoRow>

                    {isRegional && provinces.length > 0 && (
                        <InfoRow icon={<Map size={14} className="text-gray-400" />} label="Target Provinsi">
                            <span className="leading-relaxed">{provinces.join(', ')}</span>
                        </InfoRow>
                    )}

                    <InfoRow icon={<Users size={14} className="text-gray-400" />} label="Peserta">
                        <div className="flex-1">
                            <span>
                                <strong>{participantCount}</strong> Terdaftar
                                {quota > 0 && <span className="text-gray-400"> / {quota} Kuota</span>}
                            </span>
                            {quota > 0 && (
                                <div className="mt-1.5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-navy rounded-full transition-all"
                                        style={{ width: `${fillPct}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    </InfoRow>
                </div>

                {/* Divider */}
                <div className="h-px bg-gray-100 mt-2 mb-4" />

                <a
                    href={`/leaderboard/${event.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-yellow-50 to-amber-50 hover:from-yellow-100 hover:to-amber-100 text-amber-800 py-2.5 rounded-lg text-xs font-bold transition-all shadow-sm border border-yellow-200 mb-4"
                >
                    <Trophy size={14} className="text-amber-600" />
                    BUKA LIVE LEADERBOARD
                </a>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-2">
                    <ActionBtn
                        onClick={() => onEdit(event)}
                        icon={<Edit2 size={13} />}
                        label="Edit"
                        className="bg-gray-50 text-gray-700 hover:bg-gray-100"
                    />
                    <ActionBtn
                        onClick={() => onViewParticipants(event.id, event.title)}
                        icon={<Users size={13} />}
                        label="Peserta"
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                    />
                    <ActionBtn
                        onClick={() => onManageStaff(event)}
                        icon={<Shield size={13} />}
                        label="Staff"
                        className="bg-orange-50 text-orange-600 hover:bg-orange-100"
                    />
                    <ActionBtn
                        onClick={() => onShowQR(event.id, event.title)}
                        icon={<QrCode size={13} />}
                        label="QR Code"
                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    />
                    <ActionBtn
                        onClick={() => onFinalize(event.id)}
                        icon={<CheckSquare size={13} />}
                        label="Finalize"
                        className="bg-purple-50 text-purple-700 hover:bg-purple-100"
                    />
                    <ActionBtn
                        onClick={() => onDelete(event.id)}
                        icon={<Trash2 size={13} />}
                        label="Hapus"
                        className="bg-red-50 text-red-600 hover:bg-red-100"
                    />
                </div>
            </div>
        </div>
    )
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-2.5">
            <div className="mt-0.5 flex-shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
                <div className="text-xs text-gray-800 font-medium">{children}</div>
            </div>
        </div>
    )
}

function ActionBtn({ onClick, icon, label, className }: {
    onClick: () => void
    icon: React.ReactNode
    label: string
    className: string
}) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition active:scale-95 ${className}`}
        >
            {icon}
            {label}
        </button>
    )
}
