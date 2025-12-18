'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { LayoutDashboard, Users, UserCheck, LogOut, ShieldAlert, Menu, Calendar, Clock } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                router.replace('/auth/login')
                return
            }

            // Check Role
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single()

            if (error || !profileData || !['admin', 'superadmin'].includes(profileData.role)) {
                // Not authorized
                router.replace('/dashboard') // Send back to member dashboard
                return
            }

            setUser(session.user)
            setProfile(profileData)
            setLoading(false)
        }

        checkAdmin()
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin w-8 h-8 border-4 border-navy border-t-transparent rounded-full"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans flex relative overflow-hidden">

            {/* WATERMARK OVERLAY - ANTI LEAK */}
            <div className="fixed inset-0 pointer-events-none z-[9999] flex flex-wrap content-start items-start opacity-[0.03] overflow-hidden select-none"
                style={{ transform: 'rotate(-15deg) scale(1.5)' }}>
                {Array.from({ length: 100 }).map((_, i) => (
                    <div key={i} className="p-8 text-xl font-bold text-gray-900 whitespace-nowrap">
                        {user?.email} • {profile?.role} • DO NOT SHARE
                    </div>
                ))}
            </div>

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-navy text-white transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative shadow-xl flex flex-col`}>
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Admin Portal</h1>
                        <p className="text-xs text-white/50">IKADBP Management</p>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/70 hover:text-white">
                        <span className="text-2xl">×</span>
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition text-sm font-medium">
                        <LayoutDashboard size={18} /> Dashboard
                    </Link>
                    <Link href="/admin/verify" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition text-sm font-medium">
                        <UserCheck size={18} /> Verifikasi Member
                    </Link>
                    <Link href="/admin/agendas" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition text-sm font-medium">
                        <Calendar size={18} /> Agenda
                    </Link>
                    {profile?.role === 'superadmin' && (
                        <>
                            <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition text-sm font-medium opacity-75 hover:opacity-100">
                                <Users size={18} /> User Management
                            </Link>
                            <Link href="/admin/logs" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition text-sm font-medium opacity-75 hover:opacity-100">
                                <Clock size={18} /> Activity Logs
                            </Link>
                        </>
                    )}
                    <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition text-sm font-medium mt-auto text-blue-200 hover:text-white">
                        <LogOut size={18} className="rotate-180" /> Kembali ke App
                    </Link>
                </nav>

                <div className="p-4 border-t border-white/10 bg-black/20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">
                            {profile?.full_name?.charAt(0) || 'A'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">{profile?.full_name}</p>
                            <p className="text-xs text-white/50 truncate capitalize">{profile?.role}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => supabase.auth.signOut().then(() => router.replace('/auth/login'))}
                        className="w-full flex items-center justify-center gap-2 bg-red-500/20 text-red-200 py-2 rounded-lg hover:bg-red-500/30 transition text-xs font-bold"
                    >
                        <LogOut size={14} /> Keluar
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 relative z-10">
                {/* Mobile Header */}
                <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                    <button onClick={() => setSidebarOpen(true)} className="text-navy">
                        <Menu size={24} />
                    </button>
                    <span className="font-bold text-navy">Admin Portal</span>
                    <div className="w-6" /> {/* Spacer */}
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
