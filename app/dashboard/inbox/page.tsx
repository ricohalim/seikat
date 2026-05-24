'use client'

import { useState, useEffect } from 'react'
import { getInboxMessages, markInboxRead } from '@/app/actions/inbox'
import { Bell, Loader2, Calendar, Clock, X, ChevronRight } from 'lucide-react'
import { linkify } from '@/lib/linkify'

export default function InboxPage() {
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedMessage, setSelectedMessage] = useState<any | null>(null)

    const fetchMessages = async () => {
        setLoading(true)
        const res = await getInboxMessages(50) // Limit 50 latest
        setMessages(res || [])
        setLoading(false)

        // Mark as read
        await markInboxRead()
    }

    useEffect(() => {
        fetchMessages()
    }, [])

    return (
        <div className="animate-in fade-in duration-500">

            {/* Page Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-navy/8 flex items-center justify-center flex-shrink-0">
                    <Bell size={18} className="text-navy" />
                </div>
                <div>
                    <h1 className="text-xl font-black text-navy tracking-tight">Inbox & Pengumuman</h1>
                    <p className="text-sm text-gray-400">Informasi terbaru dari administrator IKADBP</p>
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-14 text-gray-400">
                    <Loader2 className="w-7 h-7 animate-spin mb-3 text-navy/40" />
                    <p className="text-sm">Memuat pesan...</p>
                </div>
            ) : messages.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Bell size={22} className="text-gray-300" />
                    </div>
                    <p className="font-bold text-gray-700 mb-1">Belum ada pesan</p>
                    <p className="text-sm text-gray-400">Tidak ada pengumuman terbaru saat ini.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            onClick={() => setSelectedMessage(msg)}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-navy/15 transition-all cursor-pointer group overflow-hidden"
                        >
                            <div className="flex items-start gap-4 p-5">
                                <div className="hidden sm:flex flex-shrink-0">
                                    <div className="w-10 h-10 rounded-xl bg-navy/6 text-navy flex items-center justify-center group-hover:bg-navy group-hover:text-white transition-all">
                                        <Bell size={18} />
                                    </div>
                                </div>

                                <div className="flex-1 w-full overflow-hidden">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                                        <h3 className="font-bold text-navy text-sm group-hover:text-azure transition-colors">
                                            {msg.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {msg.status === 'draft' && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-purple-50 text-purple-600 border border-purple-100">
                                                    Draft
                                                </span>
                                            )}
                                            {msg.expires_at && (
                                                <div className="flex items-center gap-1 text-[11px] text-orange font-medium bg-orange/5 px-2 py-1 rounded-lg border border-orange/10">
                                                    <Clock size={11} />
                                                    {new Date(msg.expires_at).toLocaleDateString('id-ID')}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1 text-[11px] text-gray-400 bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
                                                <Calendar size={11} />
                                                {new Date(msg.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric', month: 'long', year: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                                        {msg.content}
                                    </p>

                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-[11px] font-bold text-navy/40 uppercase tracking-widest">Administrator</span>
                                        <span className="text-xs font-bold text-azure flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            Baca Selengkapnya <ChevronRight size={13} />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MESSAGE MODAL */}
            {selectedMessage && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setSelectedMessage(null)}>
                    <div
                        className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
                    >
                        {/* Header */}
                        <div className="bg-navy p-5 flex justify-between items-center text-white shrink-0">
                            <h3 className="font-bold text-lg md:text-xl pr-4 leading-tight">
                                {selectedMessage.title}
                            </h3>
                            <button onClick={() => setSelectedMessage(null)} className="hover:bg-white/20 p-2 rounded-full transition bg-white/10 shrink-0">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-5 overflow-y-auto w-full">
                            <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100 text-sm text-gray-500">
                                <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                                    <Calendar size={14} />
                                    {new Date(selectedMessage.created_at).toLocaleDateString('id-ID', {
                                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                                    })}
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="px-2 py-1 bg-navy/5 text-navy font-medium rounded">Oleh: Administrator</span>
                                </div>
                            </div>

                            <div className="prose prose-sm md:prose-base max-w-none text-gray-700 leading-relaxed overflow-x-hidden">
                                {linkify(selectedMessage.content)}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100 shrink-0">
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className="px-5 py-2.5 bg-navy text-white font-bold rounded-xl hover:bg-[#1a3561] transition-all text-sm"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
