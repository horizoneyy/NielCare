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
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header (Clean title, no top badge, no subtitle, no icons) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Jadwal Praktik Harian
            </h1>
          </div>

          <Link href="/doctor/availability">
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs h-10 px-4"
            >
              Atur Jam Ketersediaan
            </Button>
          </Link>
        </div>

        {/* Date Selector Card */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changeDateByDays(-1)}
                  className="h-10 px-3 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                  title="Hari Sebelumnya"
                >
                  ←
                </Button>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="h-10 rounded-lg border-slate-200 text-xs sm:text-sm font-semibold focus:border-blue-500 shadow-xs"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => changeDateByDays(1)}
                  className="h-10 px-3 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 font-bold"
                  title="Hari Berikutnya"
                >
                  →
                </Button>
              </div>

              {/* Quick shortcut pills */}
              <div className="flex items-center gap-1.5 ml-0 sm:ml-2">
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className={`text-xs px-3 py-2 rounded-lg font-semibold transition-all cursor-pointer ${
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
                  className="text-xs px-3 py-2 rounded-lg font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Besok
                </button>
              </div>
            </div>

            {/* Selected Date Indicator */}
            <div className="text-left md:text-right">
              <p className="text-xs font-bold text-slate-900">{formatDate(selectedDate)}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-semibold text-blue-700">{appointments.length} Pasien</span>{" "}
                terjadwal ({approvedCount} disetujui, {pendingCount} menunggu)
              </p>
            </div>
          </div>
        </div>

        {/* Schedule List Content */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="pb-4 border-b border-slate-100 mb-5">
            <h3 className="text-base font-bold text-slate-900">
              Antrean Pasien — {formatDate(selectedDate)}
            </h3>
          </div>

          {loading ? (
            <div className="space-y-4 py-4 animate-pulse">
              <div className="h-28 bg-slate-50 rounded-xl border border-slate-100"></div>
              <div className="h-28 bg-slate-50 rounded-xl border border-slate-100"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
              <h4 className="text-sm font-bold text-slate-800">
                Tidak Ada Janji Temu pada Tanggal Ini
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Belum ada reservasi pasien untuk tanggal {formatDate(selectedDate)}.
              </p>
              {selectedDate !== todayStr && (
                <Button
                  size="sm"
                  onClick={() => setSelectedDate(todayStr)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Kembali ke Hari Ini
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
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
