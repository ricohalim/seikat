import { X, UserPlus, Trash2 } from 'lucide-react'
import { useState } from 'react'

interface StaffModalProps {
    isOpen: boolean
    onClose: () => void
    eventName: string
    staffList: any[]
    loading: boolean
    onAddStaff: (e: React.FormEvent, email: string, role: string) => Promise<void>
    onRemoveStaff: (id: string) => Promise<void>
}

export function StaffModal({ isOpen, onClose, eventName, staffList, loading, onAddStaff, onRemoveStaff }: StaffModalProps) {
    const [newStaffEmail, setNewStaffEmail] = useState('')
    const [newStaffRole, setNewStaffRole] = useState('Koordinator')
    const [adding, setAdding] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setAdding(true)
        await onAddStaff(e, newStaffEmail, newStaffRole)
        setNewStaffEmail('')
        setAdding(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <div>
                        <h3 className="text-lg font-bold text-navy">Manajemen Panitia</h3>
                        <p className="text-gray-500 text-xs">{eventName}</p>
                    </div>
                    <button onClick={onClose}><X className="text-gray-400 hover:text-red-500 transition" /></button>
                </div>

                <div className="p-6 border-b border-gray-100 bg-white">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Email member..."
                                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy/20 outline-none"
                                value={newStaffEmail}
                                onChange={e => setNewStaffEmail(e.target.value)}
                                required
                            />
                        </div>
                        <select
                            className="border rounded-lg p-2 text-sm bg-gray-50 outline-none"
                            value={newStaffRole}
                            onChange={e => setNewStaffRole(e.target.value)}
                        >
                            <option value="Koordinator">Koordinator</option>
                            <option value="Registrasi">Registrasi</option>
                            <option value="Konsumsi">Konsumsi</option>
                            <option value="Liaison">Liaison</option>
                            <option value="Keamanan">Keamanan</option>
                            <option value="Dokumentasi">Dokumentasi</option>
                        </select>
                        <button type="submit" disabled={adding} className="bg-navy text-white p-2 rounded-lg hover:bg-navy/90 transition disabled:opacity-70">
                            <UserPlus size={20} />
                        </button>
                    </form>
                </div>

                <div className="p-0 overflow-y-auto max-h-[50vh]">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Loading staff...</div>
                    ) : staffList.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Belum ada panitia ditugaskan.</div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {staffList.map((staff) => (
                                <li key={staff.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div>
                                        {/* @ts-ignore */}
                                        <p className="text-sm font-bold text-navy">{staff.profiles?.full_name || 'Unknown'}</p>
                                        <p className="text-xs text-gray-500">{staff.role}</p>
                                    </div>
                                    <button
                                        onClick={() => onRemoveStaff(staff.id)}
                                        className="text-gray-400 hover:text-red-500 p-2 transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    )
}
