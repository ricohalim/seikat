'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function selfCheckIn(eventId: string) {
    const supabase = await createClient()

    try {
        // 1. Get User
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, message: 'Unauthenticated' }
        }

        // 2. Check Registration + fetch event date in parallel
        const [
            { data: participant, error: partError },
            { data: event, error: eventError },
        ] = await Promise.all([
            supabase
                .from('event_participants')
                .select('id, status, check_in_time')
                .eq('event_id', eventId)
                .eq('user_id', user.id)
                .single(),
            supabase
                .from('events')
                .select('date_start')
                .eq('id', eventId)
                .single(),
        ])

        if (partError || !participant) {
            return { success: false, message: 'Anda belum terdaftar di event ini.' }
        }

        // 3. Validasi Hari H — hanya boleh check-in pada hari pelaksanaan event
        if (eventError || !event?.date_start) {
            return { success: false, message: 'Data event tidak ditemukan.' }
        }

        const todayWIB = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }) // 'YYYY-MM-DD'
        const eventDay = event.date_start.slice(0, 10) // ambil bagian YYYY-MM-DD saja

        if (todayWIB !== eventDay) {
            const formatter = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: 'Asia/Jakarta' })
            const eventDateFormatted = formatter.format(new Date(eventDay))
            return {
                success: false,
                message: `Check-in hanya bisa dilakukan pada Hari H event.\nEvent ini berlangsung pada ${eventDateFormatted}.`
            }
        }

        // 3. Check Status — blokir semua status yang tidak boleh check-in
        if (participant.status === 'Waiting List') {
            return { success: false, message: 'Status Anda Waiting List (Kena Sanksi).\nHarap lapor ke panitia untuk pemutihan.' }
        }

        if (participant.status === 'Cancelled') {
            return { success: false, message: 'Pendaftaran Anda sudah dibatalkan. Anda tidak dapat check-in.' }
        }

        if (participant.status === 'Permitted') {
            return { success: false, message: 'Anda telah mengajukan izin tidak hadir untuk event ini.' }
        }

        // 4. Check if already checked in
        if (participant.check_in_time) {
            return { success: true, message: 'Anda sudah check-in sebelumnya.', alreadyCheckedIn: true }
        }

        // 4. Perform Check-In (Use RPC to handle sanction reset)
        const { error: rpcError } = await supabase.rpc('check_in_participant', {
            p_event_id: eventId,
            p_user_id: user.id
        })

        if (rpcError) {
            console.error('Self check-in RPC error:', rpcError)
            throw new Error('Gagal memproses check-in.')
        }

        revalidatePath('/dashboard')
        revalidatePath(`/dashboard/events/${eventId}/staff`)
        revalidatePath('/admin/agendas')
        return { success: true, message: 'Check-in Berhasil! Selamat datang.' }

    } catch (error: any) {
        return { success: false, message: error.message || 'Terjadi kesalahan sistem.' }
    }
}
