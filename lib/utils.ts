import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Sanitize external URLs untuk mencegah XSS via javascript: atau data: protocol.
 * Hanya mengizinkan URL dengan protocol http: atau https:.
 * @returns URL yang aman, atau null jika URL tidak valid / berbahaya
 */
export function sanitizeExternalUrl(url: string | null | undefined): string | null {
    if (!url || typeof url !== 'string') return null
    const trimmed = url.trim()
    if (!trimmed) return null
    try {
        const parsed = new URL(trimmed)
        if (!['http:', 'https:'].includes(parsed.protocol)) return null
        return parsed.toString()
    } catch {
        // URL tidak valid (tidak bisa di-parse)
        return null
    }
}

export function calculateProfileCompleteness(profile: any): number {
    if (!profile) return 0;

    const fields = [
        'full_name',
        'phone',
        'gender',
        'birth_place',
        'birth_date',
        // Academic
        'generation',
        'education_level',
        'university',
        'major',
        // Domicile
        'domicile_city',
        'domicile_province',
        // Job
        'job_type',
        'job_position',
        'company_name',
        'industry_sector',
        // Image
        'photo_url'
    ];

    let filled = 0;
    fields.forEach(field => {
        if (profile[field] && profile[field].trim() !== '') {
            filled++;
        }
    });

    return Math.round((filled / fields.length) * 100);
}

/**
 * Validasi kekuatan password.
 * @returns null jika valid, atau string pesan error jika tidak valid
 */
export function validatePassword(password: string): string | null {
    if (!password) return 'Password tidak boleh kosong'
    if (password.length < 8) return 'Password minimal 8 karakter'
    if (!/[A-Z]/.test(password)) return 'Harus mengandung minimal 1 huruf kapital'
    if (!/[0-9]/.test(password)) return 'Harus mengandung minimal 1 angka'
    return null // valid
}
