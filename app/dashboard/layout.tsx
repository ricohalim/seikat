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

    // 2. Fetch profile lengkap untuk sidebar (status + display info)
    const { data: profile } = await supabase
        .from('profiles')
        .select('account_status, full_name, photo_url, role, generation')
        .eq('id', user.id)
        .single()

    if (profile?.account_status === 'Pending') {
        redirect('/auth/verification-pending')
    }

    // 3. Render shell dengan data user untuk sidebar
    return (
        <DashboardShell
            userName={profile?.full_name ?? ''}
            userPhoto={profile?.photo_url ?? null}
            userRole={profile?.role ?? 'member'}
            userGeneration={profile?.generation ?? ''}
        >
            {children}
        </DashboardShell>
    )
}
