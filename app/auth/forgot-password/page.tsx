'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertCircle, Mail, CheckCircle } from 'lucide-react'

// Gunakan supabase-js langsung (bukan SSR) agar bisa pakai flowType: 'implicit'.
// @supabase/ssr selalu pakai PKCE sehingga magic link hanya berfungsi di browser yang sama.
const supabaseImplicit = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { flowType: 'implicit' } }
)

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabaseImplicit.auth.signInWithOtp({
            email: email.trim().toLowerCase(),
            options: {
                shouldCreateUser: false,
                emailRedirectTo: `${window.location.origin}/auth/callback?next=%2Fdashboard%2Fchange-password%3Ffrom%3Dreset`,
                
            },
        })

        setLoading(false)

        if (error) {
            setError('Gagal mengirim email. Pastikan email terdaftar dan coba lagi.')
            return
        }

        setSent(true)
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="w-full max-w-sm">

                {/* Back link */}
                <Link
                    href="/auth/login"
                    className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-navy transition-colors mb-8 font-medium"
                >
                    <ArrowLeft size={15} />
                    Kembali ke Login
                </Link>

                {sent ? (
                    /* ── Success State ── */
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                        <div className="w-14 h-14 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <CheckCircle size={28} className="text-green-600" />
                        </div>
                        <h1 className="text-xl font-black text-navy tracking-tight mb-2">Magic Link Terkirim</h1>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Magic link telah dikirim ke{' '}
                            <span className="font-bold text-navy">{email}</span>.
                            Klik link di email untuk langsung masuk dan atur password baru.
                        </p>
                        <p className="text-xs text-gray-400 mt-4">
                            Link berlaku selama 1 jam. Cek folder inbox dan spam.
                        </p>
                        <Link
                            href="/auth/login"
                            className="mt-6 inline-block w-full text-center bg-navy text-white font-bold py-3 rounded-xl text-sm hover:bg-navy/90 transition"
                        >
                            Kembali ke Login
                        </Link>
                    </div>
                ) : (
                    /* ── Form State ── */
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                        <div className="mb-7">
                            <h1 className="text-2xl font-black text-navy tracking-tight">Lupa Password</h1>
                            <p className="text-gray-400 text-sm mt-1">
                                Masukkan email terdaftar. Kami akan kirimkan magic link — klik linknya untuk langsung masuk dan atur password baru.
                            </p>
                        </div>

                        {error && (
                            <div className="mb-5 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2.5">
                                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Email
                                </label>
                                <div className="relative">
                                    <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="nama@email.com"
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none transition-all placeholder:text-gray-300 focus:border-navy focus:ring-2 focus:ring-navy/10 shadow-sm"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full bg-navy text-white font-bold py-3 rounded-xl text-sm hover:bg-navy/90 transition shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Mengirim...
                                    </>
                                ) : (
                                    'Kirim Magic Link'
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
