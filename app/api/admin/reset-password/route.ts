import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { checkRateLimit, cleanupExpired } from '@/lib/rate-limit'
import { validatePassword } from '@/lib/utils'
import { isSuperAdmin, isValidUUID } from '@/lib/roles'

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
        const { data: { user }, error: callerError } = await supabaseAdmin.auth.getUser(token)
        if (callerError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Rate limiting: max 10 reset password per menit per admin
        cleanupExpired()
        const rl = checkRateLimit(`reset-password:${user.id}`, 10, 60_000)
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
            .eq('id', user.id)
            .single()

        if (!profile || !isSuperAdmin(profile?.role)) {
            return NextResponse.json({ error: 'Forbidden: Superadmin only' }, { status: 403 })
        }

        const { targetUserId, newPassword } = await request.json()
        if (!targetUserId || !newPassword) {
            return NextResponse.json({ error: 'Missing userId or password' }, { status: 400 })
        }
        if (!isValidUUID(targetUserId)) {
            return NextResponse.json({ error: 'targetUserId tidak valid' }, { status: 400 })
        }

        const pwError = validatePassword(newPassword)
        if (pwError) return NextResponse.json({ error: pwError }, { status: 400 })

        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            targetUserId,
            { password: newPassword }
        )
        if (updateError) throw updateError

        // Log activity
        await supabaseAdmin.from('activity_logs').insert({
            user_id: user.id,
            action: 'USER_PASSWORD_RESET',
            details: { target_user_id: targetUserId, timestamp: new Date().toISOString() }
        }).then(() => {})

        return NextResponse.json({
            success: true,
            message: `Password untuk ${updatedUser.user?.email} berhasil direset.`
        })

    } catch (error: any) {
        console.error('[reset-password] Error:', error)
        const msg = process.env.NODE_ENV !== 'production' ? error.message : 'Terjadi kesalahan server.'
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
