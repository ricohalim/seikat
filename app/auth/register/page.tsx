'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowRight, ArrowLeft, User, Briefcase, MapPin, GraduationCap, Heart, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react'
import {
    GENDERS, GENERATIONS, EDUCATION_LEVELS, COUNTRIES, PROVINCES,
    UNIVERSITIES, FACULTIES, JOB_TYPES, BUSINESS_FIELDS, INDUSTRY_SECTORS
} from '@/lib/constants'

export default function RegisterPage() {
    const [step, setStep] = useState(1) // 1: Cek Email, 2: Form

    // Form Data
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // Detailed Form Data
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        gender: '',
        birth_place: '',
        birth_date: '',

        // Academic
        generation: '',
        education_level: '',
        current_education_level: '',
        current_university: '',
        university: '',
        faculty: '',
        major: '',

        // Domicile
        domicile_country: 'INDONESIA',
        domicile_province: '',
        domicile_city: '',

        // Job
        job_type: '',
        job_position: '',
        company_name: '',
        industry_sector: '',
        linkedin_url: '',

        // Business & Interests
        hobbies: '',
        interests: '',
        communities: '',
        has_business: false,
        business_name: '',
        business_desc: '',
        business_field: '',
        business_position: '',
        business_location: '',

        photo_url: ''
    })

    const [linkedinUsername, setLinkedinUsername] = useState('')
    const [isSameEducation, setIsSameEducation] = useState(true)
    const [tncAccepted, setTncAccepted] = useState(false)

    // UI States
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [checkResult, setCheckResult] = useState<{ status: 'pending' | 'approved' | 'available' | 'error', message: string } | null>(null)

    // Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        if (name === 'university') {
            setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target
        setFormData(prev => ({ ...prev, [name]: checked }))
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9+]/g, '')
        if (val.startsWith('0')) val = '62' + val.substring(1)
        setFormData(prev => ({ ...prev, phone: val }))
    }

    // STEP 1: Email Check
    const handleEmailCheck = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setCheckResult(null)

        try {
            // 1. Check profiles table first (Active Members)
            const { data: profileList, error: profileError } = await supabase
                .from('profiles')
                .select('account_status')
                .ilike('email', email)

            if (profileList && profileList.length > 0) {
                if (profileList && profileList.length > 0) {
                    const profile = profileList[0]

                    // STRICT CHECK: If any profile exists with this email, we BLOCK it.
                    if (profile.account_status === 'Pending') {
                        setCheckResult({ status: 'pending', message: 'Email sedang dalam proses verifikasi pendaftaran.' })
                    } else {
                        setCheckResult({ status: 'approved', message: 'Email sudah terdaftar sebagai anggota. Silahkan Login.' })
                    }
                    return
                }
            }

            // 2. Check temp_registrations (Recent Signups)
            const { data: tempList, error: tempError } = await supabase
                .from('temp_registrations')
                .select('status')
                .ilike('email', email)
                .order('submitted_at', { ascending: false }) // Check latest submission

            if (tempError) throw tempError

            if (tempList && tempList.length > 0) {
                const tempUser = tempList[0]

                if (tempUser.status === 'Pending') {
                    setCheckResult({ status: 'pending', message: 'Email sedang dalam proses verifikasi pendaftaran. Mohon tunggu informasi selanjutnya.' })
                    return
                } else if (tempUser.status === 'Approved') {
                    setCheckResult({ status: 'approved', message: 'Email sudah terdaftar sebagai anggota aktif. Silahkan Login.' })
                    return
                }
                // If Rejected, we might allow re-registration, so we don't return here.
            }

            // Valid -> Proceed to Step 2
            setCheckResult(null)
            setStep(2)

        } catch (err: any) {
            setError(err.message || 'Gagal mengecek email')
        } finally {
            setLoading(false)
        }
    }

    // TnC Handler
    const [showTnC, setShowTnC] = useState(false)

    // Triggered by "Daftar Sekarang" button
    const handleRegisterClick = (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setError('Password tidak sama')
            return
        }
        setShowTnC(true)
    }

    // Triggered by "Saya Mengerti & Setuju" inside TnC
    const onAgreeTnC = () => {
        setShowTnC(false)
        // Call the actual submit function passed as an event or call it directly
        // We need to create a synthetic event or refactor handleSubmit to not need one
        handleSubmitActual()
    }

    // STEP 2: Full Submit (Refactored)
    const handleSubmitActual = async () => {
        setLoading(true)
        setError(null)

        try {
            const phoneClean = formData.phone.startsWith('62') || formData.phone.startsWith('+')
                ? formData.phone
                : '62' + formData.phone.replace(/^0+/, '')

            let finalLinkedin = ''
            if (linkedinUsername) {
                let cleanUser = linkedinUsername
                if (cleanUser.includes('linkedin.com/in/')) {
                    cleanUser = cleanUser.split('linkedin.com/in/')[1].replace(/\/$/, '')
                }
                finalLinkedin = `https://www.linkedin.com/in/${cleanUser}`
            }

            const currentEdLevel = isSameEducation ? formData.education_level : formData.current_education_level

            const profilePayload = {
                ...formData,
                phone: phoneClean,
                linkedin_url: finalLinkedin,
                current_education_level: currentEdLevel,
                birth_date: formData.birth_date || null,
                account_status: 'Pending'
            }

            // Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { full_name: formData.full_name } }
            })

            if (authError) throw authError

            if (authData.user) {
                // Upsert Profile
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: authData.user.id,
                    email: email, // Save email for searchability
                    ...profilePayload
                })

                // Also save to temp_registrations for admin review
                await supabase.from('temp_registrations').insert({
                    email,
                    full_name: formData.full_name,
                    whatsapp: phoneClean,
                    status: 'Pending',
                    raw_data: profilePayload
                })

                setSuccess(true)
            }

        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan saat mendaftar.')
        } finally {
            setLoading(false)
        }
    }

    // Original submit handler kept for form validity check but redirected
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirmPassword) {
            setError('Password tidak sama')
            return
        }
        setShowTnC(true)
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 animate-in fade-in duration-500">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={40} />
                    </div>
                    <h2 className="text-3xl font-bold text-navy mb-2">Pendaftaran Berhasil!</h2>
                    <p className="text-gray-600 mb-8">
                        Data Anda telah kami terima. Mohon tunggu proses verifikasi admin kami.
                        Silakan login untuk memantau status Anda.
                    </p>
                    <Link href="/auth/login" className="block w-full bg-navy text-white py-4 rounded-xl font-bold text-lg hover:bg-navy/90 transition shadow-lg shadow-navy/20">
                        Kembali ke Login
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 animate-in fade-in duration-500">
            {/* TnC Modal */}
            {showTnC && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-xl font-bold text-navy">Syarat dan Ketentuan Perlindungan Data</h3>
                            <button onClick={() => setShowTnC(false)} className="text-gray-400 hover:text-red-500 transition">
                                <span className="text-2xl">×</span>
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto text-sm text-gray-600 space-y-4 leading-relaxed">
                            <p className="font-medium text-navy">Terima kasih telah menjadi bagian dari Ikatan Alumni Djarum Beasiswa Plus (IKADBP).</p>
                            <p>Sebagai anggota IKADBP, Anda menyetujui syarat dan ketentuan berikut terkait perlindungan data pribadi Anda sesuai dengan Undang-Undang Nomor 27 Tahun 2022 tentang Perlindungan Data Pribadi (UU PDP):</p>

                            <div className="space-y-1">
                                <h4 className="font-bold text-navy">1. Pengumpulan Data Pribadi</h4>
                                <p>IKADBP mengumpulkan data pribadi Anda yang diperlukan untuk keperluan administratif dan operasional organisasi, termasuk namun tidak terbatas pada nama, alamat email, nomor telepon, alamat domisili, dan informasi kontak lainnya.</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-navy">2. Tujuan Pengolahan Data Pribadi</h4>
                                <p>Data pribadi Anda digunakan untuk keperluan manajemen keanggotaan, komunikasi internal, serta pelaksanaan kegiatan dan program IKADBP. Data ini juga dapat digunakan untuk mengirimkan pembaruan, undangan, atau informasi lain yang relevan dengan Anda sebagai anggota.</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-navy">3. Dasar Hukum Pengolahan</h4>
                                <p>Pengolahan data pribadi Anda didasarkan pada persetujuan Anda sebagai subjek data, sesuai dengan ketentuan UU PDP.</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-navy">4. Perlindungan dan Keamanan Data Pribadi</h4>
                                <p>IKADBP berkomitmen untuk menjaga keamanan dan kerahasiaan data pribadi Anda. Kami menerapkan langkah-langkah teknis dan organisatoris yang sesuai untuk melindungi data pribadi Anda dari akses, pengungkapan, perubahan, atau penghapusan yang tidak sah.</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-navy">5. Pengungkapan kepada Pihak Ketiga</h4>
                                <p>IKADBP tidak akan mengungkapkan atau memberikan data pribadi Anda kepada pihak ketiga tanpa persetujuan tertulis dari Anda, kecuali jika diwajibkan oleh peraturan perundang-undangan yang berlaku.</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-navy">6. Hak Anda sebagai Subjek Data</h4>
                                <p>Anda memiliki hak-hak berikut terkait data pribadi Anda: Hak Akses, Hak Perbaikan, Hak Penghapusan.</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-navy">7. Retensi Data Pribadi</h4>
                                <p>Data pribadi Anda akan disimpan selama diperlukan untuk memenuhi tujuan pengumpulannya atau selama diwajibkan oleh peraturan perundang-undangan yang berlaku.</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-navy">8. Perubahan pada Syarat dan Ketentuan</h4>
                                <p>IKADBP berhak untuk mengubah atau memperbarui syarat dan ketentuan ini dari waktu ke waktu.</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-navy">9. Kontak dan Pengaduan</h4>
                                <p>Jika Anda memiliki pertanyaan, kekhawatiran, atau keluhan mengenai syarat dan ketentuan ini atau pengolahan data pribadi Anda, silakan hubungi kami melalui email di sekretariat.ikadbp@gmail.com.</p>
                            </div>
                            <div className="space-y-1">
                                <h4 className="font-bold text-navy">10. Hukum yang Berlaku</h4>
                                <p>Syarat dan ketentuan ini diatur dan ditafsirkan sesuai dengan hukum yang berlaku di Republik Indonesia, termasuk UU PDP.</p>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            <button
                                onClick={() => setShowTnC(false)}
                                className="px-6 py-2.5 rounded-lg font-bold text-gray-500 hover:bg-gray-200 transition text-sm"
                            >
                                Batal
                            </button>
                            <button
                                onClick={onAgreeTnC}
                                className="px-6 py-2.5 rounded-lg font-bold bg-navy text-white hover:bg-navy/90 transition shadow-lg shadow-navy/20 text-sm flex items-center gap-2"
                            >
                                <CheckCircle size={16} /> Saya Mengerti & Setuju
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 flex flex-col md:flex-row shadow-lg">

                {/* Visual Side (Left) */}
                <div className="hidden md:flex md:w-1/3 bg-navy text-white p-8 flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-navy to-blue-900 opacity-90"></div>
                    {/* Decorative Circles */}
                    <div className="absolute top-10 right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-10 left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl"></div>

                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold mb-2">Portal<br />IKADBP</h2>
                        <p className="text-white/70 text-sm">Jalin koneksi, bangun relasi, dan berkontribusi bersama alumni.</p>
                    </div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                <User size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Daftar Mudah</h4>
                                <p className="text-xs text-white/60">Isi data diri dalam 2 langkah.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                                <CheckCircle size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm">Verifikasi Cepat</h4>
                                <p className="text-xs text-white/60">Status langsung terpantau.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Form Side */}
                <div className="w-full md:w-2/3 p-8 md:p-12 relative overflow-y-auto max-h-[90vh]">

                    {step === 1 && (
                        <div className="max-w-sm mx-auto animate-in slide-in-from-right-8 duration-300">
                            <div className="mb-8">
                                <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-navy text-xs font-bold mb-4">
                                    <ArrowLeft size={14} /> KEMBALI
                                </Link>
                                <h2 className="text-2xl font-bold text-navy mb-1">Mulai Pendaftaran 👋</h2>
                                <p className="text-gray-500 text-sm">Masukkan email untuk memulai.</p>
                            </div>

                            {checkResult && (
                                <div className={`p-4 rounded-xl mb-6 text-sm flex gap-3 items-start ${checkResult.status === 'approved'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-orange/10 text-orange border border-orange/20'
                                    }`}>
                                    <Info size={20} className="shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold mb-1">{checkResult.status === 'approved' ? 'Akun Sudah Ada' : 'Menunggu Verifikasi'}</p>
                                        <p>{checkResult.message}</p>
                                        {checkResult.status === 'approved' && (
                                            <Link href="/auth/login" className="inline-block mt-2 font-bold underline">Login Disini</Link>
                                        )}
                                    </div>
                                </div>
                            )}

                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm flex items-center gap-2 border border-red-100">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleEmailCheck} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-navy uppercase tracking-wide mb-2">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition"
                                        placeholder="nama@email.com"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-navy text-white py-3 rounded-xl font-bold text-lg hover:bg-navy/90 transition shadow-lg shadow-navy/20 flex items-center justify-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : (
                                        <>Lanjut <ArrowRight size={20} /></>
                                    )}
                                </button>
                            </form>

                            <p className="text-center text-sm text-gray-500 mt-8">
                                Sudah punya akun? <Link href="/auth/login" className="text-navy font-bold hover:underline">Login</Link>
                            </p>
                        </div>
                    )}


                    {step === 2 && (
                        <div className="animate-in slide-in-from-right-8 duration-300">
                            <div className="flex items-center gap-4 mb-8 sticky top-0 bg-white z-20 py-4 border-b border-gray-100">
                                <button onClick={() => setStep(1)} className="text-gray-400 hover:text-navy transition">
                                    <ArrowLeft size={24} />
                                </button>
                                <div>
                                    <h2 className="text-xl font-bold text-navy">Lengkapi Data Diri</h2>
                                    <p className="text-gray-500 text-xs truncate max-w-[200px]">{email}</p>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-8 text-sm flex items-center gap-2 border border-red-100">
                                    <AlertCircle size={18} />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-8">

                                {/* 1. Akun & Pribadi */}
                                <section className="space-y-4">
                                    <h3 className="font-bold text-navy border-b pb-2 flex items-center gap-2"><User size={18} /> Info Pribadi</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="label">Nama Lengkap</label>
                                            <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange} className="input-field" placeholder="Nama Lengkap" />
                                        </div>
                                        <div>
                                            <label className="label">Nomor Whatsapp</label>
                                            <input type="tel" name="phone" required value={formData.phone} onChange={handlePhoneChange} className="input-field" placeholder="08xxx (Wajib Aktif)" />
                                        </div>
                                        <div>
                                            <label className="label">Jenis Kelamin</label>
                                            <select name="gender" required value={formData.gender} onChange={handleChange} className="input-field bg-white">
                                                <option value="">- Pilih -</option>
                                                {GENDERS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Password</label>
                                            <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="******" />
                                        </div>
                                        <div>
                                            <label className="label">Ulangi Password</label>
                                            <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field" placeholder="******" />
                                        </div>
                                    </div>
                                </section>

                                {/* 2. Akademik */}
                                <section className="space-y-4">
                                    <h3 className="font-bold text-navy border-b pb-2 flex items-center gap-2"><GraduationCap size={18} /> Akademik</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Angkatan Beswan</label>
                                            <select name="generation" required value={formData.generation} onChange={handleChange} className="input-field bg-white">
                                                <option value="">- Pilih -</option>
                                                {GENERATIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="label">Universitas (S1)</label>
                                            <input list="universities" name="university" required value={formData.university} onChange={handleChange} className="input-field" placeholder="Nama Universitas" />
                                            <datalist id="universities">
                                                {UNIVERSITIES.map(u => <option key={u} value={u} />)}
                                            </datalist>
                                        </div>
                                        <div>
                                            <label className="label">Fakultas</label>
                                            <select name="faculty" value={formData.faculty} onChange={handleChange} className="input-field bg-white">
                                                <option value="">- Pilih -</option>
                                                {FACULTIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="label">Jurusan</label>
                                            <input type="text" name="major" required value={formData.major} onChange={handleChange} className="input-field" placeholder="Jurusan" />
                                        </div>
                                    </div>
                                </section>

                                {/* 3. Pekerjaan */}
                                <section className="space-y-4">
                                    <h3 className="font-bold text-navy border-b pb-2 flex items-center gap-2"><Briefcase size={18} /> Pekerjaan</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="label">Posisi / Jabatan</label>
                                            <input type="text" name="job_position" value={formData.job_position} onChange={handleChange} className="input-field" placeholder="Staff, Manager, CEO" />
                                        </div>
                                        <div>
                                            <label className="label">Nama Perusahaan</label>
                                            <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="input-field" placeholder="PT..." />
                                        </div>
                                    </div>
                                </section>

                                </section>

                                {/* TnC Checkbox */}
                                <div className="pt-4 border-t">
                                    <div className="flex items-start gap-3 mb-6">
                                        <div className="relative flex items-center">
                                            <input 
                                                type="checkbox" 
                                                id="tnc" 
                                                checked={tncAccepted}
                                                onChange={(e) => setTncAccepted(e.target.checked)}
                                                className="w-5 h-5 rounded border-gray-300 text-navy focus:ring-navy cursor-pointer mt-0.5"
                                            />
                                        </div>
                                        <label htmlFor="tnc" className="text-sm text-gray-600 leading-snug cursor-pointer select-none">
                                            Saya telah membaca dan menyetujui <span onClick={(e) => { e.preventDefault(); setShowTnC(true); }} className="font-bold text-navy hover:underline cursor-pointer">Syarat & Ketentuan</span> serta kebijakan privasi data IKADBP.
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !tncAccepted}
                                        className="w-full bg-navy text-white py-4 rounded-xl font-bold text-lg hover:bg-navy/90 transition shadow-lg shadow-navy/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : (
                                            <>Daftar Sekarang <CheckCircle size={20} /></>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

    <style jsx>{`
                .label {
                    display: block;
                    font-size: 0.70rem;
                    font-weight: 700;
                    color: #64748b; 
                    text-transform: uppercase;
                    margin-bottom: 0.25rem;
                }
                .input-field {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border-radius: 0.75rem;
                    border: 1px solid #e2e8f0;
                    outline: none;
                    transition: all 0.2s;
                }
                .input-field:focus {
                    border-color: #0F172A;
                    box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.1);
                }
            `}</style>
        </div >
    )
}
