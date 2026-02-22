import { createClient } from '@/lib/supabase/server'
import AdminSidebarClient from './AdminSidebarClient'

// Layout ini sekarang Server Component.
// Middleware sudah menjamin hanya admin/superadmin/korwil yang bisa masuk.
// Kita cukup fetch nama & role untuk ditampilkan di sidebar.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch profile (middleware sudah jamin user ada & punya role admin)
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role, email')
        .eq('id', user!.id)
        .single()

    return (
        <div className="min-h-screen bg-gray-100 font-sans flex relative overflow-hidden">
            <AdminSidebarClient
                userEmail={user?.email ?? ''}
                userName={profile?.full_name ?? ''}
                userRole={profile?.role ?? ''}
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 relative z-10">
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
