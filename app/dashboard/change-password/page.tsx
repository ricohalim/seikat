'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock, Save, AlertCircle, CheckCircle } from 'lucide-react'

export default function ChangePasswordPage() {
    const [oldPassword, setOldPassword] = useState('')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const router = useRouter()

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (password !== confirm) {
            setMsg({ type: 'error', text: 'Password konfirmasi tidak sama.' })
            return
        }
        if (password.length < 6) {
            setMsg({ type: 'error', text: 'Password minimal 6 karakter.' })
            return
        }

        setLoading(true)
        setMsg(null)

        try {
            // Get current user email
            const { data: { user } } = await supabase.auth.getUser()
            if (!user || !user.email) throw new Error('User tidak ditemukan.')

            // 1. Verify Old Password by attempting re-login
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: oldPassword
            })

            if (signInError) {
                throw new Error('Password lama salah.')
            }

            // 2. Update to New Password
            const { error: updateError } = await supabase.auth.updateUser({ password })
            if (updateError) throw updateError

            setMsg({ type: 'success', text: 'Password berhasil diperbarui.' })
            setTimeout(() => {
                router.push('/dashboard')
            }, 1500)
        } catch (err: any) {
            setMsg({ type: 'error', text: err.message || 'Gagal mengubah password.' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-600 mb-4">
                        <Lock size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-navy">Ganti Password</h2>
                    <p className="text-gray-500 text-sm mt-1">Buat password baru yang aman untuk akun Anda.</p>
                </div>

                {msg && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 text-sm mb-6 ${msg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {msg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        {msg.text}
                    </div>
                )}

                <form onSubmit={handleUpdate} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Password Lama</label>
                        <input
                            type="password"
                            required
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition"
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Password Baru</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition"
                            placeholder="••••••••"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Konfirmasi Password</label>
                        <input
                            type="password"
                            required
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-navy focus:ring-2 focus:ring-navy/20 outline-none transition"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-navy text-white py-3 rounded-xl font-bold hover:bg-navy/90 transition shadow-lg shadow-navy/20 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={18} /> Simpan Password
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="w-full text-gray-500 text-sm hover:text-navy transition"
                    >
                        Batal
                    </button>
                </form>
            </div>
        </div>
    )
}
