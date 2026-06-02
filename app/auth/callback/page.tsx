'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
    const router = useRouter()

    useEffect(() => {
        const handleAuth = async () => {
            const searchParams = new URLSearchParams(window.location.search)
            const next = searchParams.get('next') || '/dashboard'
            const code = searchParams.get('code')

            // PKCE flow: ?code=... (Supabase may still send this regardless of flowType)
            if (code) {
                const { error } = await supabase.auth.exchangeCodeForSession(code)
                if (!error) {
                    router.replace(next)
                    return
                }
                // code exchange failed — fall through to hash check
            }

            // Implicit flow: #access_token=...
            const hash = window.location.hash.substring(1)
            const params = new URLSearchParams(hash)
            const accessToken = params.get('access_token')
            const refreshToken = params.get('refresh_token')

            if (accessToken && refreshToken) {
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken,
                    refresh_token: refreshToken
                })

                if (!error) {
                    router.replace(next)
                    return
                }
            }

            // Fallback: cek session aktif
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                router.replace(next)
            } else {
                router.replace('/auth/login')
            }
        }

        handleAuth()
    }, [router])

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-10 h-10 border-4 border-navy border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-gray-500 text-sm font-medium">Memproses login alumni...</p>
            </div>
        </div>
    )
}
