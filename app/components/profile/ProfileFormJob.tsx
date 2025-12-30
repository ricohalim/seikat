'use client'

import React from 'react'
import { Briefcase, MapPin } from 'lucide-react'
import { ProfileData } from '@/types/profile'
import { COUNTRIES, PROVINCES, INDUSTRY_SECTORS, JOB_TYPES } from '@/lib/constants'

interface Props {
    formData: ProfileData
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
}

export default function ProfileFormJob({ formData, handleChange }: Props) {
    return (
        <div className="space-y-6">
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
        </div>
    )
}
