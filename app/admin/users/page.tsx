'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Shield, User, Lock, MoreHorizontal, AlertOctagon } from 'lucide-react'

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [currentUserRole, setCurrentUserRole] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            // Check Current User Role
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
                setCurrentUserRole(profile?.role || 'member')
            }

            // Fetch All Profiles (Admin View)
            const { data, error } = await supabase
                .from('profiles')
                .select('id, email, full_name, role, account_status, created_at')
                .order('created_at', { ascending: false })
                .limit(100)

            if (data) setUsers(data)
            setLoading(false)
        }

        fetchData()
    }, [])

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

    // Mock Reset Password (Real implementation requires Server Action / Supabase Admin API)
    const handleResetPassword = async (email: string) => {
        const newPass = prompt(`Reset Password untuk ${email}.\nMasukkan password sementara baru:`)
        if (!newPass) return

        // NOTE: Client-side `updateUser` only works for the logged-in user.
        // For Admin to reset OTHER user's password, we normally need a Backend Edge Function with Service Role Key.
        // OR we trigger a "Penalty Reset" flow where we generate a link.

        // Since we are in client-mode only for now, we will simulate the best we can or use the invite API if enabled.
        // For this demo, we'll alert the limitation.
        alert("PENTING: Reset Password User lain memerlukan Backend Function (Supabase Admin API). \n\nSolusi saat ini: Minta user menggunakan fitur 'Lupa Password' di halaman login, atau Super Admin harus login ke Dashboard Supabase langsung.")
    }

    const filtered = users.filter(u =>
        u.full_name?.toLowerCase().includes(filter.toLowerCase()) ||
        u.email?.toLowerCase().includes(filter.toLowerCase())
    )

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
        <div className="max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy">Manajemen User</h1>
                    <p className="text-gray-500 text-sm">Kelola Role Admin dan Reset Akses User.</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari User / Email..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-navy outline-none w-64 text-sm bg-white"
                    />
                </div>
            </header>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-100">
                            <th className="p-4 font-bold">User</th>
                            <th className="p-4 font-bold">Role</th>
                            <th className="p-4 font-bold">Status</th>
                            <th className="p-4 font-bold text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-50">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading...</td></tr>
                        ) : filtered.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50 transition group">
                                <td className="p-4">
                                    <div className="font-bold text-navy">{u.full_name}</div>
                                    <div className="text-xs text-gray-400">{u.email}</div>
                                </td>
                                <td className="p-4">
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
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${u.account_status === 'Active' ? 'text-green-600 bg-green-50' : 'text-orange bg-orange/10'}`}>
                                        {u.account_status}
                                    </span>
                                </td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    <button
                                        onClick={() => handleResetPassword(u.email)}
                                        title="Reset Password"
                                        className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition"
                                    >
                                        <Lock size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
