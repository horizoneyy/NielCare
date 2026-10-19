"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";
import { AppointmentCard } from "@/components/shared/AppointmentCard";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials, formatDate } from "@/lib/utils/formatters";
import type { User, Appointment } from "@/types";

export default function DoctorPatientDetailPage() {
  const { id } = useParams();
  const supabase = createClient();
  const [patient, setPatient] = useState<User | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data: doctor } = await supabase
          .from("doctors")
          .select("id")
          .eq("user_id", user.id)
          .single();
        if (!doctor) return;
        const { data: p } = await supabase
          .from("users")
          .select("*")
          .eq("id", id)
          .single();
        if (p) setPatient(p as User);
        const { data: appts } = await supabase
          .from("appointments")
          .select(`*`)
          .eq("patient_id", id as string)
          .eq("doctor_id", doctor.id)
          .order("appointment_date", { ascending: false });
        if (appts) setAppointments(appts as Appointment[]);
      } catch (err) {
        console.error("Gagal memuat rekam pasien:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-72 mb-6"></div>
          <div className="h-44 bg-white rounded-xl border border-slate-200 mb-6"></div>
          <div className="h-72 bg-white rounded-xl border border-slate-200"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header (Clean title, no subtitle, no icon) */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Patient Profile &amp; Medical History
            </h1>
          </div>

          <Link href="/doctor/patients">
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-lg text-xs h-10 px-4"
            >
              Back to Directory
            </Button>
          </Link>
        </div>

        {/* Patient Profile Bio Card */}
        {patient && (
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border border-slate-200">
                  <AvatarFallback className="bg-blue-50 text-blue-700 text-lg font-bold">
                    {getInitials(patient.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-900">{patient.full_name}</h2>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Registered
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 capitalize mt-0.5">
                    Gender: <span className="font-semibold text-slate-700">{patient.gender || "Not specified"}</span>
                  </p>
                </div>
              </div>

              <div className="px-3.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-center">
                <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
                  Total Visits
                </span>
                <p className="text-lg font-extrabold text-blue-900 font-mono">
                  {appointments.length} Visits
                </p>
              </div>
            </div>

            {/* Patient Vitals & Contact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <p className="text-slate-400 font-medium">Email</p>
                <p className="font-semibold text-slate-800 truncate mt-0.5">{patient.email || "-"}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <p className="text-slate-400 font-medium">Phone Number</p>
                <p className="font-semibold text-slate-800 truncate mt-0.5">{patient.phone || "-"}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <p className="text-slate-400 font-medium">Date of Birth</p>
                <p className="font-semibold text-slate-800 truncate mt-0.5">
                  {patient.date_of_birth ? formatDate(patient.date_of_birth) : "-"}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <p className="text-slate-400 font-medium">Vitals (Weight / Height)</p>
                <p className="font-semibold text-slate-800 truncate mt-0.5">
                  {patient.weight_kg ? `${patient.weight_kg} kg` : "-"} /{" "}
                  {patient.height_cm ? `${patient.height_cm} cm` : "-"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* History of Appointments */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="pb-4 border-b border-slate-100 mb-5">
            <h3 className="text-base font-bold text-slate-900">Appointment History</h3>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
              <h4 className="text-sm font-bold text-slate-800">No Appointment History</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                This patient does not have any appointment history with you yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((a) => (
                <AppointmentCard
                  key={a.id}
                  appointment={a}
                  linkPrefix="/doctor/appointments"
                  showPatient={false}
                  showDoctor={false}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
