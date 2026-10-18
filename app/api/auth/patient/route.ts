import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, full_name, date_of_birth, gender, phone } = body;

    const rawPhone = (phone || "").trim().replace(/[-\s]/g, "");
    if (!rawPhone || rawPhone.length < 8) {
      return NextResponse.json(
        { error: "Nomor HP tidak valid. Harap masukkan nomor HP aktif minimal 8 digit." },
        { status: 400 }
      );
    }

    const adminSupabase = await createAdminClient();

    // ─── ALUR 1: PASIEN LAMA (LOOKUP ONLY) ───────────────────────────────────
    if (action === "lookup") {
      const { data: existingPatient, error: lookupError } = await adminSupabase
        .from("users")
        .select("*")
        .eq("phone", rawPhone)
        .eq("role", "patient")
        .maybeSingle();

      if (lookupError) {
        console.error("[Patient Lookup Error]", lookupError);
        return NextResponse.json({ error: "Gagal mencari data pasien." }, { status: 500 });
      }

      if (!existingPatient) {
        return NextResponse.json(
          {
            error: "not_found",
            message: "Nomor HP belum terdaftar. Silakan pilih tab 'Pasien Baru' untuk mendaftar.",
          },
          { status: 404 }
        );
      }

      const email = `${rawPhone}@patient.nielcare.local`;
      const password = `nielcare_patient_${rawPhone}`;

      // Pastikan kata sandi auth tersinkronisasi untuk auto-login
      try {
        await adminSupabase.auth.admin.updateUserById(existingPatient.id, { password });
      } catch (authErr) {
        console.warn("[Auth sync warning]", authErr);
      }

      return NextResponse.json({
        success: true,
        patient: existingPatient,
        email,
        password,
      });
    }

    // ─── ALUR 2: PASIEN BARU (REGISTER) ──────────────────────────────────────
    if (!full_name || !date_of_birth || !gender) {
      return NextResponse.json(
        { error: "Nama, tanggal lahir, jenis kelamin, dan nomor HP wajib diisi lengkap." },
        { status: 400 }
      );
    }

    // Cek apakah nomor HP sudah terdaftar
    const { data: duplicatePhone } = await adminSupabase
      .from("users")
      .select("id, full_name, phone")
      .eq("phone", rawPhone)
      .maybeSingle();

    if (duplicatePhone) {
      return NextResponse.json(
        {
          error: "already_registered",
          message: "Nomor HP sudah terdaftar. Silakan pilih tab 'Pasien Lama' untuk masuk.",
          phone: rawPhone,
        },
        { status: 409 }
      );
    }

    const email = `${rawPhone}@patient.nielcare.local`;
    const password = `nielcare_patient_${rawPhone}`;

    // Buat akun di Supabase Auth
    let authUserId: string;
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "patient", full_name, phone: rawPhone },
    });

    if (authError) {
      // Jika akun auth sudah ada (misal dari percobaan sebelumnya yang belum lengkap)
      const { data: userList } = await adminSupabase.auth.admin.listUsers();
      const existingUser = userList?.users?.find((u) => u.email === email);
      if (existingUser) {
        authUserId = existingUser.id;
        await adminSupabase.auth.admin.updateUserById(authUserId, { password });
      } else {
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }
    } else {
      authUserId = authData.user.id;
    }

    // Simpan ke tabel public.users
    const { error: insertError } = await adminSupabase.from("users").insert({
      id: authUserId,
      email,
      username: rawPhone,
      full_name: full_name.trim(),
      phone: rawPhone,
      date_of_birth,
      gender,
      role: "patient",
      is_active: true,
    });

    if (insertError) {
      console.error("[Patient Insert Error]", insertError);
      return NextResponse.json(
        { error: `Gagal menyimpan data pasien: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      email,
      password,
    });
  } catch (err: any) {
    console.error("[Patient API Server Error]", err);
    return NextResponse.json({ error: "Terjadi kesalahan pada server klinik." }, { status: 500 });
  }
}
