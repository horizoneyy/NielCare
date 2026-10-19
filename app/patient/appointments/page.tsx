"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";
import { AppointmentCard } from "@/components/shared/AppointmentCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { Appointment } from "@/types";
import { Calendar, ArrowLeft, CalendarPlus, Clock, CheckCircle } from "lucide-react";

export default function PatientAppointmentsPage() {
  const supabase = createClient();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const res = await fetch(`/api/appointments?patient_id=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setAppointments(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60">
        <Sidebar />
        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-8 bg-slate-200/80 rounded-xl w-64 mb-6"></div>
          <div className="h-10 bg-slate-200/60 rounded-xl w-72 mb-6"></div>
          <div className="space-y-4">
            <div className="h-28 bg-white rounded-2xl border border-slate-100 p-5"></div>
            <div className="h-28 bg-white rounded-2xl border border-slate-100 p-5"></div>
          </div>
        </main>
      </div>
    );
  }

  const upcoming = appointments.filter((a) => ["pending", "approved"].includes(a.status));
  const past = appointments.filter((a) => ["done", "rejected", "cancelled"].includes(a.status));

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/patient/dashboard"
                className="inline-flex items-center text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Dashboard Pasien
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Riwayat &amp; Jadwal Janji Temu
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Daftar seluruh konsultasi dokter dan catatan pemeriksaan gigi Anda
            </p>
          </div>

          <Link href="/patient/book">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-xs transition-all cursor-pointer text-xs h-9 px-4"
            >
              <CalendarPlus className="h-3.5 w-3.5 mr-1.5" /> Buat Janji Baru
            </Button>
          </Link>
        </div>

        {/* Tabs Filter */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="mb-6 bg-slate-200/60 p-1 rounded-xl w-full sm:w-auto">
            <TabsTrigger
              value="upcoming"
              className="rounded-lg text-xs font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs transition-all"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Akan Datang ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-lg text-xs font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs transition-all"
            >
              <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              Riwayat Lampau ({past.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcoming.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200/90 rounded-2xl shadow-xs">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Tidak Ada Janji Temu Terdekat</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Semua janji temu yang menunggu konfirmasi atau sudah disetujui akan ditampilkan di sini.
                </p>
                <Link href="/patient/book">
                  <Button
                    size="sm"
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                  >
                    <CalendarPlus className="h-3.5 w-3.5 mr-1.5" /> Jadwalkan Kunjungan
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3.5">
                {upcoming.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} linkPrefix="/patient/appointments" />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history">
            {past.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200/90 rounded-2xl shadow-xs">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Belum Ada Riwayat Kunjungan</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Riwayat janji temu yang telah selesai atau dibatalkan akan tersimpan rapi di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {past.map((a) => (
                  <AppointmentCard key={a.id} appointment={a} linkPrefix="/patient/appointments" />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
