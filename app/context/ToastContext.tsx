'use client'

import React, { createContext, useContext } from 'react'
import { Toaster } from 'sonner'
import { toast } from 'sonner'

// Types
type ToastType = 'success' | 'error' | 'info' | 'loading'

interface ToastContextType {
    addToast: (message: string, type: ToastType, duration?: number) => void
    removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
    const context = useContext(ToastContext)
    // Fallback if used outside provider (Sonner handles this gracefully usually via global instance, but we keep context for API compatibility)
    if (!context) {
        // Return a direct proxy to sonner if context is missing, for easier migration if needed
        return {
            addToast: (message: string, type: ToastType) => {
                if (type === 'success') toast.success(message)
                else if (type === 'error') toast.error(message)
                else if (type === 'info') toast.info(message)
                else toast(message)
            },
            removeToast: (id: string) => toast.dismiss(id)
        }
    }
    return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {

    const addToast = (message: string, type: ToastType, duration = 3000) => {
        const options = { duration }
        if (type === 'success') toast.success(message, options)
        else if (type === 'error') toast.error(message, options)
        else if (type === 'info') toast.info(message, options)
        else if (type === 'loading') toast.loading(message, options)
        else toast(message, options)
    }

    const removeToast = (id: string) => {
        toast.dismiss(id)
    }

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <Toaster position="top-right" richColors closeButton />
        </ToastContext.Provider>
    )
}

