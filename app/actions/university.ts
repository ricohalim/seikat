'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Double check role prevents bypassing UI, but RLS is the real gatekeeper
    // Ideally we assume RLS handles it to keep this function clean OR we manually check role here for faster feedback

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
    const supabase = await createClient()

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
    const supabase = await createClient()

    // Soft delete usually safer for referential integrity, but for this simpler implementation hard delete or is_active=false
    // The table schema has is_active, let's use that (Soft Delete)
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
