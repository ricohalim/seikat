import { getUniversities } from '@/app/actions/university'
import MasterDataClient from './MasterDataClient'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function MasterDataPage() {
    // 1. Check Super Admin Role
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/auth/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || profile.role !== 'superadmin') {
        redirect('/admin')
    }

    // 2. Fetch Data
    const universities = await getUniversities()

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-navy">Master Data Universitas</h1>
                    <p className="text-gray-500 text-sm">Kelola daftar universitas untuk form registrasi.</p>
                </div>
            </div>

            <MasterDataClient initialData={universities || []} />
        </div>
    )
}
