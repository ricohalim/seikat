
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

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
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            <Navbar />
            <div className="max-w-md mx-auto px-5 pt-10">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                    <h3 className="text-navy font-bold text-lg mb-6 text-center">Ruang Alumni</h3>

                    {error && (
                        <div className="mb-4 bg-red-50 text-red-600 p-3 rounded text-sm text-center">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-navy font-semibold text-sm mb-1">Email Terdaftar</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-azure focus:ring-1 focus:ring-azure"
                            />
                        </div>
                        <div>
                            <label className="block text-navy font-semibold text-sm mb-1">PIN Keamanan</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-azure focus:ring-1 focus:ring-azure"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-navy text-white font-bold py-3 rounded-lg hover:bg-navy/90 transition disabled:opacity-50 mt-4"
                        >
                            {loading ? 'Memuat...' : 'Masuk Aplikasi'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
