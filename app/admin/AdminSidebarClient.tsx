'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { LayoutDashboard, Users, UserCheck, LogOut, ShieldAlert, Menu, Calendar, Clock, Inbox, Activity } from 'lucide-react'

interface AdminSidebarClientProps {
    userEmail: string
    userName: string
    userRole: string
}

export default function AdminSidebarClient({ userEmail, userName, userRole }: AdminSidebarClientProps) {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const router = useRouter()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.replace('/')
    }

    return (
        <>
            {/* WATERMARK OVERLAY - ANTI LEAK */}
            <div
                className="fixed inset-0 pointer-events-none z-[9999] flex flex-wrap content-start items-start opacity-[0.03] overflow-hidden select-none"
                style={{ transform: 'rotate(-15deg) scale(1.5)' }}
            >
                {Array.from({ length: 100 }).map((_, i) => (
                    <div key={i} className="p-8 text-xl font-bold text-gray-900 whitespace-nowrap">
                        {userEmail} • {userRole} • DO NOT SHARE
                    </div>
                ))}
            </div>

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <button onClick={() => setSidebarOpen(true)} className="text-navy">
                    <Menu size={24} />
                </button>
                <span className="font-bold text-navy">Admin Portal</span>
                <div className="w-6" />
            </div>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 z-20 bg-black/40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-30 w-64 bg-navy text-white transition-transform duration-300 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative shadow-xl flex flex-col`}
            >
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Admin Portal</h1>
                        <p className="text-xs text-white/50">IKADBP Management</p>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="md:hidden text-white/70 hover:text-white"
                    >
                        <span className="text-2xl">×</span>
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {userRole !== 'korwil' && (
                        <Link
                            href="/admin"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition text-sm font-medium"
                        >
                            <LayoutDashboard size={18} /> Dashboard
                        </Link>
                    )}
                    {userRole !== 'korwil' && (
                        <Link
                            href="/admin/verify"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition text-sm font-medium"
                        >
                            <UserCheck size={18} /> Verifikasi Member
                        </Link>
                    )}
                    <Link
                        href="/admin/agendas"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition text-sm font-medium"
                    >
                        <Calendar size={18} /> Agenda
                    </Link>
                    <Link
                        href="/admin/live-events"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition text-sm font-medium"
                    >
                        <Activity size={18} /> Live Events
                    </Link>
                    {userRole !== 'korwil' && (
                        <Link
                            href="/admin/inbox"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition text-sm font-medium"
                        >
                            <Inbox size={18} /> Inbox Broadcast
                        </Link>
                    )}
                    {userRole === 'superadmin' && (
                        <>
                            <Link
                                href="/admin/users"
                                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition text-sm font-medium opacity-75 hover:opacity-100"
                            >
                                <Users size={18} /> User Management
                            </Link>
                            <Link
                                href="/admin/master-data"
                                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition text-sm font-medium opacity-75 hover:opacity-100"
                            >
                                <ShieldAlert size={18} /> Master Data
                            </Link>
                            <Link
                                href="/admin/logs"
                                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition text-sm font-medium opacity-75 hover:opacity-100"
                            >
                                <Clock size={18} /> Activity Logs
                            </Link>
                        </>
                    )}
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition text-sm font-medium mt-auto text-blue-200 hover:text-white"
                    >
                        <LogOut size={18} className="rotate-180" /> Kembali ke App
                    </Link>
                </nav>

                <div className="p-4 border-t border-white/10 bg-black/20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                            {userName?.charAt(0) || 'A'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate">{userName}</p>
                            <p className="text-xs text-white/50 truncate capitalize">{userRole}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="w-full flex items-center justify-center gap-2 bg-red-500/20 text-red-200 py-2 rounded-lg hover:bg-red-500/30 transition text-xs font-bold"
                    >
                        <LogOut size={14} /> Keluar
                    </button>
                </div>
            </aside>
        </>
    )
}
