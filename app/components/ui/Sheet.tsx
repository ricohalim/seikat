import { X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

interface SheetProps {
    isOpen: boolean
    onClose: () => void
    title?: React.ReactNode
    description?: React.ReactNode
    children: React.ReactNode
    className?: string
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function Sheet({ isOpen, onClose, title, description, children, className, size = 'lg' }: SheetProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true)
            document.body.style.overflow = 'hidden'
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300) // Match duration
            document.body.style.overflow = ''
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    if (!isVisible && !isOpen) return null

    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-full'
    }

    return (
        <div className="fixed inset-0 z-[100] flex justify-end transition-opacity duration-300">
            {/* Backdrop */}
            <div
                className={clsx(
                    "absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                className={twMerge(
                    "relative h-full w-full bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out border-l border-gray-100",
                    sizeClasses[size],
                    isOpen ? "translate-x-0" : "translate-x-full",
                    className
                )}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-white z-10">
                    <div className="space-y-1">
                        {title && <h2 className="text-lg font-bold text-navy">{title}</h2>}
                        {description && <div className="text-sm text-gray-500">{description}</div>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    )
}
