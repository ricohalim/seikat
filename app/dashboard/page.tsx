'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
    Building2, MapPin, GraduationCap, Mail, Phone,
    Linkedin, Calendar, User as UserIcon
} from 'lucide-react'

// Define Profile Interface
interface Profile {
    full_name: string
    generation: string
    university: string
    major: string
    photo_url: string
    email?: string // Fetched from auth link or separate
    phone: string
    gender: string
    birth_place: string
    birth_date: string
    domicile_city: string
    domicile_province: string

    // Job
    job_position: string
    company_name: string
    industry_sector: string

    linkedin_url: string
    account_status: string
}

export default function DashboardPage() {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        async function fetchProfile() {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/auth/login')
                return
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error) {
                console.error('Error fetching profile:', error)
            } else {
                setProfile({ ...data, email: user.email })
            }
            setLoading(false)
        }

        fetchProfile()
    }, [router])

    // Helper to convert GDrive links to direct format
    const getOptimizedImageUrl = (url: string) => {
        if (!url) return null;
        if (url.includes('drive.google.com')) {
            // Extract ID
            const idMatch = url.match(/[-\w]{25,}/);
            if (idMatch) {
                return `https://drive.google.com/thumbnail?id=${idMatch[0]}&sz=w400`; // Use Thumbnail API for faster loading & less CORS issues
            }
        }
        return url;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-pulse text-navy font-semibold">Memuat Data Profil...</div>
            </div>
        )
    }

    if (!profile) return <div>Data tidak ditemukan.</div>

    const displayPhoto = getOptimizedImageUrl(profile.photo_url);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* 1. Header Card (Hero) */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-navy to-azure opacity-90"></div>

                <div className="relative pt-16 flex flex-col md:flex-row items-end md:items-end gap-6">
                    <div className="relative">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-md bg-gray-200 overflow-hidden">
                            {displayPhoto ? (
                                <img src={displayPhoto} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                    <UserIcon size={48} />
                                </div>
                            )}
                        </div>
                        {profile.account_status === 'Active' && (
                            <div className="absolute bottom-2 right-2 bg-green-500 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm">
                                Active
                            </div>
                        )}
                    </div>

                    <div className="flex-1 pb-2">
                        <h2 className="text-3xl font-bold text-navy mb-1">{profile.full_name}</h2>
                        <div className="flex flex-wrap gap-3 text-gray-600 text-sm">
                            <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                <GraduationCap size={16} className="text-orange" />
                                Beswan Djarum {profile.generation}
                            </span>
                            <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                                <Building2 size={16} className="text-azure" />
                                {profile.university}
                            </span>
                        </div>
                    </div>

                    <div className="pb-2">
                        <button className="bg-navy text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm hover:bg-navy/90 transition">
                            Edit Profil
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Grid Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Col: Contact & Personal */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-navy mb-4 border-b border-gray-100 pb-2">Informasi Kontak</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <Mail size={18} className="text-gray-400 mt-1" />
                                <div>
                                    <p className="text-xs text-gray-400">Email</p>
                                    <p className="text-sm font-medium text-gray-700 break-all">{profile.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Phone size={18} className="text-gray-400 mt-1" />
                                <div>
                                    <p className="text-xs text-gray-400">Whatsapp</p>
                                    <p className="text-sm font-medium text-gray-700">{profile.phone || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <MapPin size={18} className="text-gray-400 mt-1" />
                                <div>
                                    <p className="text-xs text-gray-400">Domisili</p>
                                    <p className="text-sm font-medium text-gray-700">
                                        {profile.domicile_city}, {profile.domicile_province}
                                    </p>
                                </div>
                            </div>
                            {profile.linkedin_url && (
                                <div className="flex items-start gap-3">
                                    <Linkedin size={18} className="text-blue-600 mt-1" />
                                    <div>
                                        <p className="text-xs text-gray-400">LinkedIn</p>
                                        <a href={profile.linkedin_url} target="_blank" className="text-sm font-medium text-blue-600 hover:underline truncate block max-w-[200px]">
                                            Lihat Profil
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Center & Right Col: Academic & Career */}
                <div className="md:col-span-2 space-y-6">

                    {/* Career Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-navy mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                            <Building2 size={20} className="text-orange" />
                            Pekerjaan & Karir
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-400">Posisi / Jabatan</p>
                                <p className="text-base font-semibold text-gray-800">{profile.job_position || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Perusahaan / Instansi</p>
                                <p className="text-base font-semibold text-gray-800">{profile.company_name || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Sektor Industri</p>
                                <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded mt-1">
                                    {profile.industry_sector || '-'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bio Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-navy mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                            <UserIcon size={20} className="text-azure" />
                            Biodata Diri
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-400">Tempat, Tanggal Lahir</p>
                                <p className="text-sm font-medium text-gray-700">
                                    {profile.birth_place ? `${profile.birth_place}, ` : ''}
                                    {profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Jenis Kelamin</p>
                                <p className="text-sm font-medium text-gray-700">{profile.gender || '-'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Jurusan</p>
                                <p className="text-sm font-medium text-gray-700">{profile.major || '-'}</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
