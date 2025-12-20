import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

    // Get User
    const {
        data: { user },
    } = await supabase.auth.getUser()

    // ROUTE PROTECTION RULES
    // 1. If user is NOT logged in and tries to access /dashboard or /admin -> Redirect to login
    if (!user && (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/admin'))) {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        url.searchParams.set('next', request.nextUrl.pathname)
        return NextResponse.redirect(url)
    }

    // 2. If user IS logged in and tries to access /auth fields (login/register) -> Redirect to dashboard
    if (user && request.nextUrl.pathname.startsWith('/auth')) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return response
}
