'use client'

import { useState } from 'react'
import Sidebar from '@/app/components/Sidebar'
import { Menu } from 'lucide-react'

/**
 * DashboardShell — Client Component wrapper untuk dashboard.
 * Menangani state sidebar (buka/tutup) yang membutuhkan interaktivitas client-side.
 * Dipisahkan dari layout.tsx agar layout bisa menjadi Server Component (auth guard server-side).
 */
export default function DashboardShell({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false)

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Mobile Header (Hidden on Desktop) */}
                <div className="md:hidden bg-white border-b border-gray-100 p-4 flex items-center justify-between sticky top-0 z-30">
                    <span className="font-bold text-navy">SEIKAT</span>
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="text-navy p-1"
                        aria-label="Buka menu"
                    >
                        <Menu size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    )
}
