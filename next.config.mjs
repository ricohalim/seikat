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
        ],
      },
    ]
  },
};

export default nextConfig;
