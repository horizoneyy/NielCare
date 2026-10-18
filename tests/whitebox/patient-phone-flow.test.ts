// =====================================================================
// NielCare Dental — Whitebox Verification: Patient Phone Flow
// Menguji alur:
// 1. Pasien baru mengisi nama, tgl lahir, jenis kelamin, dan nomor HP
// 2. Nomor HP sebagai pengenal unik tunggal
// 3. Pasien lama memasukkan nomor HP saja -> data terisi otomatis
// 4. Pasien baru yang memasukkan nomor terdaftar -> ditolak & diarahkan ke Pasien Lama
// =====================================================================

export interface MockPatient {
  id: string;
  phone: string;
  full_name: string;
  date_of_birth: string;
  gender: "male" | "female";
}

export function handlePatientFlow(
  database: MockPatient[],
  request: {
    action: "register" | "lookup";
    full_name?: string;
    date_of_birth?: string;
    gender?: "male" | "female";
    phone: string;
  }
): { success: boolean; redirect: string; patient?: MockPatient; error?: string } {
  const cleanPhone = request.phone.trim().replace(/[-\s]/g, "");

  if (request.action === "lookup") {
    const existing = database.find((p) => p.phone === cleanPhone);
    if (!existing) {
      return {
        success: false,
        redirect: "new_patient_tab",
        error: "Nomor HP belum terdaftar. Silakan pilih tab Pasien Baru.",
      };
    }
    return {
      success: true,
      redirect: "/patient/dashboard",
      patient: existing,
    };
  }

  // Action: Register (Pasien Baru)
  if (!request.full_name || !request.date_of_birth || !request.gender || !cleanPhone) {
    return {
      success: false,
      redirect: "new_patient_tab",
      error: "Data pendaftaran tidak lengkap.",
    };
  }

  const duplicate = database.find((p) => p.phone === cleanPhone);
  if (duplicate) {
    return {
      success: false,
      redirect: "existing_patient_tab",
      error: "Nomor HP sudah terdaftar. Mengalihkan ke tab Pasien Lama.",
    };
  }

  const newPatient: MockPatient = {
    id: `pat-${Date.now()}`,
    phone: cleanPhone,
    full_name: request.full_name.trim(),
    date_of_birth: request.date_of_birth,
    gender: request.gender,
  };

  database.push(newPatient);

  return {
    success: true,
    redirect: "/patient/dashboard",
    patient: newPatient,
  };
}

export function runPatientPhoneFlowTests(): boolean {
  console.log("Menjalankan verifikasi alur Pasien Baru & Pasien Lama berbasis Nomor HP...");

  const mockDb: MockPatient[] = [
    {
      id: "pat-1",
      phone: "081234567890",
      full_name: "Budi Santoso",
      date_of_birth: "1990-01-15",
      gender: "male",
    },
  ];

  let allPassed = true;

  // Test 1: Pasien Lama memasukkan nomor HP terdaftar -> sukses langsung ke dashboard
  const res1 = handlePatientFlow(mockDb, { action: "lookup", phone: "0812-3456-7890" });
  const pass1 = res1.success && res1.redirect === "/patient/dashboard" && res1.patient?.full_name === "Budi Santoso";
  console.log(`[TC-PAT-001] Pasien Lama input nomor HP terdaftar -> Masuk Dashboard | ${pass1 ? "PASS ✅" : "FAIL ❌"}`);
  if (!pass1) allPassed = false;

  // Test 2: Pasien Lama memasukkan nomor HP yang belum ada -> ditolak & diarahkan ke tab Pasien Baru
  const res2 = handlePatientFlow(mockDb, { action: "lookup", phone: "089999999999" });
  const pass2 = !res2.success && res2.redirect === "new_patient_tab";
  console.log(`[TC-PAT-002] Pasien Lama nomor tidak ditemukan -> Arahkan ke Pasien Baru | ${pass2 ? "PASS ✅" : "FAIL ❌"}`);
  if (!pass2) allPassed = false;

  // Test 3: Pasien Baru mendaftar dengan nomor baru -> terdaftar & masuk dashboard
  const res3 = handlePatientFlow(mockDb, {
    action: "register",
    full_name: "Siti Rahma",
    date_of_birth: "1995-08-20",
    gender: "female",
    phone: "081987654321",
  });
  const pass3 = res3.success && res3.redirect === "/patient/dashboard" && res3.patient?.phone === "081987654321";
  console.log(`[TC-PAT-003] Pasien Baru mengisi 4 data & no HP baru -> Sukses Masuk Dashboard | ${pass3 ? "PASS ✅" : "FAIL ❌"}`);
  if (!pass3) allPassed = false;

  // Test 4: Pasien Baru memasukkan nomor HP yang SUDAH terdaftar -> ditolak & diarahkan ke Pasien Lama
  const res4 = handlePatientFlow(mockDb, {
    action: "register",
    full_name: "Budi Kloning",
    date_of_birth: "1992-03-10",
    gender: "male",
    phone: "081234567890", // nomor yang sama dengan mockDb[0]
  });
  const pass4 = !res4.success && res4.redirect === "existing_patient_tab";
  console.log(`[TC-PAT-004] Pasien Baru dengan nomor HP duplikat -> Ditolak & Arahkan ke Pasien Lama | ${pass4 ? "PASS ✅" : "FAIL ❌"}`);
  if (!pass4) allPassed = false;

  if (allPassed) {
    console.log("Semua pengujian alur Pasien Baru & Pasien Lama BERHASIL ✅");
  } else {
    console.error("Terdapat pengujian alur Pasien yang gagal ❌");
  }

  return allPassed;
}

runPatientPhoneFlowTests();
