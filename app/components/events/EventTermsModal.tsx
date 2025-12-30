'use client'

import { AlertTriangle, X, CheckCircle } from 'lucide-react'

interface Props {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    loading: boolean
    isSanctioned: boolean
}

export function EventTermsModal({ isOpen, onClose, onConfirm, loading, isSanctioned }: Props) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-navy p-4 flex justify-between items-center text-white">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <AlertTriangle className="text-yellow-400" />
                        Syarat & Ketentuan Kehadiran
                    </h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4 text-gray-700 text-sm leading-relaxed">
                    <div className={`p-4 rounded-xl border ${isSanctioned ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                        {isSanctioned ? (
                            <p className="font-bold text-red-700 flex items-start gap-2">
                                <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                                Perhatian: Akun Anda sedang dalam masa sanksi karena tidak hadir (Alpha) 2x berturut-turut. Pendaftaran Anda akan masuk ke WAITING LIST.
                            </p>
                        ) : (
                            <p className="font-bold text-blue-700 flex items-start gap-2">
                                <CheckCircle className="shrink-0 mt-0.5" size={16} />
                                Akun Anda dalam status baik. Mohon pertahankan kedisiplinan kehadiran Anda.
                            </p>
                        )}
                    </div>

                    <div className="space-y-3">
                        <p className="font-semibold text-gray-900 border-b pb-2">Aturan Penting:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>
                                <strong>Wajib Scan QR:</strong> Kehadiran hanya dihitung scan QR Code di lokasi acara.
                            </li>
                            <li>
                                <strong>Sanksi Alpha:</strong> Jika tidak hadir tanpa izin (Alpha) sebanyak 2x berturut-turut, akun Anda akan terkena sanksi.
                            </li>
                            <li>
                                <strong>Efek Sanksi:</strong> Pendaftaran event berikutnya otomatis masuk <em>Waiting List</em> (Prioritas rendah).
                            </li>
                            <li>
                                <strong>Pembatalan/Izin:</strong> Maksimal H-2 acara. Jika mendadak, silakan hubungi panitia.
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition"
                    >
                        Batal
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-6 py-2 bg-navy text-white font-bold rounded-lg hover:bg-navy/90 hover:shadow-lg transition flex items-center gap-2"
                    >
                        {loading ? 'Memproses...' : (isSanctioned ? 'Saya Mengerti (Waiting List)' : 'Saya Setuju & Daftar')}
                    </button>
                </div>
            </div>
        </div>
    )
}
