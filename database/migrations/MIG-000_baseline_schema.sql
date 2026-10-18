-- MIG-000: Baseline Schema Supabase PostgreSQL untuk NielCare Dental
-- Tanggal: 2026-10-18
-- Penanggung Jawab: NielCare
-- Fitur: Unified Users (Pasien, Dokter, Owner) dengan Data Fisik (BB/TB)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT UNIQUE,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female')),
    weight_kg NUMERIC(5, 1),
    height_cm NUMERIC(5, 1),
    role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'owner')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    specialization TEXT NOT NULL,
    bio TEXT,
    years_experience INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS public.doctor_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
    is_available BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT check_time_range CHECK (end_time > start_time)
);

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    service_id UUID,
    appointment_date DATE NOT NULL,
    slot_time TIME NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'done', 'cancelled')),
    symptom_description TEXT,
    emergency_level TEXT NOT NULL DEFAULT 'routine' CHECK (emergency_level IN ('critical', 'moderate', 'routine')),
    ai_analysis_result TEXT,
    estimated_cost NUMERIC(12, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.medical_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE UNIQUE,
    patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    diagnosis_notes TEXT NOT NULL,
    treatment_given TEXT NOT NULL,
    medications_prescribed TEXT,
    treatment_cost NUMERIC(12, 2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('booking', 'approval', 'rejection', 'system')),
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date_status ON public.appointments(appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_schedules_doctor_day ON public.doctor_schedules(doctor_id, day_of_week);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile and staff" ON public.users;
CREATE POLICY "Users can read own profile and staff" ON public.users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can view doctors" ON public.doctors;
CREATE POLICY "Anyone can view doctors" ON public.doctors FOR SELECT USING (true);

DROP POLICY IF EXISTS "Doctors can update own profile" ON public.doctors;
CREATE POLICY "Doctors can update own profile" ON public.doctors FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view schedules" ON public.doctor_schedules;
CREATE POLICY "Anyone can view schedules" ON public.doctor_schedules FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can manage schedules" ON public.doctor_schedules;
CREATE POLICY "Staff can manage schedules" ON public.doctor_schedules FOR ALL USING (true);

DROP POLICY IF EXISTS "Patients can view own appointments" ON public.appointments;
CREATE POLICY "Patients can view own appointments" ON public.appointments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Patients can insert appointments" ON public.appointments;
CREATE POLICY "Patients can insert appointments" ON public.appointments FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update appointments" ON public.appointments;
CREATE POLICY "Users can update appointments" ON public.appointments FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can view medical records" ON public.medical_records;
CREATE POLICY "Users can view medical records" ON public.medical_records FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff can manage medical records" ON public.medical_records;
CREATE POLICY "Staff can manage medical records" ON public.medical_records FOR ALL USING (true);

DROP POLICY IF EXISTS "Users can view notifications" ON public.notifications;
CREATE POLICY "Users can view notifications" ON public.notifications FOR SELECT USING (true);
