'use client'

import { useState } from 'react'
import {
    GraduationCap, Mail,
    Linkedin, User as UserIcon,
    AlertCircle, CheckCircle, X, QrCode, Calendar, Building2
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

export interface UpcomingEvent {
    id: string
    title: string
    date_start: string
    location: string
    is_online: boolean
    registration_deadline: string | null
}

export default function OverviewClient({ profile, upcomingEvents }: { profile: Profile, upcomingEvents: UpcomingEvent[] }) {
    const [isScannerOpen, setIsScannerOpen] = useState(false)
    const [showQR, setShowQR] = useState(false)

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

    return (
        <div className="space-y-5 animate-in fade-in duration-500">

            {/* ── Completion Banner ────────────────────────────── */}
            {!isVerified && (
                <div className="bg-orange/6 border border-orange/15 rounded-2xl p-4 flex items-center justify-between gap-4">
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
                <div className="relative h-28 md:h-36 bg-[#0f1e38]">

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
                                    <div className="w-full h-full flex items-center justify-center bg-navy/5">
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

            {/* ── Agenda Terdekat ──────────────────────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-navy text-sm flex items-center gap-2">
                        <Calendar size={15} className="text-azure" />
                        Agenda Terdekat
                    </h3>
                    <Link href="/dashboard/events" className="text-xs text-azure font-semibold hover:underline">
                        Lihat Semua →
                    </Link>
                </div>

                {upcomingEvents.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                        <p className="text-sm">Tidak ada agenda mendatang saat ini.</p>
                        <Link href="/dashboard/events" className="text-xs text-azure font-semibold hover:underline mt-1 inline-block">Cek halaman Events →</Link>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {upcomingEvents.map(event => {
                            const d = new Date(event.date_start)
                            const day = d.getDate()
                            const month = d.toLocaleDateString('id-ID', { month: 'short' })
                            return (
                                <Link
                                    key={event.id}
                                    href="/dashboard/events"
                                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition group"
                                >
                                    <div className="w-11 h-11 rounded-xl bg-navy/6 flex-shrink-0 flex flex-col items-center justify-center">
                                        <span className="text-[9px] font-bold text-navy/50 uppercase tracking-wide">{month}</span>
                                        <span className="text-base font-black text-navy leading-none">{day}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-navy text-sm truncate group-hover:text-azure transition">{event.title}</p>
                                        <p className="text-xs text-gray-400 truncate mt-0.5">
                                            {event.is_online ? 'Online' : (event.location || '—')}
                                        </p>
                                    </div>
                                    <span className="flex-shrink-0 text-[10px] font-bold text-azure bg-azure/8 border border-azure/15 px-2 py-0.5 rounded-md">
                                        Open
                                    </span>
                                </Link>
                            )
                        })}
                    </div>
                )}
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
