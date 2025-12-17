require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');
const readline = require('readline');

// --- CONFIG ---
const FILE_PATH = path.resolve(__dirname, '../migration_data/Database V2.0.xlsx');
const SHEET_AKUN = 'Akun';
const SHEET_DATABASE = 'Database';
const SHEET_AGENDA = 'Agenda';
const SHEET_TEMP = 'TempPendaftar';

// --- SUPABASE CLIENT ---
// User must provide these env vars or input them
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file.");
    console.error("Please create a .env file in this folder with your credentials.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// --- HELPERS ---
function readSheet(workbook, sheetName) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return [];
    return XLSX.utils.sheet_to_json(sheet);
}

function cleanString(str) {
    if (!str) return null;
    return String(str).trim();
}

function parseDate(excelDate) {
    if (!excelDate) return null;
    // Handle JS Date object
    if (excelDate instanceof Date) return excelDate;
    // Handle Excel Serial Date
    if (typeof excelDate === 'number') {
        return new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    }
    // Handle String
    return new Date(excelDate);
}

// --- MAIN MIGRATION ---
async function migrate() {
    console.log("Starting Migration...");
    console.log(`Reading Excel: ${FILE_PATH}`);

    const workbook = XLSX.readFile(FILE_PATH);

    // 1. MIGRATE USERS (AKUN)
    console.log("\n--- Migrating Auth Users (Akun) ---");
    const akunData = readSheet(workbook, SHEET_AKUN);
    const dbData = readSheet(workbook, SHEET_DATABASE);

    // Create Map for DB Data for quick lookup
    const dbMap = {};
    dbData.forEach(row => {
        const id = cleanString(row['ID Anggota']);
        if (id) dbMap[id] = row;
    });

    // PRE-FETCH ALL EXISTING USERS (To handle "User already exists" correctly)
    console.log("  Fetching existing Auth Users...");
    const emailToIdMap = new Map();
    let page = 1;
    let hasMore = true;
    while (hasMore) {
        const { data: { users }, error } = await supabase.auth.admin.listUsers({ page: page, perPage: 1000 });
        if (error || !users || users.length === 0) {
            hasMore = false;
        } else {
            users.forEach(u => {
                if (u.email) emailToIdMap.set(u.email.toLowerCase(), u.id);
            });
            console.log(`    Fetched page ${page} (${users.length} users)`);
            page++;
        }
    }
    console.log(`  Total existing users loaded: ${emailToIdMap.size}`);

    for (const row of akunData) {
        const email = cleanString(row['Email']);
        const pin = cleanString(row['PIN']) || '123456';
        const idAnggota = cleanString(row['ID Anggota']);
        const status = cleanString(row['Status Akun']);

        if (!email) continue;

        process.stdout.write(`Processing: ${idAnggota} ... `);

        let userId = emailToIdMap.get(email.toLowerCase());

        // Create User if not exists
        if (!userId) {
            try {
                const { data: userData, error: userError } = await supabase.auth.admin.createUser({
                    email: email,
                    password: pin,
                    email_confirm: true,
                    user_metadata: { member_id: idAnggota }
                });
                if (userError) {
                    console.log(`[AUTH FAIL] ${userError.message}`);
                    continue;
                }
                userId = userData.user.id;
                emailToIdMap.set(email.toLowerCase(), userId); // Update cache
            } catch (e) {
                console.log(`[EXCEPTION] ${e.message}`);
                continue;
            }
        }

        // 2. MIGRATE / UPDATE PROFILE
        const profileRow = dbMap[idAnggota];
        const payload = {
            id: userId,
            member_id: idAnggota,
            account_status: status
        };

        if (profileRow) {
            Object.assign(payload, {
                full_name: cleanString(profileRow['Nama Lengkap']),
                generation: cleanString(profileRow['Angkatan']),
                phone: cleanString(profileRow['Nomor Whatsapp']),
                gender: cleanString(profileRow['Jenis Kelamin']),
                birth_place: cleanString(profileRow['Tempat Lahir']),
                birth_date: parseDate(profileRow['Tgl Lahir']),

                education_level: cleanString(profileRow['Jenjang Pendidikan']),
                university: cleanString(profileRow['Universitas']),
                faculty: cleanString(profileRow['Fakultas']),
                major: cleanString(profileRow['Jurusan']),

                domicile_country: cleanString(profileRow['Negara Domisili']),
                domicile_city: cleanString(profileRow['Kota Domisili']),
                domicile_province: cleanString(profileRow['Provinsi Domisili']),

                photo_url: cleanString(profileRow['Foto']),
                linkedin_url: cleanString(profileRow['LinkedIn']),

                industry_sector: cleanString(profileRow['Sektor Industri']),
                job_type: cleanString(profileRow['Jenis Pekerjaan']),
                job_position: cleanString(profileRow['Jabatan']),
                company_name: cleanString(profileRow['Nama Instansi']),

                has_business: String(profileRow['Memiliki Usaha']).toLowerCase().includes('ya'),
                business_name: cleanString(profileRow['Nama Usaha']),
                business_field: cleanString(profileRow['Bidang Usaha']),
                business_location: cleanString(profileRow['Lokasi Usaha']),

                hobbies: cleanString(profileRow['Hobi']),
                interests: cleanString(profileRow['Minat']),
                communities: cleanString(profileRow['Komunitas Lain'])
            });
        }

        // Upsert profile
        const { error: profileError } = await supabase.from('profiles').upsert(payload);

        if (profileError) console.log(`[PROFILE FAIL] ${profileError.message}`);
        else console.log(`[OK]`);
    }

    // 3. MIGRATE AGENDA
    console.log("\n--- Migrating Agenda ---");
    const agendaData = readSheet(workbook, SHEET_AGENDA);
    for (const row of agendaData) {
        const title = cleanString(row['Nama Kegiatan']);
        if (!title) continue;

        const { error } = await supabase.from('events').insert({
            title: title,
            description: cleanString(row['Deskripsi']),
            date_start: parseDate(row['Tanggal']),
            location: cleanString(row['Lokasi']),
            status: cleanString(row['Status']) || 'Open'
        });
        if (error) console.error(`Error inserting event ${title}: ${error.message}`);
        else console.log(`Event migrated: ${title}`);
    }

    // 4. MIGRATE TEMP PENDAFTAR
    console.log("\n--- Migrating Temp Pendaftar ---");
    const tempData = readSheet(workbook, SHEET_TEMP);
    for (const row of tempData) {
        const email = cleanString(row['Email']);
        if (!email) continue;

        const { error } = await supabase.from('temp_registrations').insert({
            email: email,
            full_name: cleanString(row['Nama']),
            whatsapp: cleanString(row['WA']),
            submitted_at: parseDate(row['Timestamp']) || new Date(),
            status: cleanString(row['Status']) || 'Pending',
            raw_data: row // Save full row as JSON
        });
        if (error) console.error(`Error inserting temp ${email}: ${error.message}`);
        else console.log(`Temp row migrated: ${email}`);
    }

    console.log("\nMigration Complete!");
}

migrate();
