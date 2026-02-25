'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
    const router = useRouter()

    useEffect(() => {
        // 1. Sign out dari session saat ini (admin) supaya token alumni bisa masuk
        supabase.auth.signOut().then(() => {
            // 2. Setelah signout, Supabase akan proses #access_token dari URL hash
            // dan trigger onAuthStateChange dengan session baru (alumni)
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                if (event === 'SIGNED_IN' && session) {
                    router.replace('/dashboard')
                }
            })

            return () => subscription.unsubscribe()
        })
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
