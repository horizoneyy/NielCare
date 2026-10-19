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

  const firstName = user?.full_name?.split(" ")[0] || "Patient";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* PATIENT HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome, {firstName}
            </h1>
          </div>

          <Link href="/patient/book">
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs sm:text-sm h-11 px-5 shadow-xs"
            >
              Book Appointment
            </Button>
          </Link>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Upcoming Appointments
            </span>
            <div className="flex items-baseline justify-between gap-2 mt-2">
              <h3 className="text-3xl font-extrabold text-emerald-700 tracking-tight font-mono">
                {stats.upcomingAppointments}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                Confirmed
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Scheduled visits ready for attendance
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Completed Visits
            </span>
            <div className="flex items-baseline justify-between gap-2 mt-2">
              <h3 className="text-3xl font-extrabold text-blue-700 tracking-tight font-mono">
                {stats.completedAppointments}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Completed
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Successfully completed dental treatments
            </p>
          </div>
        </div>

        {/* QUICK ACTION CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Link href="/patient/book" className="group block">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 shadow-xs hover:border-emerald-300 transition-all h-full flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-emerald-950 tracking-tight mb-1">
                  Book New Appointment
                </h3>
                <p className="text-emerald-800 text-xs leading-relaxed">
                  Describe your symptoms with smart AI triage for accurate specialist referral.
                </p>
              </div>
              <div className="text-xs font-bold text-emerald-700 group-hover:underline mt-4">
                Start Booking →
              </div>
            </div>
          </Link>

          <Link href="/patient/appointments" className="group block">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs hover:border-blue-400 transition-all h-full flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight mb-1">
                  Appointment History
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  View records of past clinical treatments, prescriptions, and consultations.
                </p>
              </div>
              <div className="text-xs font-bold text-blue-600 group-hover:underline mt-4">
                View History →
              </div>
            </div>
          </Link>

          <Link href="/patient/profile" className="group block">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs hover:border-blue-400 transition-all h-full flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 tracking-tight mb-1">
                  Patient Profile
                </h3>
                <p className="text-slate-500 text-xs leading-relaxed">
                  Verify your contact number, date of birth, and personal information.
                </p>
              </div>
              <div className="text-xs font-bold text-blue-600 group-hover:underline mt-4">
                Manage Profile →
              </div>
            </div>
          </Link>
        </div>

        {/* UPCOMING APPOINTMENTS LIST */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Your Upcoming Appointments
              </h3>
            </div>
            <Link
              href="/patient/appointments"
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              View All ({stats.upcomingAppointments})
            </Link>
          </div>

          {upcomingList.length === 0 ? (
            <div className="text-center py-14 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
              <h4 className="text-sm font-bold text-slate-800">
                No Scheduled Appointments Yet
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Experiencing dental pain or need a routine checkup? Schedule your visit today.
              </p>
              <Link href="/patient/book">
                <Button
                  size="sm"
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  Book an Appointment Now
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
