'use strict';
import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { X, Camera, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { selfCheckIn } from '@/app/actions/event'

interface EventScannerModalProps {
    isOpen: boolean
    onClose: () => void
}

export function EventScannerModal({ isOpen, onClose }: EventScannerModalProps) {
    const [scanning, setScanning] = useState(true)
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
    const [permissionError, setPermissionError] = useState(false)
    const scannerRef = useRef<Html5Qrcode | null>(null)

    useEffect(() => {
        if (!isOpen) return

        // Initialize scanner
        let html5QrCode: Html5Qrcode | null = null

        const startScanner = async () => {
            try {
                // Short delay to ensure DOM is ready
                await new Promise(r => setTimeout(r, 100))

                // Html5Qrcode(elementId, config) supports formatsToSupport
                html5QrCode = new Html5Qrcode("reader", {
                    formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
                    verbose: false
                })
                scannerRef.current = html5QrCode

                await html5QrCode.start(
                    { facingMode: "environment" }, // Prefer back camera
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0
                    },
                    (decodedText) => {
                        handleScan(decodedText)
                    },
                    (errorMessage) => {
                        // ignore scan errors
                    }
                )
                setScanning(true)
                setPermissionError(false)
            } catch (err) {
                console.error("Error starting scanner", err)
                setPermissionError(true)
                setScanning(false)
            }
        }

        startScanner()

        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear()
                }).catch(err => console.error("Failed to stop scanner", err))
            }
        }
    }, [isOpen])

    const handleScan = async (qrData: string) => {
        if (!scannerRef.current) return

        // Pause scanning to prevent multiple triggers
        if (scannerRef.current.isScanning) {
            await scannerRef.current.pause(true)
        }
        setScanning(false)

        // Regex for UUID
        const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/
        const match = qrData.match(uuidRegex)

        if (!match) {
            setResult({ success: false, message: 'QR Code tidak valid.\nBukan QR Event Seikat.' })
            // Resume if invalid? User might want to try again.
            // But UI changes to result state. 
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
            setTimeout(() => {
                onClose()
            }, 2000)
        } else {
            toast.error(response.message)
        }
    }

    const handleRetry = () => {
        setResult(null)
        setScanning(true)
        if (scannerRef.current) {
            scannerRef.current.resume()
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
            <button
                onClick={onClose}
                className="absolute top-6 right-6 text-white/70 hover:text-white p-2 transition z-[110]"
            >
                <X size={32} />
            </button>

            {/* Main Card */}
            <div className="w-full max-w-md bg-zinc-900 rounded-3xl overflow-hidden relative shadow-2xl border border-white/10 flex flex-col items-center">

                {/* Header */}
                <div className="w-full p-6 pb-2 text-center relative z-10">
                    <h3 className="font-bold text-white text-xl flex items-center justify-center gap-2">
                        Self Check-in
                    </h3>
                    <p className="text-zinc-400 text-sm mt-1">Scan QR Code pada layar panitia</p>
                </div>

                {/* Camera Viewport */}
                <div className="w-full aspect-square relative bg-black mt-4 group">
                    {/* The Video Element Container */}
                    <div id="reader" className="w-full h-full overflow-hidden [&_video]:object-cover [&_video]:w-full [&_video]:h-full"></div>

                    {/* Permission Error State */}
                    {permissionError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-zinc-900 z-20">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                                <Camera size={32} className="text-red-500" />
                            </div>
                            <h4 className="text-white font-bold mb-2">Kamera Tidak Aktif</h4>
                            <p className="text-zinc-400 text-sm">Izinkan akses kamera di browser Anda untuk melakukan scanning.</p>
                        </div>
                    )}

                    {/* Scanning Overlay (Only show when scanning and no result) */}
                    {scanning && !permissionError && (
                        <>
                            {/* Scan Frame */}
                            <div className="absolute inset-0 border-[40px] border-black/50 z-10 pointer-events-none">
                                <div className="w-full h-full border-2 border-white/30 relative">
                                    {/* Corner Markers */}
                                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-azure -mt-1 -ml-1"></div>
                                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-azure -mt-1 -mr-1"></div>
                                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-azure -mb-1 -ml-1"></div>
                                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-azure -mb-1 -mr-1"></div>

                                    {/* Scanning Line Animation */}
                                    <div className="absolute top-0 left-0 w-full h-1 bg-azure/50 shadow-lg shadow-azure/50 animate-[scan_2s_ease-in-out_infinite]"></div>
                                </div>
                            </div>

                            {/* Loading Indicator for Camera Init */}
                            <div className="absolute inset-0 flex items-center justify-center z-0">
                                <Loader2 className="text-white/20 animate-spin" size={48} />
                            </div>
                        </>
                    )}

                    {/* Result Overlay */}
                    {!scanning && result && (
                        <div className="absolute inset-0 bg-zinc-900/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-200">
                            {result.success ? (
                                <>
                                    <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-4 ring-4 ring-green-500/10 animate-[bounce_0.5s_ease-out]">
                                        <CheckCircle size={40} strokeWidth={3} />
                                    </div>
                                    <h4 className="text-2xl font-bold text-white mb-2">Berhasil!</h4>
                                </>
                            ) : (
                                <>
                                    <div className="w-20 h-20 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-4 ring-4 ring-red-500/10">
                                        <X size={40} strokeWidth={3} />
                                    </div>
                                    <h4 className="text-xl font-bold text-white mb-2">Gagal!</h4>
                                </>
                            )}
                            <p className="text-zinc-400 text-sm mb-8">{result.message}</p>

                            {!result.success && (
                                <button
                                    onClick={handleRetry}
                                    className="w-full bg-white text-black py-3 rounded-xl font-bold hover:bg-zinc-200 transition"
                                >
                                    Coba Lagi
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 w-full text-center">
                    <p className="text-zinc-500 text-xs">Arahkan kamera ke QR Code Event</p>
                </div>
            </div>

            {/* Custom Keyframe for scan animation */}
            <style jsx global>{`
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    )
}
