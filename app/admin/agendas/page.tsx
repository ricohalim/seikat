'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus } from 'lucide-react'
import { useAgendas } from '@/app/hooks/useAgendas'
import { AgendaCard, AgendaCardSkeleton } from '@/app/components/admin/AgendaCard'
import { AgendaFormModal } from '@/app/components/admin/AgendaFormModal'
import { ParticipantsModal } from '@/app/components/admin/ParticipantsModal'
import { StaffModal } from '@/app/components/admin/StaffModal'

export default function AdminAgendasPage() {
    // 1. Hook for Data
    const { events, loading, fetchEvents, deleteEvent } = useAgendas()

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

    // Role Check
    const [roleLoading, setRoleLoading] = useState(true)

    useEffect(() => {
        const checkRole = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return

                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
                const role = profile?.role?.toLowerCase()

                if (role !== 'admin' && role !== 'superadmin') {
                    alert("Akses Ditolak: Anda bukan Admin.")
                    window.location.href = '/dashboard'
                }
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
            alert(`Gagal menyimpan agenda: ${error.message}`)
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
                profiles:user_id (full_name, email, phone, generation, consecutive_absences)
            `)
            .eq('event_id', eventId)

        if (error) {
            alert('Gagal memuat peserta: ' + error.message)
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
            alert('Berhasil Check-in!')
        } catch (e: any) {
            alert('Gagal check-in: ' + e.message)
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
            alert(approve ? 'Izin disetujui.' : 'Izin ditolak.')
        } catch (e: any) {
            alert('Gagal memproses izin: ' + e.message)
        }
    }

    const handleFinalizeEvent = async (eventId: string) => {
        if (!confirm('PENTING: Aksi ini akan menandai semua peserta "Registered" yang belum Check-in menjadi status "Absent" (Alpha). Sanksi akan dihitung. Lanjutkan?')) return

        try {
            const { data, error } = await supabase.rpc('finalize_event_attendance', {
                p_event_id: eventId
            })
            if (error) throw error

            alert(data) // Shows success message from RPC
            fetchEvents()
        } catch (e: any) {
            alert('Gagal finalisasi event: ' + e.message)
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
                alert('User tidak ditemukan dengan email tersebut.')
                return
            }

            const { error: insertError } = await supabase.from('event_staff').insert({
                event_id: activeEventId,
                user_id: users.id,
                role: role
            })

            if (insertError) {
                if (insertError.code === '23505') alert('User ini sudah menjadi staff.')
                else throw insertError
                return
            }
            fetchStaff(activeEventId)
        } catch (error: any) {
            alert('Gagal menambah staff: ' + error.message)
        }
    }

    const handleRemoveStaff = async (staffId: string) => {
        if (!confirm('Hapus staff ini?')) return
        await supabase.from('event_staff').delete().eq('id', staffId)
        if (activeEventId) fetchStaff(activeEventId)
    }

    if (roleLoading) return null // Or a generic page loader

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-navy">Manajemen Agenda</h1>
                    <p className="text-gray-500 text-sm">Buat dan kelola jadwal kegiatan alumni.</p>
                </div>
                <button
                    onClick={() => { setEditingEvent(null); setIsFormOpen(true) }}
                    className="flex items-center gap-2 bg-navy text-white px-4 py-2 rounded-lg font-bold hover:bg-navy/90 transition text-sm shadow-md shadow-navy/20 active:scale-95"
                >
                    <Plus size={16} /> Buat Agenda
                </button>
            </header>

            {/* Event List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading
                    ? [...Array(6)].map((_, i) => <AgendaCardSkeleton key={i} />)
                    : events.map((event) => (
                        <AgendaCard
                            key={event.id}
                            event={event}
                            onEdit={(e) => { setEditingEvent(e); setIsFormOpen(true) }}
                            onDelete={handleDelete}
                            onViewParticipants={viewParticipants}
                            onManageStaff={handleManageStaff}
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
            />

            <ParticipantsModal
                isOpen={isParticipantModalOpen}
                onClose={() => setIsParticipantModalOpen(false)}
                eventName={selectedEventName}
                participants={participants}
                loading={loadingParticipants}
                onCheckIn={handleCheckIn}
                onApprove={handleApproveCancellation}
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
        </div>
    )
}
