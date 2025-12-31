'use client'

import { useState, useEffect } from 'react'
import { getUniversities } from '@/app/actions/university'
import { UNIVERSITIES as STATIC_UNIVERSITIES } from '@/lib/constants'

// Hook to get universities (Hybrid: DB first, fallback to Static)
export function useUniversities() {
    const [universities, setUniversities] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchUnis = async () => {
            try {
                const data = await getUniversities()
                if (data && data.length > 0) {
                    setUniversities(data.map((u: any) => u.name))
                } else {
                    // Fallback to static if DB Empty/Error
                    setUniversities(STATIC_UNIVERSITIES)
                }
            } catch (err) {
                console.error("Failed to fetch universities", err)
                setUniversities(STATIC_UNIVERSITIES)
            } finally {
                setLoading(false)
            }
        }
        fetchUnis()
    }, [])

    return { universities, loading }
}
