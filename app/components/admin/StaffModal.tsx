import { X, UserPlus, Trash2, Search, Check } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface StaffModalProps {
    isOpen: boolean
    onClose: () => void
    eventName: string
    staffList: any[]
    loading: boolean
    onAddStaff: (e: React.FormEvent, email: string, role: string) => Promise<void>
    onRemoveStaff: (id: string) => Promise<void>
}

export function StaffModal({ isOpen, onClose, eventName, staffList, loading, onAddStaff, onRemoveStaff }: StaffModalProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [newStaffRole, setNewStaffRole] = useState('Koordinator')
    const [adding, setAdding] = useState(false)
    const searchRef = useRef<HTMLDivElement>(null)

    // Debounce Search
    useEffect(() => {
        const delayDebounce = setTimeout(async () => {
            if (searchTerm.length < 2) {
                setSearchResults([])
                return
            }
            // Don't search if we just selected a user (check matching name)
            if (selectedUser && selectedUser.full_name === searchTerm) return

            setIsSearching(true)
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, photo_url')
                .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
                .limit(5)

            if (!error && data) {
                setSearchResults(data)
            }
            setIsSearching(false)
        }, 300)

        return () => clearTimeout(delayDebounce)
    }, [searchTerm, selectedUser])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setSearchResults([])
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelectUser = (user: any) => {
        setSelectedUser(user)
        setSearchTerm(user.full_name)
        setSearchResults([])
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedUser?.email) return

        setAdding(true)
        await onAddStaff(e, selectedUser.email, newStaffRole)

        // Reset
        setSearchTerm('')
        setSelectedUser(null)
        setAdding(false)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full flex flex-col animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-2xl">
                    <div>
                        <h3 className="text-lg font-bold text-navy">Manajemen Panitia</h3>
                        <p className="text-gray-500 text-xs">{eventName}</p>
                    </div>
                    <button onClick={onClose}><X className="text-gray-400 hover:text-red-500 transition" /></button>
                </div>

                <div className="p-6 border-b border-gray-100 bg-white relative z-50">
                    <form onSubmit={handleSubmit} className="flex gap-2 items-start" autoComplete="off">
                        <div className="flex-1 relative" ref={searchRef}>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Cari Nama / Email member..."
                                    className={`w-full border rounded-lg pl-9 p-2 text-sm outline-none ${selectedUser ? 'border-green-500 bg-green-50 text-green-700 font-bold' : 'focus:ring-2 focus:ring-navy/20'}`}
                                    value={searchTerm}
                                    onChange={e => {
                                        setSearchTerm(e.target.value)
                                        if (selectedUser) setSelectedUser(null) // Reset selection on edit
                                    }}
                                    required
                                />
                                {selectedUser && (
                                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600" size={16} />
                                )}
                            </div>

                            {/* Dropdown Results */}
                            {(searchResults.length > 0 || isSearching) && !selectedUser && (
                                <div className="absolute top-full left-0 w-full bg-white border border-gray-100 rounded-lg shadow-xl mt-1 max-h-60 overflow-y-auto">
                                    {isSearching && <div className="p-4 text-center text-xs text-gray-400">Mencari...</div>}
                                    {searchResults.map(user => (
                                        <div
                                            key={user.id}
                                            onClick={() => handleSelectUser(user)}
                                            className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition border-b border-gray-50 last:border-0"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                                                {user.photo_url ? (
                                                    <img src={user.photo_url} alt={user.full_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                                                        {user.full_name?.charAt(0)}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="text-sm font-bold text-navy truncate">{user.full_name}</p>
                                                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="w-1/3 relative">
                            <input
                                type="text"
                                placeholder="Role (ketik/pilih)..."
                                className="w-full border rounded-lg p-2 text-sm focus:ring-2 focus:ring-navy/20 outline-none h-[38px]"
                                value={newStaffRole}
                                onChange={e => setNewStaffRole(e.target.value)}
                                list="common-roles"
                            />
                            <datalist id="common-roles">
                                <option value="Koordinator" />
                                <option value="Registrasi" />
                                <option value="Konsumsi" />
                                <option value="Liaison" />
                                <option value="Keamanan" />
                                <option value="Dokumentasi" />
                                <option value="Acara" />
                                <option value="Perlengkapan" />
                            </datalist>
                        </div>
                        <button
                            type="submit"
                            disabled={adding || !selectedUser}
                            className="bg-navy text-white p-2 rounded-lg hover:bg-navy/90 transition disabled:opacity-50 h-[38px] w-[38px] flex items-center justify-center"
                        >
                            <UserPlus size={20} />
                        </button>
                    </form>

                    {/* Role Suggestions */}
                    <div className="mt-2 flex flex-wrap gap-2">
                        {['Koordinator', 'Acara', 'Registrasi', 'Konsumsi', 'Dokumentasi'].map(role => (
                            <button
                                key={role}
                                type="button"
                                onClick={() => setNewStaffRole(role)}
                                className={`text-[10px] px-2 py-1 rounded-full border transition ${newStaffRole === role ? 'bg-navy text-white border-navy' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400'}`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-0 overflow-y-auto max-h-[50vh]">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Loading staff...</div>
                    ) : staffList.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">Belum ada panitia ditugaskan.</div>
                    ) : (
                        <ul className="divide-y divide-gray-100">
                            {staffList.map((staff) => (
                                <li key={staff.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        {/* Avatar for existing staff */}
                                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0 border border-gray-100">
                                            {/* We might not have photo_url in staffList join, assume profiles is joined */}
                                            {/* @ts-ignore */}
                                            {staff.profiles?.photo_url ? (
                                                <img src={staff.profiles.photo_url} alt={staff.profiles.full_name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-400">
                                                    {staff.profiles?.full_name?.charAt(0) || '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            {/* @ts-ignore */}
                                            <p className="text-sm font-bold text-navy">{staff.profiles?.full_name || 'Unknown'}</p>
                                            <p className="text-xs text-gray-500">{staff.role}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onRemoveStaff(staff.id)}
                                        className="text-gray-400 hover:text-red-500 p-2 transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    )
}
