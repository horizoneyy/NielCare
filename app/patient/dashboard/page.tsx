"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";
import { AppointmentCard } from "@/components/shared/AppointmentCard";
import { Button } from "@/components/ui/button";
import type { User, Appointment } from "@/types";

export default function PatientDashboard() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [upcomingList, setUpcomingList] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    completedAppointments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) return;

        const [profileRes, upcomingRes, upcomingCountRes, completedCountRes] = await Promise.all([
          supabase.from("users").select("*").eq("id", authUser.id).single(),
          supabase
            .from("appointments")
            .select(`*, doctor:doctors!appointments_doctor_id_fkey(*, user:users!doctors_user_id_fkey(*))`)
            .eq("patient_id", authUser.id)
            .in("status", ["pending", "approved"])
            .order("appointment_date", { ascending: true })
            .limit(3),
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
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="h-28 bg-white rounded-xl border border-slate-200 p-5"></div>
            <div className="h-28 bg-white rounded-xl border border-slate-200 p-5"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <div className="h-36 bg-white rounded-xl border border-slate-200"></div>
            <div className="h-36 bg-white rounded-xl border border-slate-200"></div>
            <div className="h-36 bg-white rounded-xl border border-slate-200"></div>
          </div>
          <div className="h-64 bg-white rounded-xl border border-slate-200"></div>
        </main>
      </div>
    );
  }

  const firstName = user?.full_name?.split(" ")[0] || "Pasien";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* PATIENT HEADER (Clean title, no top badge, no subtitle, no waving hand, no button icon) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Selamat Datang, {firstName}
            </h1>
          </div>

          <Link href="/patient/book">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs sm:text-sm h-11 px-5 shadow-xs"
            >
              Buat Janji Dokter
            </Button>
          </Link>
        </div>

        {/* STAT CARDS (No icons, solid colors) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Janji Temu Akan Datang
            </span>
            <div className="flex items-baseline justify-between gap-2 mt-2">
              <h3 className="text-3xl font-extrabold text-emerald-700 tracking-tight font-mono">
                {stats.upcomingAppointments}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Terkonfirmasi
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Kunjungan terjadwal yang siap dihadiri
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Pemeriksaan Selesai
            </span>
            <div className="flex items-baseline justify-between gap-2 mt-2">
              <h3 className="text-3xl font-extrabold text-blue-700 tracking-tight font-mono">
                {stats.completedAppointments}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Riwayat Selesai
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Tindakan medis yang telah tuntas dilakukan
            </p>
          </div>
        </div>

        {/* QUICK ACTION CARDS (Solid colors, no gradient, no icons) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link href="/patient/book" className="group block">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-xs hover:border-emerald-300 transition-all h-full flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-emerald-950 tracking-tight mb-1">
                  Reservasi Janji Baru
                </h3>
                <p className="text-emerald-800 text-xs leading-relaxed">
                  Konsultasikan keluhan Anda dengan triase cerdas AI untuk rujukan dokter yang tepat.
                </p>
              </div>
              <div className="text-xs font-bold text-emerald-700 group-hover:underline mt-4">
                Mulai Buat Janji →
              </div>
            </div>
          </Link>

          <Link href="/patient/appointments" className="group block">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs hover:border-blue-400 transition-all h-full flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight mb-1">
                  Riwayat Kunjungan
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Lihat rekam catatan tindakan medis, resep obat, dan riwayat konsultasi lampau Anda.
                </p>
              </div>
              <div className="text-xs font-bold text-blue-600 group-hover:underline mt-4">
                Buka Riwayat →
              </div>
            </div>
          </Link>

          <Link href="/patient/profile" className="group block">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs hover:border-blue-400 transition-all h-full flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight mb-1">
                  Profil Identitas Pasien
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Periksa kelengkapan nomor kontak WhatsApp, data tanggal lahir, dan informasi dasar pasien.
                </p>
              </div>
              <div className="text-xs font-bold text-blue-600 group-hover:underline mt-4">
                Kelola Profil →
              </div>
            </div>
          </Link>
        </div>

        {/* UPCOMING APPOINTMENTS LIST (No icons) */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Janji Temu Terdekat Anda
              </h3>
            </div>
            <Link
              href="/patient/appointments"
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Lihat Semua ({stats.upcomingAppointments})
            </Link>
          </div>

          {upcomingList.length === 0 ? (
            <div className="text-center py-14 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
              <h4 className="text-sm font-bold text-slate-800">
                Belum Ada Janji Temu Terjadwal
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Keluhan sakit gigi atau ingin konsultasi? Jadwalkan janji temu Anda sekarang.
              </p>
              <Link href="/patient/book">
                <Button
                  size="sm"
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  Buat Janji Sekarang
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
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
