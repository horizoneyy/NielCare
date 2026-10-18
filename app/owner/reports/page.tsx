"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/shared/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateShort } from "@/lib/utils/formatters";
import { BarChart3, TrendingUp, ArrowLeft, RefreshCw, Calendar, Users, DollarSign, Award, ArrowUpRight } from "lucide-react";

interface DailyData {
  date: string;
  count: number;
}

interface DoctorPerf {
  name: string;
  appointments: number;
  revenue: number;
}

export default function OwnerReportsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dailyAppointments, setDailyAppointments] = useState<DailyData[]>([]);
  const [doctorPerformance, setDoctorPerformance] = useState<DoctorPerf[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/owner/reports");
      if (res.ok) {
        const data = await res.json();
        setDailyAppointments(data.dailyAppointments || []);
        setDoctorPerformance(data.doctorPerformance || []);
        setMonthlyRevenue(data.monthlyRevenue || 0);
      }
    } catch (err) {
      console.error("[Owner Reports Error]", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60">
        <Sidebar />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-8 bg-slate-200/80 rounded-xl w-64 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="h-72 bg-white rounded-2xl border border-slate-100"></div>
            <div className="h-72 bg-white rounded-2xl border border-slate-100"></div>
          </div>
          <div className="h-64 bg-white rounded-2xl border border-slate-100"></div>
        </main>
      </div>
    );
  }

  const maxDaily = Math.max(...dailyAppointments.map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/owner/dashboard"
                className="inline-flex items-center text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Dashboard
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Laporan Keuangan &amp; Analitik Klinis
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Evaluasi mendalam penerimaan tindakan medis, performa tim dokter, dan tren antrean harian
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 text-slate-500 ${refreshing ? "animate-spin" : ""}`} />
            Segarkan Laporan
          </Button>
        </div>

        {/* 2 Top Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily chart (7 Days) */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  Kunjungan Harian (7 Hari Terakhir)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Jumlah janji temu yang terjadwal</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                Mingguan
              </span>
            </div>

            <div className="flex items-end gap-3 h-48 pt-6 px-2">
              {dailyAppointments.map((d) => {
                const heightPercent = Math.max((d.count / maxDaily) * 100, 4);
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group">
                    <span className="text-xs font-bold text-slate-700 opacity-80 group-hover:opacity-100 transition-opacity">
                      {d.count}
                    </span>
                    <div className="w-full bg-slate-100 rounded-t-xl overflow-hidden h-36 flex items-end">
                      <div
                        className="w-full rounded-t-xl bg-gradient-to-t from-indigo-600 to-sky-400 group-hover:from-indigo-500 group-hover:to-sky-300 transition-all duration-300"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 text-center truncate w-full">
                      {formatDateShort(d.date).split(",")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Revenue Card */}
          <div className="relative rounded-2xl p-8 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden shadow-lg flex flex-col justify-between">
            <div className="absolute right-0 top-0 -mt-8 -mr-8 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold tracking-widest text-emerald-400 uppercase">
                  Penerimaan Bulan Berjalan
                </span>
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>

              <span className="text-xs text-slate-400">Total Transaksi Selesai:</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-emerald-400 mt-1">
                {formatCurrency(monthlyRevenue)}
              </h2>

              <p className="text-xs text-slate-300 mt-4 leading-relaxed">
                Diakumulasi secara otomatis dari rekam medis elektronik (EMR) yang telah diselesaikan oleh dokter pemeriksa.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Sinkronisasi otomatis
              </span>
              <span className="text-indigo-300 font-medium">Bulan Ini</span>
            </div>
          </div>
        </div>

        {/* Doctor Performance Table */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Laporan Kinerja &amp; Produktivitas Dokter
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rincian total pasien yang dilayani dan total pendapatan tindakan per dokter
              </p>
            </div>
          </div>

          {doctorPerformance.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Belum ada data tindakan medis tercatat untuk periode ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 text-slate-400 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 font-semibold">Nama Dokter</th>
                    <th className="py-3 px-4 font-semibold text-center">Total Kunjungan Pasien</th>
                    <th className="py-3 px-4 font-semibold text-right">Kontribusi Pendapatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctorPerformance.map((d) => (
                    <tr key={d.name} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                          {d.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span>Dr. {d.name}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-700">
                        {d.appointments} Janji Temu
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 text-sm">
                        {formatCurrency(d.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
