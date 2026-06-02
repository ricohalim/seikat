'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock, Save, AlertCircle, CheckCircle } from 'lucide-react'

export default function ChangePasswordPage() {
    const searchParams = useSearchParams()
    const fromReset = searchParams.get('from') === 'reset'

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
        if (password.length < 8) {
            setMsg({ type: 'error', text: 'Password minimal 8 karakter.' })
            return
        }

        setLoading(true)
        setMsg(null)

        try {
            if (!fromReset) {
                // Normal flow: verify old password first
                const { data: { user } } = await supabase.auth.getUser()
                if (!user || !user.email) throw new Error('User tidak ditemukan.')

                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email: user.email,
                    password: oldPassword
                })
                if (signInError) throw new Error('Password lama salah.')
            }

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
        <div className="animate-in fade-in duration-500">

            {/* Page Header */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-9 h-9 rounded-xl bg-navy/8 flex items-center justify-center flex-shrink-0">
                        <Lock size={18} className="text-navy" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-navy tracking-tight">Ganti Password</h1>
                        <p className="text-sm text-gray-400">Perbarui password akun Anda</p>
                    </div>
                </div>
            </div>

            {/* Card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-navy rounded-l-2xl" />

                <div className="p-6">
                    {msg && (
                        <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium mb-6 ${
                            msg.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                            {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                            {msg.text}
                        </div>
                    )}

                    <form onSubmit={handleUpdate} className="space-y-4">
                        {[
                            ...(!fromReset ? [{ label: 'Password Lama', value: oldPassword, onChange: setOldPassword }] : []),
                            { label: 'Password Baru', value: password, onChange: setPassword },
                            { label: 'Konfirmasi Password Baru', value: confirm, onChange: setConfirm },
                        ].map((field) => (
                            <div key={field.label}>
                                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                                    {field.label}
                                </label>
                                <input
                                    type="password"
                                    required
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 shadow-sm transition-all"
                                />
                            </div>
                        ))}

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex-1 border border-gray-200 text-gray-500 py-3 rounded-xl font-bold hover:border-navy/30 hover:text-navy transition-all text-sm"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-navy text-white py-3 rounded-xl font-bold hover:bg-[#1a3561] hover:shadow-md hover:shadow-navy/20 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm disabled:opacity-60"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <><Save size={16} /> Simpan</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
