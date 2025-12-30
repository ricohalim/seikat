import { X, Save } from 'lucide-react'
import { useState, useEffect } from 'react'

interface AgendaFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (e: React.FormEvent, formData: any) => Promise<void>
    initialData?: any
    isEditing: boolean
}

export function AgendaFormModal({ isOpen, onClose, onSubmit, initialData, isEditing }: AgendaFormModalProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date_start: '',
        location: '',
        status: 'Open'
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            if (isEditing && initialData) {
                setFormData(initialData)
            } else {
                setFormData({
                    title: '',
                    description: '',
                    date_start: '',
                    location: '',
                    status: 'Open'
                })
            }
        }
    }, [isOpen, initialData, isEditing])

    const handleSubmitInternal = async (e: React.FormEvent) => {
        try {
            setIsSubmitting(true)
            await onSubmit(e, formData)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-navy">{isEditing ? 'Edit Agenda' : 'Buat Agenda Baru'}</h3>
                    <button onClick={onClose}><X className="text-gray-400 hover:text-red-500 transition" /></button>
                </div>
                <form onSubmit={handleSubmitInternal} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Judul Agenda</label>
                        <input
                            required
                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy/20 outline-none"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Deskripsi</label>
                        <textarea
                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy/20 outline-none h-24"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal & Waktu</label>
                            <input
                                type="datetime-local"
                                required
                                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy/20 outline-none"
                                value={formData.date_start}
                                onChange={e => setFormData({ ...formData, date_start: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lokasi</label>
                            <input
                                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy/20 outline-none"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                        <select
                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy/20 outline-none"
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="Open">Open (Dibuka)</option>
                            <option value="Closed">Closed (Ditutup)</option>
                            <option value="Draft">Draft (Disembunyikan)</option>
                        </select>
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-bold transition">Batal</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-bold hover:bg-navy/90 flex items-center gap-2 transition disabled:opacity-70">
                            <Save size={16} /> {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
