'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase' // Note: This uses ANON key, so RLS must allow select on profiles/temp by email if possible. 
// OR we might need a secure way. Standard RLS usually prevents searching by email for unauthenticated users.
// However, checking "if exists" is a common pattern.
// WE WILL TRY CLIENT SIDE FIRST. If RLS blocks it, we might need an Edge Function or RPC.
// For now, let's assume 'profiles' is readable (we set 'Public profiles are viewable by everyone' in schema.sql).
// 'temp_registrations' might need a policy tweak.

import Navbar from '@/app/components/Navbar'
import { Search, CheckCircle, Clock, XCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

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
            // 1. Check Profiles (Active Members)
            // Since RLS policies usually allow public read on profiles, this should work for checking existence.
            // We'll search by email (which might be in auth users, or specific field in profiles? 
            // Schema says 'profiles' table doesn't have email column directly, it's joined with auth.users usually.
            // BUT wait, in schema.sql we didn't add email to profiles explicitly? 
            // Let's check schema.sql again.

            // RE-READING SCHEMA from PREVIOUS STEPS:
            // profiles table: full_name, etc. NO EMAIL column visible in CREATE TABLE in step 481.
            // Wait, normally email is in auth.users. 
            // However, 'temp_registrations' HAS email.

            // If 'profiles' doesn't have email, we can't search it easily from client side without an Edge Function 
            // that uses Service Role to query auth.users.
            // CHECK: The migration script inserted data. Did it insert email into profiles?
            // Step 481 view_file schema.sql shows NO email column in profiles.

            // CRITICAL ISSUE: We cannot check "Active" status by email from client side if email isn't in profiles table 
            // and we don't have access to auth.users table (security risk).

            // WORKAROUND: The migration script likely put email in `temp_registrations`.
            // But for active users? User migrates from Excel. Excel had email.
            // If we didn't store email in profiles, we rely on Supabase Auth.

            // Let's assume for a moment the user MIGHT have added email to profiles or we can query temp_registrations.
            // If we can't query profiles by email, this feature is hard.

            // Backtrack: In `app/dashboard/page.tsx` step 487: `setProfile({ ...data, email: user.email })`. 
            // It fetches email from `auth.getUser()`.

            // Solution: we should probably query `temp_registrations` first. 
            // If not found there, we can't easily check 'active' without an RPC function `get_user_status_by_email`.

            // Let's look at `temp_registrations`.
            // Step 481: `create table temp_registrations ( ... email text ... )`.

            // Let's implements searching `temp_registrations` first.
            // For `profiles`, maybe we can search by "Nama Lengkap" instead? User asked for "Check Account". Usually by Email/ID.
            // User's Excel had "ID Anggota" (`member_id` in profiles). Maybe check by that?
            // Or "Phone"?

            // Let's stick to Email. If we can't check Active, we'll suggest Login.
            // Actually, if they are active, they should just try Login.
            // The "Cek Status" is mostly useful for "Is my registration pending?".

            // Let's implement checking `temp_registrations`.

            // WAIT. I can query `temp_registrations`.
            // I can also try `rpc` if I had one.

            // Idea: We will check `temp_registrations`. 
            // If found -> Pending/Approved/Rejected.
            // If NOT found -> "Data tidak ditemukan di antrian pendaftaran. Jika Anda sudah anggota lama, silakan coba Login langsung."

            const { data: tempList, error: tempError } = await supabase
                .from('temp_registrations')
                .select('*')
                .ilike('email', email)

            if (tempError) throw tempError

            if (tempList && tempList.length > 0) {
                const temp = tempList[0]
                if (temp.status === 'Pending') {
                    setResult({ status: 'found_pending', message: 'Status: MENUNGGU VERIFIKASI', data: temp })
                } else if (temp.status === 'Approved') {
                    setResult({ status: 'found_active', message: 'Status: DITERIMA / AKTIF', data: temp })
                } else {
                    setResult({ status: 'error', message: `Status: ${temp.status}`, data: temp })
                }
            } else {
                // Not in temp. Maybe active?
                // "Kami tidak menemukan pendaftaran baru dengan email ini. Jika Anda Alumni lama, akun Anda mungkin sudah Aktif."
                setResult({ status: 'not_found', message: 'Tidak ditemukan di antrian pendaftaran.' })
            }

        } catch (err: any) {
            setResult({ status: 'error', message: err.message || 'Terjadi kesalahan' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Navbar />

            <div className="flex-1 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-azure mx-auto mb-4">
                            <Search size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-navy">Cek Status Akun</h1>
                        <p className="text-gray-500 text-sm mt-2">Masukan email Anda untuk mengecek status pendaftaran atau keanggotaan.</p>
                    </div>

                    <form onSubmit={handleCheck} className="space-y-4">
                        <div>
                            <label className="block text-navy font-bold text-sm mb-2">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:border-azure focus:ring-1 focus:ring-azure"
                                placeholder="contoh@email.com"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-navy text-white font-bold py-3 rounded-lg hover:bg-navy/90 transition disabled:opacity-50"
                        >
                            {loading ? 'Memeriksa...' : 'Cek Status'}
                        </button>
                    </form>

                    {result && (
                        <div className={`mt-6 p-4 rounded-xl border ${result.status === 'found_active' ? 'bg-green-50 border-green-100' :
                                result.status === 'found_pending' ? 'bg-orange/10 border-orange/20' :
                                    'bg-gray-50 border-gray-100'
                            }`}>
                            <div className="flex items-start gap-3">
                                {result.status === 'found_active' && <CheckCircle className="text-green-600 flex-shrink-0" />}
                                {result.status === 'found_pending' && <Clock className="text-orange flex-shrink-0" />}
                                {result.status === 'not_found' && <XCircle className="text-gray-400 flex-shrink-0" />}

                                <div>
                                    <h4 className={`font-bold text-sm ${result.status === 'found_active' ? 'text-green-800' :
                                            result.status === 'found_pending' ? 'text-orange' :
                                                'text-gray-700'
                                        }`}>
                                        {result.message}
                                    </h4>
                                    {result.status === 'not_found' ? (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Email ini belum melakukan pendaftaran baru. <br />
                                            Jika Anda alumni lama (migrasi), silakan langsung mencoba
                                            <Link href="/auth/login" className="text-azure font-bold hover:underline ml-1">Login</Link>.
                                        </p>
                                    ) : (
                                        <p className="text-xs text-gray-600 mt-1">
                                            {result.data?.full_name} <br />
                                            Diajukan: {new Date(result.data?.submitted_at).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
