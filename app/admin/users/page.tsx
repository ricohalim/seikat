'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, Shield } from 'lucide-react'
import { useUsers } from '@/app/hooks/useUsers'
import { UserTable } from '@/app/components/admin/UserTable'
import { UserFilters } from '@/app/components/admin/UserFilters'
import { EditUserModal } from '@/app/components/admin/EditUserModal'
import { UserDetailModal } from '@/app/components/admin/UserDetailModal'

export default function UserManagementPage() {
    const ITEMS_PER_PAGE = 20
    const {
        users, loading, totalItems, currentUserRole, authLoading, availableGenerations,
        filter, setFilter, filterGeneration, setFilterGeneration, filterGender, setFilterGender,
        page, setPage, updateUserLocal
    } = useUsers(ITEMS_PER_PAGE)

    // Modal States
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [editingUser, setEditingUser] = useState<any>(null)
    const [saveLoading, setSaveLoading] = useState(false)
    const [resetLoading, setResetLoading] = useState(false)

    // Handlers
    const handleRoleChange = async (userId: string, newRole: string) => {
        if (!confirm(`Ubah role user ini menjadi ${newRole}?`)) return
        try {
            await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
            updateUserLocal({ id: userId, role: newRole })
            alert('Role berhasil diubah.')
        } catch (err) {
            alert('Gagal mengubah role.')
        }
    }

    const handleSaveUser = async (e: React.FormEvent, editForm: any) => {
        e.preventDefault()
        if (!confirm('Simpan perubahan data user ini?')) return

        setSaveLoading(true)
        try {
            const { error } = await supabase.rpc('admin_update_profile', {
                target_user_id: editingUser.id,
                new_data: editForm
            })
            if (error) throw error

            updateUserLocal({ id: editingUser.id, ...editForm })
            alert('Data user berhasil diperbarui!')
            setEditingUser(null)
        } catch (err: any) {
            console.error('Update failed:', err)
            alert('Gagal update user: ' + err.message)
        } finally {
            setSaveLoading(false)
        }
    }

    const handleResetPassword = async (userId: string, newPassword: string) => {
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
                    targetUserId: userId,
                    newPassword: newPassword
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Gagal reset password')

            alert('Password berhasil direset!')
        } catch (err: any) {
            alert('Error: ' + err.message)
        } finally {
            setResetLoading(false)
        }
    }

    if (authLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
            </div>
        )
    }

    if (!['superadmin', 'admin'].includes(currentUserRole)) {
        return (
            <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl border border-red-200">
                <Shield size={48} className="mx-auto mb-4 opacity-50" />
                <h2 className="text-xl font-bold">Akses Ditolak</h2>
                <p>Hanya Admin dan Super Admin yang dapat mengakses halaman ini.</p>
            </div>
        )
    }

    const maxPage = Math.ceil(totalItems / ITEMS_PER_PAGE)

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

            <UserFilters
                availableGenerations={availableGenerations}
                filterGeneration={filterGeneration}
                setFilterGeneration={(v) => { setFilterGeneration(v); setPage(0); }}
                filterGender={filterGender}
                setFilterGender={(v) => { setFilterGender(v); setPage(0); }}
                onReset={() => { setFilter(''); setFilterGeneration(''); setFilterGender(''); setPage(0); }}
                activeFilters={Boolean(filter || filterGeneration || filterGender)}
            />

            <UserTable
                users={users}
                loading={loading}
                onRoleChange={handleRoleChange}
                onViewDetail={setSelectedUser}
                onEdit={setEditingUser}
            />

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

            <UserDetailModal
                isOpen={!!selectedUser}
                user={selectedUser}
                onClose={() => setSelectedUser(null)}
            />

            <EditUserModal
                isOpen={!!editingUser}
                user={editingUser}
                loading={saveLoading}
                onClose={() => setEditingUser(null)}
                onSave={handleSaveUser}
                onResetPassword={handleResetPassword}
                resetLoading={resetLoading}
            />
        </div>
    )
}
