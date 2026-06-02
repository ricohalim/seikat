'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, AlertCircle, Lock } from 'lucide-react'

type PageState = 'loading' | 'ready' | 'invalid'

export default function ResetPasswordPage() {
    const [pageState, setPageState] = useState<PageState>('loading')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        const handleAuth = async () => {
            // PKCE flow: ?code=... in query string
            const searchParams = new URLSearchParams(window.location.search)
            const code = searchParams.get('code')

            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code)
                if (!error) { setPageState('ready'); return }
                // PKCE exchange failed (e.g. different browser) — fall through to other checks
            }

            // Implicit flow: #access_token=...&type=recovery in hash
            const hash = window.location.hash.substring(1)
            const params = new URLSearchParams(hash)
            const accessToken = params.get('access_token')
            const refreshToken = params.get('refresh_token')
            const type = params.get('type')

            if (accessToken && refreshToken && type === 'recovery') {
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken,
                })
                setPageState(error ? 'invalid' : 'ready')
                return
            }

            setPageState('invalid')
        }

        handleAuth()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (password.length < 8) {
            setError('Password minimal 8 karakter.')
            return
        }
        if (password !== confirm) {
            setError('Konfirmasi password tidak sama.')
            return
        }

        setLoading(true)

        const { error } = await supabase.auth.updateUser({ password })

        setLoading(false)

        if (error) {
            setError('Gagal mengubah password. Link mungkin sudah kedaluwarsa — minta link baru.')
            return
        }

        await supabase.auth.signOut()
        router.replace('/auth/login')
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="w-full max-w-sm">

                {/* Loading */}
                {pageState === 'loading' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                        <Loader2 size={28} className="animate-spin text-navy mx-auto mb-3" />
                        <p className="text-sm text-gray-400 font-medium">Memverifikasi link...</p>
                    </div>
                )}

                {/* Invalid token */}
                {pageState === 'invalid' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                        <div className="w-14 h-14 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={28} className="text-red-500" />
                        </div>
                        <h1 className="text-xl font-black text-navy tracking-tight mb-2">Link Tidak Valid</h1>
                        <p className="text-sm text-gray-500 leading-relaxed">
                            Link reset password sudah kedaluwarsa atau tidak valid. Silakan minta link baru.
                        </p>
                        <Link
                            href="/auth/forgot-password"
                            className="mt-6 inline-block w-full text-center bg-navy text-white font-bold py-3 rounded-xl text-sm hover:bg-navy/90 transition"
                        >
                            Minta Link Baru
                        </Link>
                    </div>
                )}

                {/* Form */}
                {pageState === 'ready' && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                        <div className="mb-7">
                            <h1 className="text-2xl font-black text-navy tracking-tight">Buat Password Baru</h1>
                            <p className="text-gray-400 text-sm mt-1">
                                Minimal 8 karakter.
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
                                    Password Baru
                                </label>
                                <div className="relative">
                                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Minimal 8 karakter"
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none transition-all placeholder:text-gray-300 focus:border-navy focus:ring-2 focus:ring-navy/10 shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Konfirmasi Password
                                </label>
                                <div className="relative">
                                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        value={confirm}
                                        onChange={(e) => setConfirm(e.target.value)}
                                        placeholder="Ulangi password baru"
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none transition-all placeholder:text-gray-300 focus:border-navy focus:ring-2 focus:ring-navy/10 shadow-sm"
                                    />
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="text-xs text-gray-400 hover:text-navy transition-colors font-medium"
                            >
                                {showPassword ? 'Sembunyikan' : 'Tampilkan'} password
                            </button>

                            <button
                                type="submit"
                                disabled={loading || !password || !confirm}
                                className="w-full bg-navy text-white font-bold py-3 rounded-xl text-sm hover:bg-navy/90 transition shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    'Simpan Password Baru'
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
