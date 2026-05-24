'use client'

import React from 'react'
import { Briefcase, MapPin } from 'lucide-react'
import { ProfileData } from '@/types/profile'
import { COUNTRIES, PROVINCES, INDUSTRY_SECTORS, JOB_TYPES } from '@/lib/constants'

interface Props {
    formData: ProfileData
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
}

const inputCls = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 shadow-sm transition-all'
const selectCls = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 shadow-sm transition-all'
const labelCls = 'text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5'

export default function ProfileFormJob({ formData, handleChange }: Props) {
    return (
        <div className="space-y-5">

            {/* Domisili */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-navy to-azure/50 rounded-l-2xl" />
                <div className="p-6 pl-7">
                    <h3 className="font-bold text-navy text-sm mb-5 flex items-center gap-2">
                        <MapPin size={15} className="text-navy" />
                        Domisili
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelCls}>Negara</label>
                            <select name="domicile_country" value={formData.domicile_country} onChange={handleChange} className={selectCls}>
                                {COUNTRIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        {formData.domicile_country === 'INDONESIA' ? (
                            <div>
                                <label className={labelCls}>Provinsi</label>
                                <select name="domicile_province" value={formData.domicile_province} onChange={handleChange} className={selectCls}>
                                    <option value="">— Pilih —</option>
                                    {PROVINCES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className={labelCls}>Provinsi / Wilayah</label>
                                <input type="text" name="domicile_province" value={formData.domicile_province} onChange={handleChange} className={inputCls} />
                            </div>
                        )}
                        <div>
                            <label className={labelCls}>Kota</label>
                            <input type="text" name="domicile_city" value={formData.domicile_city} onChange={handleChange} className={inputCls} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Pekerjaan */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-azure to-navy/40 rounded-l-2xl" />
                <div className="p-6 pl-7">
                    <h3 className="font-bold text-navy text-sm mb-5 flex items-center gap-2">
                        <Briefcase size={15} className="text-azure" />
                        Pekerjaan
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className={labelCls}>Sektor Industri</label>
                            <select name="industry_sector" value={formData.industry_sector} onChange={handleChange} className={selectCls}>
                                <option value="">— Pilih —</option>
                                {INDUSTRY_SECTORS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Jenis Pekerjaan</label>
                            <select name="job_type" value={formData.job_type} onChange={handleChange} className={selectCls}>
                                <option value="">— Pilih —</option>
                                {JOB_TYPES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Jabatan / Posisi</label>
                            <input type="text" name="job_position" value={formData.job_position} onChange={handleChange} className={inputCls} />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelCls}>Nama Instansi / Perusahaan</label>
                            <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className={inputCls} />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}
