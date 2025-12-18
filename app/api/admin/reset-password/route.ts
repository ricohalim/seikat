import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'




export async function POST(request: Request) {
    try {
        // 1. Check Authenticated User (Superadmin Check)
        // We use the Authorization header sent by the client
        const authHeader = request.headers.get('Authorization')
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 })
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: { headers: { Authorization: authHeader } },
                auth: { persistSession: false }
            }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check Role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (profile?.role !== 'superadmin') {
            return NextResponse.json({ error: 'Forbidden: Superadmin only' }, { status: 403 })
        }

        // 2. Extract Data
        const { targetUserId, newPassword } = await request.json()
        if (!targetUserId || !newPassword) {
            return NextResponse.json({ error: 'Missing userId or password' }, { status: 400 })
        }

        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password too short (min 6 chars)' }, { status: 400 })
        }

        // 3. Perform Reset using Admin Client
        // Initialize Admin Client lazily to prevent build-time errors if key is missing
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!serviceRoleKey) {
            throw new Error('Server misconfiguration: Missing SUPABASE_SERVICE_ROLE_KEY')
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            targetUserId,
            { password: newPassword }
        )

        if (updateError) {
            throw updateError
        }

        // 4. Log this action (Optional but good for traceability)
        // We can use the existing RPC via the client or let the trigger handle implementation
        // Since this is key security event, we manually log via RPC if possible or just rely on success return

        return NextResponse.json({
            success: true,
            message: `Password untuk ${updatedUser.user?.email} berhasil direset.`
        })

    } catch (error: any) {
        console.error('Reset Password Error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
