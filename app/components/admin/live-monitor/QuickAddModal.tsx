import { useState } from 'react'
import { X, Search, UserPlus, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface QuickAddModalProps {
    isOpen: boolean
    event: any
    onClose: () => void
    onSuccess: () => void
}

export function QuickAddModal({ isOpen, event, onClose, onSuccess }: QuickAddModalProps) {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [searchResult, setSearchResult] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)
    const [bypassConfirm, setBypassConfirm] = useState(false)

    const isOverQuota = event.quota > 0 && (event.registered_count >= event.quota)

    const handleSearch = async () => {
        setLoading(true)
        setError(null)
        setSearchResult(null)

        try {
            // Search user by email
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .ilike('email', email)
                .single()

            if (error || !data) {
                setError('User tidak ditemukan. Pastikan email benar.')
            } else {
                setSearchResult(data)
            }
        } catch (err) {
            setError('Terjadi kesalahan saat mencari user.')
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async () => {
        if (!searchResult) return
        if (isOverQuota && !bypassConfirm) return

        setLoading(true)
        try {
            // Check if already registered
            const { data: existing } = await supabase
                .from('event_participants')
                .select('id')
                .eq('event_id', event.id)
                .eq('user_id', searchResult.id)
                .single()

            if (existing) {
                alert('User ini sudah terdaftar di event ini!')
                setLoading(false)
                return
            }

            // Register
            const { error } = await supabase
                .from('event_participants')
                .insert({
                    event_id: event.id,
                    user_id: searchResult.id,
                    check_in_time: new Date().toISOString(), // Auto Check-in for On-the-spot
                    notes: 'Walk-in / On-the-spot',
                    tags: ['Walk-in']
                })

            if (error) throw error

            alert('Berhasil mendaftarkan & check-in peserta!')
            onSuccess()
        } catch (err: any) {
            console.error(err)
            alert('Gagal mendaftar: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-navy">Quick Add (On-the-Spot)</h3>
                    <button onClick={onClose}><X size={20} className="text-gray-400 hover:text-red-500" /></button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-xs text-blue-800 border border-blue-100 mb-2">
                        Menambahkan peserta ke: <span className="font-bold">{event.title}</span>
                    </div>

                    {/* Search User */}
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Cari Email User</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 p-2 border rounded-lg text-sm"
                                placeholder="user@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            />
                            <button
                                onClick={handleSearch}
                                disabled={loading}
                                className="px-4 bg-navy text-white rounded-lg hover:bg-navy/90"
                            >
                                <Search size={16} />
                            </button>
                        </div>
                        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
                    </div>

                    {/* Result Card */}
                    {searchResult && (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex gap-3 items-center animate-in fade-in slide-in-from-top-2">
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center font-bold text-gray-500">
                                {searchResult.full_name?.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-navy">{searchResult.full_name}</p>
                                <p className="text-xs text-gray-500">{searchResult.email}</p>
                            </div>
                        </div>
                    )}

                    {/* Quota Warning */}
                    {isOverQuota && searchResult && (
                        <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 flex flex-col gap-2">
                            <div className="flex items-start gap-2 text-amber-800 text-xs font-bold">
                                <AlertTriangle size={16} className="shrink-0" />
                                <p>Kuota Penuh! ({event.registered_count}/{event.quota})</p>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer mt-1">
                                <input
                                    type="checkbox"
                                    checked={bypassConfirm}
                                    onChange={e => setBypassConfirm(e.target.checked)}
                                    className="rounded text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-xs text-amber-700">Saya mengerti, paksa tambahkan (Bypass).</span>
                            </label>
                        </div>
                    )}

                    {/* Action */}
                    <button
                        onClick={handleRegister}
                        disabled={loading || !searchResult || (isOverQuota && !bypassConfirm)}
                        className="w-full py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-green-600/20 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Memproses...' : (
                            <><UserPlus size={18} /> Tambahkan & Check-in</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
