"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils/formatters";
import { generateTimeSlots, filterPastSlots, filterBookedSlots, isDateInPast, getDayOfWeek } from "@/lib/utils/timeSlots";
import { EMERGENCY_LEVEL_LABELS } from "@/types";
import type { Doctor, DoctorSchedule, BookingState, AIAnalysisResult } from "@/types";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Calendar,
  Clock,
  Stethoscope,
  Brain,
  AlertCircle,
  XCircle,
  Siren,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  ShieldCheck,
  ChevronRight
} from "lucide-react";

const SPECIALIZATIONS = [
  { id: "General Dentist", label: "Dokter Gigi Umum", title: "" },
  { id: "Orthodontist", label: "Ortodontis", title: "Sp.Ort" },
  { id: "Periodontist", label: "Periodonsia", title: "Sp.Perio" },
  { id: "Endodontist", label: "Endodontis", title: "Sp.KG" },
  { id: "Prosthodontist", label: "Prostodontis", title: "Sp.Pros" },
  { id: "Oral Surgeon", label: "Bedah Mulut", title: "Sp.BM" },
  { id: "Pediatric Dentist", label: "Dokter Gigi Anak", title: "Sp.KGA" },
];

const PRIORITY_CONFIG = {
  critical: {
    bg: "bg-rose-50/70",
    border: "border-rose-200",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-700",
    Icon: Siren,
  },
  moderate: {
    bg: "bg-amber-50/70",
    border: "border-amber-200",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
    Icon: AlertTriangle,
  },
  routine: {
    bg: "bg-emerald-50/70",
    border: "border-emerald-200",
    badgeBg: "bg-emerald-100",
    badgeText: "text-emerald-700",
    Icon: CheckCircle,
  },
};

export default function BookAppointmentPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState<BookingState>({ step: 1 });
  const [allDoctors, setAllDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [symptomError, setSymptomError] = useState("");
  const [loadingSchedules, setLoadingSchedules] = useState(false);

  // Load all doctors once at step 2
  useEffect(() => {
    async function loadDoctors() {
      const res = await fetch("/api/doctors");
      if (res.ok) {
        const data = await res.json();
        setAllDoctors(data);
      }
    }
    if (step === 2) loadDoctors();
  }, [step]);

  // Filter doctors when allDoctors or AI result changes
  useEffect(() => {
    if (!allDoctors.length) return;
    const recSpec = booking.aiAnalysis?.recommendedSpecialization;
    if (recSpec) {
      const matched = allDoctors.filter((d) => d.specialization === recSpec);
      if (matched.length > 0) {
        setFilteredDoctors(matched);
      } else {
        const general = allDoctors.filter((d) => d.specialization === "General Dentist");
        setFilteredDoctors(general.length > 0 ? general : allDoctors);
      }
    } else {
      setFilteredDoctors(allDoctors);
    }
  }, [allDoctors, booking.aiAnalysis]);

  // Load schedules when doctor selected
  useEffect(() => {
    async function loadSchedules() {
      if (!booking.doctor) return;
      setLoadingSchedules(true);
      const { data } = await supabase
        .from("doctor_schedules")
        .select("*")
        .eq("doctor_id", booking.doctor.id)
        .eq("is_available", true);
      setSchedules((data as DoctorSchedule[]) || []);
      setLoadingSchedules(false);
    }
    if (booking.doctor) loadSchedules();
  }, [booking.doctor]);

  useEffect(() => {
    async function loadSlots() {
      if (!booking.doctor || !booking.date) return;
      const dayOfWeek = getDayOfWeek(new Date(booking.date));
      const daySchedule = schedules.find((s) => s.day_of_week === dayOfWeek);
      if (!daySchedule) {
        setAvailableSlots([]);
        return;
      }
      const allSlots = generateTimeSlots(
        daySchedule.start_time,
        daySchedule.end_time,
        daySchedule.slot_duration_minutes
      );
      const afterPast = filterPastSlots(allSlots, booking.date);
      const { data: booked } = await supabase
        .from("appointments")
        .select("slot_time")
        .eq("doctor_id", booking.doctor.id)
        .eq("appointment_date", booking.date)
        .in("status", ["pending", "approved"]);
      const bookedTimes = booked?.map((b: { slot_time: string }) => b.slot_time) || [];
      setAvailableSlots(filterBookedSlots(afterPast, bookedTimes));
    }
    loadSlots();
  }, [booking.date, schedules]);

  const validateSymptomInput = (text: string): string => {
    const trimmed = text.trim();
    if (trimmed.length < 10) return "Keluhan terlalu singkat. Ceritakan gejala Anda minimal 10 karakter.";
    if (trimmed.length > 1000) return "Keluhan terlalu panjang (maksimal 1000 karakter).";
    if (/^[\d\s\W]+$/.test(trimmed)) return "Input tidak valid. Ceritakan keluhan gigi Anda dengan kata-kata.";

    const NON_SYMPTOM_PATTERNS = [
      /^(tes|test|testing|halo|hallo|hello|hi|hai|hey|yo|hei)\b/i,
      /^(coba|cobain|try|cek|check)\b/i,
      /^(asd|qwe|zxc|asdf|qwerty|abc|xxx|zzz|123|111|000)/i,
      /^[a-z]{1,4}\s*[a-z]{0,4}$/i,
    ];
    for (const pattern of NON_SYMPTOM_PATTERNS) {
      if (pattern.test(trimmed)) {
        return "Input terdeteksi bukan keluhan gigi. Harap ceritakan gejala atau keluhan gigi yang Anda alami.";
      }
    }
    const words = trimmed.split(/\s+/).filter((w) => w.length > 1);
    if (words.length < 2) return "Terlalu singkat. Tolong ceritakan gejala Anda lebih lengkap (minimal 2 kata).";

    const QUESTION_NONHEALTH = [
      /^(apa|siapa|kapan|dimana|kenapa|bagaimana|berapa)\s+(itu|ini|kabar|nama|harga|kamu|anda)/i,
      /^(tolong|please|boleh|bisa)\s+(bantu|help|tanya|tanyain)/i,
    ];
    for (const pattern of QUESTION_NONHEALTH) {
      if (pattern.test(trimmed)) {
        return "Sistem ini hanya menerima keluhan gigi. Harap ceritakan gejala gigi atau mulut yang Anda rasakan.";
      }
    }
    return "";
  };

  const handleAnalyzeSymptoms = async () => {
    setSymptomError("");
    const validationMsg = validateSymptomInput(booking.symptoms || "");
    if (validationMsg) {
      setSymptomError(validationMsg);
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch("/api/ai/analyze-symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: booking.symptoms }),
      });
      const aiResult = await res.json();

      if (!res.ok || aiResult.isValidSymptom === false) {
        setSymptomError(
          aiResult.rejectionReason ||
            "Input tidak dikenali sebagai keluhan gigi. Harap ceritakan gejala gigi atau mulut yang Anda rasakan."
        );
        setAnalyzing(false);
        return;
      }

      setBooking((prev) => ({
        ...prev,
        emergencyLevel: aiResult.emergencyLevel,
        aiAnalysis: aiResult,
      }));
      setStep(2);
    } catch (e) {
      console.error("AI Analysis failed", e);
      setSymptomError("Gagal menghubungi server analisis. Silakan coba lagi.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setBookingError("");
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: booking.doctor!.id,
          appointment_date: booking.date,
          slot_time: booking.time + ":00",
          symptom_description: booking.symptoms || null,
          emergency_level: booking.emergencyLevel || "routine",
          ai_analysis_result: booking.aiAnalysis ? JSON.stringify(booking.aiAnalysis) : null,
        }),
      });
      if (res.ok) {
        router.push("/patient/appointments");
      } else {
        const e = await res.json();
        setBookingError(e.error || "Booking gagal. Silakan coba lagi.");
      }
    } catch {
      setBookingError("Gagal terhubung ke server klinik.");
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const level = booking.emergencyLevel || "routine";
  const priorityCfg = PRIORITY_CONFIG[level];
  const stepLabels = ["Gejala & Analisis AI", "Pilih Dokter & Slot", "Konfirmasi"];
  const DAYS_OF_WEEK = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="pb-6 border-b border-slate-200/70 mb-8">
          <Link
            href="/patient/dashboard"
            className="inline-flex items-center text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Dashboard Pasien
          </Link>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Sistem Reservasi Pintar
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Buat Janji Temu Pemeriksaan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Alur 3 langkah terpandu dengan rekomendasi spesialis dokter berbasis AI
          </p>
        </div>

        {/* ─── STEP PROGRESS BAR ───────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs mb-8">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((s, idx) => (
              <div key={s} className="flex flex-col items-center text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                    s < step
                      ? "bg-emerald-600 text-white"
                      : s === step
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {s < step ? <Check className="w-4 h-4" /> : s}
                </div>
                <span
                  className={`text-[11px] font-medium leading-tight ${
                    s <= step ? "text-slate-900 font-semibold" : "text-slate-400"
                  }`}
                >
                  {stepLabels[idx]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── STEP 1: Symptoms & AI Triage ───────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-3.5 mb-5">
                <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Brain className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Ceritakan Gejala atau Keluhan Anda
                  </h3>
                  <p className="text-xs text-slate-500">
                    AI NielCare akan menganalisis tingkat kegawatan dan merekomendasikan dokter spesialis yang sesuai
                  </p>
                </div>
              </div>

              {/* Sample symptom chips */}
              <div className="bg-slate-50/90 border border-slate-100 rounded-xl p-4 mb-5">
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                  💡 Contoh Keluhan Populer (Klik untuk menambahkan):
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Sakit gigi geraham belakang berdenyut hebat",
                    "Gusi bengkak bernanah dan berdarah",
                    "Gigi berlubang dan ngilu saat minum dingin",
                    "Ingin konsultasi pasang behel kawat gigi",
                    "Pembersihan rutin karang gigi (scaling)",
                    "Gigi goyang atau patah terbentur",
                  ].map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() =>
                        setBooking((p) => ({
                          ...p,
                          symptoms: p.symptoms ? p.symptoms + ", " + ex : ex,
                        }))
                      }
                      className="text-xs bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-2xs"
                    >
                      + {ex}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                className={`rounded-xl min-h-[140px] text-xs sm:text-sm transition-colors ${
                  symptomError
                    ? "border-rose-300 focus:ring-rose-200 bg-rose-50/50"
                    : "border-slate-200 focus:ring-emerald-500"
                }`}
                placeholder="Ceritakan detail keluhan Anda... (contoh: gigi geraham belakang sakit berdenyut sudah 2 hari, gusi agak bengkak, tidak bisa mengunyah makanan keras)"
                value={booking.symptoms || ""}
                onChange={(e) => {
                  setBooking((prev) => ({ ...prev, symptoms: e.target.value }));
                  if (symptomError) setSymptomError("");
                }}
                rows={5}
              />

              <div className="flex items-center justify-between mt-2 text-xs">
                <span
                  className={
                    (booking.symptoms || "").length < 10
                      ? "text-slate-400"
                      : "text-emerald-600 font-medium"
                  }
                >
                  {(booking.symptoms || "").length} / 1000 karakter
                  {(booking.symptoms || "").length < 10 && " (minimal 10 karakter)"}
                </span>
              </div>

              {symptomError && (
                <div className="flex items-start gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl mt-4 text-xs">
                  <XCircle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-rose-800">Perhatian:</p>
                    <p className="text-rose-700 mt-0.5">{symptomError}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-6 pt-5 border-t border-slate-100">
                <Button
                  onClick={handleAnalyzeSymptoms}
                  disabled={!booking.symptoms?.trim() || analyzing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold h-11 px-6 flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Menganalisis Gejala Klinis...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      <span>Analisis Triase AI &amp; Lanjut</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP 2: Doctor Selection & Time Slot ─────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            {/* AI Result Card */}
            {booking.aiAnalysis && (
              <div
                className={`rounded-2xl p-6 border ${priorityCfg.bg} ${priorityCfg.border} shadow-xs`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${priorityCfg.badgeBg} ${priorityCfg.badgeText}`}
                      >
                        <priorityCfg.Icon className="h-3.5 w-3.5" />
                        Tingkat: {EMERGENCY_LEVEL_LABELS[level]}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">Hasil Diagnosis Awal AI</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                      {booking.aiAnalysis.possibleCondition}
                    </h3>
                  </div>
                  <div className="sm:text-right flex-shrink-0 bg-white/70 p-2.5 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Perkiraan Biaya
                    </p>
                    <p className="font-extrabold text-base text-slate-900 font-mono">
                      {booking.aiAnalysis.estimatedCostLabel}
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3">
                  {booking.aiAnalysis.reason}
                </p>

                <div className="flex items-start gap-2 p-3 bg-white/80 rounded-xl border border-slate-100 text-xs">
                  <span className="text-emerald-600 font-bold">💡 Saran Medis:</span>
                  <p className="text-slate-800 font-medium">{booking.aiAnalysis.recommendation}</p>
                </div>
              </div>
            )}

            {/* Doctors selection header */}
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Pilih Dokter Pemeriksa
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {filteredDoctors.length} dokter siap melayani
              </span>
            </div>

            {/* Doctors List */}
            <div className="space-y-4">
              {filteredDoctors.map((doctor) => {
                const specData = SPECIALIZATIONS.find((s) => s.id === doctor.specialization);
                const title = specData?.title ? `, ${specData.title}` : "";
                const isSelected = booking.doctor?.id === doctor.id;
                const availableDays = [
                  ...new Set(schedules.map((s) => DAYS_OF_WEEK[s.day_of_week])),
                ].join(", ");

                return (
                  <div
                    key={doctor.id}
                    className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs ${
                      isSelected
                        ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md"
                        : "border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
                    }`}
                  >
                    <div
                      className={`p-5 flex items-center justify-between gap-4 cursor-pointer ${
                        isSelected ? "bg-emerald-50/40" : ""
                      }`}
                      onClick={() => {
                        setBooking((prev) => ({
                          ...prev,
                          doctor,
                          date: undefined,
                          time: undefined,
                        }));
                      }}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                          DR
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                            Dr. {doctor.user?.full_name}
                            {title}
                          </h4>
                          <span className="inline-block text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full mt-0.5">
                            {doctor.specialization}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {doctor.years_experience} Tahun Pengalaman
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-slate-300"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    </div>

                    {/* Schedule & Slot Picker when selected */}
                    {isSelected && (
                      <div className="p-5 border-t border-slate-100 bg-white space-y-4">
                        <div className="p-3 bg-slate-50/80 rounded-xl text-xs">
                          <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                            Jadwal Praktik Dokter:
                          </span>
                          {loadingSchedules ? (
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <Loader2 className="w-3 h-3 animate-spin" /> Memuat ketersediaan...
                            </span>
                          ) : schedules.length > 0 ? (
                            <span className="font-bold text-slate-800">{availableDays}</span>
                          ) : (
                            <span className="text-rose-500 font-medium">
                              Belum ada jadwal praktik aktif untuk dokter ini.
                            </span>
                          )}
                        </div>

                        {/* Date Picker */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                            Pilih Tanggal Kunjungan:
                          </label>
                          <Input
                            type="date"
                            min={today}
                            value={booking.date || ""}
                            onChange={(e) => {
                              if (!isDateInPast(new Date(e.target.value))) {
                                setBooking((prev) => ({
                                  ...prev,
                                  date: e.target.value,
                                  time: undefined,
                                }));
                              }
                            }}
                            className="rounded-xl border-slate-200 text-xs sm:text-sm h-11"
                          />
                        </div>

                        {/* Time Slots */}
                        {booking.date && (
                          <div className="space-y-2 pt-2">
                            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-emerald-600" />
                              Pilih Jam / Slot Waktu:
                            </label>

                            {availableSlots.length === 0 ? (
                              <p className="p-4 bg-rose-50 text-rose-600 text-xs rounded-xl font-medium text-center">
                                Tidak ada slot jam praktik yang tersedia di tanggal ini. Silakan pilih hari lain.
                              </p>
                            ) : (
                              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                                {availableSlots.map((slot) => {
                                  const isTimeSelected = booking.time === slot;
                                  return (
                                    <button
                                      key={slot}
                                      type="button"
                                      onClick={() => setBooking((prev) => ({ ...prev, time: slot }))}
                                      className={`py-2 px-3 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                                        isTimeSelected
                                          ? "bg-emerald-600 text-white shadow-sm"
                                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80"
                                      }`}
                                    >
                                      {formatTime(slot)}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                          <Button
                            onClick={() => setStep(3)}
                            disabled={!booking.date || !booking.time}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold h-10 px-5 shadow-xs cursor-pointer"
                          >
                            Lanjut ke Konfirmasi <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
              className="rounded-xl text-xs border-slate-200"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Ubah Gejala
            </Button>
          </div>
        )}

        {/* ─── STEP 3: Review & Final Confirmation ─────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] space-y-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Rangkuman Janji Temu Pasien
              </h3>

              {booking.aiAnalysis && (
                <div className={`p-4 rounded-xl border ${priorityCfg.bg} ${priorityCfg.border}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${priorityCfg.badgeBg} ${priorityCfg.badgeText}`}
                    >
                      <priorityCfg.Icon className="h-3.5 w-3.5" /> {EMERGENCY_LEVEL_LABELS[level]}
                    </span>
                    <span className="font-extrabold text-sm text-slate-900 font-mono">
                      {booking.aiAnalysis.estimatedCostLabel}
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 text-sm">{booking.aiAnalysis.possibleCondition}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Dokter Pemeriksa
                  </span>
                  <p className="font-bold text-slate-900 text-sm">
                    Dr. {booking.doctor?.user?.full_name}
                  </p>
                  <p className="text-slate-500 mt-0.5">{booking.doctor?.specialization}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Waktu Konsultasi
                  </span>
                  <p className="font-bold text-slate-900 text-sm">
                    {booking.date ? formatDate(booking.date) : "-"}
                  </p>
                  <p className="text-emerald-700 font-mono font-bold mt-0.5">
                    Pukul {booking.time ? formatTime(booking.time) : "-"} WIB
                  </p>
                </div>
              </div>

              {booking.symptoms && (
                <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Keluhan Pasien:
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    &ldquo;{booking.symptoms}&rdquo;
                  </p>
                </div>
              )}

              {bookingError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                  {bookingError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="rounded-xl text-xs w-full sm:w-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Ubah Jadwal
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold h-11 px-8 w-full sm:w-auto shadow-sm cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Memproses Pemesanan...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Konfirmasi Janji Temu
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
