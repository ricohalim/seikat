'use client'

import React, { useState, useEffect } from 'react'
import { User, AlertCircle } from 'lucide-react'
import ProfileImageUpload from '@/app/components/ProfileImageUpload'
import { ProfileData } from '@/types/profile'
import { useToast } from '@/app/context/ToastContext'
import { useNameValidation } from '@/app/hooks/useNameValidation'

interface Props {
    formData: ProfileData
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
    handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleLinkedinChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    linkedinUsername: string
    setFormData: React.Dispatch<React.SetStateAction<ProfileData>>
}

export default function ProfileFormContact({ formData, handleChange, handlePhoneChange, handleLinkedinChange, linkedinUsername, setFormData }: Props) {
    const { addToast } = useToast()

    // Validation
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-azure uppercase mb-4 flex items-center gap-2 border-b border-gray-50 pb-2">
                <User size={16} /> Foto & Kontak
            </h3>

            <ProfileImageUpload
                currentUrl={formData.photo_url}
                onUploadComplete={(url) => {
                    setFormData(p => ({ ...p, photo_url: url }))
                    addToast('Foto terupload! Jangan lupa klik "Simpan Perubahan".', 'success')
                }}
            />

            <div className="space-y-4 mt-6">
                <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">Nama Lengkap</label>
                    <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                    />
                    {nameWarning ? (
                        <p className="text-xs text-orange mt-1 flex items-center gap-1 font-medium bg-orange/10 p-2 rounded-lg border border-orange/20">
                            <AlertCircle size={12} /> {nameWarning}
                        </p>
                    ) : (
                        <p className="text-[10px] text-gray-400 mt-1">Isi nama lengkap sesuai KTP tanpa gelar.</p>
                    )}
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
    )
}
