'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { KeyRound, Lock, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

export default function ChangePasswordPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()

        // Basic validation
        if (password.length < 6) {
            setMessage({ type: 'error', text: 'Password minimal 6 karakter' })
            return
        }

        if (password !== confirmPassword) {
            setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok' })
            return
        }

        setLoading(true)
        setMessage(null)

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            })

            if (error) throw error

            setMessage({ type: 'success', text: 'Password berhasil diperbarui!' })
            setPassword('')
            setConfirmPassword('')

        } catch (err: any) {
            setMessage({ type: 'error', text: err.message || 'Gagal mengganti password' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-navy">Ganti Password</h2>
                <p className="text-gray-500 text-sm">Amankan akun Anda dengan mengganti password secara berkala.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">

                <div className="flex items-center gap-4 mb-8 bg-blue-50 p-4 rounded-lg text-azure border border-blue-100">
                    <KeyRound size={24} />
                    <div>
                        <h4 className="font-bold text-sm">Tips Keamanan</h4>
                        <p className="text-xs opacity-80">Gunakan kombinasi huruf besar, kecil, dan angka.</p>
                    </div>
                </div>

                <form onSubmit={handleUpdate} className="space-y-6">

                    <div>
                        <label className="block text-sm font-bold text-navy mb-2">Password Baru</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                placeholder="Minimal 6 karakter"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-navy mb-2">Konfirmasi Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg focus:border-navy focus:ring-1 focus:ring-navy outline-none"
                                placeholder="Ulangi password baru"
                            />
                        </div>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-lg flex items-center gap-3 text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                            {message.text}
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-navy text-white font-bold py-3 rounded-lg hover:bg-navy/90 transition shadow-md disabled:opacity-70 flex justify-center items-center gap-2"
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : 'Update Password'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}
