import { useState } from 'react'
import { X, Check, CheckCircle, AlertOctagon, XCircle, Search, Download } from 'lucide-react'
import { Sheet } from '../ui/Sheet'
import { Badge } from '../ui/Badge'

interface ParticipantsModalProps {
    isOpen: boolean
    onClose: () => void
    eventName: string
    participants: any[]
    loading: boolean
    onCheckIn: (userId: string) => void
    onApprove: (userId: string, approve: boolean) => void
    onApproveWaitlist: (userId: string, approve: boolean) => void
}

export function ParticipantsModal({ isOpen, onClose, eventName, participants, loading, onCheckIn, onApprove, onApproveWaitlist }: ParticipantsModalProps) {
    const [searchTerm, setSearchTerm] = useState('')

    const filtered = participants.filter(p =>
        p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.generation?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Export CSV logic
    const handleDownloadCSV = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Nama,Email,Angkatan,No HP,Status,Izin\n"
            + participants.map(p => `"${p.full_name}","${p.email}","${p.generation}","${p.phone}","${p.status}","${p.cancellation_reason || ''}"`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `peserta_${eventName.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
    }

    return (
        <Sheet
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            title="Daftar Peserta"
            description={
                <div className="flex flex-col gap-1">
                    <span>{eventName} — {participants.length} Total</span>
                    <span className="text-xs text-gray-400">Cari nama peserta dan klik Check-In untuk mencatat kehadiran manual.</span>
                </div>
            }
        >
            <div className="p-6 space-y-4">
                {/* Search Bar */}
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Cari nama, email, atau angkatan..."
                            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-navy/20 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <button
                        onClick={handleDownloadCSV}
                        disabled={participants.length === 0}
                        className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition"
                        title="Download CSV"
                    >
                        <Download size={18} />
                    </button>
                </div>

                {/* Table */}
                <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="p-4">Peserta</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={3} className="p-8 text-center text-gray-400">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={3} className="p-8 text-center text-gray-400">
                                    {searchTerm ? 'Tidak ditemukan.' : 'Belum ada peserta terdaftar.'}
                                </td></tr>
                            ) : filtered.map((p, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition">
                                    <td className="p-4">
                                        <div className="font-bold text-navy flex items-center gap-2">
                                            {p.full_name}
                                            {p.isVerified && (
                                                <Badge variant="verified" className="h-5 px-2 cursor-default">
                                                    <CheckCircle size={12} className="mr-1" /> Verified
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono">{p.email}</div>
                                        <div className="text-xs text-gray-500">{p.phone} • Beswan {p.generation}</div>

                                        {/* Status Metadata */}
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {p.consecutive_absences > 0 && (
                                                <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">
                                                    <AlertOctagon size={10} /> {p.consecutive_absences}x Alpha
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td className="p-4 text-center">
                                        <div className="flex justify-center">
                                            <StatusBadge status={p.status} cancellationStatus={p.cancellation_status} />
                                        </div>
                                        {p.checked_in_at && (
                                            <div className="text-[10px] text-green-600 mt-1 font-mono text-center">
                                                {new Date(p.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                        {p.cancellation_status === 'pending' && p.cancellation_reason && (
                                            <div className="text-[10px] mt-1 p-1 bg-yellow-50 rounded border border-yellow-100 text-yellow-800 text-center mx-auto max-w-[150px] italic">
                                                &ldquo;{p.cancellation_reason}&rdquo;
                                            </div>
                                        )}
                                    </td>

                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {/* Logic for Approval */}
                                            {p.cancellation_status === 'pending' ? (
                                                <>
                                                    <button
                                                        onClick={() => onApprove(p.user_id, true)}
                                                        className="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-lg" title="Setujui Izin">
                                                        <Check size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => onApprove(p.user_id, false)}
                                                        className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg" title="Tolak Izin">
                                                        <X size={16} />
                                                    </button>
                                                </>
                                            ) : (
                                                /* Logic for Waiting List Approval */
                                                p.status === 'Waiting List' ? (
                                                    <>
                                                        <button
                                                            onClick={() => onApproveWaitlist(p.user_id, true)}
                                                            className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold" title="Terima (Registered)">
                                                            Terima
                                                        </button>
                                                        <button
                                                            onClick={() => onApproveWaitlist(p.user_id, false)}
                                                            className="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-lg" title="Tolak">
                                                            <X size={16} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    /* Logic for Check-In */
                                                    (p.status === 'Registered') && (
                                                        <button
                                                            onClick={() => onCheckIn(p.user_id)}
                                                            className="bg-navy text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-navy/90 shadow-sm active:scale-95"
                                                        >
                                                            Check In
                                                        </button>
                                                    )
                                                )
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Sheet>
    )
}

function StatusBadge({ status, cancellationStatus }: { status: string, cancellationStatus?: string }) {
    if (cancellationStatus === 'pending') {
        return <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-bold">Menunggu Izin</span>
    }

    switch (status) {
        case 'Attended':
            return <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><CheckCircle size={10} /> Hadir</span>
        case 'Registered':
            return <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-full text-xs font-bold">Terdaftar</span>
        case 'Waiting List':
            return <span className="bg-orange/10 text-orange px-2 py-1 rounded-full text-xs font-bold">Waiting List</span>
        case 'Absent':
            return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1"><XCircle size={10} /> Alpha (Absent)</span>
        case 'Permitted':
        case 'Cancelled':
            return <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold">Izin / Batal</span>
        default:
            return <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">{status}</span>
    }
}
