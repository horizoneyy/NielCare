"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/shared/Sidebar";
import { StatusBadge, EmergencyBadge } from "@/components/shared/StatusBadge";
import { EmergencyBanner } from "@/components/shared/EmergencyBanner";
import { formatDate, formatTime, formatCurrency } from "@/lib/utils/formatters";
import { EMERGENCY_LEVEL_LABELS } from "@/types";
import { Button } from "@/components/ui/button";
import type { Appointment, MedicalRecord } from "@/types";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Stethoscope,
  FileText,
  Brain,
  Siren,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Pill,
  Receipt,
  User,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const PRIORITY_CONFIG = {
  critical: {
    bg: "bg-red-50/70",
    border: "border-red-200",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
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
    bg: "bg-blue-50/70",
    border: "border-blue-200",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    Icon: CheckCircle2,
  },
};

export default function PatientAppointmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<(Appointment & { medical_record?: MedicalRecord }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/appointments/${id}`);
        if (res.ok) {
          const data = await res.json();
          setAppointment(data);
        }
      } catch (err) {
        console.error("Failed to load appointment details:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  const handleCancel = async () => {
    if (!confirm("Apakah Anda yakin ingin membatalkan jadwal janji temu ini?")) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) {
        setAppointment((prev) => (prev ? { ...prev, status: "cancelled" } : null));
      }
    } catch (err) {
      console.error("Gagal membatalkan janji temu:", err);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60">
        <Sidebar />
        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-6 bg-slate-200/80 rounded w-48 mb-4"></div>
          <div className="h-10 bg-slate-200/60 rounded-xl w-80 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-72 bg-white rounded-2xl border border-slate-200/80"></div>
            <div className="h-72 bg-white rounded-2xl border border-slate-200/80"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-slate-50/60">
        <Sidebar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
            <Calendar className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Data Janji Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Janji temu mungkin telah dihapus atau Anda tidak memiliki hak akses untuk membukanya.
          </p>
          <Link href="/patient/appointments" className="mt-4">
            <Button size="sm" variant="outline" className="rounded-xl text-xs font-semibold">
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Kembali ke Daftar Janji Temu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Parse AI analysis
  let aiAnalysis: any = null;
  try {
    if (appointment.ai_analysis_result) {
      aiAnalysis =
        typeof appointment.ai_analysis_result === "string"
          ? JSON.parse(appointment.ai_analysis_result)
          : appointment.ai_analysis_result;
    }
  } catch {
    aiAnalysis = null;
  }

  const level = appointment.emergency_level || "routine";
  const priorityCfg = PRIORITY_CONFIG[level] || PRIORITY_CONFIG.routine;
  const priorityLabel = EMERGENCY_LEVEL_LABELS[level] || "Rutin";

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4 font-medium">
          <Link href="/patient/dashboard" className="hover:text-slate-600 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <Link href="/patient/appointments" className="hover:text-slate-600 transition-colors">
            Janji Temu
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-700 font-semibold truncate max-w-[200px]">
            #{appointment.id.slice(0, 8)}
          </span>
        </div>

        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={appointment.status} />
              <EmergencyBadge level={appointment.emergency_level} label={aiAnalysis?.emergencyLevel ?? null} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {aiAnalysis?.possibleCondition || "Konsultasi Kesehatan Gigi"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              ID Reservasi: <span className="font-mono font-medium text-slate-700">{appointment.id}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            {appointment.status === "pending" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={cancelling}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-medium rounded-xl text-xs h-9 px-3.5 transition-all cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                {cancelling ? "Membatalkan..." : "Batalkan Janji"}
              </Button>
            )}
            <Link href="/patient/appointments">
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-xl text-xs h-9 px-3.5 shadow-xs transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Kembali
              </Button>
            </Link>
          </div>
        </div>

        {appointment.emergency_level === "critical" && (
          <div className="mb-6">
            <EmergencyBanner />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info Column (Left 2 cols) */}
          <div className="md:col-span-2 space-y-6">
            {/* Consultation Schedule & Doctor Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Jadwal &amp; Dokter Pemeriksa
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50/70 border border-slate-100 mb-5">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex-shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-slate-400">Tanggal Janji Temu</span>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                      {formatDate(appointment.appointment_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-slate-400">Waktu Kunjungan</span>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">
                      Pukul {formatTime(appointment.slot_time)} WIB
                    </p>
                  </div>
                </div>
              </div>

              {/* Doctor Details */}
              <div className="flex items-center gap-3.5 pt-2">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/60 flex items-center justify-center text-emerald-700 font-bold flex-shrink-0">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-medium text-slate-400">Dokter Spesialis Gigi</span>
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    Dr. {appointment.doctor?.user?.full_name || "Dokter Gigi Praktik"}
                  </h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Klinik Gigi NielCare Terakreditasi
                  </p>
                </div>
              </div>
            </div>

            {/* AI Clinical Triage Insight Card */}
            {aiAnalysis && (
              <div
                className={`rounded-2xl p-6 border ${priorityCfg.border} ${priorityCfg.bg} shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]`}
              >
                <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-white shadow-xs text-indigo-600">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Analisis Klinis AI</h3>
                      <p className="text-[11px] text-slate-500">Hasil Triage Cerdas NielCare</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${priorityCfg.badgeBg} ${priorityCfg.badgeText}`}
                  >
                    <priorityCfg.Icon className="w-3.5 h-3.5" />
                    Prioritas {priorityLabel}
                  </span>
                </div>

                <div className="space-y-3.5">
                  {aiAnalysis.reason && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Interpretasi AI
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed bg-white/80 p-3.5 rounded-xl border border-slate-200/60">
                        {aiAnalysis.reason}
                      </p>
                    </div>
                  )}

                  {aiAnalysis.recommendation && (
                    <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950">
                      <Sparkles className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-emerald-900">Rekomendasi Penanganan Awal</p>
                        <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                          {aiAnalysis.recommendation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Medical Record / Hasil Pemeriksaan (if available) */}
            {appointment.medical_record && (
              <div className="bg-white rounded-2xl p-6 border border-emerald-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Catatan Rekam Medis (EMR)</h3>
                      <p className="text-[11px] text-slate-500">Hasil diagnosis &amp; resep dokter</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Selesai Ditangani
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      Diagnosis Dokter
                    </span>
                    <p className="text-sm text-slate-800 mt-1 font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                      {appointment.medical_record.diagnosis_notes || "-"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      Tindakan Klinis
                    </span>
                    <p className="text-sm text-slate-800 mt-1 font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                      {appointment.medical_record.treatment_given || "-"}
                    </p>
                  </div>

                  {appointment.medical_record.medications_prescribed && (
                    <div>
                      <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                        <Pill className="w-3.5 h-3.5 text-emerald-600" /> Resep Obat
                      </span>
                      <p className="text-sm text-slate-800 mt-1 font-medium bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100/70 leading-relaxed">
                        {appointment.medical_record.medications_prescribed}
                      </p>
                    </div>
                  )}

                  {appointment.medical_record.treatment_cost != null && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Total Biaya Perawatan:</span>
                      <span className="text-lg font-extrabold text-emerald-700 font-mono">
                        {formatCurrency(appointment.medical_record.treatment_cost)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column / Sidebar Info */}
          <div className="space-y-6">
            {/* Symptoms / Keluhan Pasien Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" /> Keluhan yang Diberikan
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 leading-relaxed italic">
                &ldquo;{appointment.symptom_description || "Tidak ada rincian keluhan tambahan."}&rdquo;
              </p>
            </div>

            {/* Estimated Cost Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Perkiraan Biaya</h4>
                  <p className="text-[10px] text-slate-400">Estimasi berbasis AI Triage</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Rentang Perkiraan
                </span>
                <p className="text-base sm:text-lg font-bold text-emerald-700 mt-0.5 font-mono">
                  {aiAnalysis?.estimatedCostLabel || "Rp 150.000 – Rp 350.000"}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  * Biaya akhir disesuaikan dengan tindakan nyata dan obat yang diberikan dokter di ruang periksa.
                </p>
              </div>
            </div>

            {/* Help / Clinic Contact Info Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1">
                Butuh Bantuan Janji?
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Jika ada kendala keterlambatan atau darurat sakit gigi hebat, hubungi resepsionis kami.
              </p>
              <div className="text-xs font-medium text-emerald-400 space-y-1">
                <p>📍 NielCare Dental Clinic Center</p>
                <p>📞 Emergency: (021) 555-0199</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
