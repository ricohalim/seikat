'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, User, Calendar, Users, LogOut, LayoutDashboard } from 'lucide-react'
import { clsx } from 'clsx'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Profile', href: '/dashboard/profile', icon: User },
    { name: 'Events', href: '/dashboard/events', icon: Calendar },
    { name: 'Alumni Directory', href: '/dashboard/directory', icon: Users },
]

export default function Sidebar() {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/auth/login')
    }

    return (
        <aside className="w-64 bg-white border-r border-gray-100 flex-shrink-0 hidden md:flex flex-col h-screen sticky top-0">
            <div className="p-6 border-b border-gray-50">
                <h1 className="text-2xl font-bold text-navy tracking-tight">SEIKAT</h1>
                <p className="text-xs text-gray-400">Portal Alumni Djarum</p>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                'flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                                isActive
                                    ? 'bg-navy text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-navy'
                            )}
                        >
                            <Icon size={18} />
                            {item.name}
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
    )
}
