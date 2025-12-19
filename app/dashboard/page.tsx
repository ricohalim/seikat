import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OverviewClient from './overview-client'

export default async function DashboardPage() {
    const supabase = await createClient()

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/auth/login')
    }

    // 2. Fetch Profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (!profile) {
        return <div className="p-8 text-center text-red-500">Error: Profil user tidak ditemukan di database.</div>
    }

    // Add email from auth to profile object
    const fullProfile = {
        ...profile,
        email: user.email
    }

    // 3. Render Client View (No spinner!)
    return <OverviewClient profile={fullProfile} />
}
