interface UserTableProps {
    users: any[]
    loading: boolean
    onRoleChange: (userId: string, newRole: string) => void
    onViewDetail: (user: any) => void
    onEdit: (user: any) => void
}

export function UserTable({ users, loading, onRoleChange, onViewDetail, onEdit }: UserTableProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden select-none"> {/* Anti-Copy: select-none */}
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-100">
                        <th className="p-4 font-bold">User Information</th>
                        <th className="p-4 font-bold">Education / Job</th>
                        <th className="p-4 font-bold">Role & Status</th>
                        <th className="p-4 font-bold text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-50">
                    {loading ? (
                        <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading Data...</td></tr>
                    ) : users.length === 0 ? (
                        <tr><td colSpan={4} className="p-8 text-center text-gray-400">User tidak ditemukan.</td></tr>
                    ) : users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 transition group">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden border border-gray-100">
                                        {u.photo_url ? (
                                            <img src={u.photo_url} alt={u.full_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xs">
                                                {u.full_name?.charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div>
                                        <div className="font-bold text-navy text-base">{u.full_name}</div>
                                        {u.member_id && (
                                            <div className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 inline-block px-1.5 rounded mb-1 border border-blue-100 mr-2">
                                                {u.member_id}
                                            </div>
                                        )}
                                        {u.gender && (
                                            <div className="text-[10px] font-bold text-gray-500 bg-gray-100 inline-block px-1.5 rounded mb-1 border border-gray-200">
                                                {u.gender}
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-400 font-mono mb-1">{u.email}</div>
                                        <div className="text-[10px] text-gray-400">{u.phone || '-'}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 text-gray-600">
                                <div className="font-semibold text-xs">Beswan {u.generation}</div>
                                <div className="text-xs">{u.university || '-'}</div>
                                <div className="text-[10px] text-gray-400 mt-1 truncate max-w-[150px]">{u.company_name ? `${u.job_position} at ${u.company_name}` : '-'}</div>
                            </td>
                            <td className="p-4">
                                <div className="flex flex-col gap-2 items-start">
                                    <select
                                        value={u.role || 'member'}
                                        onChange={(e) => onRoleChange(u.id, e.target.value)}
                                        className={`px-2 py-1 rounded text-xs font-bold border-none outline-none cursor-pointer ${u.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                                            u.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                                                u.role === 'korwil' ? 'bg-orange/10 text-orange' :
                                                    'bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        <option value="member">Member</option>
                                        <option value="admin">Verifikator</option>
                                        <option value="superadmin">Super Admin</option>
                                        <option value="korwil">Koordinator Wilayah</option>
                                    </select>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${u.account_status === 'Active' ? 'text-green-600 border-green-200 bg-green-50' : 'text-orange border-orange/20 bg-orange/10'}`}>
                                        {u.account_status}
                                    </span>
                                </div>
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => onViewDetail(u)}
                                        className="px-3 py-1.5 bg-navy text-white text-xs font-bold rounded hover:bg-navy/90 transition"
                                    >
                                        Detail
                                    </button>
                                    <button
                                        onClick={() => onEdit(u)}
                                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 transition"
                                        title="Edit Data User"
                                    >
                                        Edit
                                    </button>

                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
