import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()

        // Auth guard: only admin/superadmin can export
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        // Fetch only required columns (minimal data transfer = lower bill)
        const { data, error } = await supabase
            .from('profiles')
            .select('full_name, generation, university, email, domicile_country, domicile_province, domicile_city, linkedin_url, industry_sector, job_type, job_position, company_name, phone')
            .eq('account_status', 'Active')
            .neq('generation', '')
            .neq('phone', '')

        if (error) throw error

        // Transform to worksheet rows
        const rows = (data || []).map(r => ({
            'Nama Lengkap': r.full_name,
            'Generasi': r.generation,
            'Universitas': r.university,
            'Email': r.email,
            'Negara Domisili': r.domicile_country,
            'Provinsi Domisili': r.domicile_province,
            'Kota Domisili': r.domicile_city,
            'LinkedIn': r.linkedin_url,
            'Sektor Industri': r.industry_sector,
            'Jenis Pekerjaan': r.job_type,
            'Posisi': r.job_position,
            'Perusahaan': r.company_name,
        }))

        const wb = XLSX.utils.book_new()
        const ws = XLSX.utils.json_to_sheet(rows)
        XLSX.utils.book_append_sheet(wb, ws, 'Alumni Aktif')

        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

        const today = new Date().toISOString().split('T')[0]
        return new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="alumni_aktif_${today}.xlsx"`,
            },
        })
    } catch (err) {
        console.error('Export error:', err)
        return NextResponse.json({ error: 'Export failed' }, { status: 500 })
    }
}
