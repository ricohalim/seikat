'use client'

import { useState } from 'react'
import {
    Building2, MapPin, GraduationCap, Mail, Phone,
    Linkedin, User as UserIcon, Eye, EyeOff,
    AlertCircle, CheckCircle, X, QrCode
} from 'lucide-react'
import { EventScannerModal } from '../components/EventScannerModal'
import QRCode from 'react-qr-code'
import { calculateProfileCompleteness, sanitizeExternalUrl } from '@/lib/utils'
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
    const [showPrivacy, setShowPrivacy] = useState(false)
    const [isScannerOpen, setIsScannerOpen] = useState(false) // State for Event Scanner
    const [showQR, setShowQR] = useState(false) // State for Member ID QR
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
    const safeLinkedIn = sanitizeExternalUrl(profile.linkedin_url);

    // ── Banner color berdasarkan angkatan ─────────────────────────────────
    const getBannerGradient = (generation: string) => {
        const yearMatch = generation?.match(/\d{4}/)
        const year = yearMatch ? parseInt(yearMatch[0]) : 0
        if (year >= 2022) return 'from-[#0f1e38] via-[#162B52] to-[#0068C7]'
        if (year >= 2019) return 'from-[#1a1a2e] via-[#16213e] to-[#0f3460]'
        if (year >= 2016) return 'from-[#0d1b2a] via-[#1b263b] to-[#415a77]'
        if (year >= 2013) return 'from-[#2d1b69] via-[#11998e] to-[#38ef7d]'
        return 'from-[#0f1e38] via-[#162B52] to-[#0068C7]'
    }

    const bannerGradient = getBannerGradient(profile.generation)

    return (
        <div className="space-y-5 animate-in fade-in duration-500">

            {/* ── Completion Banner ────────────────────────────── */}
            {!isVerified && (
                <div className="bg-gradient-to-r from-orange/8 to-orange/4 border border-orange/15 rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-orange/10 border border-orange/20 flex items-center justify-center flex-shrink-0">
                            <AlertCircle size={18} className="text-orange" />
                        </div>
                        <div className="min-w-0">
                            <h4 className="font-bold text-navy text-sm">Profil {completionPercentage}% — Belum Verified</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-1.5 bg-orange/15 rounded-full overflow-hidden max-w-[140px]">
                                    <div
                                        className="h-full bg-orange rounded-full transition-all duration-700"
                                        style={{ width: `${completionPercentage}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-gray-500 whitespace-nowrap hidden sm:block">
                                    Butuh 90% untuk lencana Verified
                                </p>
                            </div>
                        </div>
                    </div>
                    <Link
                        href="/dashboard/profile"
                        className="flex-shrink-0 text-xs font-bold bg-white border border-orange/25 text-orange px-3 py-2 rounded-xl hover:bg-orange hover:text-white transition-all duration-200 whitespace-nowrap"
                    >
                        Lengkapi →
                    </Link>
                </div>
            )}

            {/* ── Profile Header Card ──────────────────────────── */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                {/* Banner */}
                <div className={`relative h-28 md:h-36 bg-gradient-to-r ${bannerGradient}`}>
                    {/* SVG hex pattern overlay */}
                    <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="hex" x="0" y="0" width="40" height="46" patternUnits="userSpaceOnUse">
                                <polygon points="20,2 38,12 38,34 20,44 2,34 2,12" fill="none" stroke="white" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#hex)" />
                    </svg>
                    {/* Glow spot */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -translate-y-12 translate-x-12 pointer-events-none" />

                    {/* Angkatan label di banner */}
                    {profile.generation && (
                        <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-sm border border-white/15 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                            {profile.generation.split('(')[0].trim()}
                        </div>
                    )}
                </div>

                {/* Content below banner */}
                <div className="px-6 md:px-8 pb-6">
                    <div className="flex flex-col md:flex-row md:items-end gap-4">

                        {/* Avatar — overlapping banner */}
                        <div className="relative flex-shrink-0 -mt-14 md:-mt-16">
                            <div className={`w-24 h-24 md:w-28 md:h-28 rounded-2xl border-4 border-white shadow-xl bg-gray-100 overflow-hidden ring-2 ${isVerified ? 'ring-azure/40' : 'ring-orange/30'}`}>
                                {displayPhoto ? (
                                    <img src={displayPhoto} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-navy/10 to-azure/10">
                                        <UserIcon size={36} className="text-navy/30" />
                                    </div>
                                )}
                            </div>
                            {isVerified && (
                                <div
                                    className="absolute -bottom-1 -right-1 bg-azure text-white p-1 rounded-full border-2 border-white shadow-md z-10"
                                    title="Verified Member"
                                >
                                    <CheckCircle size={14} strokeWidth={2.5} />
                                </div>
                            )}
                        </div>

                        {/* Name + badges + chips */}
                        <div className="flex-1 min-w-0 pt-2">
                            <div className="mb-1">
                                <h2 className="text-xl md:text-2xl font-black text-navy tracking-tight truncate">
                                    {profile.full_name}
                                </h2>
                            </div>

                            {/* Info pills */}
                            <div className="flex flex-wrap gap-2 mt-2">
                                {profile.generation && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-navy/70 bg-navy/5 border border-navy/8 px-2.5 py-1 rounded-lg">
                                        <GraduationCap size={13} className="text-orange flex-shrink-0" />
                                        Beswan {profile.generation}
                                    </span>
                                )}
                                {profile.university && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-navy/70 bg-navy/5 border border-navy/8 px-2.5 py-1 rounded-lg max-w-[220px] truncate">
                                        <Building2 size={13} className="text-azure flex-shrink-0" />
                                        {profile.university}
                                    </span>
                                )}
                                {profile.member_id && (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-50 border border-gray-100 px-2.5 py-1 rounded-lg font-mono">
                                        <span className="w-1.5 h-1.5 rounded-full bg-navy/30 flex-shrink-0" />
                                        {profile.member_id}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 flex-wrap mt-1 md:mt-0">
                            <button
                                onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                                title={isPrivacyMode ? 'Nonaktifkan Mode Privasi' : 'Aktifkan Mode Privasi'}
                                className={`p-2.5 rounded-xl border text-sm font-bold transition-all duration-200 ${
                                    isPrivacyMode
                                        ? 'bg-navy text-white border-navy shadow-md shadow-navy/20'
                                        : 'bg-white text-gray-400 border-gray-200 hover:text-navy hover:border-navy/30'
                                }`}
                            >
                                {isPrivacyMode ? <EyeOff size={17} /> : <Eye size={17} />}
                            </button>

                            <button
                                onClick={() => setIsScannerOpen(true)}
                                className="flex items-center gap-2 bg-navy text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-[#1a3561] hover:shadow-md hover:shadow-navy/20 transition-all duration-200 active:scale-95"
                            >
                                <QrCode size={15} className="flex-shrink-0" />
                                Scan Event
                            </button>

                            <button
                                onClick={() => setShowQR(true)}
                                className="flex items-center gap-2 bg-white text-navy border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-bold hover:border-navy/30 hover:bg-navy/3 transition-all duration-200 active:scale-95"
                            >
                                <span className="w-4 h-4 flex items-center justify-center bg-navy text-white text-[8px] font-black rounded flex-shrink-0">QR</span>
                                ID Member
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Info Grid ────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Left: Kontak */}
                <div className="h-full">

                    {/* Kontak */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative h-full">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-azure to-azure/30 rounded-l-2xl" />
                        <div className="p-5 pl-6">
                            <h3 className="font-bold text-navy text-sm mb-4 flex items-center gap-2">
                                <Mail size={15} className="text-azure" />
                                Informasi Kontak
                            </h3>
                            <div className={`space-y-3.5 transition-all duration-300 ${isPrivacyMode ? 'blur-sm select-none pointer-events-none' : ''}`}>
                                {[
                                    { icon: <Mail size={15} className="text-gray-300" />, label: 'Email', value: profile.email },
                                    { icon: <Phone size={15} className="text-gray-300" />, label: 'WhatsApp', value: profile.phone || '-' },
                                    { icon: <MapPin size={15} className="text-gray-300" />, label: 'Domisili', value: `${profile.domicile_city || '-'}, ${profile.domicile_province || '-'}` },
                                ].map(item => (
                                    <div key={item.label} className="flex items-start gap-3">
                                        <div className="mt-0.5 flex-shrink-0">{item.icon}</div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{item.label}</p>
                                            <p className="text-sm text-gray-700 font-medium truncate">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                                {safeLinkedIn && (
                                    <div className="flex items-start gap-3">
                                        <Linkedin size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">LinkedIn</p>
                                            <a href={safeLinkedIn} target="_blank" rel="noopener noreferrer nofollow" className="text-sm text-azure hover:underline font-medium">
                                                Lihat Profil →
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {isPrivacyMode && (
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <span className="bg-white/90 border border-gray-200 text-gray-400 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                        <EyeOff size={12} /> Disembunyikan
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* Right: Karir */}
                <div className="h-full">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative h-full">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-navy to-azure/50 rounded-l-2xl" />
                        <div className="p-5 pl-6 relative">
                            <h3 className="font-bold text-navy text-sm mb-4 flex items-center gap-2">
                                <Building2 size={15} className="text-navy" />
                                Pekerjaan & Karir
                            </h3>
                            <div className={`transition-all duration-300 ${isPrivacyMode ? 'blur-sm select-none pointer-events-none' : ''}`}>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {[
                                        { label: 'Posisi / Jabatan', value: profile.job_position, large: true },
                                        { label: 'Perusahaan / Instansi', value: profile.company_name, large: true },
                                    ].map(item => (
                                        <div key={item.label} className="bg-gray-50/60 border border-gray-100 rounded-xl p-3.5">
                                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1">{item.label}</p>
                                            <p className="text-sm font-semibold text-gray-800">{item.value || '—'}</p>
                                        </div>
                                    ))}
                                    {profile.industry_sector && (
                                        <div className="sm:col-span-2">
                                            <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest mb-1.5">Sektor Industri</p>
                                            <span className="inline-flex items-center gap-1.5 bg-azure/8 text-azure border border-azure/15 text-xs font-bold px-3 py-1.5 rounded-full">
                                                {profile.industry_sector}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {isPrivacyMode && (
                                <div className="absolute inset-0 flex items-center justify-center z-10">
                                    <span className="bg-white/90 border border-gray-200 text-gray-400 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                                        <EyeOff size={12} /> Disembunyikan
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

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
            {/* Event Scanner Modal */}
            <EventScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
        </div >
    )
}
