'use client'

import { useState } from 'react'
import { X, CalendarX } from 'lucide-react'

interface Props {
    isOpen: boolean
    onClose: () => void
    onConfirm: (reason: string) => void
    loading: boolean
}

export function CancellationModal({ isOpen, onClose, onConfirm, loading }: Props) {
    const [reason, setReason] = useState('')
    const [error, setError] = useState('')

    if (!isOpen) return null

    const handleSubmit = () => {
        if (reason.trim().length < 5) {
            setError('Mohon isi alasan dengan jelas (min. 5 karakter)')
            return
        }
        onConfirm(reason)
        setReason('')
        setError('')
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-800 flex items-center gap-2">
                        <CalendarX size={18} className="text-red-500" />
                        Izin Tidak Hadir
                    </h3>
                    <button onClick={onClose} className="hover:bg-gray-200 p-1 rounded-full text-gray-400 hover:text-gray-600 transition">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">
                        Apakah Anda yakin tidak dapat menghadiri acara ini?
                        Mohon sertakan alasan yang jelas untuk pengajuan izin.
                    </p>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">Alasan Ketidakhadiran</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none min-h-[100px]"
                            placeholder="Contoh: Ada tugas dinas mendadak ke luar kota..."
                        />
                        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                    </div>

                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-xs text-yellow-700">
                        <strong>Catatan:</strong> Pengajuan izin maksimal <strong>H-2</strong> acara. Izin yang disetujui tidak akan dihitung sebagai Alpha (Sanksi).
                    </div>
                </div>

                <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition text-sm"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition text-sm flex items-center gap-2 shadow-sm"
                    >
                        {loading ? 'Mengirim...' : 'Kirim Permohonan Izin'}
                    </button>
                </div>
            </div>
        </div>
    )
}
