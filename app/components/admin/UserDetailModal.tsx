import { X, User, Briefcase, Shield } from 'lucide-react'

interface UserDetailModalProps {
    isOpen: boolean
    user: any
    onClose: () => void
}

export function UserDetailModal({ isOpen, user, onClose }: UserDetailModalProps) {
    if (!isOpen || !user) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 select-none">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-bold text-navy">Detail User</h3>
                        <p className="text-xs text-gray-500">{user.id}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-red-500 transition">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-8 overflow-y-auto space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Nama Lengkap</label>
                            <p className="font-bold text-navy text-lg">{user.full_name}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Email</label>
                            <p className="font-medium text-gray-700">{user.email}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Whatsapp</label>
                            <p className="font-medium text-gray-700">{user.phone || '-'}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Angkatan</label>
                            <p className="font-medium text-gray-700">Beswan {user.generation}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Universitas</label>
                            <p className="font-medium text-gray-700">{user.university}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-bold">Jurusan</label>
                            <p className="font-medium text-gray-700">{user.major}</p>
                        </div>
                        <div className="col-span-2 border-t pt-4 mt-2">
                            <h4 className="font-bold text-navy mb-3 text-sm flex items-center gap-2"><Briefcase size={16} /> Pekerjaan</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Posisi</label>
                                    <p className="font-medium text-gray-700">{user.job_position || '-'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Perusahaan</label>
                                    <p className="font-medium text-gray-700">{user.company_name || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs text-gray-400 uppercase font-bold">Sektor</label>
                                    <p className="font-medium text-gray-700">{user.industry_sector || '-'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-span-2 border-t pt-4 mt-2">
                            <h4 className="font-bold text-navy mb-3 text-sm flex items-center gap-2"><User size={16} /> Bio Lainnya</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">Domisili</label>
                                    <p className="font-medium text-gray-700">{user.domicile_city}, {user.domicile_province}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-400 uppercase font-bold">LinkedIn</label>
                                    <p className="font-medium text-blue-600 truncate">{user.linkedin_url || '-'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-2 border-t pt-4 mt-2">
                            <h4 className="font-bold text-navy mb-3 text-sm flex items-center gap-2"><Shield size={16} /> Foto Profil</h4>
                            {(user.photo_url || user.verification_photo_url) ? (
                                <div className="relative w-full max-w-sm h-48 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group cursor-pointer" onClick={() => window.open(user.photo_url || user.verification_photo_url, '_blank')}>
                                    <img src={user.photo_url || user.verification_photo_url} alt="Foto Profil" className="w-full h-full object-cover group-hover:scale-105 transition" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold">
                                        Klik untuk memperbesar
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm italic">Tidak ada foto profil.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
