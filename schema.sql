-- 1. Profiles Table (Data Member)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  member_id text unique, -- "ID Anggota"
  full_name text,        -- "Nama Lengkap"
  generation text,       -- "Angkatan"
  phone text,            -- "Nomor Whatsapp"
  gender text,           -- "Jenis Kelamin"
  birth_place text,      -- "Tempat Lahir"
  birth_date date,       -- "Tgl Lahir"
  education_level text,  -- "Jenjang Pendidikan"
  university text,       -- "Universitas"
  faculty text,          -- "Fakultas"
  major text,            -- "Jurusan"
  domicile_country text, -- "Negara Domisili"
  domicile_province text,-- "Provinsi Domisili"
  domicile_city text,    -- "Kota Domisili"
  photo_url text,        -- "Foto"
  linkedin_url text,     -- "LinkedIn"
  
  -- Job Info
  industry_sector text,  -- "Sektor Industri"
  job_type text,         -- "Jenis Pekerjaan"
  job_position text,     -- "Jabatan"
  company_name text,     -- "Nama Instansi"
  
  -- Entrepreneurship
  has_business boolean default false,  -- "Memiliki Usaha"
  business_name text,    -- "Nama Usaha"
  business_desc text,    -- "Deskripsi Usaha"
  business_field text,   -- "Bidang Usaha"
  business_position text,-- "Jabatan dalam Usaha"
  business_location text,-- "Lokasi Usaha"
  
  -- Interests
  hobbies text,          -- "Hobi"
  interests text,        -- "Minat"
  communities text,      -- "Komunitas Lain"
  
  -- Metadata
  account_status text default 'Active', -- "Status Akun"
  created_at timestamptz default now()
);

-- 2. Events Table (Agenda)
create table if not exists events (
  id uuid default gen_random_uuid() primary key,
  title text not null,        -- "Nama Kegiatan"
  description text,           -- "Deskripsi"
  date_start timestamptz,     -- "Tanggal"
  location text,              -- "Lokasi"
  status text default 'Open', -- "Status" (Buka/Tutup)
  created_at timestamptz default now()
);

-- 3. Event Participants (Pendaftaran Event)
create table if not exists event_participants (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references events(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  registered_at timestamptz default now(),
  unique(event_id, user_id)
);

-- 4. Temp Registrations (TempPendaftar)
create table if not exists temp_registrations (
  id uuid default gen_random_uuid() primary key,
  submitted_at timestamptz default now(),
  status text default 'Pending', -- Pending, Approved, Rejected
  
  full_name text,
  email text,
  whatsapp text,
  pin text,
  
  raw_data jsonb 
);

-- 5. Row Level Security (RLS) Policies (Basic Setup)
alter table profiles enable row level security;
alter table events enable row level security;
alter table event_participants enable row level security;
alter table temp_registrations enable row level security;

-- Allow users to read their own profile
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Allow everyone to read events
create policy "Events are viewable by everyone" on events for select using (true);
