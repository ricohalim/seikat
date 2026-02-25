'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
    const router = useRouter()

    useEffect(() => {
        // Supabase client otomatis proses #access_token dari URL hash
        // Dengarkan event SIGNED_IN lalu redirect ke dashboard
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                router.replace('/dashboard')
            }
        })

        // Fallback: kalau session sudah ada langsung redirect
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) router.replace('/dashboard')
        })

        return () => subscription.unsubscribe()
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-10 h-10 border-4 border-navy border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-gray-500 text-sm font-medium">Memproses login...</p>
            </div>
        </div>
    )
}
