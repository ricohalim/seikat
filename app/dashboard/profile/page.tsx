'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Save, Loader2, User, Phone, MapPin, Linkedin, Building2, BookOpen } from 'lucide-react'

interface ProfileData {
    full_name: string
    phone: string
    domicile_city: string
    domicile_province: string
    linkedin_url: string
    photo_url: string

    // Job
    company_name: string
    job_position: string
    industry_sector: string
}

export default function EditProfilePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)

    const [formData, setFormData] = useState<ProfileData>({
        full_name: '',
        phone: '',
        domicile_city: '',
        domicile_province: '',
        linkedin_url: '',
        photo_url: '',
        company_name: '',
        job_position: '',
        industry_sector: ''
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

            if (error) {
                console.error('Error fetching profile:', error)
            } else if (data) {
                setFormData({
                    full_name: data.full_name || '',
                    phone: data.phone || '',
                    domicile_city: data.domicile_city || '',
                    domicile_province: data.domicile_province || '',
                    linkedin_url: data.linkedin_url || '',
                    photo_url: data.photo_url || '',
                    company_name: data.company_name || '',
                    job_position: data.job_position || '',
                    industry_sector: data.industry_sector || ''
                })
            }
            setLoading(false)
        }

        fetchProfile()
    }, [router])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        if (!userId) return

        const { error } = await supabase
            .from('profiles')
            .update(formData)
            .eq('id', userId)

        if (error) {
            setMessage({ type: 'error', text: 'Gagal menyimpan perubahan: ' + error.message })
        } else {
            setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' })
            // Optional: Refresh router to update Sidebar name etc if changed
            router.refresh()
        }
        setSaving(false)
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Memuat data...</div>

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-navy">Edit Profil</h2>
                <p className="text-gray-500 text-sm">Perbarui informasi terbaru Anda.</p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-8">

                {/* Section 1: Basic Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-navy border-b border-gray-100 pb-2 flex items-center gap-2">
                        <User size={20} className="text-azure" /> Informasi Dasar
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Link Foto Profil (Google Drive Public)</label>
                            <input type="text" name="photo_url" value={formData.photo_url} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none transition"
                                placeholder="https://drive.google.com/..."
                            />
                            <p className="text-[10px] text-gray-400 mt-1 ml-1">Pastikan link Google Drive sudah di-set "Anyone with the link can view".</p>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Nama Lengkap</label>
                            <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Nomor Whatsapp</label>
                            <input type="text" name="phone" value={formData.phone} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Kota Domisili</label>
                            <input type="text" name="domicile_city" value={formData.domicile_city} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Provinsi</label>
                            <input type="text" name="domicile_province" value={formData.domicile_province} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none transition"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">LinkedIn URL</label>
                            <input type="text" name="linkedin_url" value={formData.linkedin_url} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none transition"
                                placeholder="https://linkedin.com/in/..."
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Job Info */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-navy border-b border-gray-100 pb-2 flex items-center gap-2">
                        <Building2 size={20} className="text-orange" /> Pekerjaan
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Jabatan / Posisi</label>
                            <input type="text" name="job_position" value={formData.job_position} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Perusahaan / Instansi</label>
                            <input type="text" name="company_name" value={formData.company_name} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none transition"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">Sektor Industri</label>
                            <input type="text" name="industry_sector" value={formData.industry_sector} onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none transition"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-navy text-white px-6 py-3 rounded-lg font-bold shadow-md hover:bg-navy/90 transition flex items-center gap-2 disabled:opacity-50"
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
        </div>
    )
}
