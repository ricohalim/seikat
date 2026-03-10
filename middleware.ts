import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
    const isPaused = true; // Ubah ke false untuk mengaktifkan kembali project

    if (isPaused) {
        return new Response(
            `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Under Maintenance | Seikat</title>
    <style>
        :root {
            --primary-color: #3b82f6;
            --bg-color: #f3f4f6;
            --card-bg: #ffffff;
            --text-main: #1f2937;
            --text-muted: #6b7280;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --primary-color: #60a5fa;
                --bg-color: #111827;
                --card-bg: #1f2937;
                --text-main: #f9fafb;
                --text-muted: #9ca3af;
            }
        }

        body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }

        .maintenance-card {
            background-color: var(--card-bg);
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
            text-align: center;
            max-width: 500px;
            width: 100%;
            animation: fadeIn 0.6s ease-out;
        }

        .icon-container {
            width: 80px;
            height: 80px;
            background-color: rgba(59, 130, 246, 0.1);
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto 24px;
            color: var(--primary-color);
        }

        .icon-container svg {
            width: 40px;
            height: 40px;
            animation: pulse 2s infinite;
        }

        h1 {
            font-size: 1.75rem;
            font-weight: 700;
            margin: 0 0 12px;
            letter-spacing: -0.025em;
        }

        p {
            color: var(--text-muted);
            line-height: 1.6;
            margin: 0 0 24px;
            font-size: 1rem;
        }

        .progress-bar-container {
            height: 6px;
            background-color: rgba(59, 130, 246, 0.1);
            border-radius: 9999px;
            overflow: hidden;
            margin-top: 32px;
        }

        .progress-bar {
            height: 100%;
            width: 50%;
            background-color: var(--primary-color);
            border-radius: 9999px;
            animation: loading 2s ease-in-out infinite alternate;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }

        @keyframes loading {
            0% { width: 30%; transform: translateX(-100%); }
            100% { width: 30%; transform: translateX(400%); }
        }
    </style>
</head>
<body>
    <div class="maintenance-card">
        <div class="icon-container">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        </div>
        <h1>Under Maintenance</h1>
        <p>Kami sedang melakukan pemeliharaan dan peningkatan sistem untuk memberikan pengalaman yang lebih baik. Silakan kembali beberapa saat lagi.</p>
        <div class="progress-bar-container">
            <div class="progress-bar"></div>
        </div>
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
