'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
    const router = useRouter()

    useEffect(() => {
        const handleAuth = async () => {
            // Ambil token dari URL hash (#access_token=...)
            const hash = window.location.hash.substring(1)
            const params = new URLSearchParams(hash)
            const accessToken = params.get('access_token')
            const refreshToken = params.get('refresh_token')

            if (accessToken && refreshToken) {
                // Set session baru secara manual menggunakan token alumni
                // Catatan: Jika dibuka di browser yang sama dengan admin, 
                // ini akan menimpa session admin. Disarankan buka di Incognito.
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                })

                if (!error) {
                    router.replace('/dashboard')
                    return
                }
            }

            // Fallback: Jika tidak ada token, cek session aktif
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                router.replace('/dashboard')
            } else {
                router.replace('/auth/login')
            }
        }

        handleAuth()
    }, [router])

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-10 h-10 border-4 border-navy border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-gray-500 text-sm font-medium">Memproses login alumni...</p>
            </div>
        </div>
    )
}
