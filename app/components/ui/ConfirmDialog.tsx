'use client'

import { X } from 'lucide-react'

interface ConfirmDialogProps {
    isOpen: boolean
    title: string
    description: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'default'
    loading?: boolean
    onConfirm: () => void
    onCancel: () => void
}

/**
 * ConfirmDialog — Pengganti native confirm() / alert() / prompt() yang tidak bisa di-style.
 * Gunakan variant='danger' untuk aksi destruktif (hapus), 'warning' untuk aksi berisiko.
 */
export function ConfirmDialog({
    isOpen,
    title,
    description,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    variant = 'default',
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    if (!isOpen) return null

    const variantStyles = {
        danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
        warning: 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-400',
        default: 'bg-navy hover:bg-navy/90 focus:ring-navy/50',
    }

    return (
        <div
            className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onCancel() }}
        >
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between mb-1">
                    <h3 className="text-lg font-bold text-navy pr-4">{title}</h3>
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 transition flex-shrink-0 -mt-1 -mr-1 p-1 rounded-lg hover:bg-gray-100"
                        aria-label="Tutup"
                    >
                        <X size={18} />
                    </button>
                </div>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">{description}</p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 py-2 text-white rounded-lg text-sm font-bold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2 ${variantStyles[variant]}`}
                    >
                        {loading && (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        )}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    )
}
