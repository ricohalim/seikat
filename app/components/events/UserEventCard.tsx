import { Calendar, MapPin, Clock } from 'lucide-react'
import Link from 'next/link'
import { Skeleton } from '../ui/Skeleton'

interface Event {
    id: string
    title: string
    description: string
    date_start: string
    location: string
    status: string
}

interface UserEventCardProps {
    event: Event
    isRegistered: boolean
    isClosed: boolean
    isStaff: boolean
    isRegistering: boolean
    onRegister: (id: string) => void
    onCancel: (id: string) => void
}

export function UserEventCard({ event, isRegistered, isClosed, isStaff, isRegistering, onRegister, onCancel }: UserEventCardProps) {
    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col group animate-in fade-in zoom-in-95 duration-500">
            <div className={`h-2 ${isClosed ? 'bg-gray-300' : 'bg-gradient-to-r from-orange to-red-500'}`}></div>
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-navy line-clamp-2" title={event.title}>{event.title}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${isRegistered ? 'bg-green-100 text-green-700' :
                        isClosed ? 'bg-gray-100 text-gray-500' : 'bg-blue-50 text-blue-600'
                        }`}>
                        {isRegistered ? 'Terdaftar' : event.status}
                    </span>
                </div>

                <p className="text-gray-600 text-sm mb-6 line-clamp-3 min-h-[4.5em]">
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

                <div className="mt-6 flex flex-col gap-2">
                    <button
                        onClick={() => onRegister(event.id)}
                        disabled={isRegistered || isClosed || isRegistering}
                        className={`w-full font-bold py-2 rounded-lg transition text-sm active:scale-95 ${isRegistered
                            ? 'bg-green-100 text-green-700 cursor-default'
                            : isClosed
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-navy text-white hover:bg-navy/90 shadow-md shadow-navy/20'
                            }`}
                    >
                        {isRegistering ? 'Mendaftarkan...' :
                            isRegistered ? 'Anda Telah Terdaftar' :
                                isClosed ? 'Pendaftaran Ditutup' : 'Daftar Kegiatan'}
                    </button>

                    {isRegistered && !isClosed && (
                        <button
                            onClick={() => onCancel(event.id)}
                            className="w-full font-medium py-2 rounded-lg transition text-sm text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100"
                        >
                            Batalkan / Izin Tidak Hadir
                        </button>
                    )}
                </div>

                {isStaff && (
                    <Link
                        href={`/dashboard/events/${event.id}/staff`}
                        className="w-full mt-2 block text-center bg-orange text-white font-bold py-2 rounded-lg transition text-sm hover:bg-orange/90 shadow-sm active:scale-95"
                    >
                        <span className="flex items-center justify-center gap-2">
                            🛡️ Console Panitia
                        </span>
                    </Link>
                )}
            </div>
        </div>
    )
}

export function UserEventSkeleton() {
    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col h-[400px]">
            <Skeleton className="h-2 w-full" />
            <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between mb-4">
                    <Skeleton className="h-8 w-2/3" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                </div>

                <div className="space-y-2 mb-6">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                </div>

                <div className="mt-auto space-y-4 pt-6">
                    <div className="flex gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-3 w-12" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="flex-1 space-y-1">
                            <Skeleton className="h-3 w-12" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </div>
                </div>

                <Skeleton className="h-10 w-full mt-6 rounded-lg" />
            </div>
        </div>
    )
}
