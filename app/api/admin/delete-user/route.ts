import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { checkRateLimit, cleanupExpired } from '@/lib/rate-limit'
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

        // Verify caller JWT via service_role (bypasses RLS — cannot be spoofed)
        const token = authHeader.replace('Bearer ', '')
        const { data: { user: callerUser }, error: callerError } = await supabaseAdmin.auth.getUser(token)
        if (callerError || !callerUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Rate limiting: max 10 deletions per menit per admin
        cleanupExpired()
        const rl = checkRateLimit(`delete-user:${callerUser.id}`, 10, 60_000)
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.' },
                { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
            )
        }

        // Fetch caller role via service_role (bypasses RLS — true role always returned)
        const { data: callerProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', callerUser.id)
            .single()

        // STRICT CHECK: Only superadmin can delete users
        if (!isSuperAdmin(callerProfile?.role)) {
            return NextResponse.json({ error: 'Forbidden: Superadmin only' }, { status: 403 })
        }

        const { targetUserId } = await request.json()
        if (!targetUserId) return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 })
        if (!isValidUUID(targetUserId)) return NextResponse.json({ error: 'targetUserId tidak valid' }, { status: 400 })

        // Prevent superadmin from deleting themselves
        if (targetUserId === callerUser.id) {
            return NextResponse.json({ error: 'Tidak dapat menghapus akun sendiri' }, { status: 403 })
        }

        // Delete user from Supabase Auth (cascades to public.profiles via DB trigger)
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)
        if (deleteError) throw deleteError

        // Log activity
        await supabaseAdmin.from('activity_logs').insert({
            user_id: callerUser.id,
            action: 'USER_DELETED',
            details: { target_user_id: targetUserId, timestamp: new Date().toISOString() }
        }).then(() => {})

        return NextResponse.json({ success: true, message: 'User berhasil dihapus dari sistem.' })

    } catch (error: any) {
        console.error('[delete-user]', error)
        const isDev = process.env.NODE_ENV === 'development'
        return NextResponse.json({ error: isDev ? error.message : 'Internal Server Error' }, { status: 500 })
    }
}
