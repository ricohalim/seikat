import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Gunakan getSession() — baca dari cookie, TANPA network call ke Supabase
    // getUser() menyebabkan 504 timeout di Vercel Edge Runtime
    const {
        data: { session },
    } = await supabase.auth.getSession()

    const user = session?.user ?? null
    const pathname = request.nextUrl.pathname

    // 1. Belum login → akses /dashboard atau /admin → redirect login
    if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        url.searchParams.set('next', pathname)
        return NextResponse.redirect(url)
    }

    // 2. Sudah login → akses /auth → redirect dashboard
    if (user && pathname.startsWith('/auth')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // Catatan: role check untuk /admin dilakukan di dalam masing-masing page
    // untuk menghindari extra DB query di Edge Runtime (penyebab timeout 504)

    return response
}
