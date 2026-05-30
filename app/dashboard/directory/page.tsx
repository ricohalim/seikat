'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, MapPin, Building2, GraduationCap, X, Linkedin } from 'lucide-react'

interface Member {
    id: string
    full_name: string
    generation: string
    photo_url: string
    linkedin_url: string
    university: string
    major: string
    company_name: string
    job_position: string
}

import { calculateProfileCompleteness, sanitizeExternalUrl } from '@/lib/utils'
import Link from 'next/link'
import { Lock, AlertCircle } from 'lucide-react'

// ...

export default function DirectoryPage() {
    const [members, setMembers] = useState<Member[]>([])
    const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const gridRef = useRef<HTMLDivElement>(null)

    // Authorization State
    const [isAuthorized, setIsAuthorized] = useState(false)
    const [isUserLoading, setIsUserLoading] = useState(true)
    const [completenessScore, setCompletenessScore] = useState(0)
    const [checkError, setCheckError] = useState<string | null>(null)

    // Hydration Mismatch Fix: Start with a "mounting" state or ensure loading matches server
    const [authLoading, setAuthLoading] = useState(true)

    // Check Authorization First
    useEffect(() => {
        async function checkAccess() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) return // Auth middleware handles redirect typically

                // Fetch MY profile
                const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', user.id).single()

                if (error) {
                    console.error("Error fetching profile:", error)
                    setCheckError(error.message)
                    return
                }

                if (profile) {
                    const percent = calculateProfileCompleteness(profile)
                    setCompletenessScore(percent)
                    if (percent >= 90) {
                        setIsAuthorized(true)
                    }
                }
            } catch (error: any) {
                console.error("Error checking access:", error)
                setCheckError(error.message || "Unknown error")
            } finally {
                setIsUserLoading(false)
                setAuthLoading(false)
            }
        }
        checkAccess()
    }, [])

    const [totalActiveCount, setTotalActiveCount] = useState(0)

    // Pagination State
    const [page, setPage] = useState(0)
    const ITEMS_PER_PAGE = 21

    async function fetchTotalCount() {
        const { data } = await supabase.rpc('get_active_alumni_count')
        if (data) setTotalActiveCount(data)
    }

    // Debounce Search Value
    const [debouncedSearch, setDebouncedSearch] = useState('')

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery)
        }, 500)
        return () => clearTimeout(timer)
    }, [searchQuery])

    // Fetch Directory (Server-Side Search)
    useEffect(() => {
        if (!isAuthorized || isUserLoading) return
        setLoading(true)

        async function fetchMembers() {
            // Clean Query
            const query = debouncedSearch.trim()

            // Pass parameter to RPC (Using V2 to ensure correct logic)
            const { data, error } = await supabase.rpc('get_directory_members_v2', {
                search_query: query
            })

            if (error) {
                console.error('Error fetching directory:', error)
                setCheckError(`Directory Fetch Error: ${error.message}`)
            } else {
                // Force Client-Side Sort (Double Safety)
                const sortedData = (data || []).sort((a: any, b: any) =>
                    (a.full_name || '').trim().localeCompare((b.full_name || '').trim())
                )
                setMembers(sortedData)
                setFilteredMembers(sortedData)
            }
            setLoading(false)
        }

        fetchMembers()

        // Only fetch total once
        if (debouncedSearch === '') {
            fetchTotalCount()
        }
    }, [isAuthorized, isUserLoading, debouncedSearch])

    // Pagination Logic
    const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE)
    const paginatedMembers = filteredMembers.slice(
        page * ITEMS_PER_PAGE,
        (page + 1) * ITEMS_PER_PAGE
    )

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    if (authLoading || isUserLoading) return <div className="p-8 text-center text-gray-500">Memeriksa akses...</div>

    if (!isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-2">
                    <Lock size={40} />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-navy">Akses Terkunci</h2>
                    {checkError && (
                        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-xs max-w-md mx-auto">
                            Error: {checkError}
                        </div>
                    )}
                    <p className="text-gray-500 max-w-md mx-auto mt-2">
                        Fitur Direktori Alumni hanya dapat diakses oleh anggota yang telah melengkapi profil mereka.
                    </p>
                    <p className="text-xl font-bold text-navy mt-2">
                        Kelengkapan Anda: {completenessScore}%
                    </p>
                </div>
                <div className="bg-orange/5 border border-orange/20 p-4 rounded-xl max-w-md text-left flex items-start gap-3">
                    <AlertCircle className="text-orange flex-shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-gray-600">
                        Profil Anda belum memenuhi syarat 90% kelengkapan. Silakan lengkapi data kontak, pekerjaan, dan akademik Anda.
                    </p>
                </div>
                <Link href="/dashboard/profile" className="bg-navy text-white px-6 py-3 rounded-xl font-bold hover:bg-navy/90 transition shadow-lg hover:shadow-xl hover:-translate-y-1">
                    Lengkapi Profil Sekarang
                </Link>
            </div>
        )
    }

    // Helper for images
    const getOptimizedImageUrl = (url: string) => {
        if (!url) return null;
        if (url.includes('drive.google.com')) {
            const idMatch = url.match(/[-\w]{25,}/);
            if (idMatch) return `https://drive.google.com/thumbnail?id=${idMatch[0]}&sz=w400`;
        }
        return url;
    }

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">

            {/* Header + Search */}
            <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-navy/8 flex items-center justify-center flex-shrink-0">
                        <GraduationCap size={18} className="text-navy" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-navy tracking-tight">Alumni Directory</h1>
                        <p className="text-sm text-gray-400">
                            {totalActiveCount || members.length} alumni terdaftar
                        </p>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-80">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-300" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama atau angkatan..."
                        className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 shadow-sm transition-all"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(0) }}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => { setSearchQuery(''); setPage(0) }}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-300 hover:text-gray-500 transition"
                        >
                            <X size={15} />
                        </button>
                    )}
                </div>
            </div>

            {/* Scrollable grid area */}
            <div ref={gridRef} className="flex-1 overflow-y-auto min-h-0">
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                    {[...Array(9)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl h-16 animate-pulse border border-gray-100"></div>
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1">
                        {paginatedMembers.map((member) => {
                            const safeUrl = sanitizeExternalUrl(member.linkedin_url)
                            const photoUrl = getOptimizedImageUrl(member.photo_url)
                            const genLabel = member.generation?.split('(')[0].trim()
                            return (
                            <div key={member.id} className="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all flex items-center gap-3 px-3 py-3">

                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                                    {photoUrl ? (
                                        <img
                                            src={photoUrl}
                                            alt={member.full_name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 font-semibold text-sm">
                                            {member.full_name?.charAt(0)}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-navy text-sm leading-snug truncate">
                                        {member.full_name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {genLabel && (
                                            <span className="text-xs text-gray-400">Ang. {genLabel}</span>
                                        )}
                                        {safeUrl && (
                                            <a
                                                href={safeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer nofollow"
                                                className="text-[#0077b5]/60 hover:text-[#0077b5] transition"
                                                title="LinkedIn"
                                            >
                                                <Linkedin size={11} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                            )
                        })}
                    </div>

                    {filteredMembers.length === 0 && (
                        <div className="text-center py-20 text-gray-400">
                            {members.length === 0 ? (
                                <>
                                    <div className="bg-gray-50 inline-block p-4 rounded-full mb-4">
                                        <Search size={24} className="opacity-50" />
                                    </div>
                                    <p>Belum ada data alumni yang aktif di sistem.</p>
                                </>
                            ) : (
                                <>
                                    <p>Tidak ada alumni yang cocok dengan pencarian "{searchQuery}"</p>
                                    <button onClick={() => setSearchQuery('')} className="text-navy font-bold hover:underline mt-2">Reset Pencarian</button>
                                </>
                            )}
                        </div>
                    )}
                </>
            )}
            </div>

            {/* Pagination — pinned bottom */}
            {filteredMembers.length > ITEMS_PER_PAGE && (
                <div className="flex-shrink-0 border-t border-gray-100 pt-3 pb-1 flex items-center justify-center gap-3">
                    <button
                        onClick={() => { setPage(p => Math.max(0, p - 1)); gridRef.current?.scrollTo({ top: 0 }) }}
                        disabled={page === 0}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold border border-gray-200 bg-white text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                    >
                        ← Sebelumnya
                    </button>
                    <span className="text-sm text-gray-400 px-2">
                        <span className="text-navy font-bold">{page + 1}</span> / {totalPages}
                    </span>
                    <button
                        onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); gridRef.current?.scrollTo({ top: 0 }) }}
                        disabled={page >= totalPages - 1}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold bg-navy text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-navy/90 transition"
                    >
                        Selanjutnya →
                    </button>
                </div>
            )}
        </div>
    )
}
