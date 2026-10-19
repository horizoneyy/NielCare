"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<"new" | "existing">("new");

  // State Pasien Baru
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [newPhone, setNewPhone] = useState("");

  // State Pasien Lama
  const [existingPhone, setExistingPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successNotice, setSuccessNotice] = useState("");

  // ─── 1. SUBMIT PASIEN BARU ───────────────────────────────────────────────
  const handleSubmitNewPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessNotice("");

    if (!fullName.trim() || !dateOfBirth || !gender || !newPhone.trim()) {
      setErrorMsg("Nama, tanggal lahir, jenis kelamin, dan nomor HP wajib diisi lengkap.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          full_name: fullName.trim(),
          date_of_birth: dateOfBirth,
          gender,
          phone: newPhone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "already_registered") {
          // Kalau pasien baru memasukkan nomor yang sudah terdaftar,
          // sistem menolak dan mengarahkannya ke “Pasien Lama”.
          setErrorMsg("Nomor HP sudah terdaftar. Mengalihkan Anda ke Pasien Lama...");
          setExistingPhone(newPhone.trim());
          setTimeout(() => {
            setActiveTab("existing");
            setErrorMsg("Nomor HP Anda sudah terdaftar di sistem. Cukup klik 'Masuk ke Dashboard'.");
          }, 1200);
          setLoading(false);
          return;
        }

        setErrorMsg(data.message || data.error || "Gagal mendaftarkan pasien.");
        setLoading(false);
        return;
      }

      // Berhasil daftar -> otomatis login dengan kredensial internal nomor HP
      if (data.email && data.password) {
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
      }

      router.push("/patient/dashboard");
      router.refresh();
    } catch {
      setErrorMsg("Gagal menghubungi server klinik. Periksa koneksi internet Anda.");
      setLoading(false);
    }
  };

  // ─── 2. SUBMIT PASIEN LAMA ───────────────────────────────────────────────
  const handleSubmitExistingPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessNotice("");

    if (!existingPhone.trim()) {
      setErrorMsg("Harap masukkan nomor HP Anda.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lookup",
          phone: existingPhone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "not_found") {
          setErrorMsg("Nomor HP belum terdaftar di klinik. Silakan pilih tab 'Pasien Baru' untuk mendaftar.");
        } else {
          setErrorMsg(data.message || data.error || "Gagal memverifikasi nomor HP.");
        }
        setLoading(false);
        return;
      }

      // Berhasil menemukan data lama -> otomatis login tanpa daftar nama dan tanpa login kata sandi
      setSuccessNotice(`Selamat datang kembali, ${data.patient?.full_name}! Memuat dashboard Anda...`);

      if (data.email && data.password) {
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
      }

      router.push("/patient/dashboard");
      router.refresh();
    } catch {
      setErrorMsg("Gagal menghubungi server klinik. Periksa koneksi internet Anda.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 font-sans">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 relative">
        <Link
          href="/"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-700 mb-6 transition-colors"
        >
          ← Kembali ke Beranda
        </Link>

        {/* Brand Header */}
        <div className="mb-6">
          <div className="mb-3">
            <span className="text-3xl font-extrabold tracking-tight font-sans">
              <span className="text-slate-900">Niel</span>
              <span className="text-emerald-600">Care</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pendaftaran & Masuk Pasien</h1>
          <p className="text-xs text-slate-500 mt-1">
            Nomor HP Anda menjadi pengenal unik pasien di klinik NielCare Dental.
          </p>
        </div>

        {/* Tab Selector: Pasien Baru vs Pasien Lama */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("new");
              setErrorMsg("");
              setSuccessNotice("");
            }}
            className={`py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all text-center cursor-pointer ${
              activeTab === "new"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Pasien Baru
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("existing");
              setErrorMsg("");
              setSuccessNotice("");
            }}
            className={`py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-all text-center cursor-pointer ${
              activeTab === "existing"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Pasien Lama
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3.5 mb-5 font-medium">
            {errorMsg}
          </div>
        )}

        {successNotice && (
          <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 mb-5 font-medium">
            {successNotice}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: FORM PASIEN BARU (HANYA NAMA, TGL LAHIR, GENDER, NO HP)      */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "new" && (
          <form onSubmit={handleSubmitNewPatient} className="space-y-4" autoComplete="off">
            <div>
              <label className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase block mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Contoh: Andi Daniel"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase block mb-1">
                  Tanggal Lahir *
                </label>
                <input
                  type="date"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-800"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase block mb-1">
                  Jenis Kelamin *
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as "male" | "female")}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-800 h-[42px]"
                >
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase block mb-1">
                Nomor HP (WhatsApp) *
              </label>
              <input
                type="tel"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="08123456789"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-800"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Nomor ini langsung terdaftar sebagai identitas unik Anda di klinik.
              </p>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loading ? "Mendaftarkan Pasien..." : "Daftar & Masuk ke Dashboard"}
              </button>
            </div>
          </form>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: FORM PASIEN LAMA (HANYA MEMASUKKAN NOMOR HP)                  */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "existing" && (
          <form onSubmit={handleSubmitExistingPatient} className="space-y-4" autoComplete="off">
            <div>
              <label className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase block mb-1">
                Masukkan Nomor HP Terdaftar *
              </label>
              <input
                type="tel"
                required
                value={existingPhone}
                onChange={(e) => setExistingPhone(e.target.value)}
                placeholder="Contoh: 08123456789"
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-600 focus:bg-white transition-all text-slate-800"
              />
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                Sistem mencari nomor Anda di database dan data lama Anda akan terisi otomatis, tanpa perlu daftar nama dan tanpa login kata sandi.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {loading ? "Mencari Data Pasien..." : "Masuk ke Dashboard"}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Akses staf & dokter?{" "}
            <Link href="/login" className="font-semibold text-emerald-700 hover:text-emerald-800 underline">
              Login Staf di Sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
