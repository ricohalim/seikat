import { Calendar, MapPin, Edit2, Users, Shield, Trash2, CheckSquare, Clock } from 'lucide-react'
import { Skeleton } from '../ui/Skeleton'

interface AgendaCardProps {
    event: any
    onEdit: (event: any) => void
    onDelete: (id: string) => void
    onViewParticipants: (id: string, title: string) => void
    onManageStaff: (event: any) => void
    onShowQR: (id: string, title: string) => void
    onFinalize: (id: string) => void
}

export function AgendaCard({ event, onEdit, onDelete, onViewParticipants, onManageStaff, onShowQR, onFinalize }: AgendaCardProps) {
    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col group animate-in fade-in zoom-in-95 duration-300">
            <div className={`h-2 ${event.status === 'Open' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-navy text-lg line-clamp-1" title={event.title}>{event.title}</h3>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${event.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                        {event.status}
                    </span>
                </div>
                <p className="text-gray-500 text-xs mb-4 line-clamp-2 min-h-[2.5em]">{event.description}</p>

                <div className="space-y-2 text-sm text-gray-600 mb-6">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-navy" />
                        <span>{event.date_start ? new Date(event.date_start).toLocaleString('id-ID') : '-'}</span>
                    </div>
                    {event.registration_deadline && (
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-red-500" />
                            <span className="text-red-600 font-medium text-xs">
                                Deadline: {new Date(event.registration_deadline).toLocaleString('id-ID')}
                            </span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-navy" />
                        <span>{event.location || 'Online'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users size={14} className="text-navy" />
                        <span>{event.participants?.[0]?.count || 0} Terdaftar</span>
                    </div>
                </div>

                <div className="mt-auto flex gap-2 pt-4 border-t border-gray-50 flex-wrap">
                    <button
                        onClick={() => onEdit(event)}
                        className="flex-1 min-w-[60px] flex items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 text-navy py-2 rounded text-xs font-bold transition active:scale-95"
                    >
                        <Edit2 size={14} /> Edit
                    </button>
                    <button
                        onClick={() => onViewParticipants(event.id, event.title)}
                        className="flex-1 min-w-[60px] flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded text-xs font-bold transition active:scale-95"
                    >
                        <Users size={14} /> Peserta
                    </button>
                    <button
                        onClick={() => onManageStaff(event)}
                        className="flex-1 min-w-[60px] flex items-center justify-center gap-1 bg-orange/10 hover:bg-orange/20 text-orange py-2 rounded text-xs font-bold transition active:scale-95"
                    >
                        <Shield size={14} /> Staff
                    </button>

                    <button
                        onClick={() => onShowQR(event.id, event.title)}
                        title="Tampilkan QR Code Event"
                        className="p-2 bg-navy/10 text-navy hover:bg-navy/20 rounded transition active:scale-95"
                    >
                        <CheckSquare size={14} className="hidden" /> {/* Legacy icon replacement */}
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 7h.01" /><path d="M17 7h.01" /><path d="M7 17h.01" /><path d="M17 17h.01" /></svg>
                    </button>

                    <button
                        onClick={() => onFinalize(event.id)}
                        title="Finalize Attendance (Calculate Sanctions)"
                        className="p-2 bg-purple-50 text-purple-600 hover:bg-purple-100 rounded transition active:scale-95"
                    >
                        <CheckSquare size={14} />
                    </button>

                    <button
                        onClick={() => onDelete(event.id)}
                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition active:scale-95"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
        </div>
    )
}

export function AgendaCardSkeleton() {
    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col h-[300px]">
            <Skeleton className="h-2 w-full" />
            <div className="p-6 flex-1 flex flex-col space-y-4">
                <div className="flex justify-between">
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />

                <div className="space-y-3 mt-4">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/2" />
                </div>

                <div className="mt-auto pt-4 flex gap-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 w-8" />
                </div>
            </div>
        </div>
    )
}
