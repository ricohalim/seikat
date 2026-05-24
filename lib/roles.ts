/**
 * Centralized role definitions untuk SEIKAT.
 *
 * SEMUA role check di seluruh aplikasi harus menggunakan helper dari file ini.
 * Jangan hardcode array role (e.g. ['admin', 'superadmin']) langsung di komponen.
 */

export const ROLES = ['superadmin', 'admin', 'korwil', 'viewer', 'member'] as const
export type Role = typeof ROLES[number]

/** Role yang punya akses admin penuh (kelola user, event, konten) */
export const ADMIN_ROLES: readonly Role[] = ['superadmin', 'admin']

/** Role yang bisa masuk admin panel (akses terbatas sesuai role) */
export const PRIVILEGED_ROLES: readonly Role[] = ['superadmin', 'admin', 'korwil', 'viewer']

/**
 * Cek apakah role memiliki akses admin penuh.
 * Digunakan untuk guard halaman/action yang butuh admin atau superadmin.
 */
export const hasAdminAccess = (role?: string | null): boolean =>
    ADMIN_ROLES.includes(role as Role)

/**
 * Cek apakah role memiliki akses ke admin panel (tapi mungkin read-only).
 * Digunakan untuk guard layout admin.
 */
export const hasPrivilegedAccess = (role?: string | null): boolean =>
    PRIVILEGED_ROLES.includes(role as Role)

/**
 * Cek apakah role adalah superadmin.
 * Digunakan untuk operasi sensitif (assign superadmin, hapus data kritis).
 */
export const isSuperAdmin = (role?: string | null): boolean =>
    role === 'superadmin'
