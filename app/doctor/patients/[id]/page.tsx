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
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar as CalIcon,
  User as UserIcon,
  HeartPulse,
  Scale,
  Ruler,
  ChevronRight,
  ShieldCheck,
  History,
} from "lucide-react";

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
      <div className="min-h-screen bg-slate-50/60">
        <Sidebar />
        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-6 bg-slate-200/80 rounded w-48 mb-4"></div>
          <div className="h-44 bg-white rounded-2xl border border-slate-200/80 mb-6"></div>
          <div className="h-72 bg-white rounded-2xl border border-slate-200/80"></div>
        </main>
      </div>
    );
  }

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
          <Link href="/doctor/patients" className="hover:text-slate-600 transition-colors">
            Daftar Pasien
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-700 font-semibold truncate max-w-[200px]">
            {patient?.full_name || "Detail Pasien"}
          </span>
        </div>

        {/* Top Header */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-200/70 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Profil Pasien &amp; Rekam Medis
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Data klinis lengkap dan histori konsultasi gigi di klinik Anda
            </p>
          </div>

          <Link href="/doctor/patients">
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium rounded-xl text-xs h-10 px-4 shadow-xs transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Kembali ke Daftar
            </Button>
          </Link>
        </div>

        {/* Patient Profile Bio Card */}
        {patient && (
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-blue-100 shadow-xs">
                  <AvatarFallback className="bg-blue-50 text-blue-700 text-lg font-bold">
                    {getInitials(patient.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-900">{patient.full_name}</h2>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Terdaftar
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 capitalize mt-0.5">
                    Jenis Kelamin: <span className="font-semibold text-slate-700">{patient.gender || "Belum diisi"}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200/60 text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
                    Total Kunjungan
                  </span>
                  <p className="text-lg font-extrabold text-blue-900 font-mono">
                    {appointments.length} Kali
                  </p>
                </div>
              </div>
            </div>

            {/* Patient Vitals & Contact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <Mail className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">Email</p>
                  <p className="font-semibold text-slate-800 truncate">{patient.email || "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <Phone className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">No. Telepon</p>
                  <p className="font-semibold text-slate-800 truncate">{patient.phone || "-"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <CalIcon className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">Tanggal Lahir</p>
                  <p className="font-semibold text-slate-800 truncate">
                    {patient.date_of_birth ? formatDate(patient.date_of_birth) : "-"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                <HeartPulse className="h-4 w-4 text-rose-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">Fisik (BB / TB)</p>
                  <p className="font-semibold text-slate-800 truncate">
                    {patient.weight_kg ? `${patient.weight_kg} kg` : "-"} /{" "}
                    {patient.height_cm ? `${patient.height_cm} cm` : "-"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History of Appointments & EMR */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Histori Janji Temu Pasien Ini</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar seluruh rekam medis dan konsultasi yang pernah dilakukan bersama Anda
                </p>
              </div>
            </div>
          </div>

          {appointments.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <CalIcon className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Belum Ada Riwayat Janji Temu</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Pasien ini belum memiliki riwayat kunjungan yang selesai atau terdaftar pada jadwal Anda.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
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
