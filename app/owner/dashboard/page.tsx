"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/shared/Sidebar";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";

interface MonthlyStats {
  month: string;
  revenue: number;
  appointments: number;
}

export default function OwnerDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalPatients: 0,
    totalAppointments: 0,
    totalDoctors: 0,
  });

  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyStats[]>([]);
  const [priorityBreakdown, setPriorityBreakdown] = useState({
    critical: 0,
    moderate: 0,
    routine: 0,
  });

  const [loading, setLoading] = useState(true);

  async function fetchStats() {
    setLoading(true);
    try {
      const res = await fetch("/api/owner/stats");
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalRevenue: data.totalRevenue || 0,
          totalPatients: data.totalPatients || 0,
          totalAppointments: data.totalAppointments || 0,
          totalDoctors: data.totalDoctors || 0,
        });
        setMonthlyBreakdown(data.monthlyBreakdown || []);
        if (data.priorityBreakdown) {
          setPriorityBreakdown(data.priorityBreakdown);
        }
      }
    } catch (err) {
      console.error("[Owner Dashboard Error]", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-72 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-white rounded-xl border border-slate-200 p-5"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="h-72 bg-white rounded-xl border border-slate-200"></div>
            <div className="h-72 bg-white rounded-xl border border-slate-200"></div>
          </div>
        </main>
      </div>
    );
  }

  const maxRevenue = Math.max(...monthlyBreakdown.map((m) => m.revenue), 1);
  const maxAppts = Math.max(...monthlyBreakdown.map((m) => m.appointments), 1);
  const totalPriorities = priorityBreakdown.critical + priorityBreakdown.moderate + priorityBreakdown.routine;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* EXECUTIVE HEADER (Clean title, no top badge, no subtitle, no icons) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              NielCare Clinic Management Center
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchStats}
              className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs h-10 px-4"
            >
              Refresh Data
            </Button>

            <Link href="/owner/doctors">
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs h-10 px-4"
              >
                Manage Doctors
              </Button>
            </Link>

            <Link href="/owner/reports">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs h-10 px-4"
              >
                Financial Reports
              </Button>
            </Link>
          </div>
        </div>

        {/* 4 STAT CARDS (No icons, solid colors, no black) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Total Revenue</span>
            <div className="mt-2">
              <h3 className="text-2xl font-extrabold text-emerald-700 tracking-tight font-mono">
                {formatCurrency(stats.totalRevenue)}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100">
              EMR-verified treatments
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Registered Patients</span>
            <div className="flex items-baseline justify-between gap-2 mt-2">
              <h3 className="text-2xl font-extrabold text-blue-700 tracking-tight font-mono">
                {stats.totalPatients}
              </h3>
              <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Unique Patients
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100">
              Synchronized medical records
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Appointments</span>
            <div className="flex items-baseline justify-between gap-2 mt-2">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                {stats.totalAppointments}
              </h3>
              <span className="text-xs text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Total Sessions
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100">
              Clinic booking reservations
            </p>
          </div>

          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">Attending Doctors Team</span>
            <div className="flex items-baseline justify-between gap-2 mt-2">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                {stats.totalDoctors}
              </h3>
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Active Specialists
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100">
              Licensed dental practitioners
            </p>
          </div>
        </div>

        {/* CHARTS (Solid light cards, no gradients) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Chart 1: Pendapatan Bulanan */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
            <div className="pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-base font-bold text-slate-900">
                Monthly Revenue (Last 6 Months)
              </h3>
            </div>

            <div className="space-y-4 pt-2">
              {monthlyBreakdown.map((m) => {
                const pct = Math.round((m.revenue / maxRevenue) * 100);
                return (
                  <div key={m.month} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{m.month}</span>
                      <span className="font-bold text-emerald-700 font-mono">
                        {formatCurrency(m.revenue)}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 2: Volume Kunjungan */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
            <div className="pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-base font-bold text-slate-900">
                Patient Appointments Volume (Last 6 Months)
              </h3>
            </div>

            <div className="space-y-4 pt-2">
              {monthlyBreakdown.map((m) => {
                const pct = Math.round((m.appointments / maxAppts) * 100);
                return (
                  <div key={m.month} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{m.month}</span>
                      <span className="font-bold text-blue-700 font-mono">
                        {m.appointments} Appointments
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* AI TRIAGE DISTRIBUTION & EXECUTIVE SUMMARY (Solid light cards, no dark colors) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Widget Distribusi Triage AI (2 Kolom) */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
              <h3 className="text-base font-bold text-slate-900">
                Patient AI Symptom Triage Distribution
              </h3>
              <span className="text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded font-medium">
                Total {totalPriorities} Cases
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex gap-1 p-0.5 mb-6">
              <div
                className="bg-rose-500 rounded-full"
                style={{ width: totalPriorities > 0 ? `${(priorityBreakdown.critical / totalPriorities) * 100}%` : "33%" }}
                title={`Priority: ${priorityBreakdown.critical}`}
              />
              <div
                className="bg-amber-400 rounded-full"
                style={{ width: totalPriorities > 0 ? `${(priorityBreakdown.moderate / totalPriorities) * 100}%` : "33%" }}
                title={`Moderate: ${priorityBreakdown.moderate}`}
              />
              <div
                className="bg-emerald-500 rounded-full"
                style={{ width: totalPriorities > 0 ? `${(priorityBreakdown.routine / totalPriorities) * 100}%` : "34%" }}
                title={`Routine: ${priorityBreakdown.routine}`}
              />
            </div>

            {/* Priority Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-rose-700">Priority / Urgent</span>
                  <span className="text-sm font-extrabold text-rose-700 font-mono">
                    {priorityBreakdown.critical}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Acute infection, dental abscess, severe pain
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-amber-700">Moderate</span>
                  <span className="text-sm font-extrabold text-amber-700 font-mono">
                    {priorityBreakdown.moderate}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Bleeding gums, moderate cavity breakdown
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-emerald-700">Routine</span>
                  <span className="text-sm font-extrabold text-emerald-700 font-mono">
                    {priorityBreakdown.routine}
                  </span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Teeth scaling, routine checkup
                </p>
              </div>
            </div>
          </div>

          {/* Executive Overview Highlight Card (Solid light card, no dark color) */}
          <div className="rounded-xl p-6 bg-indigo-50 border border-indigo-200 text-indigo-950 shadow-xs flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-indigo-200/60 mb-3">
                <span className="text-xs font-bold tracking-widest text-indigo-800 uppercase">
                  Executive Summary
                </span>
              </div>

              <p className="text-xs text-indigo-900 leading-relaxed mb-5">
                NielCare Dental operates with an intelligent AI-assisted reservation system that routes patient symptoms directly to the appropriate dental specialist.
              </p>

              <div className="space-y-3 pt-2 border-t border-indigo-200/60">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-700">Total Patients Treated</span>
                  <span className="font-bold text-indigo-950 font-mono">{stats.totalPatients} Patients</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-700">Total EMR Revenue</span>
                  <span className="font-bold text-emerald-700 font-mono">{formatCurrency(stats.totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-700">Active Practice Doctors</span>
                  <span className="font-bold text-indigo-950 font-mono">{stats.totalDoctors} Doctors</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-indigo-200/60">
              <Link
                href="/owner/reports"
                className="text-xs font-bold text-indigo-700 hover:underline block text-center"
              >
                View Full Performance Reports →
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
