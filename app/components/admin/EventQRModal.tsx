'use client'

import { useRef } from 'react'
import { X, Download, Printer } from 'lucide-react'
import QRCode from 'react-qr-code'

interface EventQRModalProps {
    isOpen: boolean
    onClose: () => void
    eventName: string
    eventId: string
}

export function EventQRModal({ isOpen, onClose, eventName, eventId }: EventQRModalProps) {
    const qrRef = useRef<HTMLDivElement>(null)

    if (!isOpen) return null

    const handleDownload = () => {
        const svg = document.getElementById("event-qr-code")
        if (!svg) return

        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        const img = new Image()

        // Base64 SVG
        img.src = "data:image/svg+xml;base64," + btoa(svgData)

        img.onload = () => {
            canvas.width = img.width + 40 // Padding
            canvas.height = img.height + 40

            if (ctx) {
                // Background White
                ctx.fillStyle = "white"
                ctx.fillRect(0, 0, canvas.width, canvas.height)
                ctx.drawImage(img, 20, 20)

                const pngFile = canvas.toDataURL("image/png")
                const downloadLink = document.createElement("a")
                downloadLink.download = `QR_${eventName.replace(/\s+/g, '_')}.png`
                downloadLink.href = pngFile
                downloadLink.click()
            }
        }
    }

    const handlePrint = () => {
        const printContent = document.getElementById('print-area')
        if (printContent) {
            const WindowPrt = window.open('', '', 'left=0,top=0,width=800,height=900,toolbar=0,scrollbars=0,status=0')
            if (WindowPrt) {
                WindowPrt.document.write(`
                    <html>
                        <head>
                            <title>Print QR - ${eventName}</title>
                            <style>
                                body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; text-align: center; }
                                h1 { margin-bottom: 20px; font-size: 24px; color: #1a202c; }
                                .id { margin-top: 20px; font-family: monospace; font-size: 14px; color: #718096; }
                            </style>
                        </head>
                        <body>
                            <h1>${eventName}</h1>
                            ${printContent.innerHTML}
                            <div class="id">ID: ${eventId}</div>
                            <p style="margin-top: 40px; font-size: 12px; color: #aaa;">Scan untuk Check-in Mandiri</p>
                        </body>
                    </html>
                `)
                WindowPrt.document.close()
                WindowPrt.focus()
                WindowPrt.print()
                WindowPrt.close()
            }
        }
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-8 max-w-sm w-full relative zoom-in-95 duration-200 flex flex-col items-center">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition"
                >
                    <X size={24} />
                </button>

                <h3 className="text-xl font-bold text-navy mb-1 text-center">{eventName}</h3>
                <p className="text-sm text-gray-500 mb-6">QR Code Event Check-in</p>

                <div id="print-area" className="flex justify-center p-4 bg-white">
                    <QRCode
                        id="event-qr-code"
                        value={eventId} // Self Check-in uses Event ID
                        size={250}
                        level="H"
                    />
                </div>

                <div className="flex gap-2 mt-6 w-full">
                    <button
                        onClick={handleDownload}
                        className="flex-1 bg-white border border-gray-200 text-navy py-2 rounded-lg font-bold text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                        <Download size={16} /> Save PNG
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 bg-navy text-white py-2 rounded-lg font-bold text-sm hover:bg-navy/90 flex items-center justify-center gap-2"
                    >
                        <Printer size={16} /> Print
                    </button>
                </div>
            </div>
        </div>
    )
}
