/**
 * Simple in-memory rate limiter untuk Admin API routes.
 * Menggunakan Map untuk menyimpan timestamp per key (userId atau IP).
 *
 * CATATAN: Rate limiter ini di-reset saat cold start (Vercel serverless).
 * Untuk production yang lebih robust, gunakan Upstash Redis (@upstash/ratelimit).
 * Implementasi ini sudah cukup untuk mencegah abuse saat development/staging.
 */

interface RateEntry {
    count: number
    resetAt: number
}

const store = new Map<string, RateEntry>()

/**
 * Cek apakah key tertentu sudah melebihi limit dalam window waktu tertentu.
 * @param key      Identifier unik (e.g. userId, IP address)
 * @param limit    Maksimum jumlah request dalam satu window
 * @param windowMs Durasi window dalam milliseconds (default: 60000 = 1 menit)
 * @returns { allowed: boolean, remaining: number, resetAt: number }
 */
export function checkRateLimit(
    key: string,
    limit: number = 10,
    windowMs: number = 60_000
): { allowed: boolean; remaining: number; resetAt: number } {
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || now > entry.resetAt) {
        // Window baru atau entry expired
        store.set(key, { count: 1, resetAt: now + windowMs })
        return { allowed: true, remaining: limit - 1, resetAt: now + windowMs }
    }

    if (entry.count >= limit) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt }
    }

    entry.count++
    return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt }
}

// Cleanup entries yang sudah expired (dijalankan periodically di setiap call)
// Mencegah memory leak saat banyak key unik
let lastCleanup = Date.now()
export function cleanupExpired() {
    const now = Date.now()
    if (now - lastCleanup < 5 * 60_000) return // Cleanup setiap 5 menit max
    lastCleanup = now
    for (const [key, entry] of store.entries()) {
        if (now > entry.resetAt) store.delete(key)
    }
}
