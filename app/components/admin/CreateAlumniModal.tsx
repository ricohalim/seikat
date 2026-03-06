'use client'

import { useState } from 'react'
import { X, Save, Copy, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

type CreateAlumniModalProps = {
    isOpen: boolean
    onClose: () => void
    onSuccess: (newUser: any) => void
    availableGenerations: string[]
    availableUniversities: string[]
}

export function CreateAlumniModal({ isOpen, onClose, onSuccess, availableGenerations, availableUniversities }: CreateAlumniModalProps) {
    const [loading, setLoading] = useState(false)
    const [successData, setSuccessData] = useState<any>(null)
    const [copied, setCopied] = useState(false)
    const [isNewUniv, setIsNewUniv] = useState(false)

    // Form state
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [generation, setGeneration] = useState(availableGenerations[0] || '')
    const [university, setUniversity] = useState(availableUniversities[0] || '')
    const [customUniv, setCustomUniv] = useState('')

    if (!isOpen) return null

    const resetForm = () => {
        setFullName('')
        setEmail('')
        setPhone('')
        setGeneration(availableGenerations[0] || '')
        setUniversity(availableUniversities[0] || '')
        setCustomUniv('')
        setIsNewUniv(false)
        setSuccessData(null)
        setCopied(false)
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    const handleCopy = async () => {
        if (!successData) return
        const textToCopy = `Halo ${fullName},\n\nAkun Alumni Anda telah berhasil dibuat. Berikut adalah informasi login sementara Anda:\n\nEmail: ${email}\nPassword: ${successData.password}\n\nSilakan segera login dan lengkapi profil Anda.`
        try {
            await navigator.clipboard.writeText(textToCopy)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
            toast.success('Informasi login disalin ke clipboard')
        } catch (err) {
            toast.error('Gagal menyalin teks')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('Sesi Anda telah berakhir, silakan login ulang.')

            const res = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    fullName,
                    email,
                    phone,
                    generation,
                    university: isNewUniv ? customUniv : university
                })
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error)

            setSuccessData(data.user)
            toast.success("Akun Alumni Berhasil Dibuat!")
            onSuccess(data.user)

        } catch (err: any) {
            toast.error(err.message || 'Terjadi kesalahan')
        } finally {
            setLoading(false)
        }
    }

    // Modal success state display
    if (successData) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-6 text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <CheckCircle2 size={32} className="text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-navy">Alumni Berhasil Didata!</h2>
                        <p className="text-sm text-gray-500">
                            Akun untuk <span className="font-bold">{fullName}</span> telah dibuat dan statusnya langsung aktif.
                        </p>

                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left space-y-2 mt-4">
                            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Kredensial Login</p>
                            <p className="text-sm"><span className="font-semibold w-20 inline-block">Email</span>: {email}</p>
                            <p className="text-sm"><span className="font-semibold w-20 inline-block">Password</span>: <span className="font-mono bg-yellow-100 px-1 rounded">{successData.password}</span></p>
                        </div>

                        <div className="bg-yellow-50 text-yellow-800 text-xs p-3 rounded text-left mt-2">
                            ⚠️ <b>Penting:</b> Sampaikan kredensial sementara ini kepada user. User diwajibkan mengganti password setelah login.
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-2xl">
                        <button
                            type="button"
                            onClick={handleCopy}
                            className={`px-4 py-2 ${copied ? 'bg-green-600' : 'bg-gray-800'} text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90`}
                        >
                            {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                            {copied ? 'Tersalin' : 'Copy Info'}
                        </button>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50"
                        >
                            Selesai
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-bold text-navy">Tambah Akun Alumni</h2>
                    <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nama Lengkap</label>
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-navy focus:bg-white outline-none"
                                placeholder="Cth: John Doe"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-navy focus:bg-white outline-none"
                                placeholder="Cth: john@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Nomor HP / WhatsApp</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-navy focus:bg-white outline-none"
                                placeholder="Cth: 08123456789"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Angkatan</label>
                                <select
                                    value={generation}
                                    onChange={e => setGeneration(e.target.value)}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-navy focus:bg-white outline-none"
                                >
                                    <option value="">Pilih...</option>
                                    {availableGenerations.map(g => (
                                        <option key={g} value={g}>{g}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Universitas</label>
                                {!isNewUniv ? (
                                    <div className="relative">
                                        <select
                                            value={university}
                                            onChange={e => setUniversity(e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-navy focus:bg-white outline-none appearance-none pr-8"
                                        >
                                            <option value="">Pilih...</option>
                                            {availableUniversities.map(u => (
                                                <option key={u} value={u}>{u}</option>
                                            ))}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => setIsNewUniv(true)}
                                            className="absolute right-0 top-0 bottom-0 px-2 text-xs text-blue-600 font-bold bg-gray-100 border-l border-gray-200 rounded-r-lg hover:bg-gray-200"
                                            title="Tambah Univ Baru"
                                        >
                                            + Baru
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={customUniv}
                                            onChange={e => setCustomUniv(e.target.value)}
                                            className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-sm focus:border-navy outline-none pr-8"
                                            placeholder="Ketik Univ..."
                                            required={isNewUniv}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => { setIsNewUniv(false); setCustomUniv(''); }}
                                            className="absolute right-0 top-0 bottom-0 px-2 text-xs text-gray-500 hover:text-red-500"
                                            title="Batal Tambah"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-gray-50 border-t flex justify-end gap-3 rounded-b-2xl">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-navy/90 disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            Simpan Data
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
