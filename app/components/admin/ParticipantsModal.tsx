import { X } from 'lucide-react'

interface ParticipantsModalProps {
    isOpen: boolean
    onClose: () => void
    eventName: string
    participants: any[]
    loading: boolean
}

export function ParticipantsModal({ isOpen, onClose, eventName, participants, loading }: ParticipantsModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <div>
                        <h3 className="text-lg font-bold text-navy">Daftar Peserta</h3>
                        <p className="text-gray-500 text-xs">{eventName}</p>
                    </div>
                    <button onClick={onClose}><X className="text-gray-400 hover:text-red-500 transition" /></button>
                </div>
                <div className="p-0 overflow-y-auto flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase text-xs sticky top-0">
                            <tr>
                                <th className="p-4 font-bold">Nama</th>
                                <th className="p-4 font-bold">Email</th>
                                <th className="p-4 font-bold">Angkatan</th>
                                <th className="p-4 font-bold">No. HP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading...</td></tr>
                            ) : participants.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Belum ada peserta terdaftar.</td></tr>
                            ) : participants.map((p, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="p-4 font-bold text-navy">{p.full_name}</td>
                                    <td className="p-4 text-gray-600 font-mono text-xs">{p.email}</td>
                                    <td className="p-4 text-gray-600">Beswan {p.generation}</td>
                                    <td className="p-4 text-gray-600">{p.phone || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t bg-gray-50 rounded-b-2xl text-right">
                    <button
                        onClick={() => {
                            const csvContent = "data:text/csv;charset=utf-8,"
                                + "Nama,Email,Angkatan,No HP\n"
                                + participants.map(p => `"${p.full_name}","${p.email}","${p.generation}","${p.phone}"`).join("\n");
                            const encodedUri = encodeURI(csvContent);
                            const link = document.createElement("a");
                            link.setAttribute("href", encodedUri);
                            link.setAttribute("download", `peserta_${eventName.replace(/\s+/g, '_')}.csv`);
                            document.body.appendChild(link);
                            link.click();
                        }}
                        disabled={participants.length === 0}
                        className="text-xs font-bold text-navy hover:underline disabled:opacity-50 transition"
                    >
                        Download CSV
                    </button>
                </div>
            </div>
        </div>
    )
}
