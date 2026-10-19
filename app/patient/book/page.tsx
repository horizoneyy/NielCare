"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils/formatters";
import { generateTimeSlots, filterPastSlots, filterBookedSlots, isDateInPast, getDayOfWeek } from "@/lib/utils/timeSlots";
import { EMERGENCY_LEVEL_LABELS } from "@/types";
import type { Doctor, DoctorSchedule, BookingState, AIAnalysisResult } from "@/types";

const SPECIALIZATIONS = [
  { id: "General Dentist", label: "General Dentist", title: "" },
  { id: "Orthodontist", label: "Orthodontist", title: "Sp.Ort" },
  { id: "Periodontist", label: "Periodontist", title: "Sp.Perio" },
  { id: "Endodontist", label: "Endodontist", title: "Sp.KG" },
  { id: "Prosthodontist", label: "Prosthodontist", title: "Sp.Pros" },
  { id: "Oral Surgeon", label: "Oral Surgeon", title: "Sp.BM" },
  { id: "Pediatric Dentist", label: "Pediatric Dentist", title: "Sp.KGA" },
];

const PRIORITY_CONFIG = {
  critical: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    badgeBg: "bg-rose-100",
    badgeText: "text-rose-700",
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

export default function BookAppointmentPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState<BookingState>({
    step: 1,
    emergencyLevel: "routine",
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [symptomError, setSymptomError] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    async function loadDoctors() {
      setLoadingDoctors(true);
      try {
        const res = await fetch("/api/doctors");
        if (res.ok) {
          const data = await res.json();
          setDoctors(data);
          setFilteredDoctors(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDoctors(false);
      }
    }
    loadDoctors();
  }, []);

  const handleAnalyzeSymptoms = async () => {
    if (!booking.symptoms || booking.symptoms.trim().length < 10) {
      setSymptomError("Please describe your symptoms with at least 10 characters.");
      return;
    }
    setSymptomError("");
    setAnalyzing(true);

    try {
      const res = await fetch("/api/ai/analyze-symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symptoms: booking.symptoms }),
      });

      if (!res.ok) {
        throw new Error("Failed to analyze symptoms.");
      }

      const result: AIAnalysisResult = await res.json();
      setBooking((prev) => ({
        ...prev,
        aiAnalysis: result,
        emergencyLevel: result.emergencyLevel,
      }));

      if (result.recommendedSpecialization && result.recommendedSpecialization !== "General Dentist") {
        const matched = doctors.filter((d) => d.specialization === result.recommendedSpecialization);
        setFilteredDoctors(matched.length > 0 ? matched : doctors);
      } else {
        setFilteredDoctors(doctors);
      }

      setStep(2);
    } catch (err) {
      console.error(err);
      setSymptomError("Failed to reach AI triage service. You can still proceed with doctor selection.");
      setStep(2);
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (!booking.doctor) return;
    async function loadSchedules() {
      setLoadingSchedules(true);
      try {
        const res = await fetch(`/api/doctors/${booking.doctor?.id}/schedules`);
        if (res.ok) {
          const data = await res.json();
          setSchedules(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSchedules(false);
      }
    }
    loadSchedules();
  }, [booking.doctor?.id]);

  useEffect(() => {
    if (!booking.doctor || !booking.date) return;
    async function loadBooked() {
      try {
        const res = await fetch(
          `/api/appointments?doctor_id=${booking.doctor?.id}&appointment_date=${booking.date}`
        );
        if (res.ok) {
          const data = await res.json();
          const slots = data
            .filter((a: any) => ["pending", "approved"].includes(a.status))
            .map((a: any) => a.slot_time);
          setBookedSlots(slots);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadBooked();
  }, [booking.doctor?.id, booking.date]);

  useEffect(() => {
    if (!booking.date || schedules.length === 0) {
      setAvailableSlots([]);
      return;
    }

    const selectedDate = new Date(booking.date);
    const dayOfWeek = getDayOfWeek(selectedDate);
    const daySchedule = schedules.find((s) => s.day_of_week === dayOfWeek && s.is_available);

    if (!daySchedule) {
      setAvailableSlots([]);
      return;
    }

    const slots = generateTimeSlots(
      daySchedule.start_time,
      daySchedule.end_time,
      daySchedule.slot_duration_minutes || 30
    );

    const futureSlots = filterPastSlots(slots, booking.date);
    const available = filterBookedSlots(futureSlots, bookedSlots);
    setAvailableSlots(available);
  }, [booking.date, schedules, bookedSlots]);

  const handleSubmit = async () => {
    if (!booking.doctor || !booking.date || !booking.time) {
      setBookingError("Mohon lengkapi dokter, tanggal, dan jam kunjungan.");
      return;
    }

    setSubmitting(true);
    setBookingError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const payload = {
        patient_id: user.id,
        doctor_id: booking.doctor.id,
        appointment_date: booking.date,
        slot_time: booking.time,
        symptom_description: booking.symptoms,
        emergency_level: booking.emergencyLevel || "routine",
        ai_analysis_result: booking.aiAnalysis || null,
        status: "pending",
      };

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setBookingError(errorData.error || "Failed to create appointment.");
        setSubmitting(false);
        return;
      }

      router.push("/patient/appointments");
    } catch (err) {
      console.error(err);
      setBookingError("Failed to connect to the clinic server.");
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];
  const level = booking.emergencyLevel || "routine";
  const priorityCfg = PRIORITY_CONFIG[level];
  const stepLabels = ["Symptoms & AI Triage", "Choose Doctor & Slot", "Confirmation"];
  const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="pb-6 border-b border-slate-200 mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Book Examination Appointment
          </h1>
        </div>

        {/* STEP PROGRESS BAR */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs mb-8">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((s, idx) => (
              <div key={s} className="flex flex-col items-center text-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 transition-all ${
                    s < step
                      ? "bg-emerald-600 text-white"
                      : s === step
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {s < step ? "✓" : s}
                </div>
                <span
                  className={`text-xs font-medium leading-tight ${
                    s <= step ? "text-slate-900 font-bold" : "text-slate-400"
                  }`}
                >
                  {stepLabels[idx]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1: Symptoms & AI Triage */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-xs">
              <div className="mb-5">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Describe Your Dental Symptoms
                </h3>
              </div>

              {/* Sample symptom chips */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-5">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5">
                  Example Symptoms (Click to add):
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Severe throbbing pain in back molar",
                    "Swollen bleeding gums with pus",
                    "Cavity with sharp sensitivity to cold",
                    "Consultation for braces or aligners",
                    "Routine scaling and tartar removal",
                    "Loose or chipped tooth from impact",
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
                      className="text-xs bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-md transition-all cursor-pointer"
                    >
                      + {ex}
                    </button>
                  ))}
                </div>
              </div>

              <Textarea
                className={`rounded-lg min-h-[140px] text-xs sm:text-sm transition-colors ${
                  symptomError
                    ? "border-rose-300 bg-rose-50/50"
                    : "border-slate-200 focus:border-blue-500"
                }`}
                placeholder="Describe your symptoms in detail... (e.g., lower back molar has been throbbing for 2 days, gums slightly swollen, unable to chew on the left side)"
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
                      : "text-emerald-700 font-medium"
                  }
                >
                  {(booking.symptoms || "").length} / 1000 characters
                  {(booking.symptoms || "").length < 10 && " (minimum 10 characters)"}
                </span>
              </div>

              {symptomError && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg mt-4 text-xs text-rose-800">
                  <p className="font-bold">Attention:</p>
                  <p className="mt-0.5">{symptomError}</p>
                </div>
              )}

              <div className="flex justify-end mt-6 pt-5 border-t border-slate-100">
                <Button
                  onClick={handleAnalyzeSymptoms}
                  disabled={!booking.symptoms?.trim() || analyzing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold h-11 px-6 shadow-xs"
                >
                  {analyzing ? "Analyzing Clinical Symptoms..." : "Analyze AI Triage & Continue →"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Doctor Selection & Time Slot */}
        {step === 2 && (
          <div className="space-y-6">
            {/* AI Result Card */}
            {booking.aiAnalysis && (
              <div
                className={`rounded-xl p-6 border ${priorityCfg.bg} ${priorityCfg.border} shadow-xs`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <span
                      className={`inline-block text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded ${priorityCfg.badgeBg} ${priorityCfg.badgeText}`}
                    >
                      Priority Level: {EMERGENCY_LEVEL_LABELS[level]}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                      {booking.aiAnalysis.possibleCondition}
                    </h3>
                  </div>
                  <div className="sm:text-right flex-shrink-0 bg-white p-2.5 rounded-lg border border-slate-200">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                      Estimated Cost
                    </p>
                    <p className="font-extrabold text-base text-slate-900 font-mono">
                      {booking.aiAnalysis.estimatedCostLabel}
                    </p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3">
                  {booking.aiAnalysis.reason}
                </p>

                <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs">
                  <span className="text-emerald-700 font-bold block mb-0.5">Medical Advice:</span>
                  <p className="text-slate-800">{booking.aiAnalysis.recommendation}</p>
                </div>
              </div>
            )}

            {/* Doctors selection header */}
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Select Attending Doctor
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {filteredDoctors.length} doctors available
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
                    className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden shadow-xs ${
                      isSelected
                        ? "border-emerald-500 ring-2 ring-emerald-500/20"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`p-5 flex items-center justify-between gap-4 cursor-pointer ${
                        isSelected ? "bg-emerald-50/50" : ""
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
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                          Dr. {doctor.user?.full_name}
                          {title}
                        </h4>
                        <span className="inline-block text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded mt-0.5 border border-blue-200">
                          {doctor.specialization}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">
                          {doctor.years_experience} Years Experience
                        </p>
                      </div>

                      <div className="flex items-center">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-md ${
                            isSelected
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isSelected ? "Selected ✓" : "Select"}
                        </span>
                      </div>
                    </div>

                    {/* Schedule & Slot Picker when selected */}
                    {isSelected && (
                      <div className="p-5 border-t border-slate-100 bg-white space-y-4">
                        <div className="p-3 bg-slate-50 rounded-lg text-xs">
                          <span className="font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                            Doctor Practice Schedule:
                          </span>
                          {loadingSchedules ? (
                            <span className="text-slate-400">Loading availability...</span>
                          ) : schedules.length > 0 ? (
                            <span className="font-bold text-slate-800">{availableDays}</span>
                          ) : (
                            <span className="text-rose-500 font-medium">
                              No active practice schedules found for this doctor.
                            </span>
                          )}
                        </div>

                        {/* Date Picker */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700">
                            Select Appointment Date:
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
                            className="rounded-lg border-slate-200 text-xs sm:text-sm h-11"
                          />
                        </div>

                        {/* Time Slots */}
                        {booking.date && (
                          <div className="space-y-2 pt-2">
                            <label className="text-xs font-semibold text-slate-700">
                              Select Time Slot:
                            </label>

                            {availableSlots.length === 0 ? (
                              <p className="p-4 bg-rose-50 text-rose-600 text-xs rounded-lg font-medium text-center">
                                No available appointment slots on this date. Please choose another date.
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
                                      className={`py-2 px-3 rounded-lg text-xs font-bold font-mono transition-all cursor-pointer ${
                                        isTimeSelected
                                          ? "bg-emerald-600 text-white"
                                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
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
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold h-10 px-5 shadow-xs"
                          >
                            Proceed to Confirmation →
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
              className="rounded-lg text-xs border-slate-200"
            >
              ← Change Symptoms
            </Button>
          </div>
        )}

        {/* STEP 3: Review & Final Confirmation */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">
                Appointment Booking Summary
              </h3>

              {booking.aiAnalysis && (
                <div className={`p-4 rounded-lg border ${priorityCfg.bg} ${priorityCfg.border}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${priorityCfg.badgeBg} ${priorityCfg.badgeText}`}
                    >
                      {EMERGENCY_LEVEL_LABELS[level]}
                    </span>
                    <span className="font-extrabold text-sm text-slate-900 font-mono">
                      {booking.aiAnalysis.estimatedCostLabel}
                    </span>
                  </div>
                  <p className="font-bold text-slate-800 text-sm">{booking.aiAnalysis.possibleCondition}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Attending Doctor
                  </span>
                  <p className="font-bold text-slate-900 text-sm">
                    Dr. {booking.doctor?.user?.full_name}
                  </p>
                  <p className="text-slate-500 mt-0.5">{booking.doctor?.specialization}</p>
                </div>

                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Consultation Time
                  </span>
                  <p className="font-bold text-slate-900 text-sm">
                    {booking.date ? formatDate(booking.date) : "-"}
                  </p>
                  <p className="text-emerald-700 font-mono font-bold mt-0.5">
                    {booking.time ? formatTime(booking.time) : "-"}
                  </p>
                </div>
              </div>

              {booking.symptoms && (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Reported Symptoms:
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    &ldquo;{booking.symptoms}&rdquo;
                  </p>
                </div>
              )}

              {bookingError && (
                <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                  {bookingError}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="rounded-lg text-xs w-full sm:w-auto"
                >
                  ← Change Schedule
                </Button>

                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold h-11 px-8 w-full sm:w-auto shadow-xs"
                >
                  {submitting ? "Processing Booking..." : "Confirm Appointment"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
