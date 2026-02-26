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
        // STRICT CHECK: Only superadmin can delete users. Admin cannot.
        if (profile?.role !== 'superadmin') {
            return NextResponse.json({ error: 'Forbidden: Superadmin only' }, { status: 403 })
        }

        const { targetUserId } = await request.json()
        if (!targetUserId) {
            return NextResponse.json({ error: 'Missing targetUserId' }, { status: 400 })
        }

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

        const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        })

        // 1. Delete user from Supabase Auth mapping
        // This implicitly cascades and deletes the public.profiles record
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(targetUserId)

        if (deleteError) {
            throw deleteError
        }

        return NextResponse.json({ success: true, message: `User berhasil dihapus dari sistem.` })

    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
