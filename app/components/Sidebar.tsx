'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Home, User, Calendar, Users, LogOut,
    LayoutDashboard, X, Lock, Inbox,
    ChevronRight, Shield
} from 'lucide-react'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getUnreadCount } from '@/app/actions/inbox'

// ─── Menu groups ───────────────────────────────────────────────────────────
const menuGroups = [
    {
        label: 'Menu Utama',
        items: [
            { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
            { name: 'Profil Saya', href: '/dashboard/profile', icon: User },
        ]
    },
    {
        label: 'Komunitas',
        items: [
            { name: 'Events', href: '/dashboard/events', icon: Calendar },
            { name: 'Direktori Alumni', href: '/dashboard/directory', icon: Users },
            { name: 'Inbox', href: '/dashboard/inbox', icon: Inbox, badge: true },
        ]
    },
    {
        label: 'Akun',
        items: [
            { name: 'Ganti Password', href: '/dashboard/change-password', icon: Lock },
        ]
    },
]

// ─── Role label ─────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    superadmin: { label: 'Super Admin', color: 'text-purple-500' },
    admin:      { label: 'Admin',       color: 'text-blue-500'   },
    korwil:     { label: 'Korwil',      color: 'text-teal-500'   },
    viewer:     { label: 'Viewer',      color: 'text-gray-400'   },
    member:     { label: 'Alumni',      color: 'text-orange'     },
}

// ─── Google Drive thumbnail helper ──────────────────────────────────────────
function getThumb(url: string | null): string | null {
    if (!url) return null
    if (url.includes('drive.google.com')) {
        const m = url.match(/[-\w]{25,}/)
        if (m) return `https://drive.google.com/thumbnail?id=${m[0]}&sz=w120`
    }
    return url
}

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
    userName: string
    userPhoto: string | null
    userRole: string
    userGeneration: string
}

export default function Sidebar({
    isOpen,
    onClose,
    userName,
    userPhoto,
    userRole,
    userGeneration,
}: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [unreadCount, setUnreadCount] = useState(0)

    const roleInfo = ROLE_LABELS[userRole] ?? ROLE_LABELS.member
    const thumbUrl = getThumb(userPhoto)
    const initials = userName
        ? userName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
        : '?'
    const isAdmin = ['superadmin', 'admin', 'korwil', 'viewer'].includes(userRole)

    useEffect(() => {
        const fetchUnread = async () => {
            const count = await getUnreadCount()
            setUnreadCount(count)
        }
        fetchUnread()
        const interval = setInterval(fetchUnread, 30000)
        if (pathname === '/dashboard/inbox') setUnreadCount(0)
        return () => clearInterval(interval)
    }, [pathname])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={clsx(
                'flex flex-col w-64 flex-shrink-0 h-screen',
                'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
                'md:sticky md:top-0 md:translate-x-0',
                'bg-[#0f1e38] text-white',
                isOpen ? 'translate-x-0' : '-translate-x-full'
            )}>

                {/* ── Logo ─────────────────────────────────────── */}
                <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        {/* Monogram mark */}
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-azure to-orange flex items-center justify-center flex-shrink-0 shadow-lg shadow-azure/30">
                            <span className="text-white font-black text-xs tracking-tighter">SK</span>
                        </div>
                        <div>
                            <h1 className="text-base font-black text-white tracking-tight leading-none">SEIKAT</h1>
                            <p className="text-[10px] text-white/40 font-medium leading-none mt-0.5">Portal Alumni Djarum</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="md:hidden text-white/40 hover:text-white transition p-1"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* ── Nav ──────────────────────────────────────── */}
                <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-5">
                    {menuGroups.map((group) => (
                        <div key={group.label}>
                            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25">
                                {group.label}
                            </p>
                            <div className="space-y-0.5">
                                {group.items.map((item) => {
                                    const Icon = item.icon
                                    const isActive = pathname === item.href
                                    const showBadge = item.badge && unreadCount > 0

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={onClose}
                                            className={clsx(
                                                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative',
                                                isActive
                                                    ? 'bg-white/10 text-white'
                                                    : 'text-white/55 hover:bg-white/6 hover:text-white/90'
                                            )}
                                        >
                                            {/* Active accent bar */}
                                            {isActive && (
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-orange rounded-full" />
                                            )}

                                            <Icon
                                                size={17}
                                                className={clsx(
                                                    'flex-shrink-0 transition-transform duration-200',
                                                    isActive ? 'text-white' : 'text-white/40 group-hover:text-white/70 group-hover:scale-110'
                                                )}
                                            />
                                            <span className="flex-1 leading-none">{item.name}</span>

                                            {/* Unread badge */}
                                            {showBadge && (
                                                <span className="flex items-center justify-center min-w-[18px] h-[18px] text-[10px] font-bold text-white bg-red-500 rounded-full px-1">
                                                    {unreadCount > 9 ? '9+' : unreadCount}
                                                </span>
                                            )}

                                            {/* Chevron on active */}
                                            {isActive && (
                                                <ChevronRight size={14} className="text-white/40 flex-shrink-0" />
                                            )}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Admin shortcut */}
                    {isAdmin && (
                        <div>
                            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25">
                                Admin
                            </p>
                            <Link
                                href="/admin"
                                onClick={onClose}
                                className={clsx(
                                    'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                                    pathname.startsWith('/admin')
                                        ? 'bg-orange/15 text-orange border border-orange/20'
                                        : 'text-white/55 hover:bg-orange/10 hover:text-orange/90'
                                )}
                            >
                                <Shield size={17} className="flex-shrink-0 text-orange/60 group-hover:text-orange transition-colors" />
                                <span className="flex-1 leading-none">Panel Admin</span>
                                {pathname.startsWith('/admin') && (
                                    <ChevronRight size={14} className="text-orange/50" />
                                )}
                            </Link>
                        </div>
                    )}
                </nav>

                {/* ── User card ────────────────────────────────── */}
                <div className="mx-3 mb-3 p-3 rounded-2xl bg-white/5 border border-white/8">
                    <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-azure/80 to-navy ring-2 ring-white/10">
                                {thumbUrl ? (
                                    <img src={thumbUrl} alt={userName} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-sm">
                                        {initials}
                                    </div>
                                )}
                            </div>
                            {/* Online dot */}
                            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#0f1e38]" />
                        </div>

                        {/* Name + role */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-white truncate leading-tight">
                                {userName || 'Alumni'}
                            </p>
                            <p className={clsx('text-[11px] font-medium leading-tight truncate', roleInfo.color)}>
                                {roleInfo.label}
                                {userGeneration ? ` · ${userGeneration.split('(')[0].trim()}` : ''}
                            </p>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleLogout}
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
