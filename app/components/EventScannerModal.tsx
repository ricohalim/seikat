'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X, Camera, AlertCircle, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { selfCheckIn } from '@/app/actions/event'

interface EventScannerModalProps {
    isOpen: boolean
    onClose: () => void
}

export function EventScannerModal({ isOpen, onClose }: EventScannerModalProps) {
    const [scanning, setScanning] = useState(true)
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
    const scannerRef = useRef<Html5QrcodeScanner | null>(null)

    useEffect(() => {
        if (!isOpen) return

        // Wait for DOM
        const timeout = setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                "reader",
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    showTorchButtonIfSupported: true,
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE]
                },
                /* verbose= */ false
            )

            scanner.render(
                (decodedText) => {
                    handleScan(decodedText)
                    scanner.clear()
                },
                (errorMessage) => {
                    // ignore errors during scanning
                }
            )
            scannerRef.current = scanner
        }, 100)

        return () => {
            clearTimeout(timeout)
            if (scannerRef.current) {
                try {
                    scannerRef.current.clear()
                } catch (e) {
                    console.error("Failed to clear scanner", e)
                }
            }
        }
    }, [isOpen])

    const handleScan = async (qrData: string) => {
        setScanning(false)

        // Expected Format: seikat://event/{full-uuid} OR just {full-uuid}
        // Let's robustly extract UUID.
        // Regex for UUID
        const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/
        const match = qrData.match(uuidRegex)

        if (!match) {
            setResult({ success: false, message: 'QR Code tidak valid.\nPastikan Anda menscan QR Event yang benar.' })
            return
        }

        const eventId = match[0]

        // Call Server Action
        const response = await selfCheckIn(eventId)

        setResult({
            success: response.success,
            message: response.message
        })

        if (response.success) {
            toast.success(response.message)
            // Auto close after 2 seconds on success
            setTimeout(() => {
                onClose()
            }, 2000)
        } else {
            toast.error(response.message)
        }
    }

    const reset = () => {
        setResult(null)
        setScanning(true)
        // Re-init scanner is tricky with useEffect deps, simpler to just close/open or rely on parent
        // Actually, let's just close for now or allow re-mounting.
        window.location.reload() // Quickest way to reset scanner DOM safely or we can try to improve logic later.
        // Better: onClose() then user opens again.
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
            <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white/50 hover:text-white p-2"
            >
                <X size={32} />
            </button>

            <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden relative min-h-[400px] flex flex-col">
                <div className="p-4 border-b text-center bg-navy text-white">
                    <h3 className="font-bold flex items-center justify-center gap-2">
                        <Camera size={20} /> Scan QR Event
                    </h3>
                </div>

                <div className="flex-1 bg-black relative flex items-center justify-center">
                    {scanning ? (
                        <div id="reader" className="w-full h-full"></div>
                    ) : (
                        <div className="p-8 text-center animate-in zoom-in">
                            {result?.success ? (
                                <div className="text-green-600 flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                                        <CheckCircle size={48} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold">Check-in Berhasil!</h4>
                                        <p className="text-sm text-gray-500 mt-2">{result.message}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-red-500 flex flex-col items-center gap-4">
                                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                                        <AlertCircle size={48} />
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold">Gagal Scan</h4>
                                        <p className="text-sm text-gray-500 mt-2 whitespace-pre-line">{result?.message}</p>
                                    </div>
                                    <button onClick={onClose} className="mt-4 btn-nav w-full">Tutup</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {scanning && (
                    <div className="p-4 text-center text-xs text-gray-400">
                        Arahkan kamera ke QR Code yang disediakan oleh panitia.
                    </div>
                )}
            </div>
        </div>
    )
}
