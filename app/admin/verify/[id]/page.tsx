'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, User, GraduationCap, Briefcase } from 'lucide-react'

export default function VerifyDetailPage() {
    const params = useParams()
    const id = params?.id as string

    const [registrant, setRegistrant] = useState<any>(null)
    const [duplicates, setDuplicates] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        if (!id) return

        const fetchData = async () => {
            // 1. Fetch Registrant Data
            const { data, error } = await supabase
                .from('temp_registrations')
                .select('*')
                .eq('id', id)
                .single()

            if (error || !data) {
                alert('Data tidak ditemukan. ID: ' + id)
                router.push('/admin/verify')
                return
            }

            setRegistrant(data)

            // 2. Smart Duplicate Check
            // Check similarities in profiles based on Name AND (Generation OR University)
            const meta = data.raw_data || {}
            if (data.full_name) {
                const { data: dupes } = await supabase
                    .from('profiles')
                    .select('id, full_name, generation, university, major, email, account_status')
                    .or(`full_name.ilike.%${data.full_name}%`) // Basic name match
                    .neq('account_status', 'Pending') // Exclude self (which is Pending)
                    .limit(5)

                if (dupes) {
                    // Refine client-side if needed, but for now show matches
                    setDuplicates(dupes)
                }
            }

            setLoading(false)
        }

        fetchData()
    }, [id, router])



    // 1. Create Profile (Move from temp to profiles) - HANDLED BY TRIGGER OR MANUAL HERE?
    // Since we inserted into profiles during registration (with status 'Pending'), 
    const handleApprove = async () => {
        setProcessing('approve')
        try {
            // we mainly need to UPDATE the status in profiles table.

            // Find profile by email (secure search)
            const { data: profileList } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', registrant.email)
                .single() as any

            let profileId = profileList?.id

            // Update Profile Status AND Sync Data from Raw Data
            if (profileId) {
                const r = registrant.raw_data || {}

                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({
                        account_status: 'Active',

                        // Sync Data from Registration Form (Raw Data)
                        full_name: registrant.full_name,
                        phone: registrant.whatsapp,

                        // Academic
                        generation: r.generation,
                        university: r.university,
                        major: r.major,

                        // Personal
                        gender: r.gender,
                        birth_place: r.birth_place,
                        birth_date: r.birth_date,
                        domicile_city: r.domicile_city,
                        domicile_province: r.domicile_province,
                        linkedin_url: r.linkedin_url,

                        // Job
                        job_position: r.job_position,
                        company_name: r.company_name,
                        industry_sector: r.industry_sector,

                        // Sync Verification Photo
                        photo_url: r.photo_url || registrant.verification_photo_url,
                        verification_photo_url: registrant.verification_photo_url
                    })
                    .eq('id', profileId)

                if (updateError) throw updateError
            } else {
                // Should not happen if Step 2 registration worked, but handle just in case
                alert('Error: Profile User tidak ditemukan. Pastikan user sudah mendaftar via Step 2.')
                return
            }

            // 2. Update Temp Registration Status
            await supabase
                .from('temp_registrations')
                .update({ status: 'Approved' })
                .eq('id', registrant.id)

            alert('Berhasil Verifikasi! Member kini Aktif.')
            router.push('/admin/verify')

        } catch (err: any) {
            alert('Gagal memproses: ' + err.message)
        } finally {
            setProcessing(null)
        }
    }

    const handleReject = async () => {
        const reason = prompt('Masukkan alasan penolakan:')
        if (!reason) return

        setProcessing('reject')
        try {
            await supabase
                .from('temp_registrations')
                .update({
                    status: 'Rejected',
                    // raw_data: { ...registrant.raw_data, rejection_reason: reason } // Optional: Store reason
                })
                .eq('id', registrant.id)

            // Also update Profile to Blocked or leave as Pending? 
            // Ideally we should DELETE the profile auth user so they can register again or update status.
            // For now, let's just update Temp status.

            alert('Pendaftaran ditolak.')
            router.push('/admin/verify')
        } catch (err) {
            alert('Gagal menolak.')
        } finally {
        }
    }

    const handleOnHold = async () => {
        const reason = prompt('Masukkan alasan penundaan (On-Hold):')
        if (!reason) return

        setProcessing('hold')
        try {
            // 1. Update Profile (if exists) -> On-Hold (so user knows if they login)
            if (registrant.email) {
                await supabase.from('profiles').update({ account_status: 'On-Hold' }).eq('email', registrant.email)
            }

            // 2. Update Temp Registration
            await supabase
                .from('temp_registrations')
                .update({
                    status: 'On-Hold',
                    // Optional: Append reason to raw_data if we want to track history
                    // raw_data: { ...registrant.raw_data, hold_reason: reason } 
                })
                .eq('id', registrant.id)

            alert('Status diubah menjadi On-Hold.')
            router.push('/admin/verify')
        } catch (err) {
            alert('Gagal mengubah status.')
        } finally {
            setProcessing(null)
        }
    }

    if (loading) return <div className="p-8 text-center">Loading Data...</div>

    const meta = registrant?.raw_data || {}

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <Link href="/admin/verify" className="inline-flex items-center gap-2 text-gray-500 hover:text-navy text-sm font-bold transition">
                <ArrowLeft size={16} /> Kembali ke Daftar
            </Link>

            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-2xl font-bold text-navy">{registrant.full_name}</h1>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${registrant.status === 'On-Hold'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-orange/10 text-orange'
                            }`}>
                            {registrant.status === 'On-Hold' ? 'On-Hold' : 'Pending Verification'}
                        </span>
                    </div>
                    <p className="text-gray-500 text-sm">Dikirim pada: {new Date(registrant.submitted_at).toLocaleString()}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleReject}
                        disabled={!!processing}
                        className="px-6 py-2.5 rounded-xl font-bold bg-white text-red-600 border border-red-200 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing === 'reject' ? 'Menolak...' : 'Tolak'}
                    </button>
                    <button
                        onClick={handleOnHold}
                        disabled={!!processing}
                        className="px-6 py-2.5 rounded-xl font-bold bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing === 'hold' ? 'Menunda...' : 'Tunda (On-Hold)'}
                    </button>
                    <button
                        onClick={handleApprove}
                        disabled={!!processing}
                        className="px-6 py-2.5 rounded-xl font-bold bg-navy text-white hover:bg-navy/90 transition shadow-lg shadow-navy/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {processing === 'approve' ? (
                            <>
                                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                Memproses...
                            </>
                        ) : (
                            <>
                                <CheckCircle size={18} /> Setujui Member
                            </>
                        )}
                    </button>
                </div>
            </header>

            {/* DUPLICATE WARNING */}
            {
                duplicates.length > 0 && (
                    <div className="bg-orange/10 border border-orange/20 rounded-2xl p-6 animate-in slide-in-from-top-4">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-white rounded-full text-orange shadow-sm">
                                <AlertTriangle size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold text-navy mb-1">Potensi Duplikat Ditemukan!</h3>
                                <p className="text-gray-600 text-sm mb-4">Sistem menemukan {duplicates.length} alumni yang memiliki kemiripan nama di database.</p>

                                <div className="bg-white rounded-xl border border-orange/20 overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-orange/5 text-orange font-bold uppercase text-xs">
                                            <tr>
                                                <th className="p-3">Nama Lengkap</th>
                                                <th className="p-3">Angkatan</th>
                                                <th className="p-3">Kampus</th>
                                                <th className="p-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {duplicates.map(d => (
                                                <tr key={d.id} className="hover:bg-gray-50">
                                                    <td className="p-3 font-semibold text-navy">{d.full_name}</td>
                                                    <td className="p-3 text-gray-500">{d.generation}</td>
                                                    <td className="p-3 text-gray-500">{d.university}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${d.account_status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                            {d.account_status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* DATA VIEW - LIMITED BASED ON ROLE CONSTRAINTS */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 text-navy font-bold">
                    <User size={18} /> Data Pribadi
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold">Nama Lengkap</label>
                        <p className="font-semibold text-navy text-lg">{meta.full_name}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold">Email</label>
                        <p className="font-semibold text-navy">{registrant.email}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold">Jenis Kelamin</label>
                        <p className="font-semibold text-navy">{meta.gender || '-'}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold">Tempat, Tanggal Lahir</label>
                        <p className="font-semibold text-navy">
                            {meta.birth_place || '-'}, {meta.birth_date ? new Date(meta.birth_date).toLocaleDateString() : '-'}
                        </p>
                    </div>
                    {/* NEW: Verification Photo */}
                    <div className="md:col-span-2">
                        <label className="text-xs text-gray-400 uppercase font-bold block mb-2">Foto Profil (Smart Casual)</label>
                        {(registrant.raw_data?.photo_url || registrant.verification_photo_url || meta.verification_photo_url) ? (
                            <div className="relative w-full max-w-sm h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group cursor-pointer" onClick={() => window.open(registrant.raw_data?.photo_url || registrant.verification_photo_url || meta.verification_photo_url, '_blank')}>
                                <img src={registrant.raw_data?.photo_url || registrant.verification_photo_url || meta.verification_photo_url} alt="Verifikasi" className="w-full h-full object-cover group-hover:scale-105 transition" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold">
                                    Klik untuk memperbesar
                                </div>
                            </div>
                        ) : (
                            <p className="text-red-500 text-sm italic">Tidak ada dokumen dilampirkan.</p>
                        )}
                    </div>
                </div>

                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 text-navy font-bold mt-2">
                    <GraduationCap size={18} /> Data Akademik
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold">Angkatan Beswan</label>
                        <p className="font-semibold text-navy text-lg">Beswan {meta.generation}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold">Pendidikan Terakhir</label>
                        <p className="font-semibold text-navy">{meta.education_level || '-'}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold">Universitas</label>
                        <p className="font-semibold text-navy">{meta.university || '-'}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold">Jurusan / Fakultas</label>
                        <p className="font-semibold text-navy">{meta.major || '-'} / {meta.faculty || '-'}</p>
                    </div>
                </div>

                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 text-navy font-bold mt-2">
                    <Briefcase size={18} /> Pekerjaan
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold">Posisi</label>
                        <p className="font-semibold text-navy">{meta.job_position || '-'}</p>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase font-bold">Perusahaan</label>
                        <p className="font-semibold text-navy">{meta.company_name || '-'}</p>
                    </div>
                </div>
            </div>
        </div >
    )
}
