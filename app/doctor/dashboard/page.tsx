"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";
import { AppointmentCard } from "@/components/shared/AppointmentCard";
import { Button } from "@/components/ui/button";
import type { Appointment } from "@/types";

export default function DoctorDashboard() {
  const supabase = createClient();
  const [todayList, setTodayList] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    todayAppointments: 0,
    pendingAppointments: 0,
    totalPatients: 0,
    completedThisMonth: 0,
    earningsThisMonth: 0,
  });
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

        const todayStr = new Date().toISOString().split("T")[0];

        const [apptsRes, statsRes] = await Promise.all([
          fetch(`/api/appointments?doctor_id=${doctor.id}&appointment_date=${todayStr}`),
          fetch("/api/doctor/stats"),
        ]);

        if (apptsRes.ok) {
          const apptData = await apptsRes.json();
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
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="h-28 bg-white rounded-xl border border-slate-200 p-5"></div>
            <div className="h-28 bg-white rounded-xl border border-slate-200 p-5"></div>
            <div className="h-28 bg-white rounded-xl border border-slate-200 p-5"></div>
            <div className="h-28 bg-white rounded-xl border border-slate-200 p-5"></div>
          </div>
          <div className="h-72 bg-white rounded-xl border border-slate-200"></div>
        </main>
      </div>
    );
  }

  const statCards = [
    {
      label: "Today's Queue",
      value: stats.todayAppointments.toString(),
      subtext: "Scheduled patients today",
    },
    {
      label: "Pending Approval",
      value: stats.pendingAppointments.toString(),
      subtext: "New reservation requests",
    },
    {
      label: "Total Patients Treated",
      value: stats.totalPatients.toString(),
      subtext: "Patients registered in clinic",
    },
    {
      label: "Completed Treatments",
      value: stats.completedThisMonth.toString(),
      subtext: "Current month",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* DOCTOR HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Doctor Practice Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/doctor/schedule">
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs h-10 px-4"
              >
                View Practice Schedule
              </Button>
            </Link>

            <Link href="/doctor/appointments">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs h-10 px-4"
              >
                All Appointments
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                  {s.label}
                </span>
                <h3 className="text-3xl font-extrabold text-blue-700 tracking-tight font-mono mt-2">
                  {s.value}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
                {s.subtext}
              </p>
            </div>
          ))}
        </div>

        {/* TODAY'S QUEUE & APPOINTMENTS */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Today&apos;s Patient Queue
              </h3>
            </div>
            <Link
              href="/doctor/appointments"
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Manage All Queues
            </Link>
          </div>

          {todayList.length === 0 ? (
            <div className="text-center py-16 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
              <h4 className="text-sm font-bold text-slate-800">
                No Patient Queue Today
              </h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                All practice schedules for today are clear or no bookings have been made.
              </p>
              <Link href="/doctor/schedule">
                <Button
                  size="sm"
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  View Full Schedule
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
