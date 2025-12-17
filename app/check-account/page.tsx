
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, CheckCircle, Clock, XCircle, User, QrCode } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'react-qr-code'

export default function CheckAccountPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{
        status: 'found_active' | 'found_pending' | 'not_found' | 'error',
        message: string,
        data?: any
    } | null>(null)

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) return
        setLoading(true)
        setResult(null)

        try {
            // Priority 1: Check Active Profiles (Alumni Lama / Approved)
            // Assumption: 'profiles' table has an 'email' column or we can't do this easily.
            // If it fails, we fall back to logic.

            // Try query profiles
            const { data: profileList, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .ilike('email', email)
                .limit(1)

            if (!profileError && profileList && profileList.length > 0) {
                const profile = profileList[0]
                setResult({
                    status: 'found_active',
                    message: 'Ditemukan',
                    data: profile
                })
                setLoading(false)
                return
            }

            // Priority 2: Check Temp Registrations (Pending)
            const { data: tempList, error: tempError } = await supabase
                .from('temp_registrations')
                .select('*')
                .ilike('email', email)
                .limit(1)

            if (tempError) throw tempError

            if (tempList && tempList.length > 0) {
                const temp = tempList[0]
                if (temp.status === 'Pending') {
                    setResult({ status: 'found_pending', message: 'Menunggu Verifikasi', data: temp })
                } else if (temp.status === 'Approved') {
                    // Start of active logic fallback if profile insert failed?
                    setResult({ status: 'found_active', message: 'Ditemukan (Approved)', data: temp })
                } else {
                    setResult({ status: 'error', message: `Status: ${temp.status}`, data: temp })
                }
            } else {
                setResult({ status: 'not_found', message: 'Data Tidak Ditemukan' })
            }

        } catch (err: any) {
            // If profiles query failed because 'email' column doesn't exist, we might hit here.
            // We can suppress it or assume just not found.
            // console.warn(err)
            setResult({ status: 'not_found', message: 'Data Tidak Ditemukan' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
            <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">

                {/* Header */}
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-3 border-l-4 border-orange pl-4 mb-4">
                        <h1 className="text-xl font-bold text-navy">Cek Status Keanggotaan</h1>
                    </div>
                    <p className="text-gray-500 text-sm">
                        Masukkan email untuk memastikan apakah data Anda sudah ada di database kami.
                    </p>
                </div>

                <div className="px-8 pb-8">
                    <form onSubmit={handleCheck} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-navy mb-2 uppercase">Alamat Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-4 bg-blue-50/50 border border-blue-100 rounded-lg text-navy font-medium focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy transition placeholder:text-blue-200"
                                placeholder="nama@email.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-navy text-white text-sm font-bold py-4 rounded-lg hover:bg-navy/90 transition shadow-lg hover:shadow-xl disabled:opacity-70 tracking-widest uppercase"
                        >
                            {loading ? 'MEMERIKSA...' : 'CARI DATA'}
                        </button>
                    </form>

                    {/* Pending State */}
                    {result?.status === 'found_pending' && (
                        <div className="mt-8 animate-in slide-in-from-bottom-2">
                            <div className="bg-orange/10 border border-orange/20 p-4 rounded-lg text-center mb-6">
                                <span className="text-orange font-bold text-sm">Pendaftaran Sedang Diverifikasi</span>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm">
                                    <Clock size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-navy uppercase">{result.data.full_name}</h3>
                                    <p className="text-xs text-gray-500">Diajukan: {new Date(result.data.submitted_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Active State (Mockup Match) */}
                    {result?.status === 'found_active' && (
                        <div className="mt-6 space-y-4 animate-in slide-in-from-bottom-2">
                            <div className="bg-green-100 text-green-800 p-3 rounded-lg text-center font-medium text-sm border border-green-200">
                                Ditemukan
                            </div>

                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 flex flex-col md:flex-row items-center gap-6">
                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                    <QRCode value={result.data.id || result.data.email} size={80} />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-lg font-bold text-navy uppercase mb-1">{result.data.full_name}</h3>
                                    <p className="text-xs text-gray-500 mb-2">
                                        ID: {result.data.id?.substring(0, 8).toUpperCase() || '-'} | Angkatan {result.data.generation || '-'}
                                    </p>
                                    <span className="text-green-600 font-bold text-sm uppercase">Aktif</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Not Found */}
                    {result?.status === 'not_found' && (
                        <div className="mt-6 animate-in slide-in-from-bottom-2">
                            <div className="bg-gray-100 text-gray-500 p-3 rounded-lg text-center font-medium text-sm border border-gray-200 mb-4">
                                Data Tidak Ditemukan
                            </div>

                            <div className="text-center text-sm text-gray-500">
                                <p>Email ini belum terdaftar.</p>
                                <div className="mt-4 flex gap-3 justify-center">
                                    <Link href="/auth/register" className="text-navy font-bold hover:underline">Daftar Baru</Link>
                                    <span className="text-gray-300">|</span>
                                    <Link href="/auth/login" className="text-navy font-bold hover:underline">Masuk</Link>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            <div className="fixed bottom-6 text-center w-full text-xs text-gray-400">
                <Link href="/" className="hover:text-navy transition">← Kembali ke Beranda</Link>
            </div>
        </div>
    )
}
