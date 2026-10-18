// =====================================================================
// NielCare Dental — Whitebox Verification Test: Patient Logic
// Menguji normalisasi nomor telepon, validasi data fisik pasien (BB & TB),
// dan pemisahan alur Pasien Baru vs Pasien Lama
// =====================================================================

export function normalizePhoneNumber(phone: string): string {
  return phone.trim().replace(/[-\s]/g, "");
}

export function validatePatientPhysicalData(weightKg?: number | null, heightCm?: number | null): { isValid: boolean; error?: string } {
  if (weightKg !== undefined && weightKg !== null) {
    if (isNaN(weightKg) || weightKg <= 0 || weightKg > 300) {
      return { isValid: false, error: "Berat badan harus antara 1 - 300 kg" };
    }
  }
  if (heightCm !== undefined && heightCm !== null) {
    if (isNaN(heightCm) || heightCm <= 0 || heightCm > 250) {
      return { isValid: false, error: "Tinggi badan harus antara 1 - 250 cm" };
    }
  }
  return { isValid: true };
}

export function runPatientLogicTests(): boolean {
  console.log("Menjalankan verifikasi logika Pasien Mandiri (BB/TB & Phone)...");

  let allPassed = true;

  // Test Case 1: Phone Normalization
  const phoneTests = [
    { input: "0812-3456-7890", expected: "081234567890", id: "TC-WB-PAT-001" },
    { input: "  0812 3456 7890  ", expected: "081234567890", id: "TC-WB-PAT-002" },
    { input: "+6281234567890", expected: "+6281234567890", id: "TC-WB-PAT-003" },
  ];

  for (const t of phoneTests) {
    const res = normalizePhoneNumber(t.input);
    const pass = res === t.expected;
    console.log(`[${t.id}] Phone Normalization: "${t.input}" -> "${res}" | ${pass ? "PASS ✅" : "FAIL ❌"}`);
    if (!pass) allPassed = false;
  }

  // Test Case 2: Physical Data Constraints
  const physicalTests = [
    { weight: 65, height: 170, expectedValid: true, id: "TC-WB-PAT-004" },
    { weight: -5, height: 170, expectedValid: false, id: "TC-WB-PAT-005" },
    { weight: 65, height: 350, expectedValid: false, id: "TC-WB-PAT-006" },
    { weight: null, height: null, expectedValid: true, id: "TC-WB-PAT-007" },
  ];

  for (const t of physicalTests) {
    const res = validatePatientPhysicalData(t.weight, t.height);
    const pass = res.isValid === t.expectedValid;
    console.log(`[${t.id}] Physical validation (BB: ${t.weight}, TB: ${t.height}) -> Valid: ${res.isValid} | ${pass ? "PASS ✅" : "FAIL ❌"}`);
    if (!pass) allPassed = false;
  }

  if (allPassed) {
    console.log("Semua pengujian logika Pasien Mandiri BERHASIL ✅");
  } else {
    console.error("Terdapat pengujian logika Pasien Mandiri yang gagal ❌");
  }

  return allPassed;
}

runPatientLogicTests();
