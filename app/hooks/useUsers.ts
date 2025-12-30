import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export function useUsers(itemsPerPage: number) {
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [totalItems, setTotalItems] = useState(0)

    // Filters State
    const [filter, setFilter] = useState('')
    const [filterGeneration, setFilterGeneration] = useState('')
    const [filterGender, setFilterGender] = useState('')
    const [page, setPage] = useState(0)

    // Auth Check State
    const [currentUserRole, setCurrentUserRole] = useState('')
    const [authLoading, setAuthLoading] = useState(true)
    const [availableGenerations, setAvailableGenerations] = useState<string[]>([])

    // Check Role
    useEffect(() => {
        const checkRole = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
                setCurrentUserRole(profile?.role || 'member')
            }
            setAuthLoading(false)
        }
        checkRole()
    }, [])

    // Fetch Generations for Dropdown
    useEffect(() => {
        const fetchGenerations = async () => {
            const { data } = await supabase.from('profiles').select('generation').not('generation', 'is', null)
            if (data) {
                const gens = Array.from(new Set(data.map((u: any) => u.generation).filter(Boolean))).sort() as string[]
                setAvailableGenerations(gens)
            }
        }
        fetchGenerations()
    }, [])

    // Main Fetch
    const fetchUsers = async () => {
        setLoading(true)
        try {
            const from = page * itemsPerPage
            const to = from + itemsPerPage - 1

            let query = supabase
                .from('profiles')
                .select('*', { count: 'exact' })
                .neq('account_status', 'Pending')
                .order('created_at', { ascending: true })
                .range(from, to)

            // 1. Text Search (Sanitized)
            if (filter) {
                const safeFilter = filter.replace(/[,()]/g, '')
                if (safeFilter.trim()) {
                    query = query.or(`full_name.ilike.%${safeFilter}%,email.ilike.%${safeFilter}%`)
                }
            }
            // 2. Generation Filter
            if (filterGeneration) {
                query = query.eq('generation', filterGeneration)
            }
            // 3. Gender Filter
            if (filterGender) {
                query = query.ilike('gender', filterGender)
            }

            const { data, count, error } = await query

            if (error) throw error

            if (data) {
                setUsers(data)
                setTotalItems(count || 0)
            }
        } catch (err) {
            console.error('Error fetching users:', err)
        } finally {
            setLoading(false)
        }
    }

    // Refetch when dependencies change
    useEffect(() => {
        if (!authLoading && ['superadmin', 'admin'].includes(currentUserRole)) {
            fetchUsers()
        }
    }, [page, filter, filterGeneration, filterGender, authLoading, currentUserRole])


    // Actions
    const updateUserLocal = (updatedUser: any) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
    }

    return {
        users,
        loading,
        totalItems,
        currentUserRole,
        authLoading,
        availableGenerations,
        // Methods to Expose State Setters
        filter, setFilter,
        filterGeneration, setFilterGeneration,
        filterGender, setFilterGender,
        page, setPage,
        fetchUsers, // Manual refetch if needed
        updateUserLocal
    }
}
