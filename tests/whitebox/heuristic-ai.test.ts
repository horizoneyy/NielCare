// =====================================================================
// NielCare Dental — Whitebox Verification Test
// Modul: app/api/ai/analyze-symptoms/route.ts
// Menguji fungsi validasi regex keluhan dan penentuan level urgensi
// =====================================================================

export const REJECT_PATTERNS = [
  { re: /^(tes|test|testing|halo|hallo|hello|hi|hai|hey|yo|hei)\b/i, msg: "Input terdeteksi sebagai sapaan/tes, bukan keluhan gigi." },
  { re: /^(coba|cobain|try|cek|check)\b/i, msg: "Input terdeteksi sebagai percobaan, bukan keluhan gigi." },
  { re: /^(asd|qwe|zxc|asdf|qwerty|abc|xxx|zzz)/i, msg: "Input tidak dapat dikenali. Harap ceritakan keluhan gigi Anda." },
  { re: /^[\d\s\W]+$/, msg: "Input hanya berisi angka atau karakter khusus. Harap ceritakan keluhan gigi Anda." },
];

export function validateInput(symptoms: string) {
  const trimmed = symptoms.trim();
  for (const { re, msg } of REJECT_PATTERNS) {
    if (re.test(trimmed)) {
      return { isValid: false, reason: msg };
    }
  }
  if (trimmed.split(/\s+/).filter(w => w.length > 1).length < 2) {
    return { isValid: false, reason: "Keluhan terlalu singkat." };
  }
  return { isValid: true };
}

export function runHeuristicWhiteboxTests(): boolean {
  console.log("Menjalankan verifikasi logika whitebox...");

  const testCases = [
    { input: "halo dok", expectedValid: false, id: "TC-WB-001" },
    { input: "testing 123", expectedValid: false, id: "TC-WB-001" },
    { input: "sakit", expectedValid: false, id: "TC-WB-002" },
    { input: "gigi geraham saya sakit sekali berdenyut", expectedValid: true, id: "TC-WB-003" },
  ];

  let allPassed = true;
  for (const tc of testCases) {
    const res = validateInput(tc.input);
    const pass = res.isValid === tc.expectedValid;
    console.log(`[${tc.id}] Input: "${tc.input}" -> Valid: ${res.isValid} | ${pass ? "PASS ✅" : "FAIL ❌"}`);
    if (!pass) allPassed = false;
  }

  if (allPassed) {
    console.log("Semua pengujian logika whitebox pre-validasi BERHASIL.");
  } else {
    console.error("Terdapat pengujian yang gagal.");
  }

  return allPassed;
}

// Eksekusi jika dijalankan langsung
runHeuristicWhiteboxTests();
