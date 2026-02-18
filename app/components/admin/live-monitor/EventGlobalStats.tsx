import { Users, UserCheck, Calendar, Activity } from 'lucide-react'

interface GlobalStatsProps {
    totalEvents: number
    totalParticipants: number
    totalCheckedIn: number
}

export function EventGlobalStats({ totalEvents, totalParticipants, totalCheckedIn }: GlobalStatsProps) {
    const attendanceRate = totalParticipants > 0
        ? Math.round((totalCheckedIn / totalParticipants) * 100)
        : 0

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            {/* Active Events */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-24 relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition text-navy">
                    <Calendar size={64} />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Event Aktif</p>
                    <h3 className="text-2xl font-black text-navy mt-1">{totalEvents}</h3>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold bg-green-50 w-fit px-2 py-0.5 rounded-full">
                    <Activity size={10} /> Live Now
                </div>
            </div>

            {/* Total Participants */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-24 relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition text-blue-600">
                    <Users size={64} />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Total Peserta</p>
                    <h3 className="text-2xl font-black text-navy mt-1">{totalParticipants}</h3>
                </div>
                <p className="text-[10px] text-gray-400">Terdaftar di semua event</p>
            </div>

            {/* Total Checked In */}
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-24 relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-3 opacity-5 group-hover:opacity-10 transition text-green-600">
                    <UserCheck size={64} />
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Sudah Check-in</p>
                    <h3 className="text-2xl font-black text-green-600 mt-1">{totalCheckedIn}</h3>
                </div>
                <p className="text-[10px] text-gray-400">Total kehadiran saat ini</p>
            </div>

            {/* Attendance Rate */}
            <div className="bg-navy p-4 rounded-xl border border-navy shadow-lg shadow-navy/20 flex flex-col justify-between h-24 relative overflow-hidden group text-white">
                <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition text-white">
                    <Activity size={64} />
                </div>
                <div>
                    <p className="text-xs text-white/70 font-bold uppercase tracking-wider">Rate Kehadiran</p>
                    <h3 className="text-2xl font-black mt-1">{attendanceRate}%</h3>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-navy-800 h-1.5 rounded-full mt-2 overflow-hidden border border-white/10">
                    <div
                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-1000"
                        style={{ width: `${attendanceRate}%` }}
                    ></div>
                </div>
            </div>
        </div>
    )
}
