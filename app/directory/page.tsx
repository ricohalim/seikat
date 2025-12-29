'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
// import { Search, MapPin, Building2, GraduationCap, Briefcase } from 'lucide-react' // Commented out for debugging
import Link from 'next/link'

export default function AlumniDirectoryPage() {
    // Hydration check
    const [isMounted, setIsMounted] = useState(false)

    const [alumni, setAlumni] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const [page, setPage] = useState(0)

    // Filters
    const [generationFilter, setGenerationFilter] = useState('')
    const [universityFilter, setUniversityFilter] = useState('')

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        if (!isMounted) return

        const fetchAlumni = async () => {
            setLoading(true)
            try {
                // Use RPC to ensure 'Pending' users are excluded server-side
                let query = supabase
                    .rpc('get_directory_members')
                    .order('full_name', { ascending: true })
                    .range(page * 12, (page + 1) * 12 - 1)

                if (filter) query = query.ilike('full_name', `%${filter}%`)
                if (generationFilter) query = query.eq('generation', generationFilter)
                if (universityFilter) query = query.ilike('university', `%${universityFilter}%`)

                const { data, error } = await query

                if (data) setAlumni(data)
                if (error) console.error(error)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchAlumni()
    }, [isMounted, page, filter, generationFilter, universityFilter])

    if (!isMounted) return null // Prevent hydration mismatch

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-4">
            <header className="text-center space-y-4">
                <h1 className="text-3xl font-bold text-navy">Direktori Alumni</h1>
                <p className="text-gray-500 max-w-2xl mx-auto">Temukan dan terkoneksi dengan ribuan alumni Beswan Djarum dari berbagai angkatan dan universitas.</p>

                {/* Search Bar */}
                <div className="max-w-xl mx-auto relative">
                    {/* <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} /> */}
                    <input
                        type="text"
                        placeholder="Cari nama alumni..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="w-full px-6 py-4 rounded-full border border-gray-200 shadow-sm focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none text-lg transition"
                    />
                </div>

                {/* Filters */}
                <div className="flex justify-center gap-4 flex-wrap">
                    <select
                        className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm"
                        onChange={(e) => setGenerationFilter(e.target.value)}
                    >
                        <option value="">Semua Angkatan</option>
                        {Array.from({ length: 40 }, (_, i) => (
                            <option key={i} value={(i + 1).toString()}>Beswan {i + 1}</option>
                        ))}
                    </select>
                    <input
                        type="text"
                        placeholder="Universitas..."
                        className="px-4 py-2 rounded-full border border-gray-200 bg-white text-sm"
                        onChange={(e) => setUniversityFilter(e.target.value)}
                    />
                </div>
            </header>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-64 bg-gray-100 rounded-2xl animate-pulse"></div>
                    ))
                ) : alumni.map((a) => (
                    <div key={a.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition text-center overflow-hidden">
                        <div className="w-24 h-24 mx-auto rounded-full bg-gray-200 mb-4 overflow-hidden border-4 border-white shadow-sm">
                            {a.photo_url ? (
                                <img src={a.photo_url} alt={a.full_name} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 font-bold text-2xl">
                                    {a.full_name.charAt(0)}
                                </div>
                            )}
                        </div>

                        <h3 className="font-bold text-navy text-lg mb-1 truncate">{a.full_name}</h3>
                        <p className="text-xs text-orange font-bold uppercase tracking-wide mb-3">Beswan {a.generation}</p>

                        <div className="space-y-2 text-sm text-gray-600 text-left bg-gray-50 p-4 rounded-xl">
                            <div className="flex items-start gap-2">
                                <span className="font-bold text-gray-400 text-xs uppercase w-4 flex-shrink-0">Univ</span>
                                <span className="truncate">{a.university}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-bold text-gray-400 text-xs uppercase w-4 flex-shrink-0">Major</span>
                                <span className="truncate">{a.major}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-bold text-gray-400 text-xs uppercase w-4 flex-shrink-0">Job</span>
                                <span className="truncate">{a.company_name ? `${a.job_position} @ ${a.company_name}` : '-'}</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="font-bold text-gray-400 text-xs uppercase w-4 flex-shrink-0">City</span>
                                <span className="truncate">{a.domicile_city || '-'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {!loading && alumni.length === 0 && (
                <div className="text-center py-20 text-gray-400">
                    <p>Alumni tidak ditemukan.</p>
                </div>
            )}

            {/* Pagination Controls */}
            <div className="flex justify-center gap-4 py-8">
                <button
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                    className="px-6 py-2 bg-white border border-gray-200 rounded-full font-bold text-sm hover:bg-gray-50 disabled:opacity-50"
                >
                    Sebelumnya
                </button>
                <button
                    onClick={() => setPage(p => p + 1)}
                    className="px-6 py-2 bg-white border border-gray-200 rounded-full font-bold text-sm hover:bg-gray-50"
                >
                    Selanjutnya
                </button>
            </div>
        </div>
    )
}
