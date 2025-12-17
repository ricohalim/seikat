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

export default function DirectoryPage() {
    const [members, setMembers] = useState<Member[]>([])
    const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // Fetch specific fields to be lightweight
    useEffect(() => {
        async function fetchMembers() {
            const { data, error } = await supabase
                .from('profiles')
                .select(`
                  id, full_name, generation, photo_url, linkedin_url
                `)
                .order('full_name', { ascending: true })

            if (error) {
                console.error('Error fetching directory:', error)
            } else {
                setMembers(data || [])
                setFilteredMembers(data || [])
            }
            setLoading(false)
        }

        fetchMembers()
    }, [])

    // Search Logic
    useEffect(() => {
        const query = searchQuery.toLowerCase()

        const results = members.filter(member => {
            const name = member.full_name?.toLowerCase() || ''
            const batch = member.generation?.toString().toLowerCase() || ''
            return name.includes(query) || batch.includes(query)
        })

        setFilteredMembers(results)
    }, [searchQuery, members])

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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-navy">Alumni Directory</h2>
                    <p className="text-gray-500 text-sm">Jelajahi profil rekan-rekan Beswan Djarum dari berbagai angkatan.</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredMembers.map((member) => (
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
                            <p>Tidak ada alumni yang cocok dengan pencarian "{searchQuery}"</p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
