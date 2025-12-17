'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { CheckCircle, AlertCircle, Clock, Loader2 } from 'lucide-react'
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
            // Note: This requires the 'email' column to be added to 'profiles' table via migration.
            const { data: profileList, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .ilike('email', email)
                .limit(1)

            if (!profileError && profileList && profileList.length > 0) {
                const profile = profileList[0]

                // Check if profile is actually active
                if (profile.account_status === 'Pending') {
                    setResult({
                        status: 'found_pending',
                        message: 'Status: MENUNGGU VERIFIKASI',
                        data: profile
                    })
                } else {
                    setResult({
                        status: 'found_active',
                        message: 'Status: DITERIMA / AKTIF',
                        data: profile
                    })
                }
                setLoading(false)
                return
            }

            // Priority 2: Check Temp Registrations (Pending)
            const { data: tempList, error: tempError } = await supabase
                .from('temp_registrations')
                .select('*')
                .ilike('email', email)
                .order('submitted_at', { ascending: false }) // Get latest

            if (tempError) throw tempError

            const latestTemp = tempList?.[0]

            if (latestTemp) {
                if (latestTemp.status === 'Pending') {
                    setResult({
                        status: 'found_pending',
                        message: 'Status: MENUNGGU VERIFIKASI',
                        data: latestTemp
                    })
                    return // Stop here
                } else if (latestTemp.status === 'Approved') {
                    // Fallback if not found in profiles but marked approved in temp
                    setResult({
                        status: 'found_active',
                        message: 'Status: DITERIMA / AKTIF',
                        data: latestTemp
                    })
                    return // Stop here
                } else if (latestTemp.status === 'Rejected') {
                    setResult({
                        status: 'error',
                        message: 'Status: DITOLAK',
                        data: latestTemp
                    })
                    return
                }
            }

            setResult({ status: 'not_found', message: 'Data tidak ditemukan.' })

        } catch (err: any) {
            setResult({ status: 'error', message: err.message || 'Terjadi kesalahan' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans">
            <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">

                {/* Header */}
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-3 border-l-4 border-navy pl-4 mb-4">
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
                            className="w-full bg-navy text-white text-sm font-bold py-4 rounded-lg hover:bg-navy/90 transition shadow-lg hover:shadow-xl disabled:opacity-70 tracking-widest uppercase flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'CARI DATA'}
                        </button>
                    </form>

                    {/* Result */}
                    {result && (
                        <div className={`mt-6 p-4 rounded-xl text-left animate-in fade-in slide-in-from-bottom-2 ${result.status === 'found_active'
                            ? 'bg-blue-50 border border-blue-200'
                            : result.status === 'found_pending'
                                ? 'bg-orange/10 border border-orange/20'
                                : result.status === 'not_found'
                                    ? 'bg-gray-100 border border-gray-200'
                                    : 'bg-red-50 border border-red-200'
                            }`}>
                            <div className="flex items-start gap-3">
                                <div className={`mt-1 p-1 rounded-full ${result.status === 'found_active' ? 'bg-blue-100 text-blue-600' :
                                    result.status === 'found_pending' ? 'bg-orange/20 text-orange' :
                                        'bg-gray-200 text-gray-500'
                                    }`}>
                                    {result.status === 'found_active' ? <CheckCircle size={20} /> :
                                        result.status === 'found_pending' ? <Clock size={20} /> : <AlertCircle size={20} />}
                                </div>
                                <div className="flex-1">
                                    <h4 className={`font-bold ${result.status === 'found_active' ? 'text-blue-700' :
                                        result.status === 'found_pending' ? 'text-orange' : 'text-gray-700'
                                        }`}>
                                        {result.message}
                                    </h4>

                                    {result.data && (
                                        <div className="mt-2 text-sm text-gray-600 space-y-1">
                                            <p><span className="font-semibold">Nama:</span> {result.data.full_name}</p>
                                            <p><span className="font-semibold">Email:</span> {result.data.email}</p>
                                        </div>
                                    )}

                                    {result.status === 'found_active' && (
                                        <Link href="/auth/login" className="inline-block mt-3 bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                                            Login Sekarang
                                        </Link>
                                    )}

                                    {result.status === 'not_found' && (
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-600 mb-2">Email belum terdaftar.</p>
                                            <Link href="/auth/register" className="text-sm font-bold text-navy hover:underline">
                                                Daftar Disini
                                            </Link>
                                        </div>
                                    )}
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
