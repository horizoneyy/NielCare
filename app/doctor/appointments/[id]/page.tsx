"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Sidebar } from "@/components/shared/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge, EmergencyBadge } from "@/components/shared/StatusBadge";
import { EmergencyBanner } from "@/components/shared/EmergencyBanner";
import { formatDate, formatTime, formatCurrency, formatNumber } from "@/lib/utils/formatters";
import { EMERGENCY_LEVEL_LABELS } from "@/types";
import type { Appointment, MedicalRecord } from "@/types";
import {
  Loader2,
  ArrowLeft,
  Check,
  X,
  FileText,
  Brain,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  User,
  Stethoscope,
  Pill,
  Receipt,
  CheckCircle2,
  XCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

// Parse min/max from estimatedCostLabel like "Rp 300.000 – Rp 600.000"
function parseEstimatedRange(label: string | undefined): { min: number; max: number } | null {
  if (!label) return null;
  const numbers = label.replace(/\./g, "").match(/\d+/g);
  if (!numbers || numbers.length < 2) return null;
  return { min: parseInt(numbers[0]), max: parseInt(numbers[1]) };
}

function CostWarning({ cost, aiLabel }: { cost: number; aiLabel?: string }) {
  const range = parseEstimatedRange(aiLabel);
  if (!range || !cost) return null;

  if (cost > range.max) {
    const excess = formatCurrency(cost - range.max);
    return (
      <div className="flex items-start gap-2.5 p-3 bg-amber-50/90 border border-amber-200 rounded-xl mt-2 text-amber-900">
        <TrendingUp className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-800">Biaya Melebihi Estimasi AI</p>
          <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
            Biaya yang dimasukkan <strong>{formatCurrency(cost)}</strong> melebihi batas atas estimasi AI (
            <strong>{aiLabel}</strong>) sebesar <strong>{excess}</strong>.
          </p>
        </div>
      </div>
    );
  }
  if (cost < range.min) {
    const diff = formatCurrency(range.min - cost);
    return (
      <div className="flex items-start gap-2.5 p-3 bg-blue-50/90 border border-blue-200 rounded-xl mt-2 text-blue-900">
        <TrendingDown className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-blue-800">Biaya Di Bawah Estimasi AI</p>
          <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
            Biaya yang dimasukkan <strong>{formatCurrency(cost)}</strong> berada di bawah batas bawah estimasi AI (
            <strong>{aiLabel}</strong>) sebesar <strong>{diff}</strong>.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl mt-2">
      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
      <p className="text-xs font-semibold text-emerald-700">Biaya sesuai dengan perkiraan rentang AI klinis ✓</p>
    </div>
  );
}

export default function DoctorAppointmentDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [appointment, setAppointment] = useState<(Appointment & { medical_record?: MedicalRecord }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [record, setRecord] = useState({
    diagnosis_notes: "",
    treatment_given: "",
    medications_prescribed: "",
    treatment_cost: "",
  });

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/appointments/${id}`);
        if (res.ok) {
          const data = await res.json();
          setAppointment(data);
          if (data.medical_record) {
            setRecord({
              diagnosis_notes: data.medical_record.diagnosis_notes || "",
              treatment_given: data.medical_record.treatment_given || "",
              medications_prescribed: data.medical_record.medications_prescribed || "",
              treatment_cost:
                data.medical_record.treatment_cost != null
                  ? formatNumber(data.medical_record.treatment_cost)
                  : "",
            });
          } else {
            // Pre-fill treatment_cost from AI estimate
            try {
              const ai = data.ai_analysis_result
                ? typeof data.ai_analysis_result === "string"
                  ? JSON.parse(data.ai_analysis_result)
                  : data.ai_analysis_result
                : null;
              if (ai?.estimatedCost) {
                setRecord((prev) => ({ ...prev, treatment_cost: formatNumber(ai.estimatedCost) }));
              }
            } catch {
              /* ignore */
            }
          }
        }
      } catch (err) {
        console.error("Gagal mengambil detail janji temu:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [id]);

  const updateStatus = async (status: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setAppointment((prev) => (prev ? { ...prev, status: status as Appointment["status"] } : null));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const saveRecord = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "done",
          diagnosis_notes: record.diagnosis_notes,
          treatment_given: record.treatment_given,
          medications_prescribed: record.medications_prescribed || null,
          treatment_cost: record.treatment_cost ? parseInt(record.treatment_cost.replace(/\D/g, ""), 10) : 0,
        }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        alert(`Gagal menyimpan: ${errorData.error || "Terjadi kesalahan"}`);
        setSaving(false);
        return;
      }
      setAppointment((prev) => (prev ? { ...prev, status: "done" } : null));
      router.refresh();
    } catch (e) {
      alert("Gagal menghubungi server. Periksa koneksi internet Anda.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60">
        <Sidebar />
        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-6 bg-slate-200/80 rounded w-48 mb-4"></div>
          <div className="h-10 bg-slate-200/60 rounded-xl w-72 mb-6"></div>
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
            Janji temu mungkin telah dipindahkan atau data tidak dapat dimuat.
          </p>
          <Link href="/doctor/appointments" className="mt-4">
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
  const priorityLabel = EMERGENCY_LEVEL_LABELS[level] || "Rutin";
  const appointmentTitle =
    aiAnalysis?.possibleCondition || appointment.symptom_description?.slice(0, 50) || "Pemeriksaan Gigi";
  const costValue = parseInt((record.treatment_cost || "").replace(/\D/g, ""), 10) || 0;

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4 font-medium">
          <Link href="/doctor/dashboard" className="hover:text-slate-600 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <Link href="/doctor/appointments" className="hover:text-slate-600 transition-colors">
            Janji Temu
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-700 font-semibold truncate max-w-[200px]">
            {appointment.patient?.full_name || "Pasien"}
          </span>
        </div>

        {/* Top Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={appointment.status} />
              <EmergencyBadge level={appointment.emergency_level} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {appointmentTitle}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pasien: <strong className="text-slate-800">{appointment.patient?.full_name}</strong> • ID:{" "}
              <span className="font-mono text-slate-600">{appointment.id.slice(0, 8)}</span>
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {appointment.status === "pending" && (
              <>
                <Button
                  onClick={() => updateStatus("approved")}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-xs h-10 px-4 shadow-sm transition-all cursor-pointer"
                >
                  <Check className="h-4 w-4 mr-1.5" /> Setujui Kunjungan
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateStatus("rejected")}
                  disabled={saving}
                  className="border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-xl text-xs h-10 px-4 transition-all cursor-pointer"
                >
                  <X className="h-4 w-4 mr-1.5" /> Tolak
                </Button>
              </>
            )}

            <Link href="/doctor/appointments">
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-xl text-xs h-10 px-4 shadow-xs transition-all cursor-pointer"
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
          {/* Main Column (2 cols) */}
          <div className="md:col-span-2 space-y-6">
            {/* Patient & Consultation Summary Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> Informasi Jadwal &amp; Pasien
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-xl bg-slate-50/80 border border-slate-100 mb-4">
                <div>
                  <span className="text-[11px] font-medium text-slate-400">Nama Pasien</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {appointment.patient?.full_name || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400">Tanggal Kunjungan</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatDate(appointment.appointment_date)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400">Jam Praktik</span>
                  <p className="text-sm font-bold text-blue-700 mt-0.5">
                    {formatTime(appointment.slot_time)} WIB
                  </p>
                </div>
              </div>

              {appointment.symptom_description && (
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Keluhan Mandiri Pasien
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 mt-1 leading-relaxed">
                    &ldquo;{appointment.symptom_description}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* AI Clinical Triage Insight */}
            {aiAnalysis && (
              <div className="bg-gradient-to-br from-indigo-50/80 via-blue-50/60 to-white rounded-2xl p-6 border border-blue-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between pb-3 border-b border-blue-100/70 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-white shadow-xs text-blue-600">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Hasil Triage AI Klinis</h3>
                      <p className="text-[11px] text-slate-500">Evaluasi otomatis Gemini / NVAPI</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Kategori: {priorityLabel}
                  </span>
                </div>

                <div className="space-y-3">
                  {aiAnalysis.reason && (
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Indikasi Awal
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 mt-1 bg-white/90 p-3 rounded-xl border border-blue-100/80 leading-relaxed">
                        {aiAnalysis.reason}
                      </p>
                    </div>
                  )}

                  {aiAnalysis.recommendation && (
                    <div className="p-3 bg-white/90 border border-blue-100/80 rounded-xl text-xs text-slate-700">
                      <strong className="text-blue-900 block mb-0.5">Saran Penanganan:</strong>
                      {aiAnalysis.recommendation}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Treatment Form (only when approved & no record yet) */}
            {appointment.status === "approved" && !appointment.medical_record && (
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
                <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 mb-5">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Catat Rekam Medis (EMR)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Lengkapi diagnosis, tindakan, dan resep obat setelah pemeriksaan selesai
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>
                        Catatan Diagnosis <span className="text-red-500">*</span>
                      </span>
                      <span className="text-[11px] font-normal text-slate-400">Temuan klinis dokter</span>
                    </Label>
                    <Textarea
                      value={record.diagnosis_notes}
                      onChange={(e) => setRecord((p) => ({ ...p, diagnosis_notes: e.target.value }))}
                      placeholder="Contoh: Pulpitis ireversibel gigi 36 disertai karies profunda..."
                      className="rounded-xl border-slate-200 text-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span>
                        Tindakan Klinis yang Dilakukan <span className="text-red-500">*</span>
                      </span>
                      <span className="text-[11px] font-normal text-slate-400">Prosedur dental</span>
                    </Label>
                    <Textarea
                      value={record.treatment_given}
                      onChange={(e) => setRecord((p) => ({ ...p, treatment_given: e.target.value }))}
                      placeholder="Contoh: Pembersihan kavitas, aplikasi dressing eugenol, dan tambalan sementara..."
                      className="rounded-xl border-slate-200 text-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">
                        Resep Obat (Opsional)
                      </Label>
                      <Input
                        value={record.medications_prescribed}
                        onChange={(e) =>
                          setRecord((p) => ({ ...p, medications_prescribed: e.target.value }))
                        }
                        placeholder="Contoh: Amoxicillin 500mg 3x1, Asam Mefenamat 500mg..."
                        className="rounded-xl border-slate-200 text-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                        <span>Biaya Tindakan (Rp)</span>
                        {aiAnalysis?.estimatedCostLabel && (
                          <span className="text-[11px] font-normal text-blue-600">
                            Est AI: {aiAnalysis.estimatedCostLabel}
                          </span>
                        )}
                      </Label>
                      <Input
                        type="text"
                        value={record.treatment_cost}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          if (!digits) {
                            setRecord((p) => ({ ...p, treatment_cost: "" }));
                            return;
                          }
                          const num = parseInt(digits, 10);
                          setRecord((p) => ({ ...p, treatment_cost: formatNumber(num) }));
                        }}
                        placeholder={
                          aiAnalysis?.estimatedCost ? formatNumber(aiAnalysis.estimatedCost) : "0"
                        }
                        className="rounded-xl border-slate-200 text-sm focus:border-blue-500 focus:ring-blue-500 font-mono"
                      />
                      {costValue > 0 && aiAnalysis?.estimatedCostLabel && (
                        <CostWarning cost={costValue} aiLabel={aiAnalysis.estimatedCostLabel} />
                      )}
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={saveRecord}
                      disabled={saving || !record.diagnosis_notes || !record.treatment_given}
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-xs h-10 px-6 shadow-sm transition-all cursor-pointer"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Menyimpan Rekam Medis...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Selesaikan Pemeriksaan &amp; Simpan EMR
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Existing Medical Record (View Mode) */}
            {appointment.medical_record && (
              <div className="bg-white rounded-2xl p-6 border border-emerald-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Rekam Medis Pasien Terverifikasi
                      </h3>
                      <p className="text-xs text-slate-500">Tersimpan dalam database EMR klinik</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Selesai Dirawat
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      Diagnosis Dokter
                    </span>
                    <p className="text-sm text-slate-800 mt-1 font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                      {appointment.medical_record.diagnosis_notes}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                      Tindakan Medis
                    </span>
                    <p className="text-sm text-slate-800 mt-1 font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-100 leading-relaxed">
                      {appointment.medical_record.treatment_given}
                    </p>
                  </div>

                  {appointment.medical_record.medications_prescribed && (
                    <div>
                      <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1">
                        <Pill className="w-3.5 h-3.5 text-blue-600" /> Resep Obat
                      </span>
                      <p className="text-sm text-slate-800 mt-1 font-medium bg-blue-50/40 p-3.5 rounded-xl border border-blue-100/70 leading-relaxed">
                        {appointment.medical_record.medications_prescribed}
                      </p>
                    </div>
                  )}

                  {appointment.medical_record.treatment_cost != null && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Total Biaya Tindakan:</span>
                      <span className="text-lg font-extrabold text-slate-900 font-mono">
                        {formatCurrency(appointment.medical_record.treatment_cost)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column (Sidebar Cards) */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" /> Status Pasien
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Status Janji:</span>
                  <StatusBadge status={appointment.status} />
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Tingkat Urgensi:</span>
                  <EmergencyBadge level={appointment.emergency_level} />
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-800 font-medium truncate max-w-[150px]">
                    {appointment.patient?.email || "-"}
                  </span>
                </div>
              </div>

              {appointment.status === "pending" && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col gap-2">
                  <Button
                    onClick={() => updateStatus("approved")}
                    disabled={saving}
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                  >
                    Setujui Janji Temu
                  </Button>
                  <Button
                    onClick={() => updateStatus("rejected")}
                    disabled={saving}
                    size="sm"
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold"
                  >
                    Tolak Permintaan
                  </Button>
                </div>
              )}
            </div>

            {/* AI Cost Reference Benchmark */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Perkiraan Biaya AI</h4>
                  <p className="text-[10px] text-slate-400">Kalkulasi patokan tarif klinik</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Estimasi AI Triage
                </span>
                <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 font-mono">
                  {aiAnalysis?.estimatedCostLabel || "Rp 150.000 – Rp 350.000"}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Dokter berwenang mengubah angka final sesuai kondisi klinis dan obat yang diberikan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
