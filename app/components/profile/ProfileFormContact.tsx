'use client'

import React, { useState, useEffect } from 'react'
import { User, AlertCircle } from 'lucide-react'
import ProfileImageUpload from '@/app/components/ProfileImageUpload'
import { ProfileData } from '@/types/profile'
import { toast } from 'sonner'
import { useNameValidation } from '@/app/hooks/useNameValidation'

interface Props {
    formData: ProfileData
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
    handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleLinkedinChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    linkedinUsername: string
    setFormData: React.Dispatch<React.SetStateAction<ProfileData>>
}

// Shared input/label classes
const inputCls = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 shadow-sm transition-all'
const selectCls = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 shadow-sm transition-all appearance-none'
const labelCls = 'text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5'

export default function ProfileFormContact({ formData, handleChange, handlePhoneChange, handleLinkedinChange, linkedinUsername, setFormData }: Props) {
    const { validateName } = useNameValidation()
    const [nameWarning, setNameWarning] = useState<string | null>(null)

    useEffect(() => {
        if (formData.full_name) {
            const validation = validateName(formData.full_name)
            setNameWarning(validation.hasWarning ? validation.message : null)
        } else {
            setNameWarning(null)
        }
    }, [formData.full_name, validateName])

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-azure rounded-l-2xl" />
            <div className="p-6 pl-7">
                <h3 className="font-bold text-navy text-sm mb-5 flex items-center gap-2">
                    <User size={15} className="text-azure" />
                    Foto &amp; Kontak
                </h3>

                <ProfileImageUpload
                    currentUrl={formData.photo_url}
                    onUploadComplete={(url) => {
                        setFormData(p => ({ ...p, photo_url: url }))
                        toast.success('Foto terupload! Jangan lupa klik "Simpan Perubahan".')
                    }}
                />

                <div className="space-y-4 mt-6">
                    <div>
                        <label className={labelCls}>Nama Lengkap</label>
                        <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required
                            className={inputCls}
                        />
                        {nameWarning ? (
                            <p className="text-xs text-orange mt-1.5 flex items-center gap-1.5 font-medium bg-orange/8 px-3 py-2 rounded-xl border border-orange/15">
                                <AlertCircle size={12} /> {nameWarning}
                            </p>
                        ) : (
                            <p className="text-[11px] text-gray-300 mt-1">Isi nama lengkap sesuai KTP tanpa gelar.</p>
                        )}
                    </div>
                    <div>
                        <label className={labelCls}>No. WhatsApp</label>
                        <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">+</span>
                            <input type="text" name="phone" value={formData.phone} onChange={handlePhoneChange}
                                placeholder="628123456789"
                                className={`${inputCls} pl-7`}
                            />
                        </div>
                        <p className="text-[11px] text-gray-300 mt-1">Gunakan kode negara (contoh: 62812...)</p>
                    </div>
                    <div>
                        <label className={labelCls}>LinkedIn Username</label>
                        <div className="flex items-stretch">
                            <span className="flex items-center bg-gray-50 border border-r-0 border-gray-200 text-gray-400 text-xs px-3 rounded-l-xl whitespace-nowrap">
                                linkedin.com/in/
                            </span>
                            <input type="text" value={linkedinUsername} onChange={handleLinkedinChange}
                                className="flex-1 px-3.5 py-2.5 bg-white border border-gray-200 rounded-r-xl text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 shadow-sm transition-all"
                                placeholder="username"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
