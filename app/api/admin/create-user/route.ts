import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader) return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 })

        // Verify caller is superadmin or admin
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

        const { fullName, email, phone, generation, university } = await request.json()

        if (!fullName || !email) {
            return NextResponse.json({ error: 'Nama dan Email wajib diisi' }, { status: 400 })
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 })
        }

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        if (!serviceRoleKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY')

        const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        })

        // 1. Check if email is already in use in auth.users
        const { data: { users: existingUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
        if (listError) throw listError

        const isEmailTaken = existingUsers.some(u => u.email?.toLowerCase() === email.toLowerCase())
        if (isEmailTaken) {
            return NextResponse.json({
                error: `Email ${email} sudah terdaftar di sistem. Anda tidak bisa menggunakan email ini lagi.`
            }, { status: 409 })
        }

        // 2. Create User in Supabase Auth
        const password = '123456' // Sesuai permintaan: password default 123456

        const { data: newUserAuth, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // Bypass email confirmation
            user_metadata: {
                full_name: fullName
            }
        })

        if (createAuthError || !newUserAuth.user) {
            console.error('Auth create error:', createAuthError)
            return NextResponse.json({ error: `Gagal membuat user di Auth: ${createAuthError?.message}` }, { status: 400 })
        }

        // 3. Upsert profil langsung — jangan hanya UPDATE supaya pasti terbuat
        //    walau tidak ada trigger Supabase Auth yang otomatis insert row
        const { error: upsertProfileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: newUserAuth.user.id,
                full_name: fullName,
                email: email,
                phone: phone || null,
                generation: generation || null,
                university: university || null,
                account_status: 'Active',
                role: 'member'
            }, { onConflict: 'id' })

        if (upsertProfileError) {
            console.error('Profile upsert error:', upsertProfileError)
            // Rollback: hapus user Auth agar tidak jadi ghost account
            await supabaseAdmin.auth.admin.deleteUser(newUserAuth.user.id)
            return NextResponse.json({ error: `Gagal menyimpan data profil: ${upsertProfileError.message}` }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: `Akun alumni berhasil dibuat.`,
            user: {
                id: newUserAuth.user.id,
                email: newUserAuth.user.email,
                password: password
            }
        })

    } catch (error: any) {
        console.error('Create User API Error:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
