"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";
import { AppointmentCard } from "@/components/shared/AppointmentCard";
import { formatCurrency } from "@/lib/utils/formatters";
import type { Appointment, DoctorStats } from "@/types";
import {
  Calendar,
  Users,
  CheckCircle,
  Clock,
  TrendingUp,
  Stethoscope,
  Activity,
  ArrowRight,
  CalendarCheck,
  ShieldAlert,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DoctorDashboard() {
  const supabase = createClient();
  const [stats, setStats] = useState<DoctorStats>({
    todayAppointments: 0,
    pendingAppointments: 0,
    totalPatients: 0,
    completedThisMonth: 0,
    earningsThisMonth: 0,
  });
  const [todayList, setTodayList] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const today = new Date().toISOString().split("T")[0];

        // Fetch doctor record
        const { data: doctor } = await supabase
          .from("doctors")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!doctor) {
          setLoading(false);
          return;
        }

        // Parallel fetch for appointments & stats
        const [apptRes, statsRes] = await Promise.all([
          fetch(`/api/appointments?doctor_id=${doctor.id}&date=${today}`),
          fetch("/api/doctor/stats"),
        ]);

        if (apptRes.ok) {
          const apptData = await apptRes.json();
          apptData.sort((a: Appointment, b: Appointment) =>
            a.slot_time.localeCompare(b.slot_time)
          );
          setTodayList(apptData);
        }

        if (statsRes.ok) {
          const s = await statsRes.json();
          setStats({
            todayAppointments: s.todayAppointments,
            pendingAppointments: s.pendingAppointments,
            totalPatients: s.totalPatients,
            completedThisMonth: s.completedThisMonth,
            earningsThisMonth: s.earningsThisMonth,
          });
        }
      } catch (err) {
        console.error("[Doctor Dashboard Fetch Error]", err);
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
          <div className="h-8 bg-slate-200/80 rounded-xl w-64 mb-6"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="h-28 bg-white rounded-2xl border border-slate-100 p-5"></div>
            <div className="h-28 bg-white rounded-2xl border border-slate-100 p-5"></div>
            <div className="h-28 bg-white rounded-2xl border border-slate-100 p-5"></div>
            <div className="h-28 bg-white rounded-2xl border border-slate-100 p-5"></div>
          </div>
          <div className="h-72 bg-white rounded-2xl border border-slate-100"></div>
        </main>
      </div>
    );
  }

  const statCards = [
    {
      label: "Antrean Hari Ini",
      value: stats.todayAppointments.toString(),
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-50",
      subtext: "Pasien terjadwal hari ini",
    },
    {
      label: "Menunggu Approval",
      value: stats.pendingAppointments.toString(),
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      subtext: "Permintaan reservasi baru",
    },
    {
      label: "Total Pasien Ditangani",
      value: stats.totalPatients.toString(),
      icon: Users,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      subtext: "Pasien terdaftar di klinik",
    },
    {
      label: "Tindakan Selesai",
      value: stats.completedThisMonth.toString(),
      icon: CheckCircle,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      subtext: "Bulan berjalan",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* ─── 1. DOCTOR HEADER ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                Portal Klinis Dokter
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                <Activity className="w-3 h-3 text-emerald-500" />
                Praktik Aktif
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Dashboard Praktik Dokter
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Kelola antrean harian, rekam medis diagnosis, dan ketersediaan jam praktik Anda
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
                Cek Kalender Jadwal
              </Button>
            </Link>

            <Link href="/doctor/appointments">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all cursor-pointer text-xs h-10 px-4"
              >
                Semua Janji Temu <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* ─── 2. KPI METRICS CARDS ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                    {s.label}
                  </span>
                  <div className={`p-2.5 rounded-xl ${s.bg} ${s.color}`}>
                    <s.icon className="w-4 h-4" />
                  </div>
                </div>
                <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight font-mono">
                  {s.value}
                </h3>
              </div>
              <p className="text-[11px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
                {s.subtext}
              </p>
            </div>
          ))}
        </div>

        {/* ─── 3. TODAY'S QUEUE & APPOINTMENTS ─────────────────────────────── */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                Antrean Janji Temu Hari Ini
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar pasien terjadwal yang siap diperiksa di ruang praktik hari ini
              </p>
            </div>
            <Link
              href="/doctor/appointments"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center"
            >
              Kelola Semua Antrean
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>

          {todayList.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Tidak Ada Antrean Pasien Hari Ini
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Semua jadwal praktik untuk hari ini kosong atau belum ada booking masuk. Anda dapat memeriksa jadwal besok.
              </p>
              <Link href="/doctor/schedule">
                <Button
                  size="sm"
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                >
                  Lihat Jadwal Lengkap
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3.5">
              {todayList.map((a) => (
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
