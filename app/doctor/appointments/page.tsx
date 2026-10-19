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
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  CalendarCheck,
  Stethoscope,
  ChevronRight,
  Filter,
} from "lucide-react";

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
      <div className="min-h-screen bg-slate-50/60">
        <Sidebar />
        <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-6 bg-slate-200/80 rounded w-48 mb-4"></div>
          <div className="h-10 bg-slate-200/60 rounded-xl w-72 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="h-20 bg-white rounded-2xl border border-slate-200/80"></div>
            <div className="h-20 bg-white rounded-2xl border border-slate-200/80"></div>
            <div className="h-20 bg-white rounded-2xl border border-slate-200/80"></div>
          </div>
          <div className="space-y-4">
            <div className="h-28 bg-white rounded-2xl border border-slate-200/80"></div>
            <div className="h-28 bg-white rounded-2xl border border-slate-200/80"></div>
          </div>
        </main>
      </div>
    );
  }

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
          <span className="text-slate-700 font-semibold">Janji Temu Pasien</span>
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                Manajemen Antrean Klinis
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Janji Temu &amp; Rekam Pasien
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Verifikasi permohonan kunjungan, panggil pasien, dan input hasil diagnosis
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/doctor/schedule">
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl shadow-xs transition-all cursor-pointer text-xs h-10 px-4"
              >
                <CalendarCheck className="w-4 h-4 mr-1.5 text-blue-600" />
                Jadwal Praktik Saya
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI / Status Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-amber-200/70 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-amber-700 uppercase">
                Menunggu Konfirmasi
              </span>
              <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                {pending.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Permintaan baru</p>
            </div>
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-blue-200/70 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-blue-700 uppercase">
                Telah Disetujui
              </span>
              <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                {approved.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Siap diperiksa</p>
            </div>
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-emerald-200/70 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold tracking-wider text-emerald-700 uppercase">
                Riwayat Selesai
              </span>
              <p className="text-2xl font-extrabold text-slate-900 font-mono mt-1">
                {history.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Total konsultasi</p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari berdasarkan nama pasien atau keluhan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-white border-slate-200 text-xs sm:text-sm focus:border-blue-500 focus:ring-blue-500 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Tabs for Status */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-6 bg-slate-200/60 p-1 rounded-xl w-full sm:w-auto">
            <TabsTrigger
              value="pending"
              className="rounded-lg text-xs font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs transition-all"
            >
              <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              Menunggu Persetujuan ({pending.length})
            </TabsTrigger>
            <TabsTrigger
              value="approved"
              className="rounded-lg text-xs font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs transition-all"
            >
              <Clock className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
              Disetujui ({approved.length})
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="rounded-lg text-xs font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-xs transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Riwayat Selesai ({history.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            {pending.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Tidak Ada Janji Menunggu</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Semua permohonan janji temu pasien telah ditinjau atau belum ada reservasi baru.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
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
              <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Tidak Ada Janji Disetujui</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Belum ada jadwal yang siap diperiksa saat ini. Silakan konfirmasi janji dari tab Menunggu.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
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
              <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <Calendar className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">Belum Ada Riwayat Kunjungan</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Janji temu yang telah selesai dirawat atau dibatalkan akan tercatat di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-3.5">
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
