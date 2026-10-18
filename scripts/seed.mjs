import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// 1. Baca konfigurasi dari .env.local
const envPath = path.resolve(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("❌ File .env.local tidak ditemukan!");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf-8");
const envVars = Object.fromEntries(
  envContent
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx).trim(), line.slice(idx + 1).trim()];
    })
);

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const DEFAULT_PASSWORD = "DevPass123!";

async function getOrCreateAuthUser(email, password, metadata) {
  // Cek apakah user sudah ada
  const { data: userList } = await supabase.auth.admin.listUsers();
  const existing = userList?.users?.find((u) => u.email === email);
  if (existing) {
    console.log(`ℹ️  Auth user '${email}' sudah ada (ID: ${existing.id}).`);
    return existing.id;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata,
  });

  if (error) {
    throw new Error(`Gagal membuat auth user ${email}: ${error.message}`);
  }
  console.log(`✅ Auth user '${email}' berhasil dibuat (ID: ${data.user.id}).`);
  return data.user.id;
}

async function runSeed() {
  console.log("🌱 Memulai seeding data awal NielCare Dental...\n");

  // ─── 1. Akun Pemilik (Owner) ────────────────────────────────────────────────
  const ownerEmail = "owner@nielcare.test";
  const ownerId = await getOrCreateAuthUser(ownerEmail, DEFAULT_PASSWORD, {
    role: "owner",
    full_name: "Pemilik Klinik NielCare",
  });

  await supabase.from("users").upsert({
    id: ownerId,
    email: ownerEmail,
    username: "clinic_owner",
    full_name: "Pemilik Klinik NielCare",
    phone: "081100000001",
    role: "owner",
    is_active: true,
  });
  console.log("✅ Profil Pemilik (Owner) tersimpan di public.users.");

  // ─── 2. Dokter 1: dr. Budi Santoso (General Dentist) ───────────────────────
  const drBudiEmail = "dr.budi@nielcare.test";
  const drBudiId = await getOrCreateAuthUser(drBudiEmail, DEFAULT_PASSWORD, {
    role: "doctor",
    full_name: "drg. Budi Santoso",
  });

  await supabase.from("users").upsert({
    id: drBudiId,
    email: drBudiEmail,
    username: "dr.budi",
    full_name: "drg. Budi Santoso",
    phone: "081100000002",
    gender: "male",
    role: "doctor",
    is_active: true,
  });

  const { data: docBudi } = await supabase
    .from("doctors")
    .upsert(
      {
        user_id: drBudiId,
        specialization: "General Dentist",
        bio: "Dokter gigi umum berpengalaman menangani penambalan, scaling karang gigi, dan perawatan preventif.",
        years_experience: 8,
        is_active: true,
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (docBudi) {
    console.log("✅ Profil drg. Budi Santoso tersimpan di public.doctors.");
    // Jadwal Senin s/d Jumat (1 = Senin, 5 = Jumat), 09:00 - 17:00
    for (let day = 1; day <= 5; day++) {
      const { data: existingSched } = await supabase
        .from("doctor_schedules")
        .select("id")
        .eq("doctor_id", docBudi.id)
        .eq("day_of_week", day)
        .maybeSingle();

      if (!existingSched) {
        await supabase.from("doctor_schedules").insert({
          doctor_id: docBudi.id,
          day_of_week: day,
          start_time: "09:00:00",
          end_time: "17:00:00",
          slot_duration_minutes: 30,
          is_available: true,
        });
      }
    }
    console.log("✅ Jadwal praktik drg. Budi (Senin-Jumat 09:00-17:00) tersimpan.");
  }

  // ─── 3. Dokter 2: drg. Siti Rahma, Sp.Ort (Orthodontist) ────────────────────
  const drSitiEmail = "dr.siti@nielcare.test";
  const drSitiId = await getOrCreateAuthUser(drSitiEmail, DEFAULT_PASSWORD, {
    role: "doctor",
    full_name: "drg. Siti Rahma, Sp.Ort",
  });

  await supabase.from("users").upsert({
    id: drSitiId,
    email: drSitiEmail,
    username: "dr.siti",
    full_name: "drg. Siti Rahma, Sp.Ort",
    phone: "081100000003",
    gender: "female",
    role: "doctor",
    is_active: true,
  });

  const { data: docSiti } = await supabase
    .from("doctors")
    .upsert(
      {
        user_id: drSitiId,
        specialization: "Orthodontist",
        bio: "Spesialis ortodonti melayani konsultasi behel kawat gigi, retainer, dan estetika susunan gigi.",
        years_experience: 6,
        is_active: true,
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (docSiti) {
    console.log("✅ Profil drg. Siti Rahma tersimpan di public.doctors.");
    // Jadwal Senin s/d Jumat, 10:00 - 18:00
    for (let day = 1; day <= 5; day++) {
      const { data: existingSched } = await supabase
        .from("doctor_schedules")
        .select("id")
        .eq("doctor_id", docSiti.id)
        .eq("day_of_week", day)
        .maybeSingle();

      if (!existingSched) {
        await supabase.from("doctor_schedules").insert({
          doctor_id: docSiti.id,
          day_of_week: day,
          start_time: "10:00:00",
          end_time: "18:00:00",
          slot_duration_minutes: 30,
          is_available: true,
        });
      }
    }
    console.log("✅ Jadwal praktik drg. Siti (Senin-Jumat 10:00-18:00) tersimpan.");
  }

  // ─── 4. Pasien Uji Coba ───────────────────────────────────────────────────
  const patientEmail = "pasien@nielcare.test";
  const patientPhone = "081234567890";
  const patientId = await getOrCreateAuthUser(patientEmail, DEFAULT_PASSWORD, {
    role: "patient",
    full_name: "Pasien Uji Coba",
    phone: patientPhone,
  });

  await supabase.from("users").upsert({
    id: patientId,
    email: patientEmail,
    username: "pasien1",
    full_name: "Pasien Uji Coba",
    phone: patientPhone,
    date_of_birth: "1998-05-15",
    gender: "male",
    role: "patient",
    is_active: true,
  });
  console.log("✅ Profil Pasien Uji Coba tersimpan di public.users.");

  console.log("\n🎉 SEED DATA SELESAI!");
  console.log("Kredensial Login Pengujian:");
  console.log("-------------------------------------------------------");
  console.log(`1. Owner  : ${ownerEmail} | Pass: ${DEFAULT_PASSWORD}`);
  console.log(`2. Dokter : ${drBudiEmail} | Pass: ${DEFAULT_PASSWORD}`);
  console.log(`3. Dokter : ${drSitiEmail} | Pass: ${DEFAULT_PASSWORD}`);
  console.log(`4. Pasien : ${patientEmail} | Pass: ${DEFAULT_PASSWORD}`);
  console.log("-------------------------------------------------------");
}

runSeed().catch((err) => {
  console.error("❌ Terjadi kesalahan saat seed:", err);
  process.exit(1);
});
