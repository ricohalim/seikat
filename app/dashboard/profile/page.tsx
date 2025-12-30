'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'
import { useToast } from '@/app/context/ToastContext'
import { ProfileData } from '@/types/profile'

// Components
import ProfileSkeleton from '@/app/components/profile/ProfileSkeleton'
import ProfileFormContact from '@/app/components/profile/ProfileFormContact'
import ProfileFormAcademic from '@/app/components/profile/ProfileFormAcademic'
import ProfileFormJob from '@/app/components/profile/ProfileFormJob'
import ProfileFormBusiness from '@/app/components/profile/ProfileFormBusiness'

export default function EditProfilePage() {
    const router = useRouter()
    const { addToast } = useToast()

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

    useEffect(() => {
        async function fetchProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/auth/login')
                return
            }
            setUserId(user.id)

            const { data } = await supabase
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
        let val = e.target.value.replace(/[^0-9+]/g, '')
        if (val.startsWith('0')) {
            val = '62' + val.substring(1)
        }
        setFormData(prev => ({ ...prev, phone: val }))
    }

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target
        setFormData(prev => ({ ...prev, [name]: checked }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)

        if (!userId) return

        // 1. Validate Phone
        if (formData.phone && !formData.phone.startsWith('62') && !formData.phone.startsWith('+')) {
            const cleanPhone = '62' + formData.phone.replace(/^0+/, '')
            setFormData(prev => ({ ...prev, phone: cleanPhone }))
            formData.phone = cleanPhone
        }

        // 2. Prepare LinkedIn URL
        if (linkedinUsername) {
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
            formData.current_education_level = formData.education_level
        }

        const payload = {
            ...formData,
            birth_date: formData.birth_date || null
        }

        const { error } = await supabase
            .from('profiles')
            .update(payload)
            .eq('id', userId)

        if (error) {
            addToast('Gagal menyimpan: ' + error.message, 'error')
        } else {
            addToast('Profil berhasil diperbarui!', 'success')
            router.refresh()
            router.push('/dashboard')
        }
        setSaving(false)
    }

    if (loading) return <ProfileSkeleton />

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                <h2 className="text-2xl font-bold text-navy">Edit Profil</h2>
                <p className="text-gray-500 text-sm">Lengkapi data Anda agar akurat 100%.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-700">

                <ProfileFormContact
                    formData={formData}
                    handleChange={handleChange}
                    handlePhoneChange={handlePhoneChange}
                    handleLinkedinChange={(e) => setLinkedinUsername(e.target.value)}
                    linkedinUsername={linkedinUsername}
                    setFormData={setFormData}
                />

                <ProfileFormAcademic
                    formData={formData}
                    handleChange={handleChange}
                    isSameEducation={isSameEducation}
                    setIsSameEducation={setIsSameEducation}
                />

                <ProfileFormJob
                    formData={formData}
                    handleChange={handleChange}
                />

                <ProfileFormBusiness
                    formData={formData}
                    handleChange={handleChange}
                    handleCheckboxChange={handleCheckboxChange}
                />

                <div className="pt-4 flex justify-end sticky bottom-4 z-40">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-navy text-white px-8 py-3 rounded-xl font-bold shadow-xl shadow-navy/20 hover:bg-navy/90 hover:scale-[1.02] transition flex items-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
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

