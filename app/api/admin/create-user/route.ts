import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { checkRateLimit, cleanupExpired } from '@/lib/rate-limit'
import { hasAdminAccess } from '@/lib/roles'

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

        // Rate limiting: max 20 create per menit per admin
        cleanupExpired()
        const rl = checkRateLimit(`create-user:${callerUser.id}`, 20, 60_000)
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


        const { fullName, email, phone, generation, university } = await request.json()

        if (!fullName || !email) {
            return NextResponse.json({ error: 'Nama dan Email wajib diisi' }, { status: 400 })
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 })
        }

        // 1. Check if email is already in use via profiles table
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email.toLowerCase())
            .maybeSingle()
        if (existingProfile) {
            return NextResponse.json({
                error: `Email ${email} sudah terdaftar di sistem. Anda tidak bisa menggunakan email ini lagi.`
            }, { status: 409 })
        }

        // 2. Create User in Supabase Auth
        // Generate password random yang kuat — tidak pernah dikembalikan ke client
        const internalPassword = randomBytes(32).toString('hex')

        const { data: newUserAuth, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: internalPassword,
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

        // 4. Generate one-time recovery link agar user bisa set password sendiri
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://seikat.vercel.app'
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: { redirectTo: `${siteUrl}/auth/callback` }
        })

        if (linkError) {
            console.error('Generate recovery link error:', linkError)
            // Akun sudah dibuat, tapi link gagal — tetap return sukses, admin bisa reset manual
        }

        return NextResponse.json({
            success: true,
            message: `Akun alumni berhasil dibuat.`,
            user: {
                id: newUserAuth.user.id,
                email: newUserAuth.user.email,
                setupLink: linkData?.properties?.action_link ?? null
            }
        })

    } catch (error: any) {
        console.error('[create-user]', error)
        const isDev = process.env.NODE_ENV === 'development'
        return NextResponse.json({ error: isDev ? error.message : 'Internal Server Error' }, { status: 500 })
    }
}
