import { X, Save, Check, ChevronsUpDown } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Switch } from '@/app/components/ui/Switch'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover"
import { cn } from "@/lib/utils"
// import { Button } from "@/app/components/ui/button" // Assuming Button exists or use HTML button

import { PROVINCES } from '@/lib/constants'

interface AgendaFormModalProps {
    isOpen: boolean
    onClose: () => void
    onSubmit: (e: React.FormEvent, formData: any) => Promise<void>
    initialData?: any
    isEditing: boolean
    currentUser?: any
}

export function AgendaFormModal({ isOpen, onClose, onSubmit, initialData, isEditing, currentUser }: AgendaFormModalProps) {
    const [formData, setFormData] = useState<any>({
        title: '',
        description: '',
        date_start: '',
        location: '',
        status: 'Draft',
        quota: 0,
        scope: 'nasional',
        province: [], // Changed to array
        is_online: false
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [openProvince, setOpenProvince] = useState(false)

    // Derived state for Korwil
    const isKorwil = currentUser?.role === 'korwil'
    const managedProvinces = currentUser?.managed_provinces || []

    useEffect(() => {
        if (isOpen) {
            if (isEditing && initialData) {
                // Handle legacy string data if any
                let initProv = []
                if (Array.isArray(initialData.province)) {
                    initProv = initialData.province
                } else if (typeof initialData.province === 'string' && initialData.province) {
                    initProv = [initialData.province]
                }

                setFormData({
                    title: initialData.title || '',
                    description: initialData.description || '',
                    date_start: initialData.date_start ? formatDateForInput(initialData.date_start) : '',
                    location: initialData.location || '',
                    status: initialData.status || 'Open',
                    quota: initialData.quota || 0,
                    scope: initialData.scope || 'nasional',
                    province: initProv,
                    is_online: initialData.is_online || false
                })
            } else {
                // NEW: Default for Korwil
                if (isKorwil) {
                    setFormData({
                        title: '',
                        description: '',
                        date_start: '',
                        location: '',
                        status: 'Draft',
                        quota: 0,
                        scope: 'regional', // Locked to regional
                        province: managedProvinces, // Default select all managed provinces
                        is_online: false
                    })
                } else {
                    setFormData({
                        title: '',
                        description: '',
                        date_start: '',
                        location: '',
                        status: 'Draft',
                        quota: 0,
                        scope: 'nasional',
                        province: [],
                        is_online: false
                    })
                }
            }
        }
    }, [isOpen, initialData, isEditing, isKorwil, currentUser])

    const handleSubmitInternal = async (e: React.FormEvent) => {
        try {
            setIsSubmitting(true)
            const payload = {
                ...formData,
                // Ensure date is sent as ISO UTC
                date_start: formData.date_start ? new Date(formData.date_start).toISOString() : null,
                quota: formData.quota === '' ? 0 : Number(formData.quota),
                // Normalize data
                province: (formData.scope === 'regional' && !formData.is_online) ? formData.province : null
            }
            await onSubmit(e, payload)
        } finally {
            setIsSubmitting(false)
        }
    }

    const toggleProvince = (prov: string) => {
        setFormData((prev: any) => {
            const current = prev.province || []
            if (current.includes(prov)) {
                return { ...prev, province: current.filter((p: string) => p !== prov) }
            } else {
                return { ...prev, province: [...current, prov] }
            }
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-navy">{isEditing ? 'Edit Agenda' : 'Buat Agenda Baru'}</h3>
                    <button onClick={onClose}><X className="text-gray-400 hover:text-red-500 transition" /></button>
                </div>
                <form onSubmit={handleSubmitInternal} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Judul Agenda</label>
                        <input
                            required
                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy/20 outline-none"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    {/* New Visibility Controls */}
                    <div className="bg-gray-50/50 border border-gray-100 p-4 rounded-xl space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-bold text-navy text-sm">Metode Acara</h4>
                                <p className="text-xs text-gray-500">Apakah acara ini diadakan secara online?</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${!formData.is_online ? 'text-navy' : 'text-gray-400'}`}>OFFLINE</span>
                                <Switch
                                    checked={formData.is_online}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_online: checked })}
                                />
                                <span className={`text-xs font-bold ${formData.is_online ? 'text-green-600' : 'text-gray-400'}`}>ONLINE</span>
                            </div>
                        </div>

                        {!formData.is_online && (
                            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cakupan (Scope)</label>
                                    <Select
                                        value={formData.scope}
                                        onValueChange={(val) => setFormData({ ...formData, scope: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih cakupan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {!isKorwil && <SelectItem value="nasional">NASIONAL (Semua)</SelectItem>}
                                            <SelectItem value="regional">REGIONAL (Daerah)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {formData.scope === 'regional' && (
                                    <div className="animate-in fade-in slide-in-from-left-2">
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Provinsi</label>
                                        <Popover open={openProvince} onOpenChange={setOpenProvince}>
                                            <PopoverTrigger asChild>
                                                <button
                                                    type="button"
                                                    role="combobox"
                                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    <span className="truncate">
                                                        {formData.province && formData.province.length > 0
                                                            ? `${formData.province.length} Terpilih`
                                                            : "Pilih Provinsi..."}
                                                    </span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[200px] p-0 z-[101] max-h-60 overflow-y-auto bg-white">
                                                <div className="p-1">
                                                    {(isKorwil ? managedProvinces : PROVINCES).map((prov: string) => (
                                                        <div
                                                            key={prov}
                                                            className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-sm cursor-pointer"
                                                            onClick={() => toggleProvince(prov)}
                                                        >
                                                            <div className={cn(
                                                                "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                                formData.province?.includes(prov)
                                                                    ? "bg-navy border-navy text-white"
                                                                    : "opacity-50 [&_svg]:invisible"
                                                            )}>
                                                                <Check className={cn("h-3 w-3")} />
                                                            </div>
                                                            <span className="text-sm">{prov}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                        {formData.province?.length > 0 && (
                                            <p className="text-[10px] text-gray-500 mt-1 leading-tight">
                                                {formData.province.join(", ")}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {formData.is_online && (
                            <div className="p-2 bg-green-50 text-green-700 text-xs rounded-lg flex gap-2">
                                <Check size={14} className="mt-0.5" />
                                Acara Online akan otomatis muncul untuk SEMUA alumni (Nasional & Internasional).
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Deskripsi</label>
                        <textarea
                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy/20 outline-none h-24"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tanggal & Waktu</label>
                            <input
                                type="datetime-local"
                                required
                                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy/20 outline-none"
                                value={formData.date_start}
                                onChange={e => setFormData({ ...formData, date_start: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Lokasi Detail</label>
                            <input
                                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy/20 outline-none"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                placeholder={formData.is_online ? "Link Zoom / GMeet" : "Nama Gedung / Jalan"}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Status</label>
                        <select
                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy/20 outline-none"
                            value={formData.status}
                            onChange={e => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="Open">Open (Dibuka)</option>
                            <option value="Closed">Closed (Ditutup)</option>
                            <option value="Draft">Draft (Disembunyikan)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Kuota Peserta</label>
                        <input
                            type="number"
                            min="0"
                            placeholder="0 = Tidak Terbatas"
                            className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy/20 outline-none"
                            value={formData.quota}
                            onChange={e => setFormData({ ...formData, quota: e.target.value === '' ? '' : parseInt(e.target.value) })}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">*Isi 0 jika tidak ada batasan kuota.</p>
                    </div>
                    <div className="pt-4 flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-bold transition">Batal</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-bold hover:bg-navy/90 flex items-center gap-2 transition disabled:opacity-70">
                            <Save size={16} /> {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Helper to convert UTC ISO string to Local YYYY-MM-DDThh:mm for input
function formatDateForInput(isoString: string) {
    if (!isoString) return ''
    const date = new Date(isoString)
    const offset = date.getTimezoneOffset() * 60000
    const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16)
    return localISOTime
}
