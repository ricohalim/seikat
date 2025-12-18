'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, MapPin, Plus, Trash2, Edit2, Users, X, Check, Save } from 'lucide-react'

export default function AdminAgendasPage() {
    const [events, setEvents] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false)

    // Form State
    const [editingId, setEditingId] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date_start: '',
        location: '',
        status: 'Open'
    })

    // Participant State
    const [selectedEventName, setSelectedEventName] = useState('')
    const [participants, setParticipants] = useState<any[]>([])
    const [loadingParticipants, setLoadingParticipants] = useState(false)

    // Role Check
    const [isAdmin, setIsAdmin] = useState(false)
    const [roleLoading, setRoleLoading] = useState(true)

    const fetchEvents = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('events')
            .select(`
                *,
                participants:event_participants(count)
            `)
            .order('date_start', { ascending: false })

        if (error) {
            console.error('Error fetching events:', error)
        }

        if (data) {
            setEvents(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        const checkRoleAndFetch = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

                const role = profile?.role?.toLowerCase()
                if (role === 'admin' || role === 'superadmin') {
                    setIsAdmin(true)
                    fetchEvents() // Only fetch if admin
                } else {
                    alert("Akses Ditolak: Anda bukan Admin.")
                    window.location.href = '/dashboard' // Simple redirect
                }
            } catch (error) {
                console.error("Auth check error", error)
            } finally {
                setRoleLoading(false)
            }
        }
        checkRoleAndFetch()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!confirm('Simpan agenda ini?')) return

        try {
            if (editingId) {
                const { error } = await supabase.from('events').update(formData).eq('id', editingId)
                if (error) throw error
            } else {
                const { error } = await supabase.from('events').insert([formData])
                if (error) throw error
            }
            fetchEvents()
            setIsModalOpen(false)
            resetForm()
        } catch (error: any) {
            console.error('Save Error:', error)
            alert(`Gagal menyimpan agenda: ${error.message || 'Unknown error'}`)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus agenda ini?')) return
        await supabase.from('events').delete().eq('id', id)
        fetchEvents()
    }

    const handleEdit = (event: any) => {
        setEditingId(event.id)
        setFormData({
            title: event.title,
            description: event.description,
            date_start: event.date_start ? new Date(event.date_start).toISOString().slice(0, 16) : '',
            location: event.location,
            status: event.status
        })
        setIsModalOpen(true)
    }

    const resetForm = () => {
        setEditingId(null)
        setFormData({
            title: '',
            description: '',
            date_start: '',
            location: '',
            status: 'Open'
        })
    }

    const viewParticipants = async (eventId: string, eventTitle: string) => {
        setSelectedEventName(eventTitle)
        setLoadingParticipants(true)
        setIsParticipantModalOpen(true)

        const { data, error } = await supabase.rpc('get_event_participants', {
            target_event_id: eventId
        })

        if (error) {
            console.error('Error fetching participants:', error)
            alert('Gagal memuat peserta: ' + error.message)
        }

        if (data) {
            setParticipants(data)
        }
        setLoadingParticipants(false)
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-navy">Manajemen Agenda</h1>
                    <p className="text-gray-500 text-sm">Buat dan kelola jadwal kegiatan alumni.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true) }}
                    className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg font-bold hover:bg-navy/90 transition text-sm"
                >
                    <Plus size={16} /> Buat Agenda
                </button>
            </header>

            {/* Event List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map((event) => (
                    <div key={event.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col group">
                        <div className={`h-2 ${event.status === 'Open' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-navy text-lg line-clamp-1" title={event.title}>{event.title}</h3>
                                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${event.status === 'Open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {event.status}
                                </span>
                            </div>
                            <p className="text-gray-500 text-xs mb-4 line-clamp-2 min-h-[2.5em]">{event.description}</p>

                            <div className="space-y-2 text-sm text-gray-600 mb-6">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-navy" />
                                    <span>{event.date_start ? new Date(event.date_start).toLocaleString('id-ID') : '-'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin size={14} className="text-navy" />
                                    <span>{event.location || 'Online'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={14} className="text-navy" />
                                    <span>{event.participants?.[0]?.count || 0} Terdaftar</span>
                                </div>
                            </div>

                            <div className="mt-auto flex gap-2 pt-4 border-t border-gray-50">
                                <button
                                    onClick={() => handleEdit(event)}
                                    className="flex-1 flex items-center justify-center gap-1 bg-gray-50 hover:bg-gray-100 text-navy py-2 rounded text-xs font-bold transition"
                                >
                                    <Edit2 size={14} /> Edit
                                </button>
                                <button
                                    onClick={() => viewParticipants(event.id, event.title)}
                                    className="flex-1 flex items-center justify-center gap-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded text-xs font-bold transition"
                                >
                                    <Users size={14} /> Peserta
                                </button>
                                <button
                                    onClick={() => handleDelete(event.id)}
                                    className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-navy">{editingId ? 'Edit Agenda' : 'Buat Agenda Baru'}</h3>
                            <button onClick={() => setIsModalOpen(false)}><X className="text-gray-400 hover:text-red-500" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Judul Agenda</label>
                                <input
                                    required
                                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy/20 outline-none"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Deskripsi</label>
                                <textarea
                                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy/20 outline-none h-24"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal & Waktu</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy/20 outline-none"
                                        value={formData.date_start}
                                        onChange={e => setFormData({ ...formData, date_start: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lokasi</label>
                                    <input
                                        className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy/20 outline-none"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                                <select
                                    className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy/20 outline-none"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Open">Open (Dibuka)</option>
                                    <option value="Closed">Closed (Ditutup)</option>
                                    <option value="Draft">Draft (Disembunyikan)</option>
                                </select>
                            </div>
                            <div className="pt-4 flex justify-end gap-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-bold">Batal</button>
                                <button type="submit" className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-bold hover:bg-navy/90 flex items-center gap-2">
                                    <Save size={16} /> Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Participants Modal */}
            {isParticipantModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <div>
                                <h3 className="text-lg font-bold text-navy">Daftar Peserta</h3>
                                <p className="text-gray-500 text-xs">{selectedEventName}</p>
                            </div>
                            <button onClick={() => setIsParticipantModalOpen(false)}><X className="text-gray-400 hover:text-red-500" /></button>
                        </div>
                        <div className="p-0 overflow-y-auto flex-1">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 uppercase text-xs sticky top-0">
                                    <tr>
                                        <th className="p-4 font-bold">Nama</th>
                                        <th className="p-4 font-bold">Email</th>
                                        <th className="p-4 font-bold">Angkatan</th>
                                        <th className="p-4 font-bold">No. HP</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loadingParticipants ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading...</td></tr>
                                    ) : participants.length === 0 ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-gray-400">Belum ada peserta terdaftar.</td></tr>
                                    ) : participants.map((p, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="p-4 font-bold text-navy">{p.full_name}</td>
                                            <td className="p-4 text-gray-600 font-mono text-xs">{p.email}</td>
                                            <td className="p-4 text-gray-600">Beswan {p.generation}</td>
                                            <td className="p-4 text-gray-600">{p.phone || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 border-t bg-gray-50 rounded-b-2xl text-right">
                            <button
                                onClick={() => {
                                    const csvContent = "data:text/csv;charset=utf-8,"
                                        + "Nama,Email,Angkatan,No HP\n"
                                        + participants.map(p => `"${p.full_name}","${p.email}","${p.generation}","${p.phone}"`).join("\n");
                                    const encodedUri = encodeURI(csvContent);
                                    const link = document.createElement("a");
                                    link.setAttribute("href", encodedUri);
                                    link.setAttribute("download", `peserta_${selectedEventName.replace(/\s+/g, '_')}.csv`);
                                    document.body.appendChild(link);
                                    link.click();
                                }}
                                disabled={participants.length === 0}
                                className="text-xs font-bold text-navy hover:underline disabled:opacity-50"
                            >
                                Download CSV
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
