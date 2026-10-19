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
    if (!confirm("Are you sure you want to cancel this scheduled appointment?")) return;
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
      console.error("Failed to cancel appointment:", err);
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
          <h2 className="text-lg font-bold text-slate-800">Appointment Not Found</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            The appointment may have been cancelled or you do not have permission to view it.
          </p>
          <Link href="/patient/appointments" className="mt-4">
            <Button size="sm" variant="outline" className="rounded-lg text-xs font-semibold">
              Back to Appointments List
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
                {cancelling ? "Cancelling..." : "Cancel Appointment"}
              </Button>
            )}
            <Link href="/patient/appointments">
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-lg text-xs h-9 px-3.5"
              >
                Back
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
                Schedule &amp; Attending Doctor
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 border border-slate-100 mb-4">
                <div>
                  <span className="text-xs text-slate-500">Appointment Date</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatDate(appointment.appointment_date)}
                  </p>
                </div>

                <div>
                  <span className="text-xs text-slate-500">Visit Time</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatTime(appointment.slot_time)}
                  </p>
                </div>
              </div>

              {/* Doctor Details */}
              <div className="pt-2">
                <span className="text-xs text-slate-500">Dental Specialist</span>
                <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                  Dr. {appointment.doctor?.user?.full_name || "Attending Dentist"}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  NielCare Accredited Dental Clinic
                </p>
              </div>
            </div>

            {/* AI Clinical Triage Insight Card */}
            {aiAnalysis && (
              <div
                className={`rounded-xl p-6 border ${priorityCfg.border} ${priorityCfg.bg} shadow-xs`}
              >
                <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-900">AI Clinical Triage Analysis</h3>
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-bold ${priorityCfg.badgeBg} ${priorityCfg.badgeText}`}
                  >
                    Priority: {priorityLabel}
                  </span>
                </div>

                <div className="space-y-3">
                  {aiAnalysis.reason && (
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        AI Clinical Interpretation
                      </span>
                      <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                        {aiAnalysis.reason}
                      </p>
                    </div>
                  )}

                  {aiAnalysis.recommendation && (
                    <div className="p-3 rounded-lg bg-white border border-emerald-200 text-emerald-950">
                      <p className="text-xs font-bold text-emerald-900">Initial Care Recommendation</p>
                      <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                        {aiAnalysis.recommendation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Medical Record / Examination Results */}
            {appointment.medical_record && (
              <div className="bg-white rounded-xl p-6 border border-emerald-200 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                  <h3 className="text-sm font-bold text-slate-900">Electronic Medical Record (EMR)</h3>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    Completed
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                      Doctor Diagnosis
                    </span>
                    <p className="text-sm text-slate-800 mt-1 font-medium bg-slate-50 p-3.5 rounded-lg border border-slate-100 leading-relaxed">
                      {appointment.medical_record.diagnosis_notes || "-"}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                      Clinical Treatment
                    </span>
                    <p className="text-sm text-slate-800 mt-1 font-medium bg-slate-50 p-3.5 rounded-lg border border-slate-100 leading-relaxed">
                      {appointment.medical_record.treatment_given || "-"}
                    </p>
                  </div>

                  {appointment.medical_record.medications_prescribed && (
                    <div>
                      <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                        Prescription Medication
                      </span>
                      <p className="text-sm text-slate-800 mt-1 font-medium bg-emerald-50/50 p-3.5 rounded-lg border border-emerald-100 leading-relaxed">
                        {appointment.medical_record.medications_prescribed}
                      </p>
                    </div>
                  )}

                  {appointment.medical_record.treatment_cost != null && (
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-600">Total Treatment Cost:</span>
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
                Patient Symptoms Reported
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-100 leading-relaxed italic">
                &ldquo;{appointment.symptom_description || "No additional symptom details provided."}&rdquo;
              </p>
            </div>

            {/* Estimated Cost Card */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <h4 className="text-xs font-bold text-slate-900 mb-3">Estimated Treatment Cost</h4>

              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Estimated Range
                </span>
                <p className="text-base sm:text-lg font-bold text-emerald-700 mt-0.5 font-mono">
                  {aiAnalysis?.estimatedCostLabel || "Rp 150,000 – Rp 350,000"}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  * Final cost will be adjusted based on clinical procedures and prescribed medication during consultation.
                </p>
              </div>
            </div>

            {/* Clinic Contact Info Card */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 shadow-xs text-emerald-950">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-900 mb-1">
                Need Assistance?
              </h4>
              <p className="text-xs text-emerald-800 leading-relaxed mb-3">
                For schedule adjustments or dental emergencies, please reach out to our reception team.
              </p>
              <div className="text-xs font-medium text-emerald-900 space-y-0.5">
                <p>NielCare Dental Center</p>
                <p>Emergency: (021) 555-0199</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
