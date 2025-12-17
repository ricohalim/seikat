'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, User, Building2, MapPin, GraduationCap, Briefcase, Heart, Check, AlertCircle } from 'lucide-react'
import {
    GENDERS, GENERATIONS, EDUCATION_LEVELS, COUNTRIES, PROVINCES,
    UNIVERSITIES, FACULTIES, JOB_TYPES, BUSINESS_FIELDS, INDUSTRY_SECTORS
} from '@/lib/constants'

export default function RegisterPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    // Form State
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    // Profile Data State
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

        photo_url: '' // Optional for now
    })

    const [isSameEducation, setIsSameEducation] = useState(true)
    const [linkedinUsername, setLinkedinUsername] = useState('')

    // Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        if (name === 'university') {
            setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9+]/g, '')
        if (val.startsWith('0')) val = '62' + val.substring(1)
        setFormData(prev => ({ ...prev, phone: val }))
    }

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target
        setFormData(prev => ({ ...prev, [name]: checked }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        // 1. Basic Validation
        if (password !== confirmPassword) {
            setError('Password tidak sama')
            setLoading(false)
            return
        }
        if (password.length < 6) {
            setError('Password minimal 6 karakter')
            setLoading(false)
            return
        }

        try {
            // 2. Prepare Data
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

            // 0. Check Existing Registration (Priority)
            // Check 'temp_registrations'
            const { data: tempList } = await supabase
                .from('temp_registrations')
                .select('status')
                .eq('email', email)
                .maybeSingle()

            if (tempList) {
                if (tempList.status === 'Pending') {
                    setError('Email ini sudah terdaftar dan sedang dalam proses verifikasi. Silakan cek status di halaman "Cek Akun".')
                    setLoading(false)
                    return
                }
                if (tempList.status === 'Approved') {
                    setError('Email ini sudah terdaftar sebagai Member Aktif. Silakan langsung Login.')
                    setLoading(false)
                    return
                }
            }

            // Check 'profiles' (Active) - if email column exists or if we rely on Auth.
            // Supabase Auth signUp will handle existing auth users, but if 'profiles' exists but auth doesn't? (Migration case)
            // We'll trust Supabase Auth 'User already registered' error for the most part, 
            // but the user specifically asked "Check email first".
            // Since we can't easily query profiles.email (if it doesn't exist/is secured), 
            // we rely on temp_registrations check above + Supabase Auth check below.

            // 3. Register Data Payload
            const profilePayload = {
                ...formData,
                phone: phoneClean,
                linkedin_url: finalLinkedin,
                current_education_level: currentEdLevel,
                birth_date: formData.birth_date || null, // Handle empty date
                account_status: 'Pending' // Default status
            }

            // 4. Supabase Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: formData.full_name, // Meta data
                    }
                }
            })

            if (authError) throw authError

            if (authData.user) {
                // 5. Insert Profile
                // Note: We used 'upsert' just in case triggers already created a row
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: authData.user.id,
                    email: email, // If email column exists in profiles
                    ...profilePayload
                })

                if (profileError) {
                    console.error('Profile Insert Error:', profileError)
                    // We don't throw here to avoid failing the whole flow if account created. 
                    // But we should warn user.
                    setError('Akun dibuat tapi gagal menyimpan profil detail: ' + profileError.message)
                } else {
                    setSuccess(true)
                }
            }

        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center animate-in zoom-in-95">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-navy mb-2">Pendaftaran Berhasil!</h2>
                    <p className="text-gray-500 mb-6">
                        Akun Anda telah dibuat. Silakan cek email Anda untuk verifikasi (jika diperlukan) atau langsung masuk.
                    </p>
                    <Link href="/auth/login" className="block w-full bg-navy text-white font-bold py-3 rounded-xl hover:bg-navy/90 transition">
                        Masuk ke Aplikasi
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            {/* Header */}
            <div className="bg-navy text-white pt-10 pb-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm font-semibold mb-6 transition-colors">
                        <ArrowLeft size={16} /> Kembali
                    </Link>
                    <h1 className="text-3xl font-extrabold mb-2">Pendaftaran Anggota</h1>
                    <p className="text-blue-200">Bergabunglah dengan ribuan alumni Beswan Djarum lainnya.</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto px-6 -mt-10">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 text-sm font-medium flex items-center gap-2 border-b border-red-100">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">

                        {/* 1. Account Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-navy uppercase border-b border-gray-100 pb-2 mb-4">Informasi Akun</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Email <span className="text-red-500">*</span></label>
                                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                        placeholder="nama@email.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Password <span className="text-red-500">*</span></label>
                                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                        placeholder="Min 6 karakter"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Konfirmasi Password <span className="text-red-500">*</span></label>
                                    <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                        placeholder="Ulangi password"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 2. Personal Info (Copy from Edit Profile) */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-navy uppercase border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                                <User size={16} /> Data Pribadi
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                                    <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">No. Whatsapp <span className="text-red-500">*</span></label>
                                    <input type="text" name="phone" required value={formData.phone} onChange={handlePhoneChange}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                        placeholder="628..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Jenis Kelamin <span className="text-red-500">*</span></label>
                                    <select name="gender" required value={formData.gender} onChange={handleChange}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none bg-white"
                                    >
                                        <option value="">- Pilih -</option>
                                        {GENDERS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Tempat Lahir</label>
                                    <input type="text" name="birth_place" value={formData.birth_place} onChange={handleChange}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Tanggal Lahir</label>
                                    <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 3. Academic */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-navy uppercase border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                                <GraduationCap size={16} /> Data Akademik
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Angkatan <span className="text-red-500">*</span></label>
                                    <select name="generation" required value={formData.generation} onChange={handleChange}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none bg-white"
                                    >
                                        <option value="">- Pilih -</option>
                                        {GENERATIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Pendidikan (Saat Beasiswa)</label>
                                    <select name="education_level" value={formData.education_level} onChange={handleChange}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none bg-white"
                                    >
                                        <option value="">- Pilih -</option>
                                        {['D4', 'S1'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Universitas <span className="text-red-500">*</span></label>
                                    <input list="universities" type="text" name="university" required value={formData.university} onChange={handleChange}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                        placeholder="Ketik nama universitas..."
                                    />
                                    <datalist id="universities">
                                        {UNIVERSITIES.map(u => <option key={u} value={u} />)}
                                    </datalist>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Fakultas</label>
                                    <select name="faculty" value={formData.faculty} onChange={handleChange}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none bg-white"
                                    >
                                        <option value="">- Pilih -</option>
                                        {FACULTIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Jurusan</label>
                                    <input type="text" name="major" value={formData.major} onChange={handleChange}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                    />
                                </div>

                                {/* Current Ed */}
                                <div className="md:col-span-2 pt-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-navy mb-2 cursor-pointer">
                                        <input type="checkbox" checked={isSameEducation} onChange={(e) => setIsSameEducation(e.target.checked)}
                                            className="w-4 h-4 text-navy rounded border-gray-300 focus:ring-navy"
                                        />
                                        Pendidikan Saat Ini sama dengan saat menerima Beasiswa?
                                    </label>

                                    {!isSameEducation && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 pl-6">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Jenjang Saat Ini</label>
                                                <select name="current_education_level" value={formData.current_education_level} onChange={handleChange}
                                                    className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none bg-white"
                                                >
                                                    <option value="">- Pilih -</option>
                                                    {EDUCATION_LEVELS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Universitas Saat Ini</label>
                                                <input type="text" name="current_university" value={formData.current_university} onChange={handleChange}
                                                    className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                                    placeholder="Nama Kampus..."
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 4. Domicile */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-navy uppercase border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                                <MapPin size={16} /> Domisili
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Negara</label>
                                    <select name="domicile_country" value={formData.domicile_country} onChange={handleChange}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none bg-white"
                                    >
                                        {COUNTRIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                {formData.domicile_country === 'INDONESIA' ? (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Provinsi</label>
                                        <select name="domicile_province" value={formData.domicile_province} onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none bg-white"
                                        >
                                            <option value="">- Pilih -</option>
                                            {PROVINCES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Provinsi / Wilayah</label>
                                        <input type="text" name="domicile_province" value={formData.domicile_province} onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Kota</label>
                                    <input type="text" name="domicile_city" value={formData.domicile_city} onChange={handleChange}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 5. Job */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-navy uppercase border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                                <Briefcase size={16} /> Pekerjaan
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Sektor Industri</label>
                                    <select name="industry_sector" value={formData.industry_sector} onChange={handleChange}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none bg-white"
                                    >
                                        <option value="">- Pilih -</option>
                                        {INDUSTRY_SECTORS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Jenis Pekerjaan</label>
                                    <select name="job_type" value={formData.job_type} onChange={handleChange}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none bg-white"
                                    >
                                        <option value="">- Pilih -</option>
                                        {JOB_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Posisi / Jabatan</label>
                                    <input type="text" name="job_position" value={formData.job_position} onChange={handleChange}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Nama Perusahaan / Instansi</label>
                                    <input type="text" name="company_name" value={formData.company_name} onChange={handleChange}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">LinkedIn Username</label>
                                    <div className="flex items-center">
                                        <span className="bg-gray-50 border border-r-0 border-gray-300 text-gray-500 text-xs p-2 rounded-l-lg">
                                            linkedin.com/in/
                                        </span>
                                        <input type="text" value={linkedinUsername} onChange={e => setLinkedinUsername(e.target.value)}
                                            className="flex-1 p-2 border border-gray-200 rounded-r-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                            placeholder="username"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 6. Interests & Business */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-navy uppercase border-b border-gray-100 pb-2 mb-4 flex items-center gap-2">
                                <Heart size={16} /> Minat & Usaha
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Hobi</label>
                                    <input type="text" name="hobbies" value={formData.hobbies} onChange={handleChange}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Minat</label>
                                    <input type="text" name="interests" value={formData.interests} onChange={handleChange}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Komunitas Lain</label>
                                    <input type="text" name="communities" value={formData.communities} onChange={handleChange}
                                        className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                    />
                                </div>

                                <div className="border-t border-gray-50 pt-4 mt-2">
                                    <label className="flex items-center gap-2 text-sm font-bold text-navy mb-4 cursor-pointer">
                                        <input type="checkbox" name="has_business" checked={formData.has_business} onChange={handleCheckboxChange}
                                            className="w-4 h-4 text-navy rounded border-gray-300 focus:ring-navy"
                                        />
                                        Memiliki Usaha / Bisnis Sendiri?
                                    </label>

                                    {formData.has_business && (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 animate-in fade-in">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Nama Usaha</label>
                                                <input type="text" name="business_name" value={formData.business_name} onChange={handleChange}
                                                    className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Bidang Usaha</label>
                                                <select name="business_field" value={formData.business_field} onChange={handleChange}
                                                    className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none bg-white"
                                                >
                                                    <option value="">- Pilih -</option>
                                                    {BUSINESS_FIELDS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Deskripsi Usaha</label>
                                                <textarea name="business_desc" value={formData.business_desc} onChange={handleChange}
                                                    className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                                    rows={2}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Jabatan dalam Usaha</label>
                                                <input type="text" name="business_position" value={formData.business_position} onChange={handleChange}
                                                    className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 mb-1">Lokasi Usaha</label>
                                                <input type="text" name="business_location" value={formData.business_location} onChange={handleChange}
                                                    className="w-full p-2 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="pt-6 border-t border-gray-100">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-navy text-white text-lg font-bold py-4 rounded-xl hover:bg-navy/90 hover:shadow-lg hover:-translate-y-1 transition-all flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
                            >
                                {loading ? <Loader2 size={24} className="animate-spin" /> : 'Daftar Sekarang'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    )
}
