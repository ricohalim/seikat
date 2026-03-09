import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    const isPaused = true; // Ubah ke false untuk mengaktifkan kembali project

    if (isPaused) {
        return new Response(
            `<!DOCTYPE html>
            <html>
                <head>
                    <title>Project Paused</title>
                    <meta name="viewport" content="width=device-width, initial-scale=1">
                    <style>
                        body { font-family: system-ui, -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: #000; color: #fff; text-align: center; }
                        .container { padding: 20px; }
                        h1 { font-size: 2rem; margin-bottom: 10px; }
                        p { color: #888; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Project Paused</h1>
                        <p>Akses publik sedang ditutup untuk sementara waktu.</p>
                    </div>
                </body>
            </html>`,
            {
                status: 503,
                headers: { 'content-type': 'text/html' },
            }
        );
    }

    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
