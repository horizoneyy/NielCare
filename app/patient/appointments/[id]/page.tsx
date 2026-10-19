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

const PRIORITY_CONFIG = {
  critical: {
    bg: "bg-red-50",
    border: "border-red-200",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
  },
  moderate: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
  },
  routine: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
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
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-72 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 h-72 bg-white rounded-xl border border-slate-200"></div>
            <div className="h-72 bg-white rounded-xl border border-slate-200"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
          <h2 className="text-lg font-bold text-slate-800">Data Janji Tidak Ditemukan</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            Janji temu mungkin telah dihapus atau Anda tidak memiliki hak akses untuk membukanya.
          </p>
          <Link href="/patient/appointments" className="mt-4">
            <Button size="sm" variant="outline" className="rounded-lg text-xs font-semibold">
              Kembali ke Daftar Janji Temu
            </Button>
          </Link>
        </div>
      </div>
    );
  }

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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header Section (Clean title, no top badge, no subtitle, no icons) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={appointment.status} />
              <EmergencyBadge level={appointment.emergency_level} label={aiAnalysis?.emergencyLevel ?? null} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {aiAnalysis?.possibleCondition || "Konsultasi Kesehatan Gigi"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {appointment.status === "pending" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={cancelling}
                className="border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-lg text-xs h-9 px-3.5"
              >
                {cancelling ? "Membatalkan..." : "Batalkan Janji"}
              </Button>
            )}
            <Link href="/patient/appointments">
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-lg text-xs h-9 px-3.5"
              >
                Kembali
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
          {/* Main Info Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Consultation Schedule & Doctor Card */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Jadwal &amp; Dokter Pemeriksa
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 mb-4">
                <div>
                  <span className="text-xs text-slate-500">Tanggal Janji Temu</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatDate(appointment.appointment_date)}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-slate-500">Waktu Kunjungan</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    Pukul {formatTime(appointment.slot_time)} WIB
                  </p>
                </div>
              </div>

              {/* Doctor Details */}
              <div className="pt-2">
                <span className="text-xs text-slate-500">Dokter Spesialis Gigi</span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  Dr. {appointment.doctor?.user?.full_name || "Dokter Gigi Praktik"}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Klinik Gigi NielCare Terakreditasi
                </p>
              </div>
            </div>

            {/* AI Clinical Triage Insight Card */}
            {aiAnalysis && (
              <div
                className={`rounded-xl p-6 border ${priorityCfg.border} ${priorityCfg.bg} shadow-xs`}
              >
                <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">Analisis Klinis AI</h3>
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold ${priorityCfg.badgeBg} ${priorityCfg.badgeText}`}
                  >
                    Prioritas {priorityLabel}
                  </span>
                </div>

                <div className="space-y-3">
                  {aiAnalysis.reason && (
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Interpretasi AI
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                        {aiAnalysis.reason}
                      </p>
                    </div>
                  )}

                  {aiAnalysis.recommendation && (
                    <div className="p-3 rounded-lg bg-white border border-emerald-200 text-emerald-950">
                      <p className="text-xs font-bold text-emerald-900">Rekomendasi Penanganan Awal</p>
                      <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                        {aiAnalysis.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Medical Record / Hasil Pemeriksaan */}
            {appointment.medical_record && (
              <div className="bg-white rounded-xl p-6 border border-emerald-200 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <h3 className="text-sm font-bold text-slate-900">Catatan Rekam Medis (EMR)</h3>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    Selesai Ditangani
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                      Diagnosis Dokter
                    </span>
                    <p className="text-sm text-slate-800 mt-1 font-medium bg-slate-50 p-3.5 rounded-lg border border-slate-100 leading-relaxed">
                      {appointment.medical_record.diagnosis_notes || "-"}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                      Tindakan Klinis
                    </span>
                    <p className="text-sm text-slate-800 mt-1 font-medium bg-slate-50 p-3.5 rounded-lg border border-slate-100 leading-relaxed">
                      {appointment.medical_record.treatment_given || "-"}
                    </p>
                  </div>

                  {appointment.medical_record.medications_prescribed && (
                    <div>
                      <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                        Resep Obat
                      </span>
                      <p className="text-sm text-slate-800 mt-1 font-medium bg-emerald-50/50 p-3.5 rounded-lg border border-emerald-100 leading-relaxed">
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

          {/* Right Column */}
          <div className="space-y-6">
            {/* Symptoms Card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Keluhan yang Diberikan
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-100 leading-relaxed italic">
                &ldquo;{appointment.symptom_description || "Tidak ada rincian keluhan tambahan."}&rdquo;
              </p>
            </div>

            {/* Estimated Cost Card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 mb-3">Perkiraan Biaya</h4>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Rentang Perkiraan
                </span>
                <p className="text-base sm:text-lg font-bold text-emerald-700 mt-0.5 font-mono">
                  {aiAnalysis?.estimatedCostLabel || "Rp 150.000 – Rp 350.000"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  * Biaya akhir disesuaikan dengan tindakan nyata dan obat yang diberikan dokter di ruang periksa.
                </p>
              </div>
            </div>

            {/* Clinic Contact Info Card (Solid light background, no dark color) */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs text-emerald-950">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                Butuh Bantuan Janji?
              </h4>
              <p className="text-xs text-emerald-800 leading-relaxed mb-3">
                Jika ada kendala keterlambatan atau darurat sakit gigi, hubungi resepsionis kami.
              </p>
              <div className="text-xs font-medium text-emerald-900 space-y-0.5">
                <p>Klinik Gigi NielCare Center</p>
                <p>Emergency: (021) 555-0199</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
