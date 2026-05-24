'use client'

import React from 'react'
import { GraduationCap } from 'lucide-react'
import { ProfileData } from '@/types/profile'
import { GENDERS, GENERATIONS, EDUCATION_LEVELS, FACULTIES } from '@/lib/constants'
import { useUniversities } from '@/app/hooks/useUniversities'

interface Props {
    formData: ProfileData
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
    isSameEducation: boolean
    setIsSameEducation: (val: boolean) => void
}

const inputCls = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 shadow-sm transition-all'
const selectCls = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 shadow-sm transition-all'
const labelCls = 'text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5'

export default function ProfileFormAcademic({ formData, handleChange, isSameEducation, setIsSameEducation }: Props) {
    const { universities } = useUniversities()
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange to-orange/30 rounded-l-2xl" />
            <div className="p-6 pl-7">
                <h3 className="font-bold text-navy text-sm mb-5 flex items-center gap-2">
                    <GraduationCap size={15} className="text-orange" />
                    Data Akademik
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className={labelCls}>Jenis Kelamin</label>
                        <select name="gender" value={formData.gender} onChange={handleChange} className={selectCls}>
                            <option value="">— Pilih —</option>
                            {GENDERS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Tempat Lahir</label>
                        <input type="text" name="birth_place" value={formData.birth_place} onChange={handleChange} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Tanggal Lahir</label>
                        <input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Angkatan</label>
                        <select name="generation" value={formData.generation} onChange={handleChange} className={selectCls}>
                            <option value="">— Pilih —</option>
                            {GENERATIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className={labelCls}>Pendidikan (Saat Terima Beasiswa)</label>
                        <select name="education_level" value={formData.education_level} onChange={handleChange} className={selectCls}>
                            <option value="">— Pilih —</option>
                            {['D4', 'S1'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className={labelCls}>Universitas</label>
                        <input
                            list="universities-list"
                            type="text"
                            name="university"
                            value={formData.university}
                            onChange={(e) => {
                                e.target.value = e.target.value.toUpperCase()
                                handleChange(e)
                            }}
                            className={inputCls}
                            placeholder="Ketik nama universitas..."
                        />
                        <datalist id="universities-list">
                            {universities.map(uni => <option key={uni} value={uni} />)}
                        </datalist>
                    </div>

                    <div>
                        <label className={labelCls}>Fakultas</label>
                        <select name="faculty" value={formData.faculty} onChange={handleChange} className={selectCls}>
                            <option value="">— Pilih —</option>
                            {FACULTIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Jurusan</label>
                        <input type="text" name="major" value={formData.major} onChange={handleChange} className={inputCls} />
                    </div>

                    {/* Current Education Toggle */}
                    <div className="md:col-span-2 border-t border-gray-100 pt-4 mt-1">
                        <label className="flex items-center gap-2.5 text-sm font-bold text-navy mb-4 cursor-pointer select-none">
                            <input type="checkbox" checked={isSameEducation} onChange={(e) => setIsSameEducation(e.target.checked)}
                                className="w-4 h-4 text-navy rounded border-gray-300 focus:ring-navy"
                            />
                            Pendidikan Saat Ini sama dengan saat menerima Beasiswa?
                        </label>

                        {!isSameEducation && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                                <div>
                                    <label className={labelCls}>Jenjang Pendidikan Saat Ini</label>
                                    <select name="current_education_level" value={formData.current_education_level} onChange={handleChange} className={selectCls}>
                                        <option value="">— Pilih —</option>
                                        {EDUCATION_LEVELS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Universitas Saat Ini</label>
                                    <input type="text" name="current_university" value={formData.current_university}
                                        onChange={(e) => {
                                            e.target.value = e.target.value.toUpperCase()
                                            handleChange(e)
                                        }}
                                        className={inputCls}
                                        placeholder="Ketik nama universitas..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
