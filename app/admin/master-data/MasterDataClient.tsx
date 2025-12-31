'use client'

import { useState } from 'react'
import { Plus, Search, Edit2, Trash2, X, Check, Loader2 } from 'lucide-react'
import { addUniversity, updateUniversity, deleteUniversity } from '@/app/actions/university'
import { useToast } from '@/app/context/ToastContext'

interface University {
    id: number
    name: string
    is_active: boolean
    created_at: string
}

export default function MasterDataClient({ initialData }: { initialData: University[] }) {
    const [universities, setUniversities] = useState(initialData)
    const [search, setSearch] = useState('')
    const { addToast } = useToast()

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingId, setEditingId] = useState<number | null>(null)
    const [formName, setFormName] = useState('')
    const [loading, setLoading] = useState(false)

    // Filter
    const filtereddata = universities.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase())
    )

    const handleOpenAdd = () => {
        setEditingId(null)
        setFormName('')
        setIsModalOpen(true)
    }

    const handleOpenEdit = (u: University) => {
        setEditingId(u.id)
        setFormName(u.name)
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (editingId) {
                // Update
                const res = await updateUniversity(editingId, formName)
                if (res.error) {
                    addToast(res.error, 'error')
                } else {
                    addToast('Universitas berhasil diupdate', 'success')
                    setIsModalOpen(false)
                    // Optimistic update
                    setUniversities(prev => prev.map(u => u.id === editingId ? { ...u, name: formName.toUpperCase() } : u))
                }
            } else {
                // Add
                const res = await addUniversity(formName)
                if (res.error) {
                    addToast(res.error, 'error')
                } else {
                    addToast('Universitas berhasil ditambahkan', 'success')
                    setIsModalOpen(false)
                    // Optimistic update would require ID, but we revalidatePath so page might refresh. 
                    // However server actions revalidatePath refreshes the Server Component, 
                    // but we need to trigger a router refresh to see it in Client Component or rely on router.refresh()
                    // Let's rely on simple state for now, but real re-fetch usually needs router.refresh() 
                    // Since we don't have router here yet, let's just close modal. 
                    // Ideally we should inject router but let's assume page reload or we accept optimistic slightly off until refresh.
                    window.location.reload()
                }
            }
        } catch (error) {
            addToast('Terjadi kesalahan', 'error')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Yakin ingin menghapus universitas ini?')) return

        const res = await deleteUniversity(id)
        if (res.error) {
            addToast(res.error, 'error')
        } else {
            addToast('Universitas dihapus', 'success')
            setUniversities(prev => prev.filter(u => u.id !== id))
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari Universitas..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy/20"
                    />
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="bg-navy text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-navy/90 transition shadow-lg shadow-navy/20 whitespace-nowrap"
                >
                    <Plus size={18} /> Tambah Universitas
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="max-h-[70vh] overflow-y-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Nama Universitas</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtereddata.map(uni => (
                                <tr key={uni.id} className="hover:bg-gray-50/50 transition">
                                    <td className="p-4 text-sm font-medium text-navy">{uni.name}</td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => handleOpenEdit(uni)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(uni.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                            title="Hapus"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtereddata.length === 0 && (
                                <tr>
                                    <td colSpan={2} className="p-8 text-center text-gray-400 text-sm">
                                        Tidak ada data universitas ditemukan
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-navy">
                                {editingId ? 'Edit Universitas' : 'Tambah Universitas'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nama Universitas</label>
                                <input
                                    type="text"
                                    required
                                    value={formName}
                                    onChange={e => setFormName(e.target.value.toUpperCase())}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:border-navy focus:ring-1 focus:ring-navy outline-none uppercase"
                                    placeholder="JURUSAN TEKNIK..."
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition text-sm"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading || !formName.trim()}
                                    className="px-6 py-2.5 rounded-xl font-bold bg-navy text-white hover:bg-navy/90 transition shadow-lg shadow-navy/20 text-sm flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                                    Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
