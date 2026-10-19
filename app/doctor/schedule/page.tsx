"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";
import { AppointmentCard } from "@/components/shared/AppointmentCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Appointment } from "@/types";
import { formatDate } from "@/lib/utils/formatters";
import {
  Calendar,
  Clock,
  ChevronRight,
  CalendarDays,
  Settings,
  UserCheck,
  AlertCircle,
  CalendarCheck,
  ChevronLeft,
  CalendarRange,
} from "lucide-react";

export default function DoctorSchedulePage() {
  const supabase = createClient();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    async function fetchSchedule() {
      setLoading(true);
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
        const { data } = await supabase
          .from("appointments")
          .select(`*, patient:users!appointments_patient_id_fkey(*)`)
          .eq("doctor_id", doctor.id)
          .eq("appointment_date", selectedDate)
          .in("status", ["pending", "approved"])
          .order("slot_time", { ascending: true });
        if (data) setAppointments(data as Appointment[]);
      } catch (err) {
        console.error("Gagal memuat jadwal:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSchedule();
  }, [selectedDate]);

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  const changeDateByDays = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split("T")[0]);
  };

  const pendingCount = appointments.filter((a) => a.status === "pending").length;
  const approvedCount = appointments.filter((a) => a.status === "approved").length;

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4 font-medium">
          <Link href="/doctor/dashboard" className="hover:text-slate-600 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-700 font-semibold">Kalender Jadwal Praktik</span>
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                <CalendarRange className="w-3.5 h-3.5 text-blue-600" />
                Kalender Agenda &amp; Antrean
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Jadwal Praktik Harian
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Periksa daftar pasien terjadwal per tanggal dan sesuaikan kesiapan ruang periksa
            </p>
          </div>

          <Link href="/doctor/availability">
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl shadow-xs transition-all cursor-pointer text-xs h-10 px-4"
            >
              <Settings className="w-4 h-4 mr-1.5 text-blue-600" />
              Atur Jam Ketersediaan
            </Button>
          </Link>
        </div>

        {/* Date Selector & Quick Filters Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeDateByDays(-1)}
                  className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                  title="Hari Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="relative">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-10 rounded-xl border-slate-200 text-xs sm:text-sm font-semibold focus:border-blue-500 focus:ring-blue-500 shadow-xs"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeDateByDays(1)}
                  className="h-10 w-10 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50"
                  title="Hari Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Quick shortcut pills */}
              <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className={`text-xs px-3 py-2 rounded-xl font-semibold transition-all cursor-pointer ${
                    selectedDate === todayStr
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Hari Ini
                </button>
                <button
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setSelectedDate(tomorrow.toISOString().split("T")[0]);
                  }}
                  className="text-xs px-3 py-2 rounded-xl font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Besok
                </button>
              </div>
            </div>

            {/* Selected Date Indicator & Metrics */}
            <div className="flex items-center gap-3">
              <div className="text-left md:text-right">
                <p className="text-xs font-bold text-slate-900">{formatDate(selectedDate)}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  <span className="font-semibold text-blue-700">{appointments.length} Pasien</span>{" "}
                  terjadwal ({approvedCount} disetujui, {pendingCount} menunggu)
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule List Content */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Antrean Pasien — {formatDate(selectedDate)}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Diurutkan berdasarkan jam sesi praktik
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4 py-4 animate-pulse">
              <div className="h-28 bg-slate-50 rounded-2xl border border-slate-100"></div>
              <div className="h-28 bg-slate-50 rounded-2xl border border-slate-100"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Tidak Ada Janji Temu pada Tanggal Ini
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Belum ada reservasi pasien untuk tanggal {formatDate(selectedDate)}. Anda dapat beralih ke tanggal lain atau memeriksa hari ini.
              </p>
              {selectedDate !== todayStr && (
                <Button
                  size="sm"
                  onClick={() => setSelectedDate(todayStr)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                >
                  Kembali ke Hari Ini
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              {appointments.map((a) => (
                <AppointmentCard
                  key={a.id}
                  appointment={a}
                  linkPrefix="/doctor/appointments"
                  showPatient
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
