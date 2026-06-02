import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = request.nextUrl
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/dashboard/change-password?from=reset'

    if (code) {
        const supabase = await createClient()

        // Try OTP token_hash verification (magic link flow via {{ .Token }} template)
        const { error: otpError } = await supabase.auth.verifyOtp({
            token_hash: code,
            type: 'magiclink',
        })
        if (!otpError) {
            return NextResponse.redirect(`${origin}${next}`)
        }

        // Fallback: try PKCE code exchange
        const { error: pkceError } = await supabase.auth.exchangeCodeForSession(code)
        if (!pkceError) {
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    return NextResponse.redirect(`${origin}/auth/forgot-password`)
}
