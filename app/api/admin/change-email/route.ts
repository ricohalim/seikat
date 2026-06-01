import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { checkRateLimit, cleanupExpired } from '@/lib/rate-limit'
import { hasAdminAccess, isValidUUID } from '@/lib/roles'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Verify caller JWT via service_role
        const token = authHeader.replace('Bearer ', '')
        const { data: { user: callerUser }, error: callerError } = await supabaseAdmin.auth.getUser(token)
        if (callerError || !callerUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Rate limiting: max 20 email changes per menit per admin
        cleanupExpired()
        const rl = checkRateLimit(`change-email:${callerUser.id}`, 20, 60_000)
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
            )
        }

        // Fetch caller role via service_role
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', callerUser.id)
            .single()

        if (!hasAdminAccess(profile?.role)) {
            return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
        }

        const { targetUserId, newEmail } = await request.json()
        if (!targetUserId || !newEmail) {
            return NextResponse.json({ error: 'Missing targetUserId or newEmail' }, { status: 400 })
        }
        if (!isValidUUID(targetUserId)) {
            return NextResponse.json({ error: 'targetUserId tidak valid' }, { status: 400 })
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 })
        }

        // 1. Check if email is already in use via profiles table
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', newEmail.toLowerCase())
            .neq('id', targetUserId)
            .maybeSingle()
        if (existingProfile) {
            return NextResponse.json({
                error: `Email ${newEmail} sudah digunakan oleh akun lain. Jika ini adalah "akun hantu" (tanpa profile), hapus dulu dari Supabase Auth.`
            }, { status: 409 })
        }

        // 2. Update email di Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
            email: newEmail,
            email_confirm: true // bypass email confirmation
        })
        if (authError) {
            console.error('[change-email] Auth update error:', authError)
            const isDev = process.env.NODE_ENV === 'development'
            return NextResponse.json({ error: isDev ? `Gagal update di Auth: ${authError.message}` : 'Gagal update email' }, { status: 400 })
        }

        // 3. Update email di tabel profiles juga
        await supabaseAdmin.from('profiles').update({ email: newEmail }).eq('id', targetUserId)

        return NextResponse.json({ success: true, message: `Email berhasil diubah ke ${newEmail}` })

    } catch (error: any) {
        console.error('[change-email]', error)
        const isDev = process.env.NODE_ENV === 'development'
        return NextResponse.json({ error: isDev ? error.message : 'Internal Server Error' }, { status: 500 })
    }
}
