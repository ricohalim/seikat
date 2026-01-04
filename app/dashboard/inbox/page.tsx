'use client'

import { useState, useEffect } from 'react'
import { getInboxMessages, markInboxRead } from '@/app/actions/inbox'
import { Bell, Loader2, Calendar, Clock } from 'lucide-react'

export default function InboxPage() {
    const [messages, setMessages] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

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
                        <div key={msg.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition group">
                            <div className="flex items-start gap-4">
                                <div className="hidden sm:flex flex-col items-center min-w-[60px]">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
                                        <Bell size={20} />
                                    </div>
                                </div>

                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                        <h3 className="font-bold text-lg text-gray-900 leading-tight">
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

                                    <div className="prose prose-sm max-w-none text-gray-600">
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                    </div>

                                    <div className="mt-4 flex items-center gap-2">
                                        <span className="text-xs font-medium text-navy bg-navy/5 px-2 py-1 rounded">
                                            Administrator
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
