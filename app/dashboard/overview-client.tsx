'use client'

import { useState } from 'react'
import {
    Building2, MapPin, GraduationCap, Mail, Phone,
    Linkedin, Calendar, User as UserIcon, Eye, EyeOff,
    AlertCircle, CheckCircle, X
} from 'lucide-react'
import QRCode from 'react-qr-code'
import { calculateProfileCompleteness } from '@/lib/utils'
import Link from 'next/link'

// Define Profile Interface
export interface Profile {
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

    id: string
    member_id?: string // Added ID IKADBP

    // Job
    job_position: string
    company_name: string
    industry_sector: string

    linkedin_url: string
    account_status: string
    role?: string
}

export default function OverviewClient({ profile }: { profile: Profile }) {
    const [showQR, setShowQR] = useState(false) // State for QR Modal
    const [isPrivacyMode, setIsPrivacyMode] = useState(false) // State for Privacy Mode

    // Calculate Integrity
    const completionPercentage = calculateProfileCompleteness(profile)
    const isVerified = completionPercentage >= 90

    // Helper to convert GDrive links to direct format
    const getOptimizedImageUrl = (url: string) => {
        if (!url) return null;
        if (url.includes('drive.google.com')) {
            const idMatch = url.match(/[-\w]{25,}/);
            if (idMatch) {
                return `https://drive.google.com/thumbnail?id=${idMatch[0]}&sz=w400`;
            }
        }
        return url;
    }

    const displayPhoto = getOptimizedImageUrl(profile.photo_url);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">

            {/* Verification Status Banner (If incomplete) */}
            {!isVerified && (
                <div className="bg-orange/10 border border-orange/20 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-orange/20 p-2 rounded-full text-orange">
                            <AlertCircle size={20} />
                        </div>
                        <div>
                            <h4 className="font-bold text-navy text-sm">Profil Belum Lengkap ({completionPercentage}%)</h4>
                            <p className="text-xs text-gray-600">Lengkapi profil Anda hingga 90% untuk mendapatkan lencana Verified dan akses fitur Agenda.</p>
                        </div>
                    </div>
                    <Link href="/dashboard/profile" className="text-xs font-bold bg-white border border-orange/30 text-orange px-3 py-2 rounded-lg hover:bg-orange/5 transition">
                        Lengkapi Profil
                    </Link>
                </div>
            )}

            {/* 1. Header Card (Hero) */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-navy to-azure opacity-90"></div>

                <div className="relative pt-16 flex flex-col md:flex-row items-end md:items-end gap-6">
                    <div className="relative">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-md bg-gray-200 overflow-hidden relative">
                            {/* ... img logic ... */}
                            {displayPhoto ? (
                                <img src={displayPhoto} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                                    <UserIcon size={48} />
                                </div>
                            )}
                        </div>
                        {isVerified && (
                            <div className="absolute bottom-2 right-2 bg-gradient-to-br from-blue-500 to-blue-600 text-white p-2 rounded-full border-4 border-white shadow-lg z-10" title="Verified Member">
                                <CheckCircle size={20} fill="white" className="text-blue-600" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 pb-2">
                        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                            <h2 className="text-3xl font-bold text-navy">{profile.full_name}</h2>

                            {/* Admin Badge - Only for admins */}
                            {['admin', 'superadmin'].includes(profile.role || '') && (
                                <Link
                                    href="/admin"
                                    className="hidden md:inline-flex items-center gap-1 bg-purple-50 border border-purple-100 text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hover:bg-purple-100 transition"
                                >
                                    Admin Portal
                                </Link>
                            )}
                        </div>

                        {/* MEMBER ID DISPLAY - CLEANER LOOK */}
                        <div className="flex items-center gap-3 mb-4">
                            {profile.member_id ? (
                                <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-navy/40"></span>
                                    ID: <span className="font-mono text-navy font-bold tracking-wider">{profile.member_id}</span>
                                </span>
                            ) : (
                                <span className="text-sm font-medium text-gray-400 italic flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                    No Member ID
                                </span>
                            )}

                            {/* Mobile Admin Badge */}
                            {['admin', 'superadmin'].includes(profile.role || '') && (
                                <Link
                                    href="/admin"
                                    className="md:hidden inline-flex items-center gap-1 bg-purple-50 border border-purple-100 text-purple-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider hover:bg-purple-100 transition"
                                >
                                    Admin
                                </Link>
                            )}
                        </div>

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

                    <div className="pb-2 flex gap-3">
                        <button
                            onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition ${isPrivacyMode
                                ? 'bg-navy text-white hover:bg-navy/90 border border-navy'
                                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                            title={isPrivacyMode ? "Nonaktifkan Mode Privasi" : "Aktifkan Mode Privasi"}
                        >
                            {isPrivacyMode ? <EyeOff size={18} /> : <Eye size={18} />}
                            <span className="hidden md:inline">{isPrivacyMode ? 'Privasi On' : 'Privasi Off'}</span>
                        </button>

                        <button
                            onClick={() => setShowQR(true)}
                            className="bg-white border border-gray-200 text-navy px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 transition flex items-center gap-2"
                        >
                            <span className="w-5 h-5 flex items-center justify-center bg-navy text-white text-[8px] rounded">QR</span>
                            ID Member
                        </button>
                    </div>

                    <div className="absolute top-4 right-4 md:static md:hidden">
                        {/* Mobile extra actions if needed */}
                    </div>
                </div >
            </div >



            {/* ... Grid Content ... */}
            < div className="grid grid-cols-1 md:grid-cols-3 gap-6" >
                {/* ... existing content ... */}

                {/* Left Col: Contact & Personal */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                        <h3 className="font-bold text-navy mb-4 border-b border-gray-100 pb-2">Informasi Kontak</h3>
                        <div className={`space-y-4 transition-all duration-300 ${isPrivacyMode ? 'filter blur-sm select-none' : ''}`}>
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
                        {isPrivacyMode && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <div className="bg-white/80 px-3 py-1 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">
                                    <EyeOff size={14} className="text-gray-500" />
                                    <span className="text-xs font-bold text-gray-500">Disembunyikan</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Bio Section (Moved here for balance) */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                        <h3 className="font-bold text-navy mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                            <UserIcon size={20} className="text-azure" />
                            Biodata Diri
                        </h3>
                        <div className={`space-y-4 transition-all duration-300 ${isPrivacyMode ? 'filter blur-sm select-none' : ''}`}>
                            <div>
                                <p className="text-xs text-gray-400">Tempat, Tanggal Lahir</p>
                                <p className="text-sm font-medium text-gray-700">
                                    {profile.birth_place ? `${profile.birth_place}, ` : ''}
                                    {profile.birth_date ? new Date(profile.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
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
                        {isPrivacyMode && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <div className="bg-white/80 px-3 py-1 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">
                                    <EyeOff size={14} className="text-gray-500" />
                                    <span className="text-xs font-bold text-gray-500">Disembunyikan</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Center & Right Col: Academic & Career */}
                <div className="md:col-span-2 space-y-6">

                    {/* Career Section */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                        <h3 className="font-bold text-navy mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                            <Building2 size={20} className="text-orange" />
                            Pekerjaan & Karir
                        </h3>
                        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300 ${isPrivacyMode ? 'filter blur-sm select-none' : ''}`}>
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
                        {isPrivacyMode && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <div className="bg-white/80 px-3 py-1 rounded-full border border-gray-200 shadow-sm flex items-center gap-2">
                                    <EyeOff size={14} className="text-gray-500" />
                                    <span className="text-xs font-bold text-gray-500">Disembunyikan</span>
                                </div>
                            </div>
                        )}
                    </div>



                </div>
            </div >

            {/* QR Modal */}
            {
                showQR && (
                    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center relative zoom-in-95 duration-200">
                            <button
                                onClick={() => setShowQR(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
                            >
                                <X size={24} />
                            </button>

                            <h3 className="text-xl font-bold text-navy mb-2">ID Anggota</h3>
                            <p className="text-sm text-gray-500 mb-6">Tunjukkan QR Code ini untuk verifikasi.</p>

                            <div className="bg-white p-4 rounded-xl border-2 border-navy/10 inline-block shadow-sm">
                                <QRCode
                                    value={profile.member_id || profile.id || ""}
                                    size={200}
                                    level="H"
                                />
                            </div>

                            <p className="text-lg font-mono font-bold text-navy mt-6 tracking-widest break-all">
                                {profile.member_id || '-'}
                            </p>
                            <p className="text-xs text-gray-400 mt-1 break-all">
                                UID: {profile.id}
                            </p>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
