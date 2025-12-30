'use client'

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react'

// Types
type ToastType = 'success' | 'error' | 'info' | 'loading'

interface Toast {
    id: string
    message: string
    type: ToastType
    duration?: number
}

interface ToastContextType {
    addToast: (message: string, type: ToastType, duration?: number) => void
    removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
    const context = useContext(ToastContext)
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider')
    }
    return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((message: string, type: ToastType, duration = 3000) => {
        const id = Math.random().toString(36).substring(2, 9)
        setToasts((prev) => [...prev, { id, message, type, duration }])

        if (duration > 0) {
            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id))
            }, duration)
        }
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    )
}

function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: (id: string) => void }) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        requestAnimationFrame(() => setIsVisible(true))
    }, [])

    const handleRemove = () => {
        setIsVisible(false)
        setTimeout(() => {
            onRemove(toast.id)
        }, 300) // Match transition duration
    }

    const icons = {
        success: <CheckCircle size={18} className="text-green-500" />,
        error: <AlertCircle size={18} className="text-red-500" />,
        info: <Info size={18} className="text-blue-500" />,
        loading: <Loader2 size={18} className="text-blue-500 animate-spin" />
    }

    const bgColors = {
        success: 'bg-white border-green-100',
        error: 'bg-white border-red-100',
        info: 'bg-white border-blue-100',
        loading: 'bg-white border-blue-100'
    }

    return (
        <div
            className={`
                pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border min-w-[300px] max-w-sm
                transition-all duration-300 transform
                ${bgColors[toast.type]}
                ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-[100%] opacity-0'}
            `}
        >
            <div className={`p-2 rounded-full ${toast.type === 'success' ? 'bg-green-50' : toast.type === 'error' ? 'bg-red-50' : 'bg-blue-50'}`}>
                {icons[toast.type]}
            </div>
            <p className="text-sm font-medium text-gray-700 flex-1">{toast.message}</p>
            <button onClick={handleRemove} className="text-gray-400 hover:text-gray-600 transition p-1">
                <X size={16} />
            </button>
        </div>
    )
}
