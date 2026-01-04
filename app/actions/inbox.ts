'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getInboxMessages(limit = 50, showArchived = false) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    // Check if admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin'

    let query = supabase
        .from('inbox_messages')
        .select('*, profiles:created_by(full_name)')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (isAdmin) {
        // Admin views: Toggle between archived and active
        // If showArchived is true, show ONLY archived
        if (showArchived) {
            query = query.eq('is_archived', true)
        } else {
            // Show active (archive = false)
            query = query.eq('is_archived', false)
        }
    } else {
        // User views: Only active, not expired, AND PUBLISHED
        query = query.or(`target_user_id.eq.${user.id},target_user_id.is.null`)
            .eq('is_archived', false)
            .eq('status', 'published') // Only show published
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching inbox messages:', error)
        return []
    }

    return data
}

export async function createBroadcastMessage(title: string, content: string, expiresAt: Date | null, status: 'draft' | 'published' = 'published') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Check admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('inbox_messages')
        .insert({
            title,
            content,
            created_by: user.id,
            target_user_id: null, // Broadcast
            type: 'announcement',
            expires_at: expiresAt ? expiresAt.toISOString() : null,
            status: status
        })

    if (error) {
        console.error('Error creating message:', error)
        return { error: 'Failed' }
    }

    revalidatePath('/admin/inbox')
    revalidatePath('/dashboard/inbox')
    return { success: true }
}

export async function updateMessage(id: string, title: string, content: string, expiresAt: Date | null, status: 'draft' | 'published') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Check admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('inbox_messages')
        .update({
            title,
            content,
            expires_at: expiresAt ? expiresAt.toISOString() : null,
            status: status
        })
        .eq('id', id)

    if (error) {
        console.error('Error updating message:', error)
        return { error: 'Failed' }
    }

    revalidatePath('/admin/inbox')
    revalidatePath('/dashboard/inbox')
    return { success: true }
}

export async function deleteMessage(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Unauthorized' }

    // Check admin
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('inbox_messages')
        .delete()
        .eq('id', id)

    if (error) {
        return { error: 'Failed' }
    }

    revalidatePath('/admin/inbox')
    revalidatePath('/dashboard/inbox')
    return { success: true }
}

export async function archiveMessage(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('inbox_messages')
        .update({ is_archived: true })
        .eq('id', id)

    if (error) return { error: 'Failed' }

    revalidatePath('/admin/inbox')
    return { success: true }
}

export async function unarchiveMessage(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('inbox_messages')
        .update({ is_archived: false })
        .eq('id', id)

    if (error) return { error: 'Failed' }

    revalidatePath('/admin/inbox')
    return { success: true }
}

export async function markInboxRead() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
        .from('profiles')
        .update({ last_read_inbox: new Date().toISOString() })
        .eq('id', user.id)

    revalidatePath('/dashboard/inbox')
}

export async function getUnreadCount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return 0

    // Get last Read
    const { data: profile } = await supabase
        .from('profiles')
        .select('last_read_inbox')
        .eq('id', user.id)
        .single()

    const lastRead = profile?.last_read_inbox || new Date(0).toISOString() // Default epoch if null

    const { count, error } = await supabase
        .from('inbox_messages')
        .select('*', { count: 'exact', head: true })
        .or(`target_user_id.eq.${user.id},target_user_id.is.null`)
        .eq('is_archived', false)
        .eq('status', 'published')
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .gt('created_at', lastRead)

    if (error) return 0
    return count || 0
}
