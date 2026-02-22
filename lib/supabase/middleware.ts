import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const ADMIN_ROLES = ['admin', 'superadmin', 'korwil'] as const

export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create the client
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

    // Get User (always call this to refresh session cookies)
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const pathname = request.nextUrl.pathname

    // ROUTE PROTECTION RULES
    // 1. If user is NOT logged in and tries to access /dashboard or /admin -> Redirect to login
    if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin'))) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        url.searchParams.set('next', pathname)
        return NextResponse.redirect(url)
    }

    // 2. If user IS logged in and tries to access /auth pages -> Redirect to dashboard
    if (user && pathname.startsWith('/auth')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    // 3. If user IS logged in and tries to access /admin -> Check role (server-side, before render)
    if (user && pathname.startsWith('/admin')) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        const userRole = profile?.role as string | undefined
        if (!userRole || !ADMIN_ROLES.includes(userRole as typeof ADMIN_ROLES[number])) {
            // Not an admin -> redirect to member dashboard
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return response
}
