import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Service role client bypassing RLS, requires SUPABASE_SERVICE_ROLE_KEY
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

        // Check caller role directly using admin privileges
        const { data: callerProfile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', callerUser.id)
            .single()

        // Viewer and Korwil are explicitly forbidden from changing roles.
        // Usually, only superadmin should change role. We allow admin as per UI, but restrict if needed.
        if (!['superadmin', 'admin'].includes(callerProfile?.role)) {
            return NextResponse.json({ error: 'Forbidden: Superadmin/Admin only' }, { status: 403 })
        }

        const { targetUserId, newRole } = await req.json()
        if (!targetUserId || !newRole) {
            return NextResponse.json({ error: 'targetUserId and newRole required' }, { status: 400 })
        }

        // 2. Prevent non-superadmin from promoting others to superadmin or modifying existing superadmin
        if (callerProfile?.role !== 'superadmin') {
            if (newRole === 'superadmin') {
                return NextResponse.json({ error: 'Forbidden: Only Superadmin can assign Superadmin role' }, { status: 403 })
            }

            // Check target's current role
            const { data: targetProfile } = await supabaseAdmin
                .from('profiles')
                .select('role')
                .eq('id', targetUserId)
                .single()

            if (targetProfile?.role === 'superadmin') {
                return NextResponse.json({ error: 'Forbidden: Cannot modify Superadmin properties' }, { status: 403 })
            }
        }

        // 3. Execute role update
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ role: newRole })
            .eq('id', targetUserId)

        if (updateError) throw updateError

        // 4. Log the activity 
        await supabaseAdmin.from('activity_logs').insert({
            user_id: callerUser.id,
            action: 'USER_ROLE_CHANGE',
            details: {
                target_user_id: targetUserId,
                new_role: newRole,
                timestamp: new Date().toISOString()
            }
        }).then(() => { }) // Ignore if logging fails

        return NextResponse.json({ success: true, message: `Role berhasil diubah menjadi ${newRole}` })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
