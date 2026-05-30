/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qqwmfijmjgqmcnrgvlie.supabase.co',
      },
    ],
  },

  // Security Headers — diterapkan ke semua route
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Mencegah browser menebak tipe konten (MIME sniffing attack)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Mencegah halaman dimuat dalam iframe (clickjacking attack)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Aktifkan XSS filter bawaan browser (legacy, tapi masih berguna)
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          // Batasi info referrer yang dikirim ke site lain
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Izinkan akses kamera hanya dari origin sendiri (untuk QR scanner)
          // Microphone dan geolocation dinonaktifkan
          { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
          // Paksa HTTPS selama 2 tahun, termasuk subdomain (HSTS)
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Content Security Policy — batasi sumber script, style, dan koneksi
          // 'unsafe-inline' diperlukan untuk Next.js inline styles & Tailwind
          // connect-src mencakup Supabase project URL
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://qqwmfijmjgqmcnrgvlie.supabase.co",
              "font-src 'self'",
              "connect-src 'self' https://qqwmfijmjgqmcnrgvlie.supabase.co wss://qqwmfijmjgqmcnrgvlie.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; ')
          },
        ],
      },
    ]
  },
};

export default nextConfig;
