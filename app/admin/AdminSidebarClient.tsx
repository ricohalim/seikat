'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import { clsx } from 'clsx'
import {
    LayoutDashboard, Users, UserCheck, LogOut, ShieldAlert,
    Menu, Calendar, Clock, Inbox, Activity, X, ChevronRight
} from 'lucide-react'

interface AdminSidebarClientProps {
    userEmail: string
    userName: string
    userRole: string
}

const menuGroups = [
    {
        label: 'Overview',
        items: [
            { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, roles: ['superadmin', 'admin'] },
            { name: 'Verifikasi Member', href: '/admin/verify', icon: UserCheck, roles: ['superadmin', 'admin'] },
        ]
    },
    {
        label: 'Konten',
        items: [
            { name: 'Agenda', href: '/admin/agendas', icon: Calendar, roles: ['superadmin', 'admin', 'korwil'] },
            { name: 'Live Events', href: '/admin/live-events', icon: Activity, roles: ['superadmin', 'admin', 'korwil'] },
            { name: 'Inbox Broadcast', href: '/admin/inbox', icon: Inbox, roles: ['superadmin', 'admin'] },
        ]
    },
    {
        label: 'Manajemen',
        items: [
            { name: 'User Management', href: '/admin/users', icon: Users, roles: ['superadmin', 'admin', 'viewer'] },
            { name: 'Master Data', href: '/admin/master-data', icon: ShieldAlert, roles: ['superadmin'] },
            { name: 'Activity Logs', href: '/admin/logs', icon: Clock, roles: ['superadmin'] },
        ]
    },
]

export default function AdminSidebarClient({ userEmail, userName, userRole }: AdminSidebarClientProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const pathname = usePathname()
    const router = useRouter()

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.replace('/')
    }

    const initials = userName?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'A'

    return (
        <>
            {/* WATERMARK OVERLAY */}
            <div
                className="fixed inset-0 pointer-events-none z-[9999] flex flex-wrap content-start items-start opacity-[0.025] overflow-hidden select-none"
                style={{ transform: 'rotate(-15deg) scale(1.5)' }}
            >
                {Array.from({ length: 80 }).map((_, i) => (
                    <div key={i} className="p-8 text-sm font-bold text-gray-900 whitespace-nowrap">
                        {userEmail} · {userRole} · CONFIDENTIAL
                    </div>
                ))}
            </div>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0f1e38] border-b border-white/10 px-4 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-orange/90 flex items-center justify-center">
                        <span className="text-white font-black text-[10px]">A</span>
                    </div>
                    <span className="font-bold text-white text-sm tracking-tight">Admin Portal</span>
                </div>
                <button onClick={() => setSidebarOpen(true)} className="text-white/60 hover:text-white p-1 transition">
                    <Menu size={20} />
                </button>
            </div>

            {/* Sidebar */}
            <aside className={clsx(
                'flex flex-col w-64 flex-shrink-0 h-screen',
                'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
                'md:sticky md:top-0 md:translate-x-0',
                'bg-[#0f1e38] text-white',
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}>

                {/* Logo */}
                <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-orange/90 border border-orange/30 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-black text-xs">A</span>
                        </div>
                        <div>
                            <h1 className="text-sm font-black text-white tracking-tight leading-none">Admin Portal</h1>
                            <p className="text-[10px] text-white/35 font-medium leading-none mt-0.5">IKADBP Management</p>
                        </div>
                    </div>
                    <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/40 hover:text-white transition p-1">
                        <X size={18} />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-5">
                    {menuGroups.map(group => {
                        const visibleItems = group.items.filter(item => item.roles.includes(userRole))
                        if (visibleItems.length === 0) return null
                        return (
                            <div key={group.label}>
                                <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25">
                                    {group.label}
                                </p>
                                <div className="space-y-0.5">
                                    {visibleItems.map(item => {
                                        const Icon = item.icon
                                        const isActive = pathname === item.href
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                onClick={() => setSidebarOpen(false)}
                                                className={clsx(
                                                    'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative',
                                                    isActive
                                                        ? 'bg-white/10 text-white'
                                                        : 'text-white/55 hover:bg-white/6 hover:text-white/90'
                                                )}
                                            >
                                                {isActive && (
                                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-orange rounded-full" />
                                                )}
                                                <Icon size={17} className={clsx(
                                                    'flex-shrink-0 transition-transform duration-200',
                                                    isActive ? 'text-white' : 'text-white/40 group-hover:text-white/70 group-hover:scale-110'
                                                )} />
                                                <span className="flex-1 leading-none">{item.name}</span>
                                                {isActive && <ChevronRight size={14} className="text-white/40 flex-shrink-0" />}
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}

                    {/* Back to App */}
                    <div>
                        <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25">Navigasi</p>
                        <Link
                            href="/dashboard"
                            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/55 hover:bg-white/6 hover:text-white/90 transition-all duration-200"
                        >
                            <LogOut size={17} className="flex-shrink-0 text-white/40 group-hover:text-white/70 rotate-180" />
                            <span className="flex-1 leading-none">Kembali ke App</span>
                        </Link>
                    </div>
                </nav>

                {/* User card */}
                <div className="mx-3 mb-3 p-3 rounded-2xl bg-white/5 border border-white/8">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-white truncate leading-tight">{userName || 'Admin'}</p>
                            <p className="text-[11px] text-orange font-medium leading-tight capitalize">{userRole}</p>
                        </div>
                        <button
                            onClick={handleSignOut}
                            title="Keluar"
                            className="flex-shrink-0 p-1.5 text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                            <LogOut size={15} />
                        </button>
                    </div>
                </div>
            </aside>
        </>
    )
}
