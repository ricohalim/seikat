import { X, Lock, Briefcase, AlertCircle, Check, ChevronsUpDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { GENERATIONS, UNIVERSITIES, PROVINCES } from '@/lib/constants'
import { useNameValidation } from '@/app/hooks/useNameValidation'
import { useUniversities } from '@/app/hooks/useUniversities'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover"
import { cn } from "@/lib/utils"

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
        account_status: user?.account_status,
        managed_provinces: user?.managed_provinces || []
    })

    const [openProvince, setOpenProvince] = useState(false)

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
                account_status: user.account_status,
                managed_provinces: user.managed_provinces || []
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

    const toggleProvince = (prov: string) => {
        setEditForm((prev: any) => {
            const current = prev.managed_provinces || []
            if (current.includes(prov)) {
                return { ...prev, managed_provinces: current.filter((p: string) => p !== prov) }
            } else {
                return { ...prev, managed_provinces: [...current, prov] }
            }
        })
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
                                <option value="korwil">Koordinator Wilayah</option>
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

                    {/* MANAGED PROVINCES - Only for Korwil */}
                    {editForm.role === 'korwil' && (
                        <div className="animate-in fade-in slide-in-from-top-2 bg-purple-50 p-4 rounded-xl border border-purple-100">
                            <label className="text-xs font-bold text-purple-800 uppercase mb-1 block">Wilayah Pegangan (Provinsi)</label>
                            <p className="text-[10px] text-gray-500 mb-2">Pilih provinsi yang dikelola oleh Koordinator ini.</p>

                            <Popover open={openProvince} onOpenChange={setOpenProvince}>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        role="combobox"
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-purple-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <span className="truncate text-gray-700">
                                            {editForm.managed_provinces && editForm.managed_provinces.length > 0
                                                ? `${editForm.managed_provinces.length} Provinsi Terpilih`
                                                : "Pilih Provinsi..."}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0 z-[101] max-h-60 overflow-y-auto bg-white">
                                    <div className="p-1">
                                        {PROVINCES.map((prov) => (
                                            <div
                                                key={prov}
                                                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-sm cursor-pointer"
                                                onClick={() => toggleProvince(prov)}
                                            >
                                                <div className={cn(
                                                    "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                    editForm.managed_provinces?.includes(prov)
                                                        ? "bg-navy border-navy text-white"
                                                        : "opacity-50 [&_svg]:invisible"
                                                )}>
                                                    <Check className={cn("h-3 w-3")} />
                                                </div>
                                                <span className="text-sm">{prov}</span>
                                            </div>
                                        ))}
                                    </div>
                                </PopoverContent>
                            </Popover>
                            {editForm.managed_provinces?.length > 0 && (
                                <p className="text-[10px] text-gray-600 mt-2 leading-tight">
                                    {editForm.managed_provinces.join(", ")}
                                </p>
                            )}
                        </div>
                    )}

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

