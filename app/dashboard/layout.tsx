// Server Component — TIDAK ada 'use client'
// Auth guard dijalankan di server sebelum halaman dirender ke browser.
// Ini mencegah flash konten dashboard untuk user berstatus Pending.
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/app/components/DashboardShell'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()

    // 1. Pastikan user sudah login (fallback dari middleware)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/auth/login')

    // 2. Cek account_status — blokir user Pending sebelum render
    const { data: profile } = await supabase
        .from('profiles')
        .select('account_status')
        .eq('id', user.id)
        .single()

    if (profile?.account_status === 'Pending') {
        redirect('/auth/verification-pending')
    }

    // 3. Render shell (Client Component) dengan children sebagai server-rendered content
    return <DashboardShell>{children}</DashboardShell>
}
