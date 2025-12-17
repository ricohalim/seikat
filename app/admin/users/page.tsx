'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Shield, User, Lock, Briefcase, GraduationCap, X } from 'lucide-react'

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [currentUserRole, setCurrentUserRole] = useState('')

    // Pagination
    const [page, setPage] = useState(0)
    const ITEMS_PER_PAGE = 20
    const [totalItems, setTotalItems] = useState(0)

    // Detail Modal
    const [selectedUser, setSelectedUser] = useState<any>(null)

    useEffect(() => {
        const checkRole = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
                setCurrentUserRole(profile?.role || 'member')
            }
        }
        checkRole()
    }, [])

    useEffect(() => {
        fetchUsers()
    }, [page, filter]) // Refetch on page or filter change

    const fetchUsers = async () => {
        setLoading(true)
        try {
            // Build Query
            let query = supabase
                .from('profiles')
                .select('*', { count: 'exact' }) // Select ALL columns for Super Admin
                .order('created_at', { ascending: false })

            // Apply Filter
            if (filter) {
                query = query.or(`full_name.ilike.%${filter}%,email.ilike.%${filter}%`)
            }

            // Apply Pagination
            const from = page * ITEMS_PER_PAGE
            const to = from + ITEMS_PER_PAGE - 1
            query = query.range(from, to)

            const { data, count, error } = await query

            if (error) throw error
            if (data) {
                setUsers(data)
                setTotalItems(count || 0)
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
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
            alert('Role berhasil diubah.')
        } catch (err) {
            alert('Gagal mengubah role.')
        }
    }

    const handleResetPassword = async (email: string) => {
        alert("Fitur Reset Password User lain memerlukan Backend Function (Supabase Admin API). \n\nSilahkan minta user reset sendiri via 'Lupa Password' atau gunakan Dashboard Supabase.")
    }

    const maxPage = Math.ceil(totalItems / ITEMS_PER_PAGE)

    if (currentUserRole !== 'superadmin') {
        return (
            <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl border border-red-200">
                <Shield size={48} className="mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-bold">Akses Ditolak</h2>
                <p>Hanya Super Admin yang dapat mengakses halaman ini.</p>
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
                                            onClick={() => handleResetPassword(u.email)}
                                            title="Reset Password"
                                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition"
                                        >
                                            <Lock size={14} />
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
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
