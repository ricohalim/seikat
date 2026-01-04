'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, User, Calendar, Users, LogOut, LayoutDashboard, X, Lock, Inbox } from 'lucide-react'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getUnreadCount } from '@/app/actions/inbox'

const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', href: '/dashboard/profile', icon: User },
    { name: 'Events', href: '/dashboard/events', icon: Calendar },
    { name: 'Alumni Directory', href: '/dashboard/directory', icon: Users },
    { name: 'Inbox', href: '/dashboard/inbox', icon: Inbox },
    { name: 'Ganti Password', href: '/dashboard/change-password', icon: Lock },
]

interface SidebarProps {
    isOpen: boolean
    onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        const fetchUnread = async () => {
            const count = await getUnreadCount()
            setUnreadCount(count)
        }
        fetchUnread()

        // Poll every 30 seconds
        const interval = setInterval(fetchUnread, 30000)

        // Optimistically clear count if on inbox page
        if (pathname === '/dashboard/inbox') {
            setUnreadCount(0)
        }

        return () => clearInterval(interval)
    }, [pathname])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={clsx(
                "bg-white border-r border-gray-100 flex flex-col h-screen fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 flex-shrink-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-navy tracking-tight">SEIKAT</h1>
                        <p className="text-xs text-gray-400">Portal Alumni Djarum</p>
                    </div>
                    {/* Close button for mobile */}
                    <button onClick={onClose} className="md:hidden text-gray-400 hover:text-navy">
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        const isInbox = item.name === 'Inbox'

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                className={clsx(
                                    'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors relative',
                                    isActive
                                        ? 'bg-navy text-white shadow-sm'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-navy'
                                )}
                            >
                                {/* @ts-ignore */}
                                <Icon size={18} />
                                <span className="flex-1">{item.name}</span>

                                {isInbox && unreadCount > 0 && (
                                    <span className="flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full animate-pulse">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-gray-50">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    )
}
