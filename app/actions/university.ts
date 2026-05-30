'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { hasAdminAccess } from '@/lib/roles'

// Helper: ambil user dan cek apakah ia admin/superadmin
async function requireAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { supabase, user: null, authorized: false }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    return { supabase, user, authorized: hasAdminAccess(profile?.role) }
}

export async function getUniversities() {
    const supabase = await createClient()

    // Order by name ASC
    const { data, error } = await supabase
        .from('master_universities')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching universities:', error)
        return []
    }

    return data
}

export async function addUniversity(name: string) {
    const { supabase, authorized } = await requireAdmin()
    if (!authorized) return { error: 'Forbidden' }

    const { error } = await supabase
        .from('master_universities')
        .insert({ name: name.toUpperCase().trim() })

    if (error) {
        if (error.code === '23505') return { error: 'Universitas sudah ada' }
        return { error: 'Gagal menambah universitas' }
    }

    revalidatePath('/admin/master-data')
    return { success: true }
}

export async function updateUniversity(id: number, name: string) {
    const { supabase, authorized } = await requireAdmin()
    if (!authorized) return { error: 'Forbidden' }

    const { error } = await supabase
        .from('master_universities')
        .update({ name: name.toUpperCase().trim() })
        .eq('id', id)

    if (error) {
        if (error.code === '23505') return { error: 'Universitas sudah ada' }
        return { error: 'Gagal update universitas' }
    }

    revalidatePath('/admin/master-data')
    return { success: true }
}

export async function deleteUniversity(id: number) {
    const { supabase, authorized } = await requireAdmin()
    if (!authorized) return { error: 'Forbidden' }

    const { error } = await supabase
        .from('master_universities')
        .update({ is_active: false })
        .eq('id', id)

    if (error) {
        return { error: 'Gagal menghapus universitas' }
    }

    revalidatePath('/admin/master-data')
    return { success: true }
}
