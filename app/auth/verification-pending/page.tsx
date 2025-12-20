'use client'

import React from 'react'
import Link from 'next/link'
import { Clock, ArrowLeft, Mail } from 'lucide-react'

export default function VerificationPendingPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 animate-in fade-in duration-500">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100 relative overflow-hidden">
                {/* Decorative BG */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange to-yellow-400"></div>

                <div className="w-20 h-20 bg-orange/10 text-orange rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock size={40} className="animate-pulse" />
                </div>

                <h2 className="text-2xl font-bold text-navy mb-2">Menunggu Verifikasi</h2>
                <div className="w-16 h-1 bg-gray-100 mx-auto mb-4 rounded-full"></div>

                <p className="text-gray-600 mb-6 leading-relaxed">
                    Terima kasih telah mendaftar. Akun Anda saat ini sedang dalam proses <span className="font-bold text-navy">verifikasi oleh Admin</span>.
                </p>

                <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 mb-8 flex gap-3 items-start text-left">
                    <Mail size={20} className="shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold mb-1">Butuh Bantuan?</p>
                        <p>Jika proses ini memakan waktu lebih dari 1x24 jam, silakan hubungi admin di <span className="font-bold">sekretariat.ikadbp@gmail.com</span></p>
                    </div>
                </div>

                <div className="space-y-3">
                    <Link href="/" className="block w-full bg-white border border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2">
                        <ArrowLeft size={18} /> Kembali ke Beranda
                    </Link>
                </div>

                <p className="text-xs text-gray-400 mt-8">
                    Portal Alumni Djarum Beasiswa Plus
                </p>
            </div>
        </div>
    )
}
