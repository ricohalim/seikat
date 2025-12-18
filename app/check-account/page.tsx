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
            // Use RPC to check status securely (Bypasses RLS issues)
            const cleanEmail = email.trim()
            const { data: rpcResult, error } = await supabase.rpc('check_email_status', {
                email_input: cleanEmail
            })

            if (error) {
                alert(`Error: ${error.message}`)
                throw error
            }

            const status = rpcResult?.status?.toLowerCase()

            // Map RPC result to UI state
            if (status === 'active' || status === 'aktif' || status === 'approved') {
                setResult({
                    status: 'found_active',
                    message: 'Status: DITERIMA / AKTIF',
                    data: { email: cleanEmail, full_name: 'Member Terdaftar' }
                })
            } else if (status === 'pending') {
                setResult({
                    status: 'found_pending',
                    message: 'Status: MENUNGGU VERIFIKASI',
                    data: { email: cleanEmail, full_name: 'Pendaftar' }
                })
            } else if (status === 'rejected') {
                setResult({
                    status: 'error',
                    message: 'Status: DITOLAK',
                    data: { email: cleanEmail, full_name: 'Pendaftar' }
                })
            } else {
                setResult({
                    status: 'not_found',
                    message: 'Data tidak ditemukan.',
                    data: { email: cleanEmail, debug: JSON.stringify(rpcResult) }
                })
            }

        } catch (err: any) {
            console.error('Check error:', err)
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
                                            <p className="text-sm text-gray-600 mb-2">Email <strong>{result.data?.email}</strong> belum terdaftar.</p>
                                            <Link href="/auth/register" className="text-sm font-bold text-navy hover:underline">
                                                Daftar Disini
                                            </Link>
                                            {/* DEBUG INFO */}
                                            <p className="text-[10px] text-gray-400 mt-2 font-mono border-t pt-2">
                                                Debug: {result.data?.debug || 'No RPC response'}
                                            </p>
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
