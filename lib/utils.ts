import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function calculateProfileCompleteness(profile: any): number {
    if (!profile) return 0;

    const fields = [
        'full_name',
        'phone',
        'gender',
        'birth_place',
        'birth_date',
        // Academic
        'generation',
        'education_level',
        'university',
        'major',
        // Domicile
        'domicile_city',
        'domicile_province',
        // Job
        'job_type',
        'job_position',
        'company_name',
        'industry_sector',
        // Image
        'photo_url'
    ];

    let filled = 0;
    fields.forEach(field => {
        if (profile[field] && profile[field].trim() !== '') {
            filled++;
        }
    });

    return Math.round((filled / fields.length) * 100);
}
