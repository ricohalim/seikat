import { useMemo } from 'react'

export interface NameValidationResult {
    hasWarning: boolean
    message: string | null
}

const WHITELIST_PREFIXES = ['moh.', 'muh.', 'md.', 'm.', 'st.']
const TITLE_INDICATORS = [
    'dr.', 'ir.', 'prof.', 'drs.', 'dra.', 'h.', 'hj.', // Prefixes
    's.t', 's.kom', 's.pd', 's.sos', 's.km', 's.e', 's.h', // Suffixes S1
    'm.m', 'm.kom', 'm.pd', 'm.t', 'm.si', // Suffixes S2
    'ph.d', 'amd', 'a.md', 'apt.' // Others
]

export function useNameValidation() {
    const validateName = (name: string): NameValidationResult => {
        if (!name) return { hasWarning: false, message: null }

        const lowerName = name.toLowerCase().trim()

        // 1. Comma Check (Strong indicator of suffix title)
        // Exception: "Manullang, Sabam" (But usually we want to discourage this format too if possible, but let's just warn)
        if (lowerName.includes(',')) {
            return {
                hasWarning: true,
                message: 'Hindari penggunaan tanda koma (,) kecuali tertulis di KTP. Mohon tidak mencantumkan gelar.'
            }
        }

        // 2. Dot Check
        if (lowerName.includes('.')) {
            // Check if every dot part is whitelisted
            // Split by space
            const parts = lowerName.split(' ')

            for (const part of parts) {
                if (part.includes('.')) {
                    // It has a dot. Check if it's in whitelist
                    if (!WHITELIST_PREFIXES.includes(part) && !WHITELIST_PREFIXES.some(p => part.startsWith(p))) {
                        // Potentially a title?
                        // Let's check against title indicators to be sure, or just warn generally about dots if not whitelisted?
                        // User requirement: "Blacklist: Dr., Ir. etc"

                        // Strict check against common titles
                        const isTitle = TITLE_INDICATORS.some(t => part.includes(t))

                        if (isTitle) {
                            return {
                                hasWarning: true,
                                message: 'Terdeteksi potensi gelar akademik. Mohon isi Nama Lengkap saja tanpa gelar (contoh: Budi Santoso).'
                            }
                        }
                    }
                }
            }
        }

        return { hasWarning: false, message: null }
    }

    return { validateName }
}
