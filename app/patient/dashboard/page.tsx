"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppointmentCard } from "@/components/shared/AppointmentCard";
import type { User, Appointment, PatientStats } from "@/types";
import {
  CalendarPlus,
  Calendar,
  CheckCircle,
  User as UserIcon,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HeartPulse,
  ChevronRight
} from "lucide-react";

export default function PatientDashboard() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<PatientStats>({
    upcomingAppointments: 0,
    completedAppointments: 0,
  });
  const [upcomingList, setUpcomingList] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) return;

        const today = new Date().toISOString().split("T")[0];

        // Eksekusi paralel via Promise.all
        const [profileRes, upcomingRes, upcomingCountRes, completedCountRes] = await Promise.all([
          supabase.from("users").select("*").eq("id", authUser.id).single(),
          supabase
            .from("appointments")
            .select(`*, doctor:doctors!appointments_doctor_id_fkey(*, user:users!doctors_user_id_fkey(*))`)
            .eq("patient_id", authUser.id)
            .in("status", ["pending", "approved"])
            .gte("appointment_date", today)
            .order("emergency_level", { ascending: true })
            .order("appointment_date", { ascending: true })
            .limit(5),
          supabase
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .eq("patient_id", authUser.id)
            .in("status", ["pending", "approved"]),
          supabase
            .from("appointments")
            .select("id", { count: "exact", head: true })
            .eq("patient_id", authUser.id)
            .eq("status", "done"),
        ]);

        if (profileRes.data) setUser(profileRes.data as User);
        if (upcomingRes.data) setUpcomingList(upcomingRes.data as Appointment[]);
        setStats({
          upcomingAppointments: upcomingCountRes.count || 0,
          completedAppointments: completedCountRes.count || 0,
        });
      } catch (err) {
        console.error("[Patient Dashboard Fetch Error]", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60">
        <Sidebar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-8 bg-slate-200/80 rounded-xl w-64 mb-3"></div>
          <div className="h-4 bg-slate-200/60 rounded-md w-96 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="h-28 bg-white rounded-2xl border border-slate-100 p-5"></div>
            <div className="h-28 bg-white rounded-2xl border border-slate-100 p-5"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <div className="h-36 bg-white rounded-2xl border border-slate-100"></div>
            <div className="h-36 bg-white rounded-2xl border border-slate-100"></div>
            <div className="h-36 bg-white rounded-2xl border border-slate-100"></div>
          </div>
          <div className="h-64 bg-white rounded-2xl border border-slate-100"></div>
        </main>
      </div>
    );
  }

  const firstName = user?.full_name?.split(" ")[0] || "Pasien";

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* ─── 1. PATIENT HEADER ───────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <HeartPulse className="w-3.5 h-3.5 text-emerald-600" />
                Portal Pasien NielCare
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/50">
                <ShieldCheck className="w-3 h-3 text-blue-500" />
                Rekam Medis Terproteksi
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Selamat Datang, {firstName} 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pantau jadwal janji temu dan riwayat perawatan kesehatan gigi Anda di sini
            </p>
          </div>

          <Link href="/patient/book">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm hover:shadow transition-all cursor-pointer text-xs sm:text-sm h-11 px-5"
            >
              <CalendarPlus className="h-4 w-4 mr-2" /> Buat Janji Dokter
            </Button>
          </Link>
        </div>

        {/* ─── 2. STAT CARDS ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Janji Temu Akan Datang
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                {stats.upcomingAppointments}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                Terkonfirmasi
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Kunjungan terjadwal yang siap dihadiri
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Pemeriksaan Selesai
              </span>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <CheckCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                {stats.completedAppointments}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                Riwayat Selesai
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Tindakan medis yang telah tuntas dilakukan
            </p>
          </div>
        </div>

        {/* ─── 3. QUICK ACTION BANNERS ─────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <Link href="/patient/book" className="group">
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <CalendarPlus className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-bold text-base tracking-tight mb-1">
                  Reservasi Janji Baru
                </h3>
                <p className="text-emerald-100/80 text-xs leading-relaxed">
                  Konsultasikan keluhan Anda dengan triase cerdas AI untuk rujukan dokter yang tepat.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-200 group-hover:text-white mt-4">
                <span>Mulai Buat Janji</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/patient/appointments" className="group">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300 h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <Clock className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight mb-1">
                  Riwayat Kunjungan
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Lihat rekam catatan tindakan medis, resep obat, dan riwayat konsultasi lampau Anda.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 group-hover:text-blue-700 mt-4">
                <span>Buka Riwayat</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          <Link href="/patient/profile" className="group">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300 h-full flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <UserIcon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight mb-1">
                  Profil Identitas Pasien
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Periksa kelengkapan nomor kontak WhatsApp, data tanggal lahir, dan informasi dasar pasien.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 group-hover:text-indigo-700 mt-4">
                <span>Kelola Profil</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>

        {/* ─── 4. UPCOMING APPOINTMENTS LIST ──────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-600" />
                Janji Temu Terdekat Anda
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pastikan Anda hadir 15 menit sebelum slot waktu praktik dimulai
              </p>
            </div>
            <Link
              href="/patient/appointments"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors inline-flex items-center"
            >
              Lihat Semua ({stats.upcomingAppointments})
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {upcomingList.length === 0 ? (
            <div className="text-center py-14 px-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Belum Ada Janji Temu Terjadwal
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Keluhan sakit gigi atau ingin konsultasi kawat gigi? Jadwalkan janji temu Anda sekarang dengan bantuan triase AI.
              </p>
              <Link href="/patient/book">
                <Button
                  size="sm"
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs"
                >
                  <CalendarPlus className="h-3.5 w-3.5 mr-1.5" /> Buat Janji Sekarang
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {upcomingList.map((a) => (
                <AppointmentCard
                  key={a.id}
                  appointment={a}
                  linkPrefix="/patient/appointments"
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
