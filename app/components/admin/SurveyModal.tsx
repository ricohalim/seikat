'use client'

import { useState, useEffect } from 'react'
import { Sheet } from '../ui/Sheet'
import {
    Plus, Trash2, ChevronUp, ChevronDown, Save, BarChart2,
    FileText, Copy, AlertCircle, Send, CheckCircle2, X, Download
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import {
    getSurveyTemplates, getTemplateWithQuestions, upsertTemplate,
    deleteTemplate, getEventSurvey, upsertEventSurvey, deleteEventSurvey,
    getSurveyResults, sendSurveyNotification
} from '@/app/actions/survey'
import type { SurveyQuestion, QuestionType } from '@/app/actions/survey'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SurveyModalProps {
    isOpen: boolean
    onClose: () => void
    eventId: string
    eventTitle: string
    eventFinalized: boolean
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
    short_text: 'Teks Singkat',
    long_text: 'Teks Panjang',
    likert: 'Skala Likert (1–5)',
    multiple_choice: 'Pilihan Ganda',
    checkbox: 'Checkbox (Pilih Banyak)',
}

const emptyQuestion = (): SurveyQuestion => ({
    order_index: 0,
    type: 'short_text',
    question_text: '',
    options: [],
    required: true,
})

// ─── Main Modal ───────────────────────────────────────────────────────────────

export function SurveyModal({ isOpen, onClose, eventId, eventTitle, eventFinalized }: SurveyModalProps) {
    const [tab, setTab] = useState<'builder' | 'results' | 'templates'>('builder')

    // Builder state
    const [surveyTitle, setSurveyTitle] = useState('')
    const [surveyDesc, setSurveyDesc] = useState('')
    const [questions, setQuestions] = useState<SurveyQuestion[]>([])
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [hasSurvey, setHasSurvey] = useState(false)
    const [notifSending, setNotifSending] = useState(false)
    const [notifSent, setNotifSent] = useState(false)

    // Templates state
    const [templates, setTemplates] = useState<any[]>([])
    const [editingTemplate, setEditingTemplate] = useState<any>(null)
    const [tmplTitle, setTmplTitle] = useState('')
    const [tmplDesc, setTmplDesc] = useState('')
    const [tmplQuestions, setTmplQuestions] = useState<SurveyQuestion[]>([])
    const [savingTmpl, setSavingTmpl] = useState(false)

    // Results state
    const [results, setResults] = useState<any>(null)
    const [loadingResults, setLoadingResults] = useState(false)

    // Load event survey on open — reset ALL state when eventId changes
    useEffect(() => {
        if (!isOpen) return
        // Reset stale results from previous event
        setResults(null)
        setNotifSent(false)
        setTab('builder')
        loadEventSurvey()
        loadTemplates()
    }, [isOpen, eventId])

    useEffect(() => {
        if (tab === 'results') {
            setResults(null)
            loadResults()
        }
    }, [tab, eventId])

    async function loadEventSurvey() {
        const data = await getEventSurvey(eventId)
        if (data) {
            setHasSurvey(true)
            setSurveyTitle(data.title)
            setSurveyDesc(data.description || '')
            setQuestions(data.questions)
        } else {
            setHasSurvey(false)
            setSurveyTitle(`Survey: ${eventTitle}`)
            setSurveyDesc('')
            setQuestions([])
        }
    }

    async function loadTemplates() {
        const data = await getSurveyTemplates()
        setTemplates(data)
    }

    async function loadResults() {
        setLoadingResults(true)
        const data = await getSurveyResults(eventId)
        setResults(data)
        setLoadingResults(false)
    }

    // ─── Builder actions ────────────────────────────────────────────────────

    const addQuestion = () => setQuestions(qs => [...qs, { ...emptyQuestion(), order_index: qs.length }])

    const removeQuestion = (i: number) => setQuestions(qs => qs.filter((_, idx) => idx !== i))

    const moveQuestion = (i: number, dir: -1 | 1) => {
        setQuestions(qs => {
            const arr = [...qs]
            const j = i + dir
            if (j < 0 || j >= arr.length) return arr
            ;[arr[i], arr[j]] = [arr[j], arr[i]]
            return arr.map((q, idx) => ({ ...q, order_index: idx }))
        })
    }

    const updateQuestion = (i: number, patch: Partial<SurveyQuestion>) => {
        setQuestions(qs => qs.map((q, idx) => idx === i ? { ...q, ...patch } : q))
    }

    const handleSave = async () => {
        if (!surveyTitle.trim()) { toast.error('Judul survey tidak boleh kosong.'); return }
        if (questions.length === 0) { toast.error('Tambahkan minimal 1 pertanyaan.'); return }
        for (const q of questions) {
            if (!q.question_text.trim()) { toast.error('Semua pertanyaan harus diisi.'); return }
            if ((q.type === 'multiple_choice' || q.type === 'checkbox') && (!q.options || q.options.filter(o => o.trim()).length < 2)) {
                toast.error('Pertanyaan pilihan harus memiliki minimal 2 opsi.'); return
            }
        }
        setSaving(true)
        const res = await upsertEventSurvey(eventId, surveyTitle, surveyDesc, questions)
        setSaving(false)
        if (res.error) { toast.error(res.error); return }
        setHasSurvey(true)
        toast.success('Survey berhasil disimpan!')
    }

    const handleDelete = async () => {
        if (!confirm('Hapus survey ini? Semua jawaban peserta akan ikut terhapus.')) return
        setDeleting(true)
        await deleteEventSurvey(eventId)
        setDeleting(false)
        setHasSurvey(false)
        setSurveyTitle(`Survey: ${eventTitle}`)
        setSurveyDesc('')
        setQuestions([])
        setResults(null)
        toast.success('Survey dihapus.')
    }

    const handleDownloadResults = () => {
        if (!results || !results.responses?.length) return
        const questions: any[] = results.questions || []

        // Build one row per respondent
        const rows = results.responses.map((r: any) => {
            const row: Record<string, any> = {
                'Nama': r.full_name ?? 'Anonim',
                'Waktu Isi': new Date(r.submitted_at).toLocaleString('id-ID'),
            }
            questions.forEach((q: any) => {
                const ans = (r.answers || []).find((a: any) => a.question_id === q.id)
                if (!ans) { row[q.question_text] = '-'; return }
                if (q.type === 'checkbox') {
                    row[q.question_text] = (ans.answer_values || []).join(', ')
                } else {
                    row[q.question_text] = ans.answer_text ?? '-'
                }
            })
            return row
        })

        const ws = XLSX.utils.json_to_sheet(rows)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Hasil Survey')
        XLSX.writeFile(wb, `survey_${eventTitle.replace(/\s+/g, '_')}.xlsx`)
    }

    const handleSendNotif = async () => {
        if (!hasSurvey) { toast.error('Simpan survey terlebih dahulu.'); return }
        if (!confirm(`Kirim notifikasi survey ke semua peserta yang hadir di "${eventTitle}"?`)) return
        setNotifSending(true)
        const res = await sendSurveyNotification(eventId, eventTitle)
        setNotifSending(false)
        if (res.error) { toast.error(res.error); return }
        setNotifSent(true)
        toast.success(`Notifikasi terkirim ke ${res.sent} peserta.`)
    }

    const handleLoadTemplate = async (templateId: string) => {
        const tmpl = await getTemplateWithQuestions(templateId)
        if (!tmpl) return
        if (questions.length > 0 && !confirm('Pertanyaan yang ada akan diganti dengan template ini. Lanjutkan?')) return
        setSurveyTitle(tmpl.title)
        setSurveyDesc(tmpl.description || '')
        setQuestions((tmpl.questions || []).map((q: any, i: number) => ({
            order_index: i,
            type: q.type,
            question_text: q.question_text,
            options: q.options || [],
            required: q.required,
        })))
        setTab('builder')
        toast.success('Template dimuat!')
    }

    // ─── Template actions ───────────────────────────────────────────────────

    const openNewTemplate = () => {
        setEditingTemplate(null)
        setTmplTitle('')
        setTmplDesc('')
        setTmplQuestions([])
    }

    const openEditTemplate = async (t: any) => {
        const data = await getTemplateWithQuestions(t.id)
        setEditingTemplate(t)
        setTmplTitle(data?.title || '')
        setTmplDesc(data?.description || '')
        setTmplQuestions((data?.questions || []).map((q: any) => ({
            order_index: q.order_index,
            type: q.type,
            question_text: q.question_text,
            options: q.options || [],
            required: q.required,
        })))
    }

    const handleSaveTemplate = async () => {
        if (!tmplTitle.trim()) { toast.error('Judul template tidak boleh kosong.'); return }
        setSavingTmpl(true)
        const res = await upsertTemplate(tmplTitle, tmplDesc, tmplQuestions, editingTemplate?.id)
        setSavingTmpl(false)
        if (res.error) { toast.error(res.error); return }
        toast.success('Template disimpan!')
        openNewTemplate()
        loadTemplates()
    }

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('Hapus template ini?')) return
        await deleteTemplate(id)
        loadTemplates()
        toast.success('Template dihapus.')
    }

    // ─── Render ─────────────────────────────────────────────────────────────

    return (
        <Sheet
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            title="Survey"
            description={<span className="text-gray-500 text-sm">{eventTitle}</span>}
        >
            {/* Tabs */}
            <div className="flex border-b border-gray-100 px-6 pt-2">
                {(['builder', 'results', 'templates'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 text-sm font-bold border-b-2 transition -mb-px ${tab === t ? 'border-navy text-navy' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        {t === 'builder' ? 'Pertanyaan' : t === 'results' ? 'Hasil' : 'Template'}
                    </button>
                ))}
            </div>

            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
                {/* ── Builder Tab ──────────────────────────────────────── */}
                {tab === 'builder' && (
                    <div className="space-y-5">
                        {/* Survey info */}
                        <div className="space-y-3">
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Judul Survey</label>
                                <input
                                    value={surveyTitle}
                                    onChange={e => setSurveyTitle(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-navy/20"
                                    placeholder="Judul survey..."
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Deskripsi (opsional)</label>
                                <textarea
                                    value={surveyDesc}
                                    onChange={e => setSurveyDesc(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-navy/20 resize-none"
                                    placeholder="Deskripsi atau instruksi singkat..."
                                />
                            </div>
                        </div>

                        <div className="h-px bg-gray-100" />

                        {/* Questions */}
                        <div className="space-y-4">
                            {questions.length === 0 && (
                                <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                                    <FileText size={24} className="mx-auto mb-2 opacity-40" />
                                    <p>Belum ada pertanyaan.</p>
                                    <p className="text-xs mt-1">Klik "Tambah Pertanyaan" atau muat dari template.</p>
                                </div>
                            )}
                            {questions.map((q, i) => (
                                <QuestionEditor
                                    key={i}
                                    index={i}
                                    total={questions.length}
                                    question={q}
                                    onChange={patch => updateQuestion(i, patch)}
                                    onRemove={() => removeQuestion(i)}
                                    onMove={dir => moveQuestion(i, dir)}
                                />
                            ))}
                        </div>

                        {/* Add question button */}
                        <button
                            onClick={addQuestion}
                            className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-400 hover:border-navy hover:text-navy transition flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> Tambah Pertanyaan
                        </button>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-2">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2.5 bg-navy text-white rounded-xl text-sm font-bold hover:bg-navy/90 disabled:opacity-60"
                            >
                                <Save size={15} />
                                {saving ? 'Menyimpan...' : 'Simpan Survey'}
                            </button>

                            {hasSurvey && (
                                <>
                                    <button
                                        onClick={handleSendNotif}
                                        disabled={notifSending || notifSent}
                                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition ${notifSent ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-60'}`}
                                    >
                                        {notifSent ? <CheckCircle2 size={15} /> : <Send size={15} />}
                                        {notifSent ? 'Notifikasi Terkirim' : notifSending ? 'Mengirim...' : 'Kirim Notifikasi ke Peserta'}
                                    </button>

                                    <button
                                        onClick={handleDelete}
                                        disabled={deleting}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 disabled:opacity-60 ml-auto"
                                    >
                                        <Trash2 size={15} />
                                        {deleting ? 'Menghapus...' : 'Hapus Survey'}
                                    </button>
                                </>
                            )}
                        </div>

                        {eventFinalized && !notifSent && hasSurvey && (
                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex items-start gap-2">
                                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
                                <span>Event sudah difinalisasi. Klik <strong>Kirim Notifikasi</strong> untuk memberitahu peserta yang hadir.</span>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Results Tab ──────────────────────────────────────── */}
                {tab === 'results' && (
                    <div className="space-y-6">
                        {loadingResults ? (
                            <div className="text-center py-12 text-gray-400 text-sm">Memuat hasil...</div>
                        ) : !results || !results.responses || results.responses.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 text-sm">
                                <BarChart2 size={32} className="mx-auto mb-3 opacity-30" />
                                <p>Belum ada respons dari peserta.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500 font-medium">
                                        <strong className="text-navy">{results.responses.length}</strong> respons diterima
                                    </span>
                                    <button
                                        onClick={handleDownloadResults}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-bold hover:bg-green-100 transition"
                                    >
                                        <Download size={13} /> Download Excel
                                    </button>
                                </div>
                                {(results.questions || []).map((q: any) => (
                                    <QuestionResult
                                        key={q.id}
                                        question={q}
                                        responses={results.responses}
                                    />
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* ── Templates Tab ─────────────────────────────────────── */}
                {tab === 'templates' && (
                    <div className="space-y-5">
                        {/* Template editor */}
                        <div className="border border-gray-200 rounded-xl p-4 space-y-4">
                            <h3 className="text-sm font-bold text-navy">
                                {editingTemplate ? `Edit Template: ${editingTemplate.title}` : 'Buat Template Baru'}
                            </h3>
                            <div className="space-y-3">
                                <input
                                    value={tmplTitle}
                                    onChange={e => setTmplTitle(e.target.value)}
                                    placeholder="Nama template..."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-navy/20"
                                />
                                <textarea
                                    value={tmplDesc}
                                    onChange={e => setTmplDesc(e.target.value)}
                                    rows={2}
                                    placeholder="Deskripsi (opsional)..."
                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-navy/20 resize-none"
                                />
                            </div>
                            <div className="space-y-3">
                                {tmplQuestions.map((q, i) => (
                                    <QuestionEditor
                                        key={i}
                                        index={i}
                                        total={tmplQuestions.length}
                                        question={q}
                                        onChange={patch => setTmplQuestions(qs => qs.map((x, xi) => xi === i ? { ...x, ...patch } : x))}
                                        onRemove={() => setTmplQuestions(qs => qs.filter((_, xi) => xi !== i))}
                                        onMove={dir => {
                                            setTmplQuestions(qs => {
                                                const arr = [...qs]
                                                const j = i + dir
                                                if (j < 0 || j >= arr.length) return arr
                                                ;[arr[i], arr[j]] = [arr[j], arr[i]]
                                                return arr
                                            })
                                        }}
                                    />
                                ))}
                                <button
                                    onClick={() => setTmplQuestions(qs => [...qs, { ...emptyQuestion(), order_index: qs.length }])}
                                    className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-400 hover:border-navy hover:text-navy transition flex items-center justify-center gap-1.5"
                                >
                                    <Plus size={13} /> Tambah Pertanyaan
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleSaveTemplate} disabled={savingTmpl} className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-bold hover:bg-navy/90 disabled:opacity-60">
                                    {savingTmpl ? 'Menyimpan...' : editingTemplate ? 'Update Template' : 'Simpan Template'}
                                </button>
                                {editingTemplate && (
                                    <button onClick={openNewTemplate} className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-bold hover:bg-gray-200">
                                        Batal Edit
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Template list */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Template Tersimpan</h3>
                            {templates.length === 0 ? (
                                <p className="text-sm text-gray-400 py-3">Belum ada template.</p>
                            ) : templates.map((t: any) => (
                                <div key={t.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl hover:bg-gray-50">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-navy">{t.title}</p>
                                        <p className="text-xs text-gray-400">{t.question_count} pertanyaan</p>
                                    </div>
                                    <button onClick={() => handleLoadTemplate(t.id)} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center gap-1">
                                        <Copy size={12} /> Muat ke Event
                                    </button>
                                    <button onClick={() => openEditTemplate(t)} className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-200">
                                        Edit
                                    </button>
                                    <button onClick={() => handleDeleteTemplate(t.id)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Sheet>
    )
}

// ─── Question Editor ──────────────────────────────────────────────────────────

function QuestionEditor({ index, total, question, onChange, onRemove, onMove }: {
    index: number
    total: number
    question: SurveyQuestion
    onChange: (patch: Partial<SurveyQuestion>) => void
    onRemove: () => void
    onMove: (dir: -1 | 1) => void
}) {
    const needsOptions = question.type === 'multiple_choice' || question.type === 'checkbox'

    const updateOption = (i: number, val: string) => {
        const opts = [...(question.options || [])]
        opts[i] = val
        onChange({ options: opts })
    }

    const addOption = () => onChange({ options: [...(question.options || []), ''] })

    const removeOption = (i: number) => {
        const opts = (question.options || []).filter((_, xi) => xi !== i)
        onChange({ options: opts })
    }

    return (
        <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
            {/* Header */}
            <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-navy text-white text-xs font-black flex items-center justify-center flex-shrink-0">{index + 1}</span>
                <select
                    value={question.type}
                    onChange={e => onChange({ type: e.target.value as QuestionType, options: [] })}
                    className="text-xs font-bold bg-gray-100 text-gray-600 border-0 rounded-lg px-2 py-1 outline-none"
                >
                    {(Object.entries(QUESTION_TYPE_LABELS) as [QuestionType, string][]).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                    ))}
                </select>
                <div className="ml-auto flex items-center gap-1">
                    <button onClick={() => onMove(-1)} disabled={index === 0} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronUp size={15} /></button>
                    <button onClick={() => onMove(1)} disabled={index === total - 1} className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"><ChevronDown size={15} /></button>
                    <button onClick={onRemove} className="p-1 text-red-400 hover:text-red-600"><X size={15} /></button>
                </div>
            </div>

            {/* Question text */}
            <input
                value={question.question_text}
                onChange={e => onChange({ question_text: e.target.value })}
                placeholder="Tulis pertanyaan di sini..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-navy/20"
            />

            {/* Likert preview */}
            {question.type === 'likert' && (
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(n => (
                        <div key={n} className="flex-1 text-center py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-400">{n}</div>
                    ))}
                </div>
            )}

            {/* Options */}
            {needsOptions && (
                <div className="space-y-2">
                    {(question.options || []).map((opt, i) => (
                        <div key={i} className="flex gap-2 items-center">
                            <span className="w-5 h-5 rounded border border-gray-300 flex-shrink-0" />
                            <input
                                value={opt}
                                onChange={e => updateOption(i, e.target.value)}
                                placeholder={`Opsi ${i + 1}`}
                                className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-navy/20"
                            />
                            <button onClick={() => removeOption(i)} className="p-1 text-red-400 hover:text-red-600"><X size={13} /></button>
                        </div>
                    ))}
                    <button onClick={addOption} className="text-xs font-bold text-navy hover:text-azure flex items-center gap-1">
                        <Plus size={12} /> Tambah opsi
                    </button>
                </div>
            )}

            {/* Required toggle */}
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer select-none w-fit">
                <input
                    type="checkbox"
                    checked={question.required}
                    onChange={e => onChange({ required: e.target.checked })}
                    className="accent-navy"
                />
                Wajib diisi
            </label>
        </div>
    )
}

// ─── Question Result ──────────────────────────────────────────────────────────

function QuestionResult({ question, responses }: { question: any; responses: any[] }) {
    const allAnswers = responses.flatMap((r: any) =>
        (r.answers || []).filter((a: any) => a.question_id === question.id)
    )

    const renderContent = () => {
        if (question.type === 'short_text' || question.type === 'long_text') {
            const texts = allAnswers.map((a: any) => a.answer_text).filter(Boolean)
            return (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {texts.length === 0 ? <p className="text-xs text-gray-400">Tidak ada jawaban</p> :
                        texts.map((t: string, i: number) => (
                            <div key={i} className="p-2.5 bg-gray-50 rounded-lg text-sm text-gray-700 border border-gray-100">{t}</div>
                        ))}
                </div>
            )
        }

        if (question.type === 'likert') {
            const values = allAnswers.map((a: any) => parseInt(a.answer_text)).filter(n => !isNaN(n))
            const avg = values.length ? (values.reduce((s, n) => s + n, 0) / values.length).toFixed(2) : '-'
            const counts = [1, 2, 3, 4, 5].map(n => ({ n, count: values.filter(v => v === n).length }))
            return (
                <div className="space-y-2">
                    <div className="text-2xl font-black text-navy">{avg} <span className="text-sm font-normal text-gray-400">/ 5</span></div>
                    <div className="space-y-1">
                        {counts.map(({ n, count }) => {
                            const pct = values.length ? Math.round((count / values.length) * 100) : 0
                            return (
                                <div key={n} className="flex items-center gap-2">
                                    <span className="w-4 text-xs font-bold text-gray-500">{n}</span>
                                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div className="h-full bg-navy rounded-full transition-all" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-xs text-gray-400 w-8">{count}x</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )
        }

        if (question.type === 'multiple_choice') {
            const picked = allAnswers.map((a: any) => a.answer_text).filter(Boolean)
            const opts = question.options || []
            return (
                <div className="space-y-1.5">
                    {opts.map((opt: string) => {
                        const count = picked.filter((p: string) => p === opt).length
                        const pct = picked.length ? Math.round((count / picked.length) * 100) : 0
                        return (
                            <div key={opt} className="flex items-center gap-2">
                                <span className="text-xs text-gray-600 w-32 truncate">{opt}</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs text-gray-400 w-14 text-right">{count} ({pct}%)</span>
                            </div>
                        )
                    })}
                </div>
            )
        }

        if (question.type === 'checkbox') {
            const allSelected = allAnswers.flatMap((a: any) => a.answer_values || [])
            const opts = question.options || []
            const total = responses.length || 1
            return (
                <div className="space-y-1.5">
                    {opts.map((opt: string) => {
                        const count = allSelected.filter((p: string) => p === opt).length
                        const pct = Math.round((count / total) * 100)
                        return (
                            <div key={opt} className="flex items-center gap-2">
                                <span className="text-xs text-gray-600 w-32 truncate">{opt}</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs text-gray-400 w-14 text-right">{count} ({pct}%)</span>
                            </div>
                        )
                    })}
                </div>
            )
        }

        return null
    }

    return (
        <div className="border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-2">
                <span className="text-xs font-black text-gray-400 mt-0.5 flex-shrink-0">Q{question.order_index + 1}</span>
                <div>
                    <p className="text-sm font-bold text-navy">{question.question_text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{QUESTION_TYPE_LABELS[question.type as QuestionType]} · {allAnswers.length} jawaban</p>
                </div>
            </div>
            {renderContent()}
        </div>
    )
}
