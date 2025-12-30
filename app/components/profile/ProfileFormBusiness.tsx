'use client'

import React from 'react'
import { Heart } from 'lucide-react'
import { ProfileData } from '@/types/profile'
import { BUSINESS_FIELDS } from '@/lib/constants'

interface Props {
    formData: ProfileData
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
    handleCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function ProfileFormBusiness({ formData, handleChange, handleCheckboxChange }: Props) {
    return (
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
    )
}
