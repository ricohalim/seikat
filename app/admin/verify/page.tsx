'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { Search, Eye, UserCheck } from 'lucide-react'

export default function VerifyListPage() {
    const [registrants, setRegistrants] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [activeTab, setActiveTab] = useState<'pending' | 'on-hold'>('pending')

    useEffect(() => {
        const fetchRegistrants = async () => {
            setLoading(true)

            let query = supabase
                .from('temp_registrations')
                .select('*')
                .order('submitted_at', { ascending: true }) // FIFO

            // Filter based on Tab
            if (activeTab === 'pending') {
                query = query.eq('status', 'Pending')
            } else {
                query = query.eq('status', 'On-Hold')
            }

            const { data } = await query

            if (data) setRegistrants(data)
            setLoading(false)
        }

        fetchRegistrants()
    }, [activeTab]) // Refetch when tab changes

    const filtered = registrants.filter(r =>
        r.full_name?.toLowerCase().includes(filter.toLowerCase()) ||
        r.email?.toLowerCase().includes(filter.toLowerCase())
    )

    return (
        <div className="space-y-6 pb-10 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-navy/8 flex items-center justify-center flex-shrink-0">
                        <UserCheck size={18} className="text-navy" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-navy tracking-tight">Antrian Verifikasi</h1>
                        <p className="text-sm text-gray-400">Validasi pendaftar baru sebelum masuk ke database alumni.</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input
                        type="text"
                        placeholder="Cari nama atau email..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-navy/40 focus:ring-2 focus:ring-navy/10 outline-none w-64 text-sm bg-white"
                    />
                </div>
            </div>

            {/* TABS */}
            <div className="flex gap-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`pb-3 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'pending'
                        ? 'border-navy text-navy'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    Menunggu Verifikasi
                </button>
                <button
                    onClick={() => setActiveTab('on-hold')}
                    className={`pb-3 px-2 text-sm font-bold border-b-2 transition ${activeTab === 'on-hold'
                        ? 'border-yellow-500 text-yellow-600'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    Ditunda (On-Hold)
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                            <th className="p-4 font-bold">Nama Lengkap</th>
                            <th className="p-4 font-bold">Angkatan</th>
                            <th className="p-4 font-bold">Universitas / Jurusan</th>
                            <th className="p-4 font-bold">Status</th>
                            {activeTab === 'on-hold' && <th className="p-4 font-bold">Catatan</th>}
                            <th className="p-4 font-bold text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-50">
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="p-4">
                                        <div className="h-4 bg-gray-100 rounded w-32 mb-1.5" />
                                        <div className="h-3 bg-gray-100 rounded w-20" />
                                    </td>
                                    <td className="p-4"><div className="h-4 bg-gray-100 rounded w-16" /></td>
                                    <td className="p-4">
                                        <div className="h-4 bg-gray-100 rounded w-28 mb-1.5" />
                                        <div className="h-3 bg-gray-100 rounded w-20" />
                                    </td>
                                    <td className="p-4"><div className="h-6 bg-gray-100 rounded-full w-20" /></td>
                                    {activeTab === 'on-hold' && <td className="p-4"><div className="h-4 bg-gray-100 rounded w-24" /></td>}
                                    <td className="p-4 text-right"><div className="h-8 bg-gray-100 rounded-xl w-20 ml-auto" /></td>
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr>
                                <td colSpan={activeTab === 'on-hold' ? 6 : 5}>
                                    <div className="py-12 text-center">
                                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                                            <UserCheck size={20} className="text-gray-300" />
                                        </div>
                                        <p className="font-bold text-gray-500 text-sm">
                                            {filter
                                                ? 'Tidak ada hasil pencarian.'
                                                : activeTab === 'pending'
                                                    ? 'Tidak ada pendaftar menunggu verifikasi.'
                                                    : 'Tidak ada pendaftar yang ditunda.'}
                                        </p>
                                    </div>
                                </td>
                            </tr>
                        ) : filtered.map((r) => {
                            // Extract metadata from raw_json if columns are missing
                            const meta = r.raw_data || {}
                            return (
                                <tr key={r.id} className="hover:bg-navy/[0.02] transition group">
                                    <td className="p-4 font-bold text-navy">
                                        {r.full_name}
                                        <div className="text-xs text-gray-400 font-normal mt-0.5">{new Date(r.submitted_at).toLocaleDateString()}</div>
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        Beswan {meta.generation || '-'}
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        <div className="font-semibold text-xs">{meta.university || '-'}</div>
                                        <div className="text-xs text-gray-400">{meta.major || '-'}</div>
                                    </td>
                                    <td className="p-4">
                                        {r.status === 'On-Hold' ? (
                                            <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-bold text-xs inline-flex items-center gap-1">
                                                <Clock size={12} /> On-Hold
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1 rounded-full bg-orange/10 text-orange font-bold text-xs inline-flex items-center gap-1">
                                                <Clock size={12} /> Pending
                                            </span>
                                        )}
                                    </td>
                                    {activeTab === 'on-hold' && (
                                        <td className="p-4 text-sm text-gray-500 italic max-w-xs truncate">
                                            "{meta.hold_reason || '-'}"
                                        </td>
                                    )}
                                    <td className="p-4 text-right">
                                        <Link href={`/admin/verify/${r.id}`} className="inline-flex items-center gap-2 px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-[#1a3561] transition shadow-sm">
                                            <Eye size={14} /> Tinjau
                                        </Link>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function Clock({ size }: { size: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
    )
}
