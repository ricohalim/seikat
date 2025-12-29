'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Shield, User, Lock, Briefcase, GraduationCap, X } from 'lucide-react'

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [filterGeneration, setFilterGeneration] = useState('')
    const [filterGender, setFilterGender] = useState('')
    const [availableGenerations, setAvailableGenerations] = useState<string[]>([])
    const [currentUserRole, setCurrentUserRole] = useState('')
    const [authLoading, setAuthLoading] = useState(true)

    // Pagination
    const [page, setPage] = useState(0)
    const ITEMS_PER_PAGE = 20
    const [totalItems, setTotalItems] = useState(0)

    // Detail Modal
    const [selectedUser, setSelectedUser] = useState<any>(null)

    useEffect(() => {
        const checkRole = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
                    setCurrentUserRole(profile?.role || 'member')
                }
            } catch (error) {
                console.error("Error checking role:", error)
            } finally {
                setAuthLoading(false)
            }
        }
        checkRole()
    }, [])

    useEffect(() => {
        if (!authLoading && ['superadmin', 'admin'].includes(currentUserRole)) {
            fetchUsers()
        }
    }, [page, filter, filterGeneration, filterGender, authLoading, currentUserRole]) // Refetch on page or filter change

    const fetchUsers = async () => {
        setLoading(true)
        try {
            // Fetch via RPC (Bypass RLS)
            const { data, error } = await supabase.rpc('get_all_profiles_for_admin')

            if (error) throw error

            if (data) {
                // Client-side Filter & Pagination (RPC returns all)
                let filteredData = data

                // Populate available generations (once or always?) - Always good to keep updated
                const gens = Array.from(new Set(data.map((u: any) => u.generation).filter(Boolean))).sort() as string[]
                setAvailableGenerations(gens)


                if (filter) {
                    const term = filter.toLowerCase()
                    filteredData = data.filter((u: any) =>
                        (u.full_name && u.full_name.toLowerCase().includes(term)) ||
                        (u.email && u.email.toLowerCase().includes(term))
                    )
                }

                if (filterGeneration) {
                    filteredData = filteredData.filter((u: any) => u.generation === filterGeneration)
                }

                if (filterGender) {
                    filteredData = filteredData.filter((u: any) => u.gender === filterGender)
                }

                setTotalItems(filteredData.length)

                // Sort
                filteredData.sort((a: any, b: any) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )

                // Paginate
                const from = page * ITEMS_PER_PAGE
                const paginatedData = filteredData.slice(from, from + ITEMS_PER_PAGE)

                setUsers(paginatedData)
            }
        } catch (err) {
            console.error('Error fetching users:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleRoleChange = async (userId: string, newRole: string) => {
        if (!confirm(`Ubah role user ini menjadi ${newRole}?`)) return
        try {
            await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
            setUsers(prev => prev.map(u => u.id === users.find(u => u.id === userId)?.id ? { ...u, role: newRole } : u)) // Safer update
            alert('Role berhasil diubah.')
        } catch (err) {
            alert('Gagal mengubah role.')
        }
    }



    const [editingUser, setEditingUser] = useState<any>(null)
    const [editForm, setEditForm] = useState<any>({})
    const [saveLoading, setSaveLoading] = useState(false)

    // Reset Password State
    const [newPassword, setNewPassword] = useState('')
    const [resetLoading, setResetLoading] = useState(false)
    const [showResetInput, setShowResetInput] = useState(false)

    const handleEditClick = (user: any) => {
        setEditingUser(user)
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

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) return alert('Password minimal 6 karakter!')
        if (!confirm('Yakin ingin mereset password user ini?')) return

        setResetLoading(true)
        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('No active session')

            const res = await fetch('/api/admin/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    targetUserId: editingUser.id,
                    newPassword: newPassword
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Gagal reset password')

            alert('Password berhasil direset!')
            setShowResetInput(false)
            setNewPassword('')
        } catch (err: any) {
            alert('Error: ' + err.message)
        } finally {
            setResetLoading(false)
        }
    }

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!confirm('Simpan perubahan data user ini?')) return

        setSaveLoading(true)
        try {
            const { error } = await supabase.rpc('admin_update_profile', {
                target_user_id: editingUser.id,
                new_data: editForm
            })

            if (error) throw error

            // Update Local State
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...editForm } : u))
            alert('Data user berhasil diperbarui!')
            setEditingUser(null)
        } catch (err: any) {
            console.error('Update failed:', err)
            alert('Gagal update user: ' + err.message)
        } finally {
            setSaveLoading(false)
        }
    }

    // EDIT MODAL RENDERER
    const renderEditModal = () => (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h3 className="text-xl font-bold text-navy">Edit Data User</h3>
                    <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-red-500 transition">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 border border-blue-100 mb-2">
                        <span className="font-bold">User:</span> {editingUser.email}
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nama Lengkap</label>
                        <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy/20 outline-none"
                            value={editForm.full_name || ''} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">No. HP</label>
                            <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy/20 outline-none"
                                value={editForm.phone || ''} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Angkatan</label>
                            <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy/20 outline-none"
                                value={editForm.generation || ''} onChange={e => setEditForm({ ...editForm, generation: e.target.value })} />
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Universitas</label>
                        <input type="text" className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-navy/20 outline-none"
                            value={editForm.university || ''} onChange={e => setEditForm({ ...editForm, university: e.target.value })} />
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
                                        onClick={handleResetPassword}
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
                        <button type="button" onClick={() => setEditingUser(null)} className="px-6 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition">Batal</button>
                        <button type="submit" disabled={saveLoading} className="px-6 py-2.5 rounded-xl font-bold bg-navy text-white hover:bg-navy/90 transition shadow-lg shadow-navy/20">
                            {saveLoading ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )

    if (authLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
            </div>
        )
    }

    const maxPage = Math.ceil(totalItems / ITEMS_PER_PAGE)

    if (!['superadmin', 'admin'].includes(currentUserRole)) {
        return (
            <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl border border-red-200">
                <Shield size={48} className="mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-bold">Akses Ditolak</h2>
                <p>Hanya Admin dan Super Admin yang dapat mengakses halaman ini.</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy">Manajemen User</h1>
                    <p className="text-gray-500 text-sm">Kelola Role Admin dan Data User (Total: {totalItems})</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari User / Email..."
                        value={filter}
                        onChange={(e) => { setFilter(e.target.value); setPage(0); }}
                        className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-navy outline-none w-64 text-sm bg-white"
                    />
                </div>
            </header>

            {/* FILTERS */}
            <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase">Filter:</span>
                </div>

                {/* Generation Filter */}
                <div className="relative">
                    <select
                        value={filterGeneration}
                        onChange={(e) => { setFilterGeneration(e.target.value); setPage(0); }}
                        className="px-4 py-2 pr-8 rounded-lg border border-gray-200 focus:border-navy outline-none text-sm bg-white appearance-none min-w-[150px]"
                    >
                        <option value="">Semua Angkatan</option>
                        {availableGenerations.map(gen => (
                            <option key={gen} value={gen}>Beswan {gen}</option>
                        ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>

                {/* Gender Filter */}
                <div className="relative">
                    <select
                        value={filterGender}
                        onChange={(e) => { setFilterGender(e.target.value); setPage(0); }}
                        className="px-4 py-2 pr-8 rounded-lg border border-gray-200 focus:border-navy outline-none text-sm bg-white appearance-none min-w-[150px]"
                    >
                        <option value="">Semua Gender</option>
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                </div>

                {/* Clear Filters */}
                {(filter || filterGeneration || filterGender) && (
                    <button
                        onClick={() => { setFilter(''); setFilterGeneration(''); setFilterGender(''); setPage(0); }}
                        className="px-3 py-2 text-red-500 text-xs font-bold hover:bg-red-50 rounded-lg transition ml-auto"
                    >
                        Reset Filter
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden select-none"> {/* Anti-Copy: select-none */}
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-100">
                            <th className="p-4 font-bold">User Information</th>
                            <th className="p-4 font-bold">Education / Job</th>
                            <th className="p-4 font-bold">Role & Status</th>
                            <th className="p-4 font-bold text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading Data...</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">User tidak ditemukan.</td></tr>
                        ) : users.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50 transition group">
                                <td className="p-4">
                                    <div className="font-bold text-navy text-base">{u.full_name}</div>
                                    {u.member_id && (
                                        <div className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 inline-block px-1.5 rounded mb-1 border border-blue-100">
                                            {u.member_id}
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-400 font-mono mb-1">{u.email}</div>
                                    <div className="text-[10px] text-gray-400">{u.phone || '-'}</div>
                                </td>
                                <td className="p-4 text-gray-600">
                                    <div className="font-semibold text-xs">Beswan {u.generation}</div>
                                    <div className="text-xs">{u.university || '-'}</div>
                                    <div className="text-[10px] text-gray-400 mt-1 truncate max-w-[150px]">{u.company_name ? `${u.job_position} at ${u.company_name}` : '-'}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col gap-2 items-start">
                                        <select
                                            value={u.role || 'member'}
                                            onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                            className={`px-2 py-1 rounded text-xs font-bold border-none outline-none cursor-pointer ${u.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                                                u.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}
                                        >
                                            <option value="member">Member</option>
                                            <option value="admin">Verifikator</option>
                                            <option value="superadmin">Super Admin</option>
                                        </select>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${u.account_status === 'Active' ? 'text-green-600 border-green-200 bg-green-50' : 'text-orange border-orange/20 bg-orange/10'}`}>
                                            {u.account_status}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => setSelectedUser(u)}
                                            className="px-3 py-1.5 bg-navy text-white text-xs font-bold rounded hover:bg-navy/90 transition"
                                        >
                                            Detail
                                        </button>
                                        <button
                                            onClick={() => handleEditClick(u)}
                                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition"
                                            title="Edit Data User"
                                        >
                                            Edit
                                        </button>

                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-4 select-none">
                <p className="text-sm text-gray-500">
                    Halaman <span className="font-bold">{page + 1}</span> dari {maxPage || 1}
                </p>
                <div className="flex gap-2">
                    <button
                        disabled={page === 0}
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-gray-50"
                    >
                        Sebelumnya
                    </button>
                    <button
                        disabled={page >= maxPage - 1}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-gray-50"
                    >
                        Selanjutnya
                    </button>
                </div>
            </div>

            {/* EDIT MODAL */}
            {editingUser && renderEditModal()}

            {/* DETAIL MODAL */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 select-none">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-navy">Detail User</h3>
                                <p className="text-xs text-gray-500">{selectedUser.id}</p>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="text-gray-400 hover:text-red-500 transition">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Nama Lengkap</label>
                                    <p className="font-bold text-navy text-lg">{selectedUser.full_name}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Email</label>
                                    <p className="font-medium text-gray-700">{selectedUser.email}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Whatsapp</label>
                                    <p className="font-medium text-gray-700">{selectedUser.phone || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Angkatan</label>
                                    <p className="font-medium text-gray-700">Beswan {selectedUser.generation}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Universitas</label>
                                    <p className="font-medium text-gray-700">{selectedUser.university}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Jurusan</label>
                                    <p className="font-medium text-gray-700">{selectedUser.major}</p>
                                </div>
                                <div className="col-span-2 border-t pt-4 mt-2">
                                    <h4 className="font-bold text-navy mb-3 text-sm flex items-center gap-2"><Briefcase size={16} /> Pekerjaan</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-400 uppercase font-bold">Posisi</label>
                                            <p className="font-medium text-gray-700">{selectedUser.job_position || '-'}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 uppercase font-bold">Perusahaan</label>
                                            <p className="font-medium text-gray-700">{selectedUser.company_name || '-'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs text-gray-400 uppercase font-bold">Sektor</label>
                                            <p className="font-medium text-gray-700">{selectedUser.industry_sector || '-'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-span-2 border-t pt-4 mt-2">
                                    <h4 className="font-bold text-navy mb-3 text-sm flex items-center gap-2"><User size={16} /> Bio Lainnya</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-gray-400 uppercase font-bold">Domisili</label>
                                            <p className="font-medium text-gray-700">{selectedUser.domicile_city}, {selectedUser.domicile_province}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs text-gray-400 uppercase font-bold">LinkedIn</label>
                                            <p className="font-medium text-blue-600 truncate">{selectedUser.linkedin_url || '-'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-span-2 border-t pt-4 mt-2">
                                    <h4 className="font-bold text-navy mb-3 text-sm flex items-center gap-2"><Shield size={16} /> Verifikasi</h4>
                                    {selectedUser.verification_photo_url ? (
                                        <div className="relative w-full max-w-sm h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group cursor-pointer" onClick={() => window.open(selectedUser.verification_photo_url, '_blank')}>
                                            <img src={selectedUser.verification_photo_url} alt="Verifikasi" className="w-full h-full object-cover group-hover:scale-105 transition" />
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold">
                                                Klik untuk memperbesar
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 text-sm italic">Tidak ada dokumen verifikasi.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
