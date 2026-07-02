'use server'

import { createClient } from '@/lib/supabase/server'
import { hasAdminAccess } from '@/lib/roles'

// ─── Types ────────────────────────────────────────────────────────────────────

export type QuestionType = 'short_text' | 'long_text' | 'likert' | 'multiple_choice' | 'checkbox'

export interface SurveyQuestion {
    id?: string
    order_index: number
    type: QuestionType
    question_text: string
    options?: string[]
    required: boolean
}

export interface EventSurveyWithQuestions {
    id: string
    event_id: string
    title: string
    description?: string
    status: 'active' | 'closed'
    questions: SurveyQuestion[]
}

// ─── Admin helpers ─────────────────────────────────────────────────────────────

async function assertAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!hasAdminAccess(profile?.role)) return null
    return { supabase, userId: user.id }
}

// ─── Templates ────────────────────────────────────────────────────────────────

export async function getSurveyTemplates() {
    const supabase = await createClient()
    const { data } = await supabase
        .from('survey_templates')
        .select(`*, questions:survey_template_questions(count)`)
        .order('created_at', { ascending: false })
    return (data || []).map((t: any) => ({
        ...t,
        question_count: t.questions?.[0]?.count ?? 0,
    }))
}

export async function getTemplateWithQuestions(templateId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('survey_templates')
        .select(`*, questions:survey_template_questions(*)`)
        .eq('id', templateId)
        .order('order_index', { referencedTable: 'survey_template_questions', ascending: true })
        .single()
    return data
}

export async function upsertTemplate(
    title: string,
    description: string,
    questions: SurveyQuestion[],
    templateId?: string
) {
    const ctx = await assertAdmin()
    if (!ctx) return { error: 'Unauthorized' }
    const { supabase, userId } = ctx

    let id = templateId
    if (id) {
        const { error } = await supabase
            .from('survey_templates')
            .update({ title, description })
            .eq('id', id)
        if (error) return { error: error.message }
    } else {
        const { data, error } = await supabase
            .from('survey_templates')
            .insert({ title, description, created_by: userId })
            .select()
            .single()
        if (error || !data) return { error: error?.message ?? 'Insert failed' }
        id = data.id
    }

    // Replace questions
    await supabase.from('survey_template_questions').delete().eq('template_id', id)
    if (questions.length > 0) {
        await supabase.from('survey_template_questions').insert(
            questions.map((q, i) => ({
                template_id: id,
                order_index: i,
                type: q.type,
                question_text: q.question_text,
                options: q.options?.length ? q.options : null,
                required: q.required,
            }))
        )
    }
    return { id }
}

export async function deleteTemplate(templateId: string) {
    const ctx = await assertAdmin()
    if (!ctx) return { error: 'Unauthorized' }
    const { error } = await ctx.supabase
        .from('survey_templates')
        .delete()
        .eq('id', templateId)
    return error ? { error: error.message } : { success: true }
}

// ─── Event Survey ──────────────────────────────────────────────────────────────

export async function getEventSurvey(eventId: string): Promise<EventSurveyWithQuestions | null> {
    const supabase = await createClient()
    const { data } = await supabase
        .from('event_surveys')
        .select(`*, questions:event_survey_questions(*)`)
        .eq('event_id', eventId)
        .order('order_index', { referencedTable: 'event_survey_questions', ascending: true })
        .single()
    if (!data) return null
    return {
        ...data,
        questions: (data.questions || []).sort((a: any, b: any) => a.order_index - b.order_index),
    }
}

export async function upsertEventSurvey(
    eventId: string,
    title: string,
    description: string,
    questions: SurveyQuestion[]
) {
    const ctx = await assertAdmin()
    if (!ctx) return { error: 'Unauthorized' }
    const { supabase } = ctx

    const { data: survey, error: surveyError } = await supabase
        .from('event_surveys')
        .upsert({ event_id: eventId, title, description, status: 'active' }, { onConflict: 'event_id' })
        .select()
        .single()

    if (surveyError || !survey) return { error: surveyError?.message ?? 'Failed' }

    // Replace questions
    await supabase.from('event_survey_questions').delete().eq('event_survey_id', survey.id)
    if (questions.length > 0) {
        await supabase.from('event_survey_questions').insert(
            questions.map((q, i) => ({
                event_survey_id: survey.id,
                order_index: i,
                type: q.type,
                question_text: q.question_text,
                options: q.options?.length ? q.options : null,
                required: q.required,
            }))
        )
    }
    return { id: survey.id }
}

export async function deleteEventSurvey(eventId: string) {
    const ctx = await assertAdmin()
    if (!ctx) return { error: 'Unauthorized' }
    const { error } = await ctx.supabase
        .from('event_surveys')
        .delete()
        .eq('event_id', eventId)
    return error ? { error: error.message } : { success: true }
}

// Copy all questions from a template into an event survey
export async function applyTemplateToEvent(eventId: string, templateId: string) {
    const supabase = await createClient()
    const tmpl = await getTemplateWithQuestions(templateId)
    if (!tmpl) return { error: 'Template tidak ditemukan' }
    const questions: SurveyQuestion[] = (tmpl.questions || []).map((q: any) => ({
        order_index: q.order_index,
        type: q.type,
        question_text: q.question_text,
        options: q.options || [],
        required: q.required,
    }))
    return upsertEventSurvey(eventId, tmpl.title, tmpl.description || '', questions)
}

// ─── Send Notification ────────────────────────────────────────────────────────

export async function sendSurveyNotification(eventId: string, eventTitle: string) {
    const ctx = await assertAdmin()
    if (!ctx) return { error: 'Unauthorized' }
    const { supabase, userId } = ctx

    // Get all Attended participants
    const { data: attendees } = await supabase
        .from('event_participants')
        .select('user_id')
        .eq('event_id', eventId)
        .eq('status', 'Attended')

    if (!attendees || attendees.length === 0) return { sent: 0 }

    const messages = attendees.map((a: any) => ({
        title: `📋 Survey: ${eventTitle}`,
        content: `Halo! Terima kasih sudah hadir di **${eventTitle}**.\n\nMohon luangkan waktu sebentar untuk mengisi survei kepuasan acara. Masukan kamu sangat berarti untuk kami!\n\n[Isi Survey](/dashboard/events/${eventId}/survey)`,
        type: 'info',
        target_user_id: a.user_id,
        created_by: userId,
        status: 'published',
    }))

    const { error } = await supabase.from('inbox_messages').insert(messages)
    return error ? { error: error.message } : { sent: attendees.length }
}

// ─── User: Submit Survey ───────────────────────────────────────────────────────

export async function getUserSurveyStatus(eventId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { hasSurvey: false, completed: false }

    // Check active survey
    const { data: survey } = await supabase
        .from('event_surveys')
        .select('id, status')
        .eq('event_id', eventId)
        .eq('status', 'active')
        .single()

    if (!survey) return { hasSurvey: false, completed: false }

    // Check if already responded
    const { data: response } = await supabase
        .from('survey_responses')
        .select('id')
        .eq('event_survey_id', survey.id)
        .eq('user_id', user.id)
        .single()

    return { hasSurvey: true, completed: !!response, surveyId: survey.id }
}

export async function submitSurveyResponse(
    eventId: string,
    answers: { question_id: string; answer_text?: string; answer_values?: string[] }[]
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Get survey
    const { data: survey } = await supabase
        .from('event_surveys')
        .select('id')
        .eq('event_id', eventId)
        .eq('status', 'active')
        .single()
    if (!survey) return { error: 'Survey tidak ditemukan atau sudah ditutup.' }

    // Verify user Attended (also allow if checked_in_at is set, in case status sync lags)
    const { data: participation } = await supabase
        .from('event_participants')
        .select('status, checked_in_at')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .single()
    if (participation?.status !== 'Attended' && !participation?.checked_in_at) {
        return { error: 'Survey hanya bisa diisi oleh peserta yang hadir.' }
    }

    // Insert response
    const { data: response, error: respError } = await supabase
        .from('survey_responses')
        .insert({ event_survey_id: survey.id, user_id: user.id })
        .select()
        .single()
    if (respError) {
        if (respError.code === '23505') return { error: 'Anda sudah mengisi survey ini.' }
        return { error: respError.message }
    }

    // Insert answers
    if (answers.length > 0) {
        await supabase.from('survey_answers').insert(
            answers.map(a => ({
                response_id: response.id,
                question_id: a.question_id,
                answer_text: a.answer_text ?? null,
                answer_values: a.answer_values?.length ? a.answer_values : null,
            }))
        )
    }

    return { success: true }
}

// ─── Admin: Survey Results ─────────────────────────────────────────────────────

export async function getSurveyResults(eventId: string) {
    const ctx = await assertAdmin()
    if (!ctx) return null
    const { supabase } = ctx

    // 1. Get survey + questions
    const { data: survey, error: surveyError } = await supabase
        .from('event_surveys')
        .select(`*, questions:event_survey_questions(*)`)
        .eq('event_id', eventId)
        .order('order_index', { referencedTable: 'event_survey_questions', ascending: true })
        .single()

    if (!survey) return null

    // 2. Get responses + answers (split to avoid auth.users FK issue)
    const { data: responses } = await supabase
        .from('survey_responses')
        .select(`id, submitted_at, user_id, answers:survey_answers(question_id, answer_text, answer_values)`)
        .eq('event_survey_id', survey.id)
        .order('submitted_at', { ascending: true })

    // 3. Lookup profile names separately
    const userIds = [...new Set((responses || []).map((r: any) => r.user_id))]
    let profileMap: Record<string, string> = {}
    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds)
        if (profiles) {
            profiles.forEach((p: any) => { profileMap[p.id] = p.full_name })
        }
    }

    const enrichedResponses = (responses || []).map((r: any) => ({
        ...r,
        full_name: profileMap[r.user_id] ?? 'Anonim',
    }))

    return { ...survey, responses: enrichedResponses }
}
