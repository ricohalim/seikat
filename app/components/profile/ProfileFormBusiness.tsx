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

const inputCls = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 shadow-sm transition-all'
const selectCls = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 shadow-sm transition-all'
const labelCls = 'text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5'

export default function ProfileFormBusiness({ formData, handleChange, handleCheckboxChange }: Props) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange/60 to-orange/20 rounded-l-2xl" />
            <div className="p-6 pl-7">
                <h3 className="font-bold text-navy text-sm mb-5 flex items-center gap-2">
                    <Heart size={15} className="text-orange" />
                    Minat &amp; Usaha
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>Hobi</label>
                        <input type="text" name="hobbies" value={formData.hobbies} onChange={handleChange} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Minat</label>
                        <input type="text" name="interests" value={formData.interests} onChange={handleChange} className={inputCls} />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelCls}>Komunitas Lain</label>
                        <input type="text" name="communities" value={formData.communities} onChange={handleChange} className={inputCls} />
                    </div>

                    <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-1">
                        <label className="flex items-center gap-2.5 text-sm font-bold text-navy mb-4 cursor-pointer select-none">
                            <input type="checkbox" name="has_business" checked={formData.has_business} onChange={handleCheckboxChange}
                                className="w-4 h-4 text-navy rounded border-gray-300 focus:ring-navy"
                            />
                            Memiliki Usaha / Bisnis Sendiri?
                        </label>

                        {formData.has_business && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className={labelCls}>Nama Usaha</label>
                                    <input type="text" name="business_name" value={formData.business_name} onChange={handleChange} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Bidang Usaha</label>
                                    <select name="business_field" value={formData.business_field} onChange={handleChange} className={selectCls}>
                                        <option value="">— Pilih —</option>
                                        {BUSINESS_FIELDS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelCls}>Deskripsi Usaha</label>
                                    <textarea name="business_desc" value={formData.business_desc} onChange={handleChange}
                                        className={`${inputCls} resize-none`}
                                        rows={2}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Jabatan dalam Usaha</label>
                                    <input type="text" name="business_position" value={formData.business_position} onChange={handleChange} className={inputCls} />
                                </div>
                                <div>
                                    <label className={labelCls}>Lokasi Usaha</label>
                                    <input type="text" name="business_location" value={formData.business_location} onChange={handleChange} className={inputCls} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
