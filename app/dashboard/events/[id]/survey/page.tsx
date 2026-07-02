'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getEventSurvey, submitSurveyResponse } from '@/app/actions/survey'
import type { SurveyQuestion, QuestionType } from '@/app/actions/survey'
import { toast } from 'sonner'
import { CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
    short_text: 'Jawaban singkat',
    long_text: 'Jawaban panjang',
    likert: 'Skala 1–5',
    multiple_choice: 'Pilihan ganda',
    checkbox: 'Pilih semua yang sesuai',
}

const LIKERT_LABELS = ['', 'Sangat Tidak Setuju', 'Tidak Setuju', 'Netral', 'Setuju', 'Sangat Setuju']

export default function SurveyFillPage() {
    const { id: eventId } = useParams<{ id: string }>()
    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [survey, setSurvey] = useState<any>(null)
    const [event, setEvent] = useState<any>(null)
    const [alreadySubmitted, setAlreadySubmitted] = useState(false)
    const [notAttended, setNotAttended] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [done, setDone] = useState(false)

    // answers: { [questionId]: string | string[] }
    const [answers, setAnswers] = useState<Record<string, string | string[]>>({})

    useEffect(() => {
        async function load() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { router.push('/auth/login'); return }

            // Fetch event info
            const { data: ev } = await supabase
                .from('events')
                .select('id, title')
                .eq('id', eventId)
                .single()
            setEvent(ev)

            // Check participation
            const { data: part } = await supabase
                .from('event_participants')
                .select('status')
                .eq('event_id', eventId)
                .eq('user_id', user.id)
                .single()

            if (part?.status !== 'Attended') {
                setNotAttended(true)
                setLoading(false)
                return
            }

            // Fetch survey
            const surveyData = await getEventSurvey(eventId)
            if (!surveyData || surveyData.status !== 'active') {
                setLoading(false)
                return
            }
            setSurvey(surveyData)

            // Check if already responded
            const { data: resp } = await supabase
                .from('survey_responses')
                .select('id')
                .eq('event_survey_id', surveyData.id)
                .eq('user_id', user.id)
                .single()

            if (resp) setAlreadySubmitted(true)
            setLoading(false)
        }
        load()
    }, [eventId])

    const setAnswer = (questionId: string, value: string | string[]) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }))
    }

    const toggleCheckbox = (questionId: string, option: string) => {
        const current = (answers[questionId] as string[]) || []
        const updated = current.includes(option)
            ? current.filter(v => v !== option)
            : [...current, option]
        setAnswer(questionId, updated)
    }

    const handleSubmit = async () => {
        if (!survey) return

        // Validate required
        for (const q of survey.questions as SurveyQuestion[]) {
            if (!q.required) continue
            const ans = answers[q.id!]
            if (q.type === 'checkbox') {
                if (!ans || (ans as string[]).length === 0) {
                    toast.error(`Pertanyaan "${q.question_text}" wajib diisi.`)
                    return
                }
            } else {
                if (!ans || (ans as string).trim() === '') {
                    toast.error(`Pertanyaan "${q.question_text}" wajib diisi.`)
                    return
                }
            }
        }

        setSubmitting(true)
        const payload = (survey.questions as SurveyQuestion[]).map(q => {
            const ans = answers[q.id!]
            if (q.type === 'checkbox') {
                return { question_id: q.id!, answer_values: (ans as string[]) || [] }
            }
            return { question_id: q.id!, answer_text: (ans as string) || '' }
        })

        const res = await submitSurveyResponse(eventId, payload)
        setSubmitting(false)

        if (res?.error) {
            toast.error(res.error)
            return
        }

        setDone(true)
    }

    // ─── States ───────────────────────────────────────────────────────────────

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-navy" size={28} />
            </div>
        )
    }

    if (done || alreadySubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="max-w-md w-full text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                        <CheckCircle2 size={32} className="text-green-600" />
                    </div>
                    <h1 className="text-xl font-black text-navy">
                        {alreadySubmitted ? 'Sudah Diisi!' : 'Terima Kasih!'}
                    </h1>
                    <p className="text-sm text-gray-500">
                        {alreadySubmitted
                            ? 'Kamu sudah mengisi survey untuk acara ini.'
                            : 'Respons kamu sudah tercatat. Masukan kamu sangat berarti bagi kami!'}
                    </p>
                    <Link
                        href="/dashboard/events"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-xl text-sm font-bold hover:bg-navy/90"
                    >
                        <ArrowLeft size={15} /> Kembali ke Agenda
                    </Link>
                </div>
            </div>
        )
    }

    if (notAttended) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="max-w-md w-full text-center space-y-4">
                    <p className="text-sm text-gray-500">Survey ini hanya bisa diisi oleh peserta yang hadir.</p>
                    <Link href="/dashboard/events" className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-xl text-sm font-bold hover:bg-navy/90">
                        <ArrowLeft size={15} /> Kembali
                    </Link>
                </div>
            </div>
        )
    }

    if (!survey) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
                <div className="max-w-md w-full text-center space-y-4">
                    <p className="text-sm text-gray-500">Survey tidak ditemukan atau sudah ditutup.</p>
                    <Link href="/dashboard/events" className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-xl text-sm font-bold hover:bg-navy/90">
                        <ArrowLeft size={15} /> Kembali
                    </Link>
                </div>
            </div>
        )
    }

    // ─── Survey form ──────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto flex items-center gap-3">
                    <Link href="/dashboard/events" className="text-gray-400 hover:text-navy transition">
                        <ArrowLeft size={18} />
                    </Link>
                    <div>
                        <p className="text-xs text-gray-400">{event?.title}</p>
                        <p className="text-base font-black text-navy leading-tight">{survey.title}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
                {survey.description && (
                    <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm text-blue-700">
                        {survey.description}
                    </div>
                )}

                {(survey.questions as SurveyQuestion[]).map((q, idx) => (
                    <div key={q.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
                        {/* Question header */}
                        <div>
                            <p className="text-sm font-bold text-navy">
                                {idx + 1}. {q.question_text}
                                {q.required && <span className="text-red-500 ml-1">*</span>}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">{QUESTION_TYPE_LABELS[q.type]}</p>
                        </div>

                        {/* Answer input */}
                        {q.type === 'short_text' && (
                            <input
                                value={(answers[q.id!] as string) || ''}
                                onChange={e => setAnswer(q.id!, e.target.value)}
                                placeholder="Jawaban singkat..."
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-navy/20"
                            />
                        )}

                        {q.type === 'long_text' && (
                            <textarea
                                value={(answers[q.id!] as string) || ''}
                                onChange={e => setAnswer(q.id!, e.target.value)}
                                rows={4}
                                placeholder="Tuliskan jawabanmu..."
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-navy/20 resize-none"
                            />
                        )}

                        {q.type === 'likert' && (
                            <div className="space-y-2">
                                <div className="grid grid-cols-5 gap-2">
                                    {[1, 2, 3, 4, 5].map(n => {
                                        const selected = (answers[q.id!] as string) === String(n)
                                        return (
                                            <button
                                                key={n}
                                                onClick={() => setAnswer(q.id!, String(n))}
                                                className={`py-3 rounded-xl text-sm font-black border-2 transition ${
                                                    selected
                                                        ? 'bg-navy text-white border-navy'
                                                        : 'bg-white text-gray-400 border-gray-200 hover:border-navy hover:text-navy'
                                                }`}
                                            >
                                                {n}
                                            </button>
                                        )
                                    })}
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-400 px-1">
                                    <span>{LIKERT_LABELS[1]}</span>
                                    <span>{LIKERT_LABELS[5]}</span>
                                </div>
                            </div>
                        )}

                        {q.type === 'multiple_choice' && (
                            <div className="space-y-2">
                                {(q.options || []).map(opt => {
                                    const selected = (answers[q.id!] as string) === opt
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => setAnswer(q.id!, opt)}
                                            className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition ${
                                                selected
                                                    ? 'bg-navy/5 border-navy text-navy font-bold'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                                            }`}
                                        >
                                            {opt}
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {q.type === 'checkbox' && (
                            <div className="space-y-2">
                                {(q.options || []).map(opt => {
                                    const checked = ((answers[q.id!] as string[]) || []).includes(opt)
                                    return (
                                        <button
                                            key={opt}
                                            onClick={() => toggleCheckbox(q.id!, opt)}
                                            className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm flex items-center gap-3 transition ${
                                                checked
                                                    ? 'bg-navy/5 border-navy text-navy font-bold'
                                                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                                            }`}
                                        >
                                            <span className={`w-4 h-4 rounded flex items-center justify-center border-2 flex-shrink-0 ${checked ? 'bg-navy border-navy' : 'border-gray-300'}`}>
                                                {checked && <CheckCircle2 size={10} className="text-white" />}
                                            </span>
                                            {opt}
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ))}

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 bg-navy text-white font-black rounded-xl hover:bg-navy/90 transition disabled:opacity-60 flex items-center justify-center gap-2 text-sm shadow-md shadow-navy/20"
                >
                    {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                    {submitting ? 'Mengirim...' : 'Kirim Jawaban'}
                </button>

                <p className="text-xs text-center text-gray-400">
                    Pertanyaan bertanda <span className="text-red-500">*</span> wajib diisi.
                </p>
            </div>
        </div>
    )
}
