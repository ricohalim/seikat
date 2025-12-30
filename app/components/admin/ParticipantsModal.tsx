import { X, Check, CheckCircle, AlertOctagon, XCircle } from 'lucide-react'

interface ParticipantsModalProps {
    isOpen: boolean
    onClose: () => void
    eventName: string
    participants: any[]
    loading: boolean
    onCheckIn: (userId: string) => void
    onApprove: (userId: string, approve: boolean) => void
}

export function ParticipantsModal({ isOpen, onClose, eventName, participants, loading, onCheckIn, onApprove }: ParticipantsModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <div>
                        <h3 className="text-lg font-bold text-navy">Daftar Peserta</h3>
                        <p className="text-gray-500 text-xs">{eventName} — {participants.length} Total</p>
                    </div>
                    <button onClick={onClose}><X className="text-gray-400 hover:text-red-500 transition" /></button>
                </div>
                <div className="p-0 overflow-y-auto flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs sticky top-0 font-bold tracking-wider">
                            <tr>
                                <th className="p-4">Peserta</th>
                                <th className="p-4">Status Log</th>
                                <th className="p-4">Status Kehadiran</th>
                                <th className="p-4 text-center">Aksi / Kontrol</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading...</td></tr>
                            ) : participants.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Belum ada peserta terdaftar.</td></tr>
                            ) : participants.map((p, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition">
                                    <td className="p-4">
                                        <div className="font-bold text-navy">{p.full_name}</div>
                                        <div className="text-xs text-gray-500 font-mono">{p.email}</div>
                                        <div className="text-xs text-gray-500">{p.phone} • Beswan {p.generation}</div>
                                    </td>

                                    <td className="p-4">
                                        {p.consecutive_absences > 0 && (
                                            <span className="inline-flex items-center gap-1 text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded-full font-bold border border-red-100 mb-1">
                                                <AlertOctagon size={10} /> {p.consecutive_absences}x Alpha
                                            </span>
                                        )}
                                        {p.cancellation_status === 'pending' && (
                                            <div className="text-xs mt-1 p-2 bg-yellow-50 rounded border border-yellow-100 text-yellow-800">
                                                <strong>Izin:</strong> "{p.cancellation_reason}"
                                            </div>
                                        )}
                                    </td>

                                    <td className="p-4">
                                        <StatusBadge status={p.status} cancellationStatus={p.cancellation_status} />
                                        {p.checked_in_at && (
                                            <div className="text-[10px] text-green-600 mt-1 font-mono">
                                                {new Date(p.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
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
                                                /* Logic for Check-In */
                                                (p.status === 'Registered' || p.status === 'Waiting List') && (
                                                    <button
                                                        onClick={() => onCheckIn(p.user_id)}
                                                        className="bg-navy text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-navy/90 shadow-sm active:scale-95"
                                                    >
                                                        Check In
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex justify-between items-center text-xs text-gray-500">
                    <div>
                        Total: <strong>{participants.length}</strong>
                    </div>
                    <button
                        onClick={() => {
                            const csvContent = "data:text/csv;charset=utf-8,"
                                + "Nama,Email,Angkatan,No HP,Status,Izin\n"
                                + participants.map(p => `"${p.full_name}","${p.email}","${p.generation}","${p.phone}","${p.status}","${p.cancellation_reason || ''}"`).join("\n");
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", `peserta_${eventName.replace(/\s+/g, '_')}.csv`);
                            document.body.appendChild(link);
                            link.click();
                        }}
                        disabled={participants.length === 0}
                        className="font-bold text-navy hover:underline disabled:opacity-50 transition"
                    >
                        Download CSV
                    </button>
                </div>
            </div>
        </div>
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
