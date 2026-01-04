'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus } from 'lucide-react'
import { useAgendas } from '@/app/hooks/useAgendas'
import { calculateProfileCompleteness } from '@/lib/utils'
import { useToast } from '@/app/context/ToastContext'
import { AgendaCard, AgendaCardSkeleton } from '@/app/components/admin/AgendaCard'
import { AgendaFormModal } from '@/app/components/admin/AgendaFormModal'
import { ParticipantsModal } from '@/app/components/admin/ParticipantsModal'
import { StaffModal } from '@/app/components/admin/StaffModal'
import { EventQRModal } from '@/app/components/admin/EventQRModal'

export default function AdminAgendasPage() {
    // 1. Hook for Data
    const { events, loading, fetchEvents, deleteEvent } = useAgendas()
    const { addToast } = useToast()

    // 2. Local UI State
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingEvent, setEditingEvent] = useState<any>(null)

    // Participants State
    const [isParticipantModalOpen, setIsParticipantModalOpen] = useState(false)
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
    const [selectedEventName, setSelectedEventName] = useState('')
    const [participants, setParticipants] = useState<any[]>([])
    const [loadingParticipants, setLoadingParticipants] = useState(false)

    // Staff State
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
    const [staffList, setStaffList] = useState<any[]>([])
    const [loadingStaff, setLoadingStaff] = useState(false)
    const [activeEventId, setActiveEventId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')

    // Role Check
    const [roleLoading, setRoleLoading] = useState(true)
    const [userProfile, setUserProfile] = useState<any>(null)

    // QR Modal State
    const [isQRModalOpen, setIsQRModalOpen] = useState(false)
    const [qrEventId, setQrEventId] = useState('')
    const [qrEventName, setQrEventName] = useState('')

    useEffect(() => {
        const checkRole = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
                const role = profile?.role?.toLowerCase()

                // Allow Admin, Superadmin, AND Korwil
                if (!['admin', 'superadmin', 'korwil'].includes(role)) {
                    addToast("Akses Ditolak: Anda bukan Admin/Korwil.", "error")
                    window.location.href = '/dashboard'
                }
                setUserProfile(profile)
            } catch (error) {
                console.error("Auth check error", error)
            } finally {
                setRoleLoading(false)
            }
        }
        checkRole()
    }, [])

    // --- Actions ---

    const handleSubmit = async (e: React.FormEvent, formData: any) => {
        e.preventDefault()
        try {
            if (editingEvent) {
                const { error } = await supabase.from('events').update(formData).eq('id', editingEvent.id)
                if (error) throw error
            } else {
                const { error } = await supabase.from('events').insert([formData])
                if (error) throw error
            }
            fetchEvents() // Re-fetch to sync
            setIsFormOpen(false)
            setEditingEvent(null)
        } catch (error: any) {
            console.error('Save Error:', error)
            addToast(`Gagal menyimpan agenda: ${error.message}`, "error")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus agenda ini?')) return
        await deleteEvent(id)
    }

    // --- Participants Logic ---
    const viewParticipants = async (eventId: string, eventTitle: string) => {
        setSelectedEventId(eventId)
        setSelectedEventName(eventTitle)
        setLoadingParticipants(true)
        setIsParticipantModalOpen(true)

        // Fetch detailed participant stats including status and cancellation info
        const { data, error } = await supabase
            .from('event_participants')
            .select(`
                *,
                profiles:user_id (*)
            `)
            .eq('event_id', eventId)

        if (error) {
            addToast('Gagal memuat peserta: ' + error.message, 'error')
        } else {
            // Flatten generic data structure for table consumption
            const formatted = data.map((p: any) => ({
                user_id: p.user_id,
                full_name: p.profiles?.full_name,
                email: p.profiles?.email,
                phone: p.profiles?.phone,
                generation: p.profiles?.generation,
                consecutive_absences: p.profiles?.consecutive_absences,
                status: p.status,
                isVerified: calculateProfileCompleteness(p.profiles) >= 90,
                checked_in_at: p.checked_in_at,
                cancellation_reason: p.cancellation_reason,
                cancellation_status: p.cancellation_status
            }))
            setParticipants(formatted)
        }
        setLoadingParticipants(false)
    }

    const handleCheckIn = async (userId: string) => {
        if (!selectedEventId) return
        if (!confirm('Tandai peserta ini sebagai HADIR (Check-in)?')) return

        try {
            const { error } = await supabase.rpc('check_in_participant', {
                p_event_id: selectedEventId,
                p_user_id: userId
            })
            if (error) throw error

            // Refresh local list
            viewParticipants(selectedEventId, selectedEventName)
            addToast('Berhasil Check-in!', 'success')
        } catch (e: any) {
            addToast('Gagal check-in: ' + e.message, 'error')
        }
    }

    const handleApproveCancellation = async (userId: string, approve: boolean) => {
        if (!selectedEventId) return
        if (!confirm(approve ? 'Setujui izin/pembatalan?' : 'Tolak izin ini?')) return

        try {
            const { error } = await supabase.rpc('approve_cancellation', {
                p_event_id: selectedEventId,
                p_user_id: userId,
                p_approve: approve
            })
            if (error) throw error

            // Refresh local list
            viewParticipants(selectedEventId, selectedEventName)
            addToast(approve ? 'Izin disetujui.' : 'Izin ditolak.', 'success')
        } catch (e: any) {
            addToast('Gagal memproses izin: ' + e.message, 'error')
        }
        const handleApproveWaitlist = async (userId: string, approve: boolean) => {
            if (!selectedEventId) return
            if (!confirm(approve ? 'Terima peserta ini dari Waiting List?' : 'Tolak peserta ini?')) return

            try {
                // Update status manually
                const status = approve ? 'Registered' : 'Rejected'
                const { error } = await supabase
                    .from('event_participants')
                    .update({ status: status })
                    .eq('event_id', selectedEventId)
                    .eq('user_id', userId)

                if (error) throw error

                viewParticipants(selectedEventId, selectedEventName)
                addToast(approve ? 'Peserta diterima (Registered).' : 'Peserta ditolak.', 'success')
            } catch (e: any) {
                addToast('Gagal memproses Waiting List: ' + e.message, 'error')
            }
        }

        const handleFinalizeEvent = async (eventId: string) => {
            if (!confirm('PENTING: Aksi ini akan menandai semua peserta "Registered" yang belum Check-in menjadi status "Absent" (Alpha). Sanksi akan dihitung. Lanjutkan?')) return

            try {
                const { data, error } = await supabase.rpc('finalize_event_attendance', {
                    p_event_id: eventId
                })
                if (error) throw error

                addToast(data, 'success') // Shows success message from RPC
                fetchEvents()
            } catch (e: any) {
                addToast('Gagal finalisasi event: ' + e.message, 'error')
            }
        }


        // --- Staff Logic ---
        const handleManageStaff = (event: any) => {
            setActiveEventId(event.id)
            setSelectedEventName(event.title)
            fetchStaff(event.id)
            setIsStaffModalOpen(true)
        }

        const fetchStaff = async (eventId: string) => {
            setLoadingStaff(true)
            const { data, error } = await supabase
                .from('event_staff')
                .select(`*, profiles:user_id (full_name, email)`)
                .eq('event_id', eventId)

            if (error) console.error('Error fetching staff:', error)
            if (data) setStaffList(data)
            setLoadingStaff(false)
        }

        const handleAddStaff = async (e: React.FormEvent, email: string, role: string) => {
            e.preventDefault()
            if (!activeEventId) return

            try {
                const { data: users, error: userError } = await supabase
                    .from('profiles').select('id').ilike('email', email).single()

                if (userError || !users) {
                    addToast('User tidak ditemukan dengan email tersebut.', 'error')
                    return
                }

                const { error: insertError } = await supabase.from('event_staff').insert({
                    event_id: activeEventId,
                    user_id: users.id,
                    role: role
                })

                if (insertError) {
                    if (insertError.code === '23505') addToast('User ini sudah menjadi staff.', 'info')
                    else throw insertError
                    return
                }
                fetchStaff(activeEventId)
            } catch (error: any) {
                addToast('Gagal menambah staff: ' + error.message, 'error')
            }
        }

        const handleRemoveStaff = async (staffId: string) => {
            if (!confirm('Hapus staff ini?')) return
            await supabase.from('event_staff').delete().eq('id', staffId)
            if (activeEventId) fetchStaff(activeEventId)
        }

        const handleShowQR = (id: string, title: string) => {
            setQrEventId(id)
            setQrEventName(title)
            setIsQRModalOpen(true)
        }

        if (roleLoading) return null // Or a generic page loader

        return (
            <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
                {/* Header & Tabs */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-navy">Manajemen Agenda</h1>
                        <p className="text-gray-500 text-sm">Buat dan kelola jadwal kegiatan alumni.</p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${activeTab === 'active' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Aktif
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`px-4 py-1.5 rounded-md text-sm font-bold transition ${activeTab === 'history' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Riwayat
                            </button>
                        </div>
                        <button
                            onClick={() => { setEditingEvent(null); setIsFormOpen(true) }}
                            className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg font-bold hover:bg-navy/90 transition text-sm shadow-md shadow-navy/20 active:scale-95"
                        >
                            <Plus size={16} /> Buat Agenda
                        </button>
                    </div>
                </div>

                {/* Event List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading
                        ? [...Array(6)].map((_, i) => <AgendaCardSkeleton key={i} />)
                        : events.filter(event => {
                            // Logic: History if Date < Today OR Status == Closed
                            const isPast = new Date(event.date_start) < new Date()
                            const isClosed = event.status === 'Closed'
                            return activeTab === 'active' ? (!isPast && !isClosed) : (isPast || isClosed)
                        }).length === 0 ? (
                            <div className="col-span-full py-12 text-center text-gray-400 border-2 border-dashed rounded-xl bg-gray-50/50">
                                {activeTab === 'active' ? 'Tidak ada agenda aktif saat ini.' : 'Belum ada riwayat agenda.'}
                            </div>
                        ) : events.filter(event => {
                            const isPast = new Date(event.date_start) < new Date()
                            const isClosed = event.status === 'Closed'
                            return activeTab === 'active' ? (!isPast && !isClosed) : (isPast || isClosed)
                        }).map((event) => (
                            <AgendaCard
                                key={event.id}
                                event={event}
                                onEdit={(e) => { setEditingEvent(e); setIsFormOpen(true) }}
                                onDelete={handleDelete}
                                onViewParticipants={viewParticipants}
                                onManageStaff={handleManageStaff}
                                onShowQR={handleShowQR}
                                onFinalize={handleFinalizeEvent}
                            />
                        ))
                    }
                </div>

                {/* Modals */}
                <AgendaFormModal
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    onSubmit={handleSubmit}
                    initialData={editingEvent}
                    isEditing={!!editingEvent}
                    currentUser={userProfile}
                />

                <ParticipantsModal
                    isOpen={isParticipantModalOpen}
                    onClose={() => setIsParticipantModalOpen(false)}
                    eventName={selectedEventName}
                    participants={participants}
                    loading={loadingParticipants}
                    onCheckIn={handleCheckIn}
                    onApprove={handleApproveCancellation}
                    onApproveWaitlist={handleApproveWaitlist}
                />

                <StaffModal
                    isOpen={isStaffModalOpen}
                    onClose={() => setIsStaffModalOpen(false)}
                    eventName={selectedEventName}
                    staffList={staffList}
                    loading={loadingStaff}
                    onAddStaff={handleAddStaff}
                    onRemoveStaff={handleRemoveStaff}
                />

                <EventQRModal
                    isOpen={isQRModalOpen}
                    onClose={() => setIsQRModalOpen(false)}
                    eventName={qrEventName}
                    eventId={qrEventId}
                />
            </div>
        )
    }
}
