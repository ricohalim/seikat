import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
    try {
        // 1. Verify the requesting user is superadmin/admin
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const token = authHeader.replace('Bearer ', '')
        const { data: { user: callerUser }, error: callerError } = await supabaseAdmin.auth.getUser(token)
        if (callerError || !callerUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        // Check caller is superadmin/admin
        const { data: callerProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', callerUser.id)
            .single()

        if (!['superadmin', 'admin'].includes(callerProfile?.role)) {
            return NextResponse.json({ error: 'Forbidden: Superadmin/Admin only' }, { status: 403 })
        }

        // 2. Get target user email
        const { targetUserId } = await req.json()
        if (!targetUserId) return NextResponse.json({ error: 'targetUserId required' }, { status: 400 })

        const { data: targetProfile } = await supabaseAdmin
            .from('profiles')
            .select('email, full_name')
            .eq('id', targetUserId)
            .single()

        if (!targetProfile?.email) {
            return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 })
        }

        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seikat.vercel.app'

        // 3. Generate magic link for target user
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: targetProfile.email,
            options: {
                redirectTo: `${siteUrl}/auth/callback`
            }
        })

        if (error) throw error

        // 4. Log the impersonation for audit trail
        await supabaseAdmin.from('activity_logs').insert({
            user_id: callerUser.id,
            action: 'IMPERSONATE',
            details: {
                target_user_id: targetUserId,
                target_email: targetProfile.email,
                target_name: targetProfile.full_name,
                timestamp: new Date().toISOString()
            }
        }).then(() => { }) // non-blocking, ignore error if table doesn't exist

        return NextResponse.json({
            link: data.properties.action_link,
            email: targetProfile.email,
            name: targetProfile.full_name
        })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
