"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";
import { AppointmentCard } from "@/components/shared/AppointmentCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Appointment } from "@/types";

export default function DoctorAppointmentsPage() {
  const supabase = createClient();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadAppointments() {
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
        const res = await fetch(`/api/appointments?doctor_id=${doctor.id}`);
        if (res.ok) {
          const data = await res.json();
          setAppointments(data);
        }
      } catch (err) {
        console.error("Gagal mengambil data janji temu dokter:", err);
      } finally {
        setLoading(false);
      }
    }
    loadAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return appointments;
    const q = searchQuery.toLowerCase();
    return appointments.filter((a) => {
      const patientName = a.patient?.full_name?.toLowerCase() || "";
      const symptom = a.symptom_description?.toLowerCase() || "";
      return patientName.includes(q) || symptom.includes(q);
    });
  }, [appointments, searchQuery]);

  const pending = filteredAppointments.filter((a) => a.status === "pending");
  const approved = filteredAppointments.filter((a) => a.status === "approved");
  const history = filteredAppointments.filter((a) =>
    ["done", "rejected", "cancelled"].includes(a.status)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-72 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="h-20 bg-white rounded-xl border border-slate-200"></div>
            <div className="h-20 bg-white rounded-xl border border-slate-200"></div>
            <div className="h-20 bg-white rounded-xl border border-slate-200"></div>
          </div>
          <div className="space-y-4">
            <div className="h-28 bg-white rounded-xl border border-slate-200"></div>
            <div className="h-28 bg-white rounded-xl border border-slate-200"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header (Clean title, no top badge, no subtitle, no button icons) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Janji Temu &amp; Rekam Pasien
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/doctor/schedule">
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs h-10 px-4"
              >
                Jadwal Praktik Saya
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Summary Cards (No icons, solid colors) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold tracking-wider text-amber-700 uppercase">
              Menunggu Konfirmasi
            </span>
            <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
              {pending.length}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Permintaan baru</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold tracking-wider text-blue-700 uppercase">
              Telah Disetujui
            </span>
            <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
              {approved.length}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Siap diperiksa</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold tracking-wider text-emerald-700 uppercase">
              Riwayat Selesai
            </span>
            <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
              {history.length}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Total konsultasi</p>
          </div>
        </div>

        {/* Search Bar (No icon) */}
        <div className="mb-6">
          <div className="relative">
            <Input
              type="text"
              placeholder="Cari berdasarkan nama pasien atau keluhan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-lg bg-white border-slate-200 text-xs sm:text-sm focus:border-blue-500 shadow-xs px-3.5"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Tabs for Status (No icons in trigger) */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-6 bg-slate-200/70 p-1 rounded-lg w-full sm:w-auto">
            <TabsTrigger
              value="pending"
              className="rounded-md text-xs font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 transition-all"
            >
              Menunggu Persetujuan ({pending.length})
            </TabsTrigger>
            <TabsTrigger
              value="approved"
              className="rounded-md text-xs font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 transition-all"
            >
              Disetujui ({approved.length})
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-md text-xs font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 transition-all"
            >
              Riwayat Selesai ({history.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pending.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-xl">
                <h4 className="text-sm font-bold text-slate-800">Tidak Ada Janji Menunggu</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Semua permohonan janji temu pasien telah ditinjau atau belum ada reservasi baru.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((a) => (
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
          </TabsContent>

          <TabsContent value="approved">
            {approved.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-xl">
                <h4 className="text-sm font-bold text-slate-800">Tidak Ada Janji Disetujui</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Belum ada jadwal yang siap diperiksa saat ini. Silakan konfirmasi janji dari tab Menunggu.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {approved.map((a) => (
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
          </TabsContent>

          <TabsContent value="history">
            {history.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-xl">
                <h4 className="text-sm font-bold text-slate-800">Belum Ada Riwayat Kunjungan</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Janji temu yang telah selesai dirawat atau dibatalkan akan tercatat di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((a) => (
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
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
