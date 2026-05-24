'use client'

import { useState } from 'react'
import Sidebar from '@/app/components/Sidebar'
import { Menu } from 'lucide-react'

interface DashboardShellProps {
    children: React.ReactNode
    userName: string
    userPhoto: string | null
    userRole: string
    userGeneration: string
}

/**
 * DashboardShell — Client Component wrapper untuk dashboard.
 * Menangani state sidebar (buka/tutup) yang membutuhkan interaktivitas client-side.
 * Dipisahkan dari layout.tsx agar layout bisa menjadi Server Component (auth guard server-side).
 */
export default function DashboardShell({
    children,
    userName,
    userPhoto,
    userRole,
    userGeneration,
}: DashboardShellProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                userName={userName}
                userPhoto={userPhoto}
                userRole={userRole}
                userGeneration={userGeneration}
            />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header */}
                <div className="md:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-30">
                    <span className="font-bold text-navy tracking-tight">SEIKAT</span>
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-navy p-1.5 rounded-lg hover:bg-gray-100 transition"
                        aria-label="Buka menu"
                    >
                        <Menu size={22} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
