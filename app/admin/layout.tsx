import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminSidebarClient from './AdminSidebarClient'
import { AdminBreadcrumb } from '@/app/components/admin/AdminBreadcrumb'
import { hasPrivilegedAccess } from '@/lib/roles'

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

    // Proteksi: hanya role privileged (superadmin, admin, korwil, viewer) yang boleh masuk
    // Menggunakan inclusion-based check agar role baru tidak otomatis dapat akses
    if (!profile || !hasPrivilegedAccess(profile.role)) {
        redirect('/dashboard')
    }

    return (
        <div className="h-screen bg-gray-50 font-sans flex overflow-hidden">
            <AdminSidebarClient
                userEmail={user?.email ?? ''}
                userName={profile?.full_name ?? ''}
                userRole={profile?.role ?? ''}
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-hidden md:pt-0 pt-14">
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {/* Breadcrumb otomatis untuk semua halaman admin */}
                    <AdminBreadcrumb />
                    {children}
                </div>
            </main>
        </div>
    )
}
