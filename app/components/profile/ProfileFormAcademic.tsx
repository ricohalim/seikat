'use client'

import React from 'react'
import { GraduationCap } from 'lucide-react'
import { ProfileData } from '@/types/profile'
import { GENDERS, GENERATIONS, EDUCATION_LEVELS, UNIVERSITIES, FACULTIES } from '@/lib/constants'

interface Props {
    formData: ProfileData
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
    isSameEducation: boolean
    setIsSameEducation: (val: boolean) => void
}

export default function ProfileFormAcademic({ formData, handleChange, isSameEducation, setIsSameEducation }: Props) {
    return (
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
    )
}
