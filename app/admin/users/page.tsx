'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Search, Shield, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { useUsers } from '@/app/hooks/useUsers'
import { UserTable } from '@/app/components/admin/UserTable'
import { UserFilters } from '@/app/components/admin/UserFilters'
import { EditUserModal } from '@/app/components/admin/EditUserModal'
import { UserDetailModal } from '@/app/components/admin/UserDetailModal'
import { CreateAlumniModal } from '@/app/components/admin/CreateAlumniModal'
import { ConfirmDialog } from '@/app/components/ui/ConfirmDialog'
import { UserPlus } from 'lucide-react'
import { validatePassword } from '@/lib/utils'
import { hasPrivilegedAccess } from '@/lib/roles'

export default function UserManagementPage() {
    const ITEMS_PER_PAGE = 20
    const router = useRouter()
    const {
        users, loading, totalItems, currentUserRole, authLoading, availableGenerations,
        availableUniversities, availableProvinces,
        filter, setFilter, filterGeneration, setFilterGeneration, filterGender, setFilterGender,
        filterUniversity, setFilterUniversity, filterProvince, setFilterProvince,
        page, setPage, updateUserLocal
    } = useUsers(ITEMS_PER_PAGE)

    // Modal States
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [editingUser, setEditingUser] = useState<any>(null)
    const [saveLoading, setSaveLoading] = useState(false)
    const [resetLoading, setResetLoading] = useState(false)
    const [impersonateLoading, setImpersonateLoading] = useState<string | null>(null)
    const [changeEmailLoading, setChangeEmailLoading] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

    // ConfirmDialog state
    const [confirmState, setConfirmState] = useState<{
        open: boolean
        title: string
        description: string
        variant: 'danger' | 'warning' | 'default'
        confirmText: string
        onConfirm: () => void
    }>({
        open: false,
        title: '',
        description: '',
        variant: 'default',
        confirmText: 'Konfirmasi',
        onConfirm: () => { },
    })

    const closeConfirm = () => setConfirmState(s => ({ ...s, open: false }))

    const showConfirm = (opts: Omit<typeof confirmState, 'open'>) =>
        setConfirmState({ ...opts, open: true })

    // Handlers
    const handleRoleChange = async (userId: string, newRole: string) => {
        showConfirm({
            title: 'Ubah Role User',
            description: `Yakin ingin mengubah role user ini menjadi "${newRole}"?`,
            variant: 'warning',
            confirmText: 'Ubah Role',
            onConfirm: async () => {
                closeConfirm()
                try {
                    const { data: { session } } = await supabase.auth.getSession()
                    if (!session) throw new Error('No active session')

                    const res = await fetch('/api/admin/change-role', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({ targetUserId: userId, newRole })
                    })

                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || 'Gagal mengubah role')

                    updateUserLocal({ id: userId, role: newRole })
                    toast.success('Role berhasil diubah.')
                } catch (err: any) {
                    toast.error('Gagal mengubah role: ' + err.message)
                }
            }
        })
    }

    const handleSaveUser = async (e: React.FormEvent, editForm: any) => {
        e.preventDefault()
        showConfirm({
            title: 'Simpan Perubahan',
            description: 'Yakin ingin menyimpan perubahan data user ini?',
            variant: 'default',
            confirmText: 'Simpan',
            onConfirm: async () => {
                closeConfirm()
                setSaveLoading(true)
                try {
                    const { error } = await supabase.rpc('admin_update_profile', {
                        target_user_id: editingUser.id,
                        new_data: editForm
                    })
                    if (error) throw error

                    updateUserLocal({ id: editingUser.id, ...editForm })
                    toast.success('Data user berhasil diperbarui!')
                    setEditingUser(null)
                } catch (err: any) {
                    console.error('Update failed:', err)
                    toast.error('Gagal update user: ' + err.message)
                } finally {
                    setSaveLoading(false)
                }
            }
        })
    }

    const handleResetPassword = async (userId: string, newPassword: string) => {
        // Validasi password dengan helper
        const validationError = validatePassword(newPassword)
        if (validationError) {
            toast.error(validationError)
            return
        }

        showConfirm({
            title: 'Reset Password',
            description: 'Yakin ingin mereset password user ini? User perlu login ulang dengan password baru.',
            variant: 'warning',
            confirmText: 'Reset Password',
            onConfirm: async () => {
                closeConfirm()
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
                        body: JSON.stringify({ targetUserId: userId, newPassword })
                    })

                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error || 'Gagal reset password')

                    toast.success('Password berhasil direset!')
                } catch (err: any) {
                    toast.error('Error: ' + err.message)
                } finally {
                    setResetLoading(false)
                }
            }
        })
    }

    const handleChangeEmail = async (userId: string, newEmail: string) => {
        if (!newEmail) {
            toast.error('Email tidak boleh kosong!')
            return
        }

        showConfirm({
            title: 'Ubah Email User',
            description: `Ubah email user ini menjadi "${newEmail}"? User perlu login ulang dengan email baru.`,
            variant: 'warning',
            confirmText: 'Ubah Email',
            onConfirm: async () => {
                closeConfirm()
                setChangeEmailLoading(true)
                try {
                    const { data: { session } } = await supabase.auth.getSession()
                    if (!session) throw new Error('No active session')

                    const res = await fetch('/api/admin/change-email', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({ targetUserId: userId, newEmail })
                    })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error)

                    updateUserLocal({ id: userId, email: newEmail })
                    toast.success(`Email berhasil diubah ke ${newEmail}`)
                } catch (err: any) {
                    toast.error('Gagal ubah email: ' + err.message)
                } finally {
                    setChangeEmailLoading(false)
                }
            }
        })
    }

    const handleImpersonate = async (userId: string) => {
        showConfirm({
            title: 'Akses sebagai User',
            description: 'Link akses sekali-pakai akan digenerate. Buka di Tab Incognito agar session Admin tetap aktif. Link otomatis dihapus dari clipboard dalam 60 detik.',
            variant: 'warning',
            confirmText: 'Generate Link Akses',
            onConfirm: async () => {
                closeConfirm()
                setImpersonateLoading(userId)
                try {
                    const { data: { session } } = await supabase.auth.getSession()
                    if (!session) throw new Error('No active session')

                    const res = await fetch('/api/admin/impersonate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({ targetUserId: userId })
                    })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error)

                    await navigator.clipboard.writeText(data.link)
                    toast.warning('Link akses disalin ke clipboard!', {
                        description: '⚠️ Paste di Tab Incognito sekarang. Clipboard akan otomatis dihapus dalam 60 detik.',
                        duration: 60000
                    })

                    // Auto-clear clipboard setelah 60 detik agar link tidak tersisa
                    setTimeout(async () => {
                        try {
                            const current = await navigator.clipboard.readText()
                            if (current === data.link) {
                                await navigator.clipboard.writeText('')
                            }
                        } catch {
                            // Clipboard read mungkin diblokir browser — tidak apa-apa
                        }
                    }, 60_000)

                } catch (err: any) {
                    toast.error('Gagal impersonate: ' + err.message)
                } finally {
                    setImpersonateLoading(null)
                }
            }
        })
    }

    const handleDeleteUser = async (userId: string, userName: string) => {
        showConfirm({
            title: '⚠️ Hapus Akun Permanen',
            description: `Akun "${userName}" akan dihapus PERMANEN dan tidak bisa dikembalikan. Yakin melanjutkan?`,
            variant: 'danger',
            confirmText: 'Hapus Permanen',
            onConfirm: async () => {
                closeConfirm()
                setDeleteLoading(userId)
                try {
                    const { data: { session } } = await supabase.auth.getSession()
                    if (!session) throw new Error('No active session')

                    const res = await fetch('/api/admin/delete-user', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`
                        },
                        body: JSON.stringify({ targetUserId: userId })
                    })
                    const data = await res.json()
                    if (!res.ok) throw new Error(data.error)

                    toast.success(`User ${userName} berhasil dihapus permanen.`)
                    router.refresh() // Ganti window.location.reload() dengan router.refresh()
                } catch (err: any) {
                    toast.error('Gagal menghapus user: ' + err.message)
                } finally {
                    setDeleteLoading(null)
                }
            }
        })
    }

    if (authLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy"></div>
            </div>
        )
    }

    if (!hasPrivilegedAccess(currentUserRole)) {
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

                <div className="flex items-center gap-3">
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
                    {currentUserRole !== 'viewer' && (
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-navy text-white rounded-lg text-sm font-bold hover:bg-navy/90 transition-colors"
                        >
                            <UserPlus size={16} />
                            <span className="hidden sm:inline">Tambah</span> Alumni
                        </button>
                    )}
                </div>
            </header>

            {currentUserRole !== 'viewer' && (
                <UserFilters
                    availableGenerations={availableGenerations}
                    filterGeneration={filterGeneration}
                    setFilterGeneration={(v) => { setFilterGeneration(v); setPage(0); }}
                    filterGender={filterGender}
                    setFilterGender={(v) => { setFilterGender(v); setPage(0); }}
                    availableUniversities={availableUniversities}
                    filterUniversity={filterUniversity}
                    setFilterUniversity={(v) => { setFilterUniversity(v); setPage(0); }}
                    availableProvinces={availableProvinces}
                    filterProvince={filterProvince}
                    setFilterProvince={(v) => { setFilterProvince(v); setPage(0); }}
                    onReset={() => { setFilter(''); setFilterGeneration(''); setFilterGender(''); setFilterUniversity(''); setFilterProvince(''); setPage(0); }}
                    activeFilters={Boolean(filter || filterGeneration || filterGender || filterUniversity || filterProvince)}
                />
            )}

            <UserTable
                users={users}
                loading={loading}
                currentUserRole={currentUserRole}
                onRoleChange={handleRoleChange}
                onViewDetail={setSelectedUser}
                onEdit={setEditingUser}
                onImpersonate={handleImpersonate}
                impersonateLoading={impersonateLoading}
                onDelete={handleDeleteUser}
                deleteLoading={deleteLoading}
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
                onChangeEmail={handleChangeEmail}
                changeEmailLoading={changeEmailLoading}
            />

            <CreateAlumniModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={() => {
                    router.refresh() // Ganti window.location.reload()
                }}
                availableGenerations={availableGenerations}
                availableUniversities={availableUniversities}
            />

            {/* ConfirmDialog — menggantikan semua native confirm()/alert()/prompt() */}
            <ConfirmDialog
                isOpen={confirmState.open}
                title={confirmState.title}
                description={confirmState.description}
                variant={confirmState.variant}
                confirmText={confirmState.confirmText}
                onConfirm={confirmState.onConfirm}
                onCancel={closeConfirm}
            />
        </div>
    )
}
