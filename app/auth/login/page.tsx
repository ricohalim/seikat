'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            if (data.user) {
                // GATEKEEPER CHECK
                // Check if user is active
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('account_status')
                    .eq('id', data.user.id)
                    .single()

                if (profile) {
                    const status = profile.account_status?.trim()

                    // BLOCK ON-HOLD USERS
                    if (status === 'On-Hold' || status === 'on-hold' || status === 'Ditunda') {
                        await supabase.auth.signOut()
                        setError('Status: DITANGGUHKAN. Harap hubungi Admin untuk informasi lebih lanjut.')
                        return
                    }

                    if (status === 'Pending') {
                        // Force Logout
                        await supabase.auth.signOut()
                        // Redirect to Pending Page
                        router.push('/auth/verification-pending')
                        return
                    }
                }

                try {
                    await supabase.rpc('log_activity', {
                        p_user_id: data.user.id,
                        p_action: 'LOGIN',
                        p_details: {
                            method: 'email_password',
                            timestamp: new Date().toISOString()
                        }
                    })
                } catch (logErr) {
                    console.error('Login logging failed:', logErr)
                    // Non-blocking
                }
            }

            // Router refresh to ensure middleware state is updated
            router.refresh()

            // Handle Redirect — hanya izinkan path internal (harus dimulai dengan /)
            // mencegah Open Redirect ke situs eksternal via ?next=https://evil.com
            const nextParam = new URLSearchParams(window.location.search).get('next')
            const safePath = nextParam?.startsWith('/') ? nextParam : '/dashboard'
            router.push(safePath)
        } catch (err) {
            if (err instanceof Error) {
                // Translate common Supabase errors
                if (err.message === 'Email not confirmed') {
                    setError('Email belum dikonfirmasi. Silakan cek email Anda untuk verifikasi.')
                } else if (err.message === 'Invalid login credentials') {
                    setError('Email atau password salah.')
                } else {
                    setError(err.message)
                }
            } else {
                setError('Terjadi kesalahan saat login')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex font-sans">

            {/* ── Left Brand Panel ─────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-[45%] xl:w-[42%] bg-[#0f1e38] flex-col justify-between p-12 relative overflow-hidden flex-shrink-0">

                {/* Logo */}
                <div className="relative z-10 flex flex-col leading-none">
                    <p className="text-white font-black text-xl tracking-tight leading-none">SEIKAT</p>
                    <p className="text-white/40 text-[10px] font-bold tracking-[0.18em] uppercase mt-1">IKADBP</p>
                </div>

                {/* Hero text */}
                <div className="relative z-10 space-y-6">
                    <div>
                        <h2 className="text-4xl font-black text-white leading-tight tracking-tight">
                            Ruang<br />
                            <span className="text-azure">Alumni</span>
                            <br />Djarum
                        </h2>
                        <p className="mt-4 text-white/50 text-sm leading-relaxed max-w-xs">
                            Terhubung dengan ribuan alumni Beasiswa Djarum Plus dari seluruh Indonesia.
                        </p>
                    </div>

                    {/* Feature chips */}
                    <div className="space-y-3">
                        {[
                            'Agenda & event eksklusif alumni',
                            'Direktori alumni seluruh Indonesia',
                            'Broadcast & inbox langsung dari admin',
                        ].map((text) => (
                            <div key={text} className="flex items-center gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-white/30 flex-shrink-0" />
                                <p className="text-white/60 text-sm">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom badge */}
                <div className="relative z-10">
                    <p className="text-white/20 text-xs">© {new Date().getFullYear()} IKADBP · All rights reserved</p>
                </div>
            </div>

            {/* ── Right Form Panel ─────────────────────────────────── */}
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-6 md:p-12 overflow-y-auto">
                <div className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-300">

                    {/* Mobile logo */}
                    <div className="lg:hidden flex flex-col leading-none mb-10">
                        <p className="font-black text-navy text-base tracking-tight leading-none">SEIKAT</p>
                        <p className="text-[9px] font-bold text-gray-400 tracking-[0.18em] uppercase mt-1">IKADBP</p>
                    </div>

                    {/* Heading */}
                    <div className="mb-8">
                        <h1 className="text-2xl font-black text-navy tracking-tight">Selamat Datang</h1>
                        <p className="text-gray-400 text-sm mt-1">Masuk ke Portal Alumni Djarum</p>
                    </div>

                    {/* Error banner */}
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2.5 animate-in slide-in-from-top-2 duration-200">
                            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                Email
                            </label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@email.com"
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none transition-all placeholder:text-gray-300 focus:border-navy focus:ring-2 focus:ring-navy/10 focus:bg-white shadow-sm"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                                    Password
                                </label>
                                <Link
                                    href="/auth/forgot-password"
                                    className="text-[11px] text-azure hover:text-navy font-bold transition-colors"
                                >
                                    Lupa Password?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 pr-11 bg-white border border-gray-200 rounded-xl text-sm outline-none transition-all placeholder:text-gray-300 focus:border-navy focus:ring-2 focus:ring-navy/10 shadow-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(v => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-navy transition-colors"
                                    aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Remember me */}
                        <div className="flex items-center gap-2.5">
                            <input
                                type="checkbox"
                                id="remember"
                                defaultChecked
                                className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy cursor-pointer accent-navy"
                            />
                            <label htmlFor="remember" className="text-sm text-gray-500 cursor-pointer select-none">
                                Ingat saya
                            </label>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 bg-navy text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-60 flex justify-center items-center gap-2 hover:bg-[#1a3561] hover:shadow-lg hover:shadow-navy/20 active:scale-[0.98]"
                        >
                            {loading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : 'Masuk Sekarang'}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="my-6 flex items-center gap-3">
                        <div className="flex-1 h-px bg-gray-100" />
                        <span className="text-xs text-gray-300 font-medium">atau</span>
                        <div className="flex-1 h-px bg-gray-100" />
                    </div>

                    {/* Register link */}
                    <p className="text-center text-sm text-gray-400">
                        Belum punya akun?{' '}
                        <Link href="/auth/register" className="font-bold text-navy hover:text-azure transition-colors">
                            Daftar sekarang
                        </Link>
                    </p>

                    {/* Back to home */}
                    <div className="mt-8 text-center">
                        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-gray-300 hover:text-navy transition-colors font-medium">
                            <ArrowLeft size={13} />
                            Kembali ke Beranda
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    )
}
