'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Shield, Clock, Search, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function ActivityLogsPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSuperAdmin, setIsSuperAdmin] = useState(false)
    const router = useRouter()

    useEffect(() => {
        checkAccessAndFetch()
    }, []) // Initial load

    // Debounce Search
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (isSuperAdmin) checkAccessAndFetch()
        }, 500)
        return () => clearTimeout(timeout)
    }, [searchQuery])

    const checkAccessAndFetch = async () => {
        setLoading(true)
        try {
            // 1. Check Role
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return router.push('/login')

            // Optimisation: Skip role check if already confirmed
            if (!isSuperAdmin) {
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
                if (profile?.role !== 'superadmin') return
                setIsSuperAdmin(true)
            }

            // 2. Fetch Logs (RPC with Search)
            const { data, error } = await supabase.rpc('get_activity_logs', {
                search_text: searchQuery || null
            })
            if (error) throw error
            setLogs(data || [])

        } catch (err: any) {
            console.error('Error fetching logs:', err)
            // alert('Gagal memuat log aktivitas.')
        } finally {
            setLoading(false)
        }
    }

    if (!loading && !isSuperAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="bg-red-50 p-6 rounded-full text-red-500 mb-6">
                    <Shield size={64} />
                </div>
                <h1 className="text-3xl font-bold text-navy mb-2">Akses Ditolak</h1>
                <p className="text-gray-500 max-w-md mx-auto mb-8">
                    Halaman ini berisi data sensitif untuk audit sistem dan hanya dapat diakses oleh Super Admin.
                </p>
                <Link href="/admin/dashboard" className="px-6 py-3 rounded-xl font-bold bg-navy text-white hover:bg-navy/90 transition shadow-lg shadow-navy/20">
                    Kembali ke Dashboard
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto pb-20 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-navy">
                        <ArrowLeft size={24} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-navy flex items-center gap-3">
                            <Clock className="text-navy" size={28} />
                            Activity Logs
                        </h1>
                        <p className="text-gray-500 text-sm">Audit trail aktivitas user dan admin (100 Terakhir)</p>
                    </div>
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Cari Actor (Nama / Email)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none text-sm transition-all"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100 font-bold">
                                <th className="p-4 w-[200px]">Timestamp</th>
                                <th className="p-4 w-[250px]">Actor (User/Admin)</th>
                                <th className="p-4 w-[200px]">Action</th>
                                <th className="p-4">Details</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading Logs...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Belum ada aktivitas tercatat.</td></tr>
                            ) : logs.map((log) => (
                                <tr key={log.id} className="hover:bg-gray-50 transition group">
                                    <td className="p-4 text-gray-500 font-mono text-xs whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString()}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-navy">{log.actor_name || 'System / Unknown'}</div>
                                        <div className="text-xs text-gray-400 font-mono">{log.actor_email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase ${log.action.includes('UPDATE') ? 'bg-blue-50 text-blue-600' :
                                            log.action.includes('VERIFY') ? 'bg-purple-50 text-purple-600' :
                                                log.action.includes('INSERT') ? 'bg-green-50 text-green-600' :
                                                    'bg-gray-100 text-gray-600'
                                            }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <pre className="text-[10px] bg-gray-50 p-2 rounded border border-gray-100 overflow-x-auto max-w-sm font-mono text-gray-600">
                                            {JSON.stringify(log.details, null, 2)}
                                        </pre>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
