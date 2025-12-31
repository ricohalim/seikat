import { X, Lock, Briefcase, AlertCircle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { GENERATIONS, UNIVERSITIES } from '@/lib/constants'
import { useNameValidation } from '@/app/hooks/useNameValidation'
import { useUniversities } from '@/app/hooks/useUniversities'

interface EditUserModalProps {
    isOpen: boolean
    user: any
    onClose: () => void
    onSave: (e: React.FormEvent, editForm: any) => Promise<void>
    loading: boolean
    onResetPassword: (userId: string, password: string) => Promise<void>
    resetLoading: boolean
}

export function EditUserModal({ isOpen, user, onClose, onSave, loading, onResetPassword, resetLoading }: EditUserModalProps) {
    const [editForm, setEditForm] = useState<any>({
        full_name: user?.full_name,
        phone: user?.phone,
        generation: user?.generation,
        university: user?.university,
        company_name: user?.company_name,
        job_position: user?.job_position,
        role: user?.role,
        account_status: user?.account_status
    })

    // FIX: Sync state when user prop changes (because component stays mounted)
    useEffect(() => {
        if (user) {
            setEditForm({
                full_name: user.full_name,
                phone: user.phone,
                generation: user.generation,
                university: user.university,
                company_name: user.company_name,
                job_position: user.job_position,
                role: user.role,
                account_status: user.account_status
            })
        }
    }, [user])

    // Validation
    const { validateName } = useNameValidation()
    const { universities } = useUniversities()
    const [nameWarning, setNameWarning] = useState<string | null>(null)

    useEffect(() => {
        if (editForm.full_name) {
            const validation = validateName(editForm.full_name)
            setNameWarning(validation.hasWarning ? validation.message : null)
        } else {
            setNameWarning(null)
        }
    }, [editForm.full_name, validateName])

    const [showResetInput, setShowResetInput] = useState(false)
    const [newPassword, setNewPassword] = useState('')

    if (!isOpen || !user) return null

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSave(e, editForm)
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-navy">Edit Data User</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 border border-blue-100 mb-2">
                        <span className="font-bold">User:</span> {user.email}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nama Lengkap</label>
                        <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy/20 outline-none"
                            value={editForm.full_name || ''} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
                        {nameWarning ? (
                            <p className="text-xs text-orange mt-1 flex items-center gap-1 font-medium bg-orange/10 p-2 rounded-lg border border-orange/20">
                                <AlertCircle size={12} /> {nameWarning}
                            </p>
                        ) : (
                            <p className="text-[10px] text-gray-400 mt-1">Isi nama lengkap sesuai KTP tanpa gelar.</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">No. HP</label>
                            <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy/20 outline-none"
                                value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Angkatan</label>
                            <select
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy/20 outline-none bg-white"
                                value={editForm.generation || ''}
                                onChange={e => setEditForm({ ...editForm, generation: e.target.value })}
                            >
                                <option value="">- Pilih Angkatan -</option>
                                {GENERATIONS.map(gen => (
                                    <option key={gen} value={gen}>{gen}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Universitas</label>
                        <select
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy/20 outline-none bg-white"
                            value={editForm.university || ''}
                            onChange={e => setEditForm({ ...editForm, university: e.target.value })}
                        >
                            <option value="">- Pilih Universitas -</option>
                            {universities.map(uni => (
                                <option key={uni} value={uni}>{uni}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Perusahaan</label>
                            <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy/20 outline-none"
                                value={editForm.company_name || ''} onChange={e => setEditForm({ ...editForm, company_name: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Jabatan</label>
                            <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy/20 outline-none"
                                value={editForm.job_position || ''} onChange={e => setEditForm({ ...editForm, job_position: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Role</label>
                            <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy/20 outline-none bg-white"
                                value={editForm.role || 'member'} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                                <option value="member">Member</option>
                                <option value="admin">Verifikator</option>
                                <option value="superadmin">Superadmin</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Status</label>
                            <select className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy/20 outline-none bg-white"
                                value={editForm.account_status || 'Pending'} onChange={e => setEditForm({ ...editForm, account_status: e.target.value })}>
                                <option value="Pending">Pending</option>
                                <option value="Active">Active</option>
                                <option value="On-Hold">On-Hold</option>
                                <option value="Blocked">Blocked</option>
                            </select>
                        </div>
                    </div>

                    {/* RESET PASSWORD SECTION */}
                    <div className="pt-4 border-t border-gray-100">
                        {!showResetInput ? (
                            <button
                                type="button"
                                onClick={() => setShowResetInput(true)}
                                className="text-xs font-bold text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg transition flex items-center gap-2"
                            >
                                <Lock size={14} /> Reset Password User Ini
                            </button>
                        ) : (
                            <div className="bg-red-50 p-4 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                                <label className="text-xs font-bold text-red-800 uppercase mb-2 block">Set Password Baru</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Min. 6 Karakter"
                                        className="flex-1 p-2 text-sm border border-red-200 rounded-lg focus:ring-2 focus:ring-red-200 outline-none text-red-900 placeholder:text-red-300"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => onResetPassword(user.id, newPassword)}
                                        disabled={resetLoading}
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-70"
                                    >
                                        {resetLoading ? '...' : 'Reset'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowResetInput(false)}
                                        className="text-red-500 p-2 hover:bg-red-100 rounded-lg"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition">Batal</button>
                        <button type="submit" disabled={loading} className="px-6 py-2.5 rounded-xl font-bold bg-navy text-white hover:bg-navy/90 transition shadow-lg shadow-navy/20">
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
