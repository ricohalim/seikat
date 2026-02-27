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
        <div className="max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-navy mb-2">Inbox & Pengumuman</h1>
                <p className="text-gray-500">Informasi terbaru dari administrator IKADBP</p>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <Loader2 className="w-8 h-8 animate-spin mb-3 text-navy" />
                    <p>Memuat pesan...</p>
                </div>
            ) : messages.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Bell size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Belum ada pesan</h3>
                    <p className="text-gray-500">Anda belum memiliki pesan atau pengumuman terbaru.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            onClick={() => setSelectedMessage(msg)}
                            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition group cursor-pointer"
                        >
                            <div className="flex items-start gap-4">
                                <div className="hidden sm:flex flex-col items-center min-w-[60px]">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Bell size={20} />
                                    </div>
                                </div>

                                <div className="flex-1 w-full overflow-hidden">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                        <h3 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                                            {msg.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            {/* Status Badge - Only visible if Draft or for Admins */}
                                            {msg.status === 'draft' && (
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-purple-100 text-purple-700 border border-purple-200">
                                                    Draft
                                                </span>
                                            )}
                                            {msg.expires_at && (
                                                <div className="flex items-center gap-1.5 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-md border border-orange-100">
                                                    <Clock size={12} />
                                                    Ends: {new Date(msg.expires_at).toLocaleDateString('id-ID')}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                <Calendar size={12} />
                                                {new Date(msg.created_at).toLocaleDateString('id-ID', {
                                                    day: 'numeric', month: 'long', year: 'numeric'
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="prose prose-sm max-w-none text-gray-500 line-clamp-2">
                                        <p className="whitespace-pre-wrap leading-relaxed">
                                            {msg.content}
                                        </p>
                                    </div>

                                    <div className="mt-4 flex items-center justify-between gap-2">
                                        <span className="text-xs font-medium text-navy bg-navy/5 px-2 py-1 rounded">
                                            Administrator
                                        </span>
                                        <span className="text-sm font-semibold text-blue-600 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                            Baca Selengkapnya
                                            <ChevronRight size={16} />
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
                                className="px-6 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition"
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
