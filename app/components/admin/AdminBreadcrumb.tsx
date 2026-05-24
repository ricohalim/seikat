'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

const PAGE_LABELS: Record<string, string> = {
    'admin': 'Dashboard',
    'users': 'Manajemen User',
    'agendas': 'Agenda & Event',
    'inbox': 'Broadcast Inbox',
    'live-events': 'Live Monitor',
    'logs': 'Audit Logs',
    'master-data': 'Master Data',
    'verify': 'Verifikasi User',
}

/**
 * AdminBreadcrumb — Auto-generated breadcrumb dari URL path.
 * Tidak perlu prop apapun, cukup ditaruh di layout atau setiap halaman admin.
 */
export function AdminBreadcrumb() {
    const pathname = usePathname()

    // Split path dan filter empty strings
    const segments = pathname.split('/').filter(Boolean)

    // Build breadcrumb items: [{label, href}]
    const crumbs = segments.map((seg, i) => {
        const href = '/' + segments.slice(0, i + 1).join('/')
        // Jika segment adalah UUID (dynamic route seperti /verify/[id]), tampilkan singkat
        const isUuid = /^[0-9a-fA-F-]{36}$/.test(seg)
        const label = isUuid ? 'Detail' : (PAGE_LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1))
        return { label, href }
    })

    if (crumbs.length <= 1) return null // Tidak perlu breadcrumb di halaman root admin

    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm mb-6">
            <Link
                href="/admin"
                className="text-gray-400 hover:text-navy transition flex items-center gap-1"
            >
                <Home size={14} />
            </Link>
            {crumbs.slice(1).map((crumb, i) => (
                <span key={crumb.href} className="flex items-center gap-1.5">
                    <ChevronRight size={14} className="text-gray-300 flex-shrink-0" />
                    {i === crumbs.length - 2 ? (
                        // Halaman aktif (terakhir) — tidak clickable
                        <span className="font-semibold text-navy truncate max-w-[200px]">
                            {crumb.label}
                        </span>
                    ) : (
                        <Link
                            href={crumb.href}
                            className="text-gray-400 hover:text-navy transition truncate max-w-[200px]"
                        >
                            {crumb.label}
                        </Link>
                    )}
                </span>
            ))}
        </nav>
    )
}
