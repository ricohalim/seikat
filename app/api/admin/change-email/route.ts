import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader) return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 })

        // Verify caller is superadmin
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { global: { headers: { Authorization: authHeader } }, auth: { persistSession: false } }
        )
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        if (!['superadmin', 'admin'].includes(profile?.role)) {
            return NextResponse.json({ error: 'Forbidden: Admin only' }, { status: 403 })
        }

        const { targetUserId, newEmail } = await request.json()
        if (!targetUserId || !newEmail) {
            return NextResponse.json({ error: 'Missing targetUserId or newEmail' }, { status: 400 })
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
            return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 })
        }

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

        const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        })

        // 1. Update email di Supabase Auth
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
            email: newEmail,
            email_confirm: true // bypass email confirmation
        })
        if (authError) throw authError

        // 2. Update email di tabel profiles juga
        await supabaseAdmin.from('profiles').update({ email: newEmail }).eq('id', targetUserId)

        return NextResponse.json({ success: true, message: `Email berhasil diubah ke ${newEmail}` })

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
