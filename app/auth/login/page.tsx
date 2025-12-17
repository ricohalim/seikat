'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2 } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) throw error

            router.push('/dashboard')
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message)
            } else {
                setError('Terjadi kesalahan saat login')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-6 font-sans">
            <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-300">

                <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-navy text-sm font-semibold mb-8 transition-colors">
                    <ArrowLeft size={16} /> Kembali ke Beranda
                </Link>

                <div className="bg-white rounded-2xl shadow-xl border border-blue-50 p-8 md:p-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-navy tracking-tight mb-2">Selamat Datang</h1>
                        <p className="text-gray-500 text-sm">Masuk untuk mengakses Ruang Alumni</p>
                    </div>

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm text-center font-medium animate-pulse">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-navy uppercase tracking-wide">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@email.com"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition-all placeholder:text-gray-300"
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-navy uppercase tracking-wide">Password</label>
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition-all placeholder:text-gray-300"
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="remember"
                                className="w-4 h-4 rounded border-gray-300 text-navy focus:ring-navy"
                                defaultChecked
                            />
                            <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">Ingat Saya</label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-navy text-white font-bold py-3.5 rounded-xl hover:bg-navy/90 hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Masuk sekarang'}
                        </button>
                    </form>

                    <div className="mt-8 text-center pt-8 border-t border-gray-50">
                        <p className="text-sm text-gray-500">
                            Belum punya akun?{' '}
                            <Link href="/auth/register" className="font-bold text-azure hover:text-navy transition">
                                Daftar di sini
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs text-gray-400 mt-8">
                    &copy; 2025 Portal Alumni. All rights reserved.
                </p>
            </div>
        </div>
    )
}
