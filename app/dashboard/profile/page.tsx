'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Save, Loader2, User, Building2, MapPin, GraduationCap, Briefcase, Heart } from 'lucide-react'
import {
    GENDERS, GENERATIONS, EDUCATION_LEVELS, COUNTRIES, PROVINCES,
    UNIVERSITIES, FACULTIES, JOB_TYPES, BUSINESS_FIELDS, INDUSTRY_SECTORS
} from '@/lib/constants'
import ProfileImageUpload from '@/app/components/ProfileImageUpload'

interface ProfileData {
    full_name: string
    phone: string
    gender: string
    birth_place: string
    birth_date: string

    // Academic
    generation: string
    education_level: string // Saat Beasiswa
    // For 'current' education logic
    current_education_level: string
    current_university: string // Added
    university: string
    faculty: string
    major: string

    // Domicile
    domicile_country: string
    domicile_province: string
    domicile_city: string

    // Job
    job_type: string
    job_position: string
    company_name: string
    industry_sector: string
    linkedin_url: string

    // Business & Interests
    hobbies: string
    interests: string
    communities: string
    has_business: boolean
    business_name: string
    business_desc: string
    business_field: string
    business_position: string
    business_location: string

    // Img
    photo_url: string
}

export default function EditProfilePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    // Local state for UI logic
    const [isSameEducation, setIsSameEducation] = useState(true)
    const [linkedinUsername, setLinkedinUsername] = useState('')

    const [formData, setFormData] = useState<ProfileData>({
        full_name: '',
        phone: '',
        birth_place: '',
        birth_date: '',
        gender: '',
        generation: '',
        education_level: '',
        current_education_level: '',
        current_university: '',
        university: '',
        faculty: '',
        major: '',
        domicile_country: 'INDONESIA',
        domicile_province: '',
        domicile_city: '',
        job_type: '',
        job_position: '',
        company_name: '',
        industry_sector: '',
        linkedin_url: '',
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

    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    useEffect(() => {
        async function fetchProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
                return
            }
            setUserId(user.id)

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (data) {
                // Extract Linkedin Username
                let liUser = ''
                if (data.linkedin_url) {
                    const parts = data.linkedin_url.split('/in/')
                    if (parts.length > 1) liUser = parts[1].replace('/', '')
                    else liUser = data.linkedin_url
                }
                setLinkedinUsername(liUser)

                setFormData({
                    full_name: data.full_name || '',
                    phone: data.phone || '',
                    birth_place: data.birth_place || '',
                    birth_date: data.birth_date || '',
                    gender: data.gender || '',
                    generation: data.generation || '',
                    education_level: data.education_level || '',
                    current_education_level: data.current_education_level || '',
                    current_university: data.current_university || '',
                    university: data.university || '',
                    faculty: data.faculty || '',
                    major: data.major || '',
                    domicile_country: data.domicile_country || 'INDONESIA',
                    domicile_province: data.domicile_province || '',
                    domicile_city: data.domicile_city || '',
                    job_type: data.job_type || '',
                    job_position: data.job_position || '',
                    company_name: data.company_name || '',
                    industry_sector: data.industry_sector || '',
                    linkedin_url: data.linkedin_url || '',
                    hobbies: data.hobbies || '',
                    interests: data.interests || '',
                    communities: data.communities || '',
                    has_business: data.has_business || false,
                    business_name: data.business_name || '',
                    business_desc: data.business_desc || '',
                    business_field: data.business_field || '',
                    business_position: data.business_position || '',
                    business_location: data.business_location || '',
                    photo_url: data.photo_url || ''
                })

                // Check Logic for "Same Education"
                // If current_education_level is empty OR equal to education_level, set true
                if (!data.current_education_level || data.current_education_level === data.education_level) {
                    setIsSameEducation(true)
                } else {
                    setIsSameEducation(false)
                }
            }
            setLoading(false)
        }

        fetchProfile()
    }, [router])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target

        // HYBRID UPPERCASE LOGIC
        // Fields to FORCE UPPERCASE
        const upperFields = [
            'full_name', 'birth_place', 'university', 'current_university', 'faculty', 'major',
            'job_position', 'company_name', 'industry_sector',
            'domicile_province', 'domicile_city', 'domicile_country',
            'business_name', 'business_field', 'business_position', 'business_location'
        ]

        if (upperFields.includes(name)) {
            setFormData(prev => ({ ...prev, [name]: value.toUpperCase() }))
            return
        }

        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/[^0-9+]/g, '') // Allow numbers and +

        // Auto-prefix logic? 
        // If user starts typing '08', maybe replace with '628'?
        // Or just let them type, but validate on Save. 
        // Let's force it on blur or simple replace if they type '08...'
        if (val.startsWith('0')) {
            val = '62' + val.substring(1)
        }
        setFormData(prev => ({ ...prev, phone: val }))
    }

    const handleLinkedinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLinkedinUsername(e.target.value)
    }

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target
        setFormData(prev => ({ ...prev, [name]: checked }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        if (!userId) return

        // 1. Validate Phone
        if (formData.phone && !formData.phone.startsWith('62') && !formData.phone.startsWith('+')) {
            // Default to indonesia if no code
            // But user asked for validation "Start with country code". 
            // If they typed '8123', we prepend 62.
            const cleanPhone = '62' + formData.phone.replace(/^0+/, '')
            setFormData(prev => ({ ...prev, phone: cleanPhone }))
            // Note: React state update is async, so we use local variable for submission payload
            formData.phone = cleanPhone
        }

        // 2. Prepare LinkedIn URL
        if (linkedinUsername) {
            // Remove full url junk if they pasted it despite instructions
            let cleanUser = linkedinUsername
            if (cleanUser.includes('linkedin.com/in/')) {
                cleanUser = cleanUser.split('linkedin.com/in/')[1].replace(/\/$/, '')
            }
            formData.linkedin_url = `https://www.linkedin.com/in/${cleanUser}`
        } else {
            formData.linkedin_url = ''
        }

        // 3. Handle Education Logic
        if (isSameEducation) {
            // If same, current level = scholarship level 
            formData.current_education_level = formData.education_level
        }

        // Prepare Payload
        const payload = {
            ...formData,
            birth_date: formData.birth_date || null
        }

        const { error } = await supabase
            .from('profiles')
            .update(payload)
            .eq('id', userId)

        if (error) {
            setMessage({ type: 'error', text: 'Gagal menyimpan: ' + error.message })
        } else {
            // Success Feedback
            alert('Profil berhasil diperbarui!')
            setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' })
            router.refresh()
            router.push('/dashboard') // Redirect back to see changes
        }
        setSaving(false)
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Memuat data...</div>

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-navy">Edit Profil</h2>
                <p className="text-gray-500 text-sm">Lengkapi data Anda agar akurat 100%.</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Section: FOTO & KONTAK */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-azure uppercase mb-4 flex items-center gap-2 border-b border-gray-50 pb-2">
                        <User size={16} /> Foto & Kontak
                    </h3>

                    <ProfileImageUpload
                        currentUrl={formData.photo_url}
                        onUploadComplete={(url) => {
                            setFormData(p => ({ ...p, photo_url: url }))
                            setMessage({ type: 'success', text: 'Foto terupload! Jangan lupa klik "Simpan Perubahan" di bawah.' })
                        }}
                    />

                    <div className="space-y-4 mt-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Nama Lengkap</label>
                            <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">No. Whatsapp</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-400 font-medium">+</span>
                                <input type="text" name="phone" value={formData.phone} onChange={handlePhoneChange}
                                    placeholder="628123456789"
                                    className="w-full pl-6 p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-1">Gunakan kode negara (contoh: 62812...)</p>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">LinkedIn Username</label>
                            <div className="flex items-center">
                                <span className="bg-gray-50 border border-r-0 border-gray-300 text-gray-500 text-xs p-2 rounded-l-lg">
                                    linkedin.com/in/
                                </span>
                                <input type="text" value={linkedinUsername} onChange={handleLinkedinChange}
                                    className="flex-1 p-2 border border-gray-200 rounded-r-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                    placeholder="username"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section: DATA AKADEMIK */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-azure uppercase mb-4 flex items-center gap-2 border-b border-gray-50 pb-2">
                        <GraduationCap size={16} /> Data Akademik
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Jenis Kelamin</label>
                            <select name="gender" value={formData.gender} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none bg-white"
                            >
                                <option value="">- Pilih -</option>
                                {GENDERS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Tempat Lahir</label>
                            <input type="text" name="birth_place" value={formData.birth_place} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Tanggal Lahir</label>
                            <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Angkatan</label>
                            <select name="generation" value={formData.generation} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none bg-white"
                            >
                                <option value="">- Pilih -</option>
                                {GENERATIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>

                        {/* Scholarship Education */}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Pendidikan (Saat Terima Beasiswa)</label>
                            <select name="education_level" value={formData.education_level} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none bg-white"
                            >
                                <option value="">- Pilih -</option>
                                {['D4', 'S1'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Universitas</label>
                            <input
                                list="universities-list"
                                type="text"
                                name="university"
                                value={formData.university}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                placeholder="Ketik nama universitas..."
                            />
                            <datalist id="universities-list">
                                {UNIVERSITIES.map(uni => <option key={uni} value={uni} />)}
                            </datalist>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Fakultas</label>
                            <select name="faculty" value={formData.faculty} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none bg-white"
                            >
                                <option value="">- Pilih -</option>
                                {FACULTIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Jurusan</label>
                            <input type="text" name="major" value={formData.major} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                            />
                        </div>

                        {/* Current Education Toggle */}
                        <div className="md:col-span-2 border-t border-dashed border-gray-200 pt-4 mt-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-navy mb-4 cursor-pointer">
                                <input type="checkbox" checked={isSameEducation} onChange={(e) => setIsSameEducation(e.target.checked)}
                                    className="w-4 h-4 text-navy rounded border-gray-300 focus:ring-navy"
                                />
                                Pendidikan Saat Ini sama dengan saat menerima Beasiswa?
                            </label>

                            {!isSameEducation && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-0 md:pl-6 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Jenjang Pendidikan Saat Ini</label>
                                        <select name="current_education_level" value={formData.current_education_level} onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none bg-white"
                                        >
                                            <option value="">- Pilih -</option>
                                            {EDUCATION_LEVELS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    {/* If current education is different, maybe they want to specify a NEW university? 
                                The user requirement said: "minta isi jenjang dan nama univ (user type [upper case] saja)"
                                So we need another University input for Current Ed? 
                                Assuming 'university' field in DB is for the Scholarship one. 
                                Adding 'current_university' logic? 
                                User request: "minta isi jenjang dan nama univ" implies YES.
                                But we didn't add 'current_university' to DB schema yet. 
                                We will presume we can reuse 'university' field? No that overwrites.
                                We will ask user to add `current_university` text column too or just skip for now and use generic. 
                                Wait, "nama univ (user type)"... 
                                I will add a text input, but warn about Schema. 
                             */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Universitas Saat Ini</label>
                                        <input type="text" name="current_university" value={formData.current_university} onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                            placeholder="Ketik nama universitas..."
                                        />
                                        <p className="text-[10px] text-gray-400 mt-1">Otomatis HURUF BESAR</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section: DOMISILI */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-azure uppercase mb-4 flex items-center gap-2 border-b border-gray-50 pb-2">
                        <MapPin size={16} /> Domisili
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Negara</label>
                            <select name="domicile_country" value={formData.domicile_country} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none bg-white"
                            >
                                {COUNTRIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        {formData.domicile_country === 'INDONESIA' ? (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Provinsi</label>
                                <select name="domicile_province" value={formData.domicile_province} onChange={handleChange}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none bg-white"
                                >
                                    <option value="">- Pilih -</option>
                                    {PROVINCES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Provinsi / Wilayah</label>
                                <input type="text" name="domicile_province" value={formData.domicile_province} onChange={handleChange}
                                    className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Kota</label>
                            <input type="text" name="domicile_city" value={formData.domicile_city} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Section: PEKERJAAN */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-azure uppercase mb-4 flex items-center gap-2 border-b border-gray-50 pb-2">
                        <Briefcase size={16} /> Pekerjaan
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Sektor Industri</label>
                            <select name="industry_sector" value={formData.industry_sector} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none bg-white"
                            >
                                <option value="">- Pilih -</option>
                                {INDUSTRY_SECTORS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Jenis Pekerjaan</label>
                            <select name="job_type" value={formData.job_type} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none bg-white"
                            >
                                <option value="">- Pilih -</option>
                                {JOB_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Jabatan / Posisi</label>
                            <input type="text" name="job_position" value={formData.job_position} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1">Nama Instansi / Perusahaan</label>
                            <input type="text" name="company_name" value={formData.company_name} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Section: MINAT & USAHA */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-bold text-azure uppercase mb-4 flex items-center gap-2 border-b border-gray-50 pb-2">
                        <Heart size={16} /> Minat & Usaha
                    </h3>
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Hobi</label>
                            <input type="text" name="hobbies" value={formData.hobbies} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Minat</label>
                            <input type="text" name="interests" value={formData.interests} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1">Komunitas Lain</label>
                            <input type="text" name="communities" value={formData.communities} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-0 md:pl-6 animate-in fade-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Nama Usaha</label>
                                        <input type="text" name="business_name" value={formData.business_name} onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Bidang Usaha</label>
                                        <select name="business_field" value={formData.business_field} onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none bg-white"
                                        >
                                            <option value="">- Pilih -</option>
                                            {BUSINESS_FIELDS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Deskripsi Usaha</label>
                                        <textarea name="business_desc" value={formData.business_desc} onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                            rows={2}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Jabatan dalam Usaha</label>
                                        <input type="text" name="business_position" value={formData.business_position} onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">Lokasi Usaha</label>
                                        <input type="text" name="business_location" value={formData.business_location} onChange={handleChange}
                                            className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-navy text-white px-8 py-3 rounded-lg font-bold shadow-md hover:bg-navy/90 transition flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={20} className="animate-spin" /> Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save size={20} /> Simpan Perubahan
                            </>
                        )}
                    </button>
                </div>

            </form>

            <style jsx>{`
                /* Visual feedback for user */
                input[name="full_name"],
                input[name="birth_place"],
                input[name="university"],
                input[name="current_university"],
                input[name="faculty"],
                input[name="major"],
                input[name="job_position"],
                input[name="company_name"],
                input[name="domicile_city"],
                input[name="domicile_province"],
                input[name="business_name"],
                input[name="business_position"],
                input[name="business_location"] {
                    text-transform: uppercase;
                }
            `}</style>
        </div>
    )
}
