export interface ProfileData {
    full_name: string
    phone: string
    gender: string
    birth_place: string
    birth_date: string

    // Academic
    generation: string
    education_level: string // Saat Beasiswa
    // For 'current' education logic
    current_education_level: string
    current_university: string
    university: string
    faculty: string
    major: string

    // Domicile
    domicile_country: string
    domicile_province: string
    domicile_city: string

    // Job
    job_type: string
    job_position: string
    company_name: string
    industry_sector: string
    linkedin_url: string

    // Business & Interests
    hobbies: string
    interests: string
    communities: string
    has_business: boolean
    business_name: string
    business_desc: string
    business_field: string
    business_position: string
    business_location: string

    // Img
    photo_url: string
}
