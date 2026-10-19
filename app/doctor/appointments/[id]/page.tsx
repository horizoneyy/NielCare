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
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mt-2 text-amber-900 text-xs">
        <p className="font-bold">Biaya Melebihi Estimasi AI</p>
        <p className="mt-0.5 leading-relaxed">
          Biaya yang dimasukkan <strong>{formatCurrency(cost)}</strong> melebihi batas atas estimasi AI (
          <strong>{aiLabel}</strong>) sebesar <strong>{excess}</strong>.
        </p>
      </div>
    );
  }
  if (cost < range.min) {
    const diff = formatCurrency(range.min - cost);
    return (
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mt-2 text-blue-900 text-xs">
        <p className="font-bold">Biaya Di Bawah Estimasi AI</p>
        <p className="mt-0.5 leading-relaxed">
          Biaya yang dimasukkan <strong>{formatCurrency(cost)}</strong> berada di bawah batas bawah estimasi AI (
          <strong>{aiLabel}</strong>) sebesar <strong>{diff}</strong>.
        </p>
      </div>
    );
  }
  return (
    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg mt-2 text-xs">
      <p className="font-semibold text-emerald-700">Biaya sesuai dengan perkiraan rentang AI klinis ✓</p>
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
            Janji temu mungkin telah dipindahkan atau data tidak dapat dimuat.
          </p>
          <Link href="/doctor/appointments" className="mt-4">
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
  const priorityLabel = EMERGENCY_LEVEL_LABELS[level] || "Rutin";
  const appointmentTitle =
    aiAnalysis?.possibleCondition || appointment.symptom_description?.slice(0, 50) || "Pemeriksaan Gigi";
  const costValue = parseInt((record.treatment_cost || "").replace(/\D/g, ""), 10) || 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header (Clean title, no top badge, no subtitle, no icons) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <StatusBadge status={appointment.status} />
              <EmergencyBadge level={appointment.emergency_level} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {appointmentTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            {appointment.status === "pending" && (
              <>
                <Button
                  onClick={() => updateStatus("approved")}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs h-10 px-4"
                >
                  Setujui Kunjungan
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateStatus("rejected")}
                  disabled={saving}
                  className="border-red-200 text-red-600 hover:bg-red-50 font-medium rounded-lg text-xs h-10 px-4"
                >
                  Tolak
                </Button>
              </>
            )}

            <Link href="/doctor/appointments">
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-lg text-xs h-10 px-4"
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
          {/* Main Column */}
          <div className="md:col-span-2 space-y-6">
            {/* Patient & Consultation Summary Card */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
                Informasi Jadwal &amp; Pasien
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 rounded-lg bg-slate-50 border border-slate-100 mb-4">
                <div>
                  <span className="text-xs text-slate-500">Nama Pasien</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {appointment.patient?.full_name || "-"}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Tanggal Kunjungan</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatDate(appointment.appointment_date)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Jam Praktik</span>
                  <p className="text-sm font-bold text-blue-700 mt-0.5">
                    {formatTime(appointment.slot_time)} WIB
                  </p>
                </div>
              </div>

              {appointment.symptom_description && (
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Keluhan Mandiri Pasien
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-100 mt-1 leading-relaxed">
                    &ldquo;{appointment.symptom_description}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* AI Clinical Triage Insight */}
            {aiAnalysis && (
              <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-200 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-blue-100 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Hasil Triage AI Klinis</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-blue-100 text-blue-800">
                    Kategori: {priorityLabel}
                  </span>
                </div>

                <div className="space-y-3">
                  {aiAnalysis.reason && (
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Indikasi Awal
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 mt-1 bg-white p-3 rounded-lg border border-blue-100 leading-relaxed">
                        {aiAnalysis.reason}
                      </p>
                    </div>
                  )}

                  {aiAnalysis.recommendation && (
                    <div className="p-3 bg-white border border-blue-100 rounded-lg text-xs text-slate-700">
                      <strong className="text-blue-900 block mb-0.5">Saran Penanganan:</strong>
                      {aiAnalysis.recommendation}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Treatment Form */}
            {appointment.status === "approved" && !appointment.medical_record && (
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
                <div className="pb-4 border-b border-slate-100 mb-5">
                  <h3 className="text-base font-bold text-slate-900">Catat Rekam Medis (EMR)</h3>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">
                      Catatan Diagnosis <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={record.diagnosis_notes}
                      onChange={(e) => setRecord((p) => ({ ...p, diagnosis_notes: e.target.value }))}
                      placeholder="Contoh: Pulpitis ireversibel gigi 36..."
                      className="rounded-lg border-slate-200 text-sm focus:border-blue-500"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-700">
                      Tindakan Klinis yang Dilakukan <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      value={record.treatment_given}
                      onChange={(e) => setRecord((p) => ({ ...p, treatment_given: e.target.value }))}
                      placeholder="Contoh: Pembersihan kavitas, tambalan sementara..."
                      className="rounded-lg border-slate-200 text-sm focus:border-blue-500"
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
                        placeholder="Contoh: Amoxicillin 500mg, Asam Mefenamat..."
                        className="rounded-lg border-slate-200 text-sm focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-slate-700">
                        Biaya Tindakan (Rp)
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
                        className="rounded-lg border-slate-200 text-sm focus:border-blue-500 font-mono"
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
                      className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs h-10 px-6"
                    >
                      {saving ? "Menyimpan Rekam Medis..." : "Selesaikan Pemeriksaan & Simpan EMR"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Existing Medical Record */}
            {appointment.medical_record && (
              <div className="bg-white rounded-xl p-6 border border-emerald-200 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <h3 className="text-base font-bold text-slate-900">
                    Rekam Medis Pasien Terverifikasi
                  </h3>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    Selesai Dirawat
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                      Diagnosis Dokter
                    </span>
                    <p className="text-sm text-slate-800 mt-1 font-medium bg-slate-50 p-3.5 rounded-lg border border-slate-100 leading-relaxed">
                      {appointment.medical_record.diagnosis_notes}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                      Tindakan Medis
                    </span>
                    <p className="text-sm text-slate-800 mt-1 font-medium bg-slate-50 p-3.5 rounded-lg border border-slate-100 leading-relaxed">
                      {appointment.medical_record.treatment_given}
                    </p>
                  </div>

                  {appointment.medical_record.medications_prescribed && (
                    <div>
                      <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                        Resep Obat
                      </span>
                      <p className="text-sm text-slate-800 mt-1 font-medium bg-blue-50/40 p-3.5 rounded-lg border border-blue-100 leading-relaxed">
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

          {/* Right Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Status Pasien
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
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Setujui Janji Temu
                  </Button>
                  <Button
                    onClick={() => updateStatus("rejected")}
                    disabled={saving}
                    size="sm"
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold"
                  >
                    Tolak Permintaan
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 mb-3">Perkiraan Biaya AI</h4>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Estimasi AI Triage
                </span>
                <p className="text-base sm:text-lg font-bold text-slate-900 mt-0.5 font-mono">
                  {aiAnalysis?.estimatedCostLabel || "Rp 150.000 – Rp 350.000"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Dokter berwenang mengubah angka final sesuai kondisi klinis dan tindakan nyata.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
