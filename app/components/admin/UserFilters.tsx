
interface UserFiltersProps {
    availableGenerations: string[]
    filterGeneration: string
    setFilterGeneration: (val: string) => void
    filterGender: string
    setFilterGender: (val: string) => void
    onReset: () => void
    activeFilters: boolean
}

export function UserFilters({ availableGenerations, filterGeneration, setFilterGeneration, filterGender, setFilterGender, onReset, activeFilters }: UserFiltersProps) {
    return (
        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Filter:</span>
            </div>

            {/* Generation Filter */}
            <div className="relative">
                <select
                    value={filterGeneration}
                    onChange={(e) => setFilterGeneration(e.target.value)}
                    className="px-4 py-2 pr-8 rounded-lg border border-gray-200 focus:border-navy outline-none text-sm bg-white appearance-none min-w-[150px]"
                >
                    <option value="">Semua Angkatan</option>
                    {availableGenerations.map(gen => (
                        <option key={gen} value={gen}>Beswan {gen}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>

            {/* Gender Filter */}
            <div className="relative">
                <select
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="px-4 py-2 pr-8 rounded-lg border border-gray-200 focus:border-navy outline-none text-sm bg-white appearance-none min-w-[150px]"
                >
                    <option value="">Semua Gender</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            </div>

            {/* Clear Filters */}
            {activeFilters && (
                <button
                    onClick={onReset}
                    className="px-3 py-2 text-red-500 text-xs font-bold hover:bg-red-50 rounded-lg transition ml-auto"
                >
                    Reset Filter
                </button>
            )}
        </div>
    )
}
