'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, MapPin, Building2, GraduationCap, X, Linkedin } from 'lucide-react'

interface Member {
    id: string
    full_name: string
    generation: string
    photo_url: string
    linkedin_url: string
}

import { calculateProfileCompleteness } from '@/lib/utils'
import Link from 'next/link'
import { Lock, AlertCircle } from 'lucide-react'

// ...

export default function DirectoryPage() {
    const [members, setMembers] = useState<Member[]>([])
    const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

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

    // Fetch Directory ONLY if Authorized
    useEffect(() => {
        if (!isAuthorized || isUserLoading) return

        async function fetchMembers() {
            const { data, error } = await supabase.rpc('get_directory_members')

            if (error) {
                console.error('Error fetching directory:', error)
                setCheckError(`Directory Fetch Error: ${error.message}`)
            } else {
                setMembers(data || [])
                setFilteredMembers(data || [])
            }
            setLoading(false)
        }

        // Only run fetch logic if authorized
        if (isAuthorized) {
            fetchMembers()
        }
    }, [isAuthorized, isUserLoading])

    // Pagination State
    const [page, setPage] = useState(0)
    const ITEMS_PER_PAGE = 20

    // Search Logic (MOVED UP to prevent Hook Error #310)
    useEffect(() => {
        const query = searchQuery.toLowerCase()

        const results = members.filter(member => {
            const name = member.full_name?.toLowerCase() || ''
            const batch = member.generation?.toString().toLowerCase() || ''
            return name.includes(query) || batch.includes(query)
        })

        setFilteredMembers(results)
        setPage(0) // Reset to first page on search
    }, [searchQuery, members])

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
        <div className="space-y-6 pb-20"> {/* Added pb-20 for bottom spacing on mobile */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-navy">Alumni Directory</h2>
                    <p className="text-gray-500 text-sm">
                        Jelajahi profil rekan-rekan Beswan Djarum dari berbagai angkatan.
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded ml-2 text-gray-400">
                            Total: {members.length} Alumni
                        </span>
                    </p>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama atau angkatan..."
                        className="block w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy text-sm transition"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl h-48 animate-pulse shadow-sm border border-gray-100"></div>
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"> {/* Squeezed gap on mobile */}
                        {paginatedMembers.map((member) => ( /* CHANGED to paginatedMembers */
                            <div key={member.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-100 group relative">
                                <div className="h-24 bg-gradient-to-r from-gray-100 to-gray-200 relative">
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] font-bold text-navy shadow-sm">
                                        TS {member.generation}
                                    </div>
                                </div>
                                <div className="px-5 pb-5 -mt-10">
                                    <div className="relative w-20 h-20 rounded-full border-4 border-white bg-white shadow-sm overflow-hidden mb-3">
                                        {member.photo_url ? (
                                            <img
                                                src={getOptimizedImageUrl(member.photo_url) || ''}
                                                alt={member.full_name}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300 font-bold text-2xl">
                                                {member.full_name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex justify-between items-start gap-2">
                                        <h3 className="font-bold text-navy line-clamp-2" title={member.full_name}>
                                            {member.full_name}
                                        </h3>

                                        {member.linkedin_url && (
                                            <a href={member.linkedin_url} target="_blank" rel="noopener noreferrer"
                                                className="text-gray-400 hover:text-[#0077b5] transition flex-shrink-0"
                                            >
                                                <Linkedin size={18} />
                                            </a>
                                        )}
                                    </div>

                                    <div className="mt-1">
                                        <span className="text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded inline-block">
                                            Beswan {member.generation}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
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

                    {/* Pagination Controls */}
                    {filteredMembers.length > ITEMS_PER_PAGE && (
                        <div className="flex items-center justify-center gap-4 pt-8 border-t border-gray-100 mt-8">
                            <button
                                onClick={() => { setPage(p => Math.max(0, p - 1)); scrollToTop(); }}
                                disabled={page === 0}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                            >
                                Sebelumnya
                            </button>
                            <span className="text-sm font-medium text-gray-500">
                                Halaman <span className="text-navy font-bold">{page + 1}</span> dari {totalPages}
                            </span>
                            <button
                                onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); scrollToTop(); }}
                                disabled={page >= totalPages - 1}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
