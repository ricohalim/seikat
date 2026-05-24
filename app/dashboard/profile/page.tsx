'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Save, Loader2, User, GraduationCap, Briefcase, Heart } from 'lucide-react'
import { toast } from 'sonner'
import { ProfileData } from '@/types/profile'

// Components
import ProfileSkeleton from '@/app/components/profile/ProfileSkeleton'
import ProfileFormContact from '@/app/components/profile/ProfileFormContact'
import ProfileFormAcademic from '@/app/components/profile/ProfileFormAcademic'
import ProfileFormJob from '@/app/components/profile/ProfileFormJob'
import ProfileFormBusiness from '@/app/components/profile/ProfileFormBusiness'

const TABS = [
    { id: 'kontak',   label: 'Kontak',   icon: User },
    { id: 'akademik', label: 'Akademik', icon: GraduationCap },
    { id: 'pekerjaan',label: 'Pekerjaan',icon: Briefcase },
    { id: 'minat',    label: 'Minat',    icon: Heart },
] as const

type TabId = typeof TABS[number]['id']

export default function EditProfilePage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<TabId>('kontak')

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

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
            if (!user) { router.push('/auth/login'); return }
            setUserId(user.id)

            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()

            if (data) {
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
        const upperFields = [
            'full_name', 'birth_place', 'university', 'current_university', 'faculty', 'major',
            'job_position', 'company_name', 'industry_sector',
            'domicile_province', 'domicile_city', 'domicile_country',
            'business_name', 'business_field', 'business_position', 'business_location'
        ]
        setFormData(prev => ({ ...prev, [name]: upperFields.includes(name) ? value.toUpperCase() : value }))
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
        setSaving(true)
        if (!userId) return

        if (formData.phone && !formData.phone.startsWith('62') && !formData.phone.startsWith('+')) {
            const cleanPhone = '62' + formData.phone.replace(/^0+/, '')
            setFormData(prev => ({ ...prev, phone: cleanPhone }))
            formData.phone = cleanPhone
        }

        if (linkedinUsername) {
            let cleanUser = linkedinUsername
            if (cleanUser.includes('linkedin.com/in/')) cleanUser = cleanUser.split('linkedin.com/in/')[1].replace(/\/$/, '')
            formData.linkedin_url = `https://www.linkedin.com/in/${cleanUser}`
        } else {
            formData.linkedin_url = ''
        }

        if (isSameEducation) formData.current_education_level = formData.education_level

        const { error } = await supabase.from('profiles').update({ ...formData, birth_date: formData.birth_date || null }).eq('id', userId)

        if (error) {
            toast.error('Gagal menyimpan: ' + error.message)
        } else {
            toast.success('Profil berhasil diperbarui!')
            router.refresh()
            router.push('/dashboard')
        }
        setSaving(false)
    }

    if (loading) return <ProfileSkeleton />

    return (
        <div className="space-y-5 animate-in fade-in duration-500">

            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-navy/8 flex items-center justify-center flex-shrink-0">
                    <Save size={18} className="text-navy" />
                </div>
                <div>
                    <h1 className="text-xl font-black text-navy tracking-tight">Edit Profil</h1>
                    <p className="text-sm text-gray-400">Lengkapi data Anda agar akurat 100%</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Tab Pills */}
                <div className="flex gap-1 bg-gray-100/70 p-1 rounded-2xl overflow-x-auto">
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all flex-1 justify-center ${
                                    isActive
                                        ? 'bg-white text-navy shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600'
                                }`}
                            >
                                <Icon size={14} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>


                {/* Save bar */}
                <div className="flex items-center justify-between gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-2.5 shadow-sm">
                    {/* Step indicator dots */}
                    <div className="flex items-center gap-1.5">
                        {TABS.map((tab) => (
                            <div
                                key={tab.id}
                                className={`h-1.5 rounded-full transition-all duration-300 ${
                                    tab.id === activeTab ? 'w-5 bg-navy' : 'w-1.5 bg-gray-200'
                                }`}
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-navy text-white px-5 py-2 rounded-xl font-bold shadow-md shadow-navy/20 hover:bg-[#1a3561] transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50 text-sm"
                    >
                        {saving
                            ? <><Loader2 size={14} className="animate-spin" /> Menyimpan...</>
                            : <><Save size={14} /> Simpan</>
                        }
                    </button>
                </div>

                {/* Tab Content */}
                <div className="animate-in fade-in duration-300">
                    {activeTab === 'kontak' && (
                        <ProfileFormContact
                            formData={formData}
                            handleChange={handleChange}
                            handlePhoneChange={handlePhoneChange}
                            handleLinkedinChange={(e) => setLinkedinUsername(e.target.value)}
                            linkedinUsername={linkedinUsername}
                            setFormData={setFormData}
                        />
                    )}
                    {activeTab === 'akademik' && (
                        <ProfileFormAcademic
                            formData={formData}
                            handleChange={handleChange}
                            isSameEducation={isSameEducation}
                            setIsSameEducation={setIsSameEducation}
                        />
                    )}
                    {activeTab === 'pekerjaan' && (
                        <ProfileFormJob
                            formData={formData}
                            handleChange={handleChange}
                        />
                    )}
                    {activeTab === 'minat' && (
                        <ProfileFormBusiness
                            formData={formData}
                            handleChange={handleChange}
                            handleCheckboxChange={handleCheckboxChange}
                        />
                    )}
                </div>

            </form>
        </div>
    )
}


