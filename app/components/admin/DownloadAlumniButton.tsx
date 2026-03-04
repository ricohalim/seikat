'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'

export default function DownloadAlumniButton() {
    const [loading, setLoading] = useState(false)

    const handleDownload = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/export-alumni')
            if (!res.ok) throw new Error('Export gagal')
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `alumni_aktif_${new Date().toISOString().split('T')[0]}.xlsx`
            a.click()
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error(err)
            alert('Gagal mengunduh data. Coba lagi.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleDownload}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 rounded-xl transition-all shadow-sm"
        >
            {loading
                ? <><Loader2 size={15} className="animate-spin" /> Mengunduh...</>
                : <><Download size={15} /> Download XLSX</>
            }
        </button>
    )
}
