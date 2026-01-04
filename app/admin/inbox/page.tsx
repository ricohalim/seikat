'use client'

import { useState, useEffect } from 'react'
import { getInboxMessages, createBroadcastMessage, deleteMessage, archiveMessage, unarchiveMessage, updateMessage } from '@/app/actions/inbox'
import { Trash2, Plus, Send, Megaphone, Loader2, X, Archive, Calendar as CalendarIcon, Clock, RefreshCcw, Pencil, Save } from 'lucide-react'
import { useToast } from '@/app/context/ToastContext'

import { Switch } from '@/app/components/ui/Switch'
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/app/components/ui/button"
import { Calendar } from "@/app/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover"

export default function AdminInboxPage() {
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [showArchived, setShowArchived] = useState(false)

    // Edit State
    const [isEditing, setIsEditing] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)

    // Form
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [isUnlimited, setIsUnlimited] = useState(true)
    const [deadline, setDeadline] = useState<Date>()
    const [status, setStatus] = useState<'draft' | 'published'>('published')

    const fetchMessages = async () => {
        setLoading(true)
        const res = await getInboxMessages(50, showArchived)
        setMessages(res || [])
        setLoading(false)
    }

    useEffect(() => {
        fetchMessages()
    }, [showArchived])

    const resetForm = () => {
        setIsCreating(false)
        setIsEditing(false)
        setEditId(null)
        setTitle('')
        setContent('')
        setIsUnlimited(true)
        setDeadline(undefined)
        setStatus('published') // Reset status as well
    }

    const openCreate = () => {
        resetForm()
        setIsCreating(true)
    }

    const openEdit = (msg: any) => {
        setEditId(msg.id)
        setTitle(msg.title)
        setContent(msg.content)
        setStatus((msg.status as 'draft' | 'published') || 'published')

        if (msg.expires_at) {
            setIsUnlimited(false)
            setDeadline(new Date(msg.expires_at))
        } else {
            setIsUnlimited(true)
            setDeadline(undefined)
        }

        setIsCreating(true) // Re-use the create modal/form
        setIsEditing(true)
    }

    const { addToast } = useToast()

    const handleSubmit = async (e: React.FormEvent, submitStatus: 'draft' | 'published' = 'published') => {
        e.preventDefault()
        if (!title || !content) return addToast('Mohon isi judul dan konten', 'error')

        const expiry = isUnlimited ? null : deadline
        if (!isUnlimited && !deadline && submitStatus === 'published') return addToast('Mohon isi tanggal deadline', 'error')

        setSubmitting(true)

        try {
            let res;
            if (isEditing && editId) {
                res = await updateMessage(editId, title, content, expiry || null, submitStatus)
            } else {
                res = await createBroadcastMessage(title, content, expiry || null, submitStatus)
            }

            if (res.error) {
                addToast('Gagal menyimpan pesan', 'error')
            } else {
                addToast(submitStatus === 'draft' ? 'Disimpan sebagai Draft' : 'Berhasil dipublikasikan!', 'success')
                resetForm()
                fetchMessages()
            }
        } catch (error) {
            console.error(error)
            addToast('Terjadi kesalahan', 'error')
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah anda yakin ingin menghapus pesan ini permanen?')) return

        const res = await deleteMessage(id)
        if (res.error) {
            alert('Gagal menghapus pesan')
        } else {
            fetchMessages()
        }
    }

    const handleArchive = async (id: string) => {
        // if (!confirm('Arsipkan pesan ini?')) return
        const res = await archiveMessage(id)
        if (res.error) alert('Gagal mengarsipkan')
        else fetchMessages()
    }

    const handleUnarchive = async (id: string) => {
        const res = await unarchiveMessage(id)
        if (res.error) alert('Gagal memulihkan')
        else fetchMessages()
    }

    // Helper for badge color
    const getStatusColor = (s: string) => {
        if (s === 'draft') return 'bg-gray-200 text-gray-700'
        return 'bg-green-100 text-green-700'
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Inbox Broadcast</h1>
                    <p className="text-gray-500">Kirim pengumuman ke seluruh member</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition border ${showArchived ? 'bg-gray-200 text-gray-800 border-gray-300' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                        <Archive size={18} /> {showArchived ? 'Lihat Aktif' : 'Lihat Arsip'}
                    </button>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg hover:bg-navy/90 transition shadow-sm"
                    >
                        <Plus size={18} /> Buat Pengumuman
                    </button>
                </div>
            </div>

            {/* FORM (Create / Edit) */}
            {isCreating && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            {isEditing ? <Pencil size={18} className="text-navy" /> : <Send size={18} className="text-navy" />}
                            {isEditing ? 'Edit Pengumuman' : 'Buat Pesan Baru'}
                        </h3>
                        <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={(e) => handleSubmit(e, status)} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20"
                                placeholder="Contoh: Undangan Reuni Akbar"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Isi Pesan</label>
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 h-32"
                                placeholder="Tulis pesan anda disini..."
                            />
                        </div>

                        {/* DEADLINE / UNLIMITED */}
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Masa Berlaku Pengumuman</label>

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <Switch
                                            checked={!isUnlimited}
                                            onCheckedChange={(checked) => setIsUnlimited(!checked)}
                                        />
                                        <span className="text-sm text-gray-700 font-medium">
                                            {isUnlimited ? 'Berlaku Selamanya (Unlimited)' : 'Ada Batas Waktu'}
                                        </span>
                                    </label>
                                </div>

                                {!isUnlimited && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <label className="text-xs text-gray-500 mb-1 block">Pilih Tanggal Berakhir</label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-[240px] justify-start text-left font-normal",
                                                        !deadline && "text-muted-foreground"
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={deadline}
                                                    onSelect={(date) => {
                                                        if (date) {
                                                            // Set to end of day 23:59:59
                                                            const endOfDay = new Date(date)
                                                            endOfDay.setHours(23, 59, 59, 999)
                                                            setDeadline(endOfDay)
                                                        } else {
                                                            setDeadline(undefined)
                                                        }
                                                    }}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <p className="text-xs text-gray-400 mt-1">*Pesan akan otomatis diarsipkan setelah tanggal ini</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                            >
                                Batal
                            </button>

                            {/* Save as Draft Button */}
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={(e) => handleSubmit(e, 'draft')}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300 transition disabled:opacity-70"
                            >
                                Simpan Draft
                            </button>

                            {/* Publish Button */}
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={(e) => handleSubmit(e, 'published')}
                                className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-bold hover:bg-navy/90 flex items-center gap-2 transition disabled:opacity-70"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={16} /> : (isEditing ? <Save size={18} /> : <Send size={18} />)}
                                {isEditing ? 'Update & Publish' : 'Kirim Broadcast'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* LIST */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className={`p-4 border-b border-gray-100 flex items-center gap-2 text-sm font-medium ${showArchived ? 'bg-gray-100 text-gray-600' : 'bg-blue-50/50 text-blue-600'}`}>
                    {showArchived ? <Archive size={16} /> : <Megaphone size={16} />}
                    {showArchived ? 'Arsip Pengumuman (Sudah Selesai)' : 'Pengumuman Aktif'}
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                        <Loader2 className="animate-spin mb-2" />
                        Memuat data...
                    </div>
                ) : messages.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        {showArchived ? 'Belum ada arsip.' : 'Belum ada pengumuman aktif.'}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`p-4 transition group ${showArchived ? 'bg-gray-50/50' : 'hover:bg-gray-50'}`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h4 className="font-bold text-gray-900">{msg.title}</h4>
                                            {msg.expires_at && (
                                                <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${new Date(msg.expires_at) < new Date()
                                                    ? 'bg-red-50 text-red-600 border-red-100'
                                                    : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                                    }`}>
                                                    <Clock size={10} />
                                                    {new Date(msg.expires_at) < new Date() ? 'Expired' : `Ends: ${new Date(msg.expires_at).toLocaleDateString('id-ID')}`}
                                                </span>
                                            )}
                                            {!msg.expires_at && (
                                                <span className="text-xs px-2 py-0.5 bg-green-50 text-green-600 rounded-full border border-green-100">Unlimited</span>
                                            )}

                                            <span className="text-xs text-gray-400">
                                                {new Date(msg.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <p className="text-gray-600 text-sm whitespace-pre-wrap">{msg.content}</p>
                                        <p className="text-xs text-gray-400 mt-2">
                                            Oleh: <span className="font-medium text-gray-600">{msg.profiles?.full_name || 'Unknown'}</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                                        <button
                                            onClick={() => openEdit(msg)}
                                            className="text-gray-500 hover:text-blue-600 p-2 transition"
                                            title="Edit Pesan"
                                        >
                                            <Pencil size={18} />
                                        </button>

                                        {showArchived ? (
                                            <button
                                                onClick={() => handleUnarchive(msg.id)}
                                                className="text-gray-500 hover:text-blue-600 p-2 transition"
                                                title="Pulihkan (Unarchive)"
                                            >
                                                <RefreshCcw size={18} />
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleArchive(msg.id)}
                                                className="text-gray-500 hover:text-orange-500 p-2 transition"
                                                title="Arsipkan"
                                            >
                                                <Archive size={18} />
                                            </button>
                                        )}

                                        <button
                                            onClick={() => handleDelete(msg.id)}
                                            className="text-gray-500 hover:text-red-500 p-2 transition"
                                            title="Hapus Permanen"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
