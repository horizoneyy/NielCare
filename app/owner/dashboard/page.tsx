"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/shared/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/formatters";
import {
  Users,
  Calendar,
  Stethoscope,
  TrendingUp,
  BarChart3,
  Siren,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  Activity,
  Sparkles,
  ChevronRight,
  Clock,
  ArrowRight,
  DollarSign
} from "lucide-react";

interface MonthlyBreakdown {
  month: string;
  label: string;
  appointments: number;
  revenue: number;
}

interface PriorityBreakdown {
  critical: number;
  moderate: number;
  routine: number;
}

export default function OwnerDashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    totalDoctors: 0,
  });
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyBreakdown[]>([]);
  const [priorityBreakdown, setPriorityBreakdown] = useState<PriorityBreakdown>({
    critical: 0,
    moderate: 0,
    routine: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/owner/stats");
      if (res.ok) {
        const data = await res.json();
        setStats({
          totalPatients: data.totalPatients,
          totalAppointments: data.totalAppointments,
          totalRevenue: data.totalRevenue,
          totalDoctors: data.totalDoctors,
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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  // Skeleton Loader bergaya Soft UI Pro Max
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <Sidebar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="space-y-2">
              <div className="h-8 bg-slate-200/80 rounded-xl w-72"></div>
              <div className="h-4 bg-slate-200/60 rounded-md w-96"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-10 bg-slate-200/80 rounded-xl w-32"></div>
              <div className="h-10 bg-slate-200/80 rounded-xl w-36"></div>
            </div>
          </div>

          {/* KPI Cards Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white rounded-2xl border border-slate-100 shadow-xs p-5">
                <div className="h-4 bg-slate-200/80 rounded w-24 mb-3"></div>
                <div className="h-8 bg-slate-200/70 rounded-lg w-32"></div>
              </div>
            ))}
          </div>

          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="h-80 bg-white rounded-2xl border border-slate-100 shadow-xs"></div>
            <div className="h-80 bg-white rounded-2xl border border-slate-100 shadow-xs"></div>
          </div>
        </main>
      </div>
    );
  }

  const maxRevenue = Math.max(...monthlyBreakdown.map((m) => m.revenue), 1);
  const maxAppts = Math.max(...monthlyBreakdown.map((m) => m.appointments), 1);
  const totalPriorities = priorityBreakdown.critical + priorityBreakdown.moderate + priorityBreakdown.routine;

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* ─── 1. EXECUTIVE HEADER & ACTIONS ───────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/70 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Sistem Operasional Aktif
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                AI Triage Engine v1.5
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Pusat Manajemen Klinik NielCare
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Ringkasan komprehensif performa dokter, antrean janji temu pasien, dan analitik pendapatan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 mr-2 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
              Segarkan Data
            </Button>

            <Link href="/owner/doctors">
              <Button
                variant="outline"
                size="sm"
                className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <Stethoscope className="w-3.5 h-3.5 mr-2 text-indigo-600" />
                Kelola Dokter
              </Button>
            </Link>

            <Link href="/owner/reports">
              <Button
                size="sm"
                className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <BarChart3 className="w-3.5 h-3.5 mr-2 text-emerald-400" />
                Laporan Keuangan
              </Button>
            </Link>
          </div>
        </div>

        {/* ─── 2. 4 EXECUTIVE STAT CARDS (METRICS) ─────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Card 1: Total Pendapatan */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Total Pendapatan</span>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                {formatCurrency(stats.totalRevenue)}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="font-semibold text-emerald-600 flex items-center">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                EMR Selesai
              </span>
              <span>dari tindakan terverifikasi</span>
            </div>
          </div>

          {/* Card 2: Total Pasien */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Pasien Terdaftar</span>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                {stats.totalPatients}
              </h3>
              <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                Pasien Unik
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
              <span>Rekam medis tersinkronisasi</span>
            </div>
          </div>

          {/* Card 3: Total Janji Temu */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Janji Temu</span>
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                {stats.totalAppointments}
              </h3>
              <span className="text-xs text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-full">
                Semua Alur
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              <Activity className="w-3.5 h-3.5 text-purple-500" />
              <span>Kunjungan &amp; konsultasi AI</span>
            </div>
          </div>

          {/* Card 4: Tim Dokter */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">Dokter Praktik</span>
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Stethoscope className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight font-mono">
                {stats.totalDoctors}
              </h3>
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                Tersedia
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>Senin s/d Jumat terjadwal</span>
            </div>
          </div>
        </div>

        {/* ─── 3. GRAFIK KINERJA BULANAN ───────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Chart 1: Janji Temu Bulanan */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Janji Temu per Bulan</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tren kunjungan pasien 6 bulan terakhir</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                6 Bulan Terakhir
              </span>
            </div>

            <div className="flex items-end gap-3 h-48 pt-6 px-2">
              {monthlyBreakdown.map((m) => {
                const heightPercent = Math.max((m.appointments / maxAppts) * 100, 4);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-xs font-bold text-slate-700 opacity-80 group-hover:opacity-100 transition-opacity">
                      {m.appointments}
                    </span>
                    <div className="w-full bg-slate-100 rounded-t-xl overflow-hidden h-36 flex items-end">
                      <div
                        className="w-full rounded-t-xl bg-gradient-to-t from-indigo-600 via-indigo-500 to-sky-400 group-hover:from-indigo-500 group-hover:to-sky-300 transition-all duration-300"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 text-center truncate w-full">
                      {m.label.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 2: Pendapatan Bulanan */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">Pendapatan Klinik per Bulan</h3>
                <p className="text-xs text-slate-500 mt-0.5">Total penerimaan dari tindakan medis EMR selesai</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                Rupiah (IDR)
              </span>
            </div>

            <div className="flex items-end gap-3 h-48 pt-6 px-2">
              {monthlyBreakdown.map((m) => {
                const heightPercent = Math.max((m.revenue / maxRevenue) * 100, 4);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-[10px] font-bold text-slate-600 truncate max-w-full group-hover:text-emerald-600 transition-colors">
                      {m.revenue > 0 ? `${(m.revenue / 1000).toFixed(0)}k` : "0"}
                    </span>
                    <div className="w-full bg-slate-100 rounded-t-xl overflow-hidden h-36 flex items-end">
                      <div
                        className="w-full rounded-t-xl bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300 transition-all duration-300"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 text-center truncate w-full">
                      {m.label.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── 4. AI TRIAGE DISTRIBUTION & EXECUTIVE SUMMARY ───────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Widget Distribusi Triage AI (2 Kolom) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  Distribusi Triase AI Gejala Pasien
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Analisis klasifikasi tingkat urgensi keluhan yang diproses oleh AI
                </p>
              </div>
              <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md font-medium">
                Total {totalPriorities} Kasus
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex gap-1 p-0.5 mb-6">
              <div
                className="bg-rose-500 rounded-full transition-all duration-500"
                style={{ width: totalPriorities > 0 ? `${(priorityBreakdown.critical / totalPriorities) * 100}%` : "33%" }}
                title={`Kritis: ${priorityBreakdown.critical}`}
              />
              <div
                className="bg-amber-400 rounded-full transition-all duration-500"
                style={{ width: totalPriorities > 0 ? `${(priorityBreakdown.moderate / totalPriorities) * 100}%` : "33%" }}
                title={`Sedang: ${priorityBreakdown.moderate}`}
              />
              <div
                className="bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: totalPriorities > 0 ? `${(priorityBreakdown.routine / totalPriorities) * 100}%` : "34%" }}
                title={`Rutin: ${priorityBreakdown.routine}`}
              />
            </div>

            {/* Priority Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-700">
                    <Siren className="w-3.5 h-3.5 text-rose-600" />
                    Kritis (Darurat)
                  </span>
                  <span className="text-sm font-extrabold text-rose-700 font-mono">
                    {priorityBreakdown.critical}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Infeksi akut, abses nanah, nyeri tak tertahankan (Sp.BM / Sp.KG)
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-amber-100 bg-amber-50/40">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Sedang (Moderate)
                  </span>
                  <span className="text-sm font-extrabold text-amber-700 font-mono">
                    {priorityBreakdown.moderate}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Gusi berdarah, gigi berlubang sedang, radang gusi ringan (Sp.Perio)
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/40">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Rutin (Ringan)
                  </span>
                  <span className="text-sm font-extrabold text-emerald-700 font-mono">
                    {priorityBreakdown.routine}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Pembersihan karang gigi (scaling), konsultasi kawat gigi (Sp.Ort)
                </p>
              </div>
            </div>
          </div>

          {/* Executive Overview Highlight Card (1 Kolom) */}
          <div className="relative rounded-2xl p-6 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden shadow-lg flex flex-col justify-between">
            <div className="absolute right-0 top-0 -mt-8 -mr-8 w-44 h-44 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute left-0 bottom-0 -mb-8 -ml-8 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold tracking-widest text-indigo-300 uppercase">
                  Ringkasan Eksekutif
                </span>
                <span className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Klinik NielCare beroperasi dengan sistem reservasi pintar berbasis AI yang memetakan keluhan pasien secara otomatis ke dokter spesialis yang tepat.
              </p>

              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Pasien Terlayani</span>
                  <span className="font-bold text-white font-mono">{stats.totalPatients} Jiwa</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Penerimaan EMR</span>
                  <span className="font-bold text-emerald-400 font-mono">{formatCurrency(stats.totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Dokter Praktik Aktif</span>
                  <span className="font-bold text-white font-mono">{stats.totalDoctors} Dokter</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-6 pt-4 border-t border-slate-800/80">
              <Link
                href="/owner/reports"
                className="inline-flex items-center justify-between w-full text-xs font-semibold text-indigo-300 hover:text-white transition-colors"
              >
                <span>Lihat Laporan Kinerja Lengkap</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
