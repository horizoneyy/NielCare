"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/shared/Sidebar";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateShort } from "@/lib/utils/formatters";

interface DoctorPerf {
  name: string;
  appointments: number;
  revenue: number;
}

interface DailyAppt {
  date: string;
  count: number;
}

export default function OwnerReportsPage() {
  const [doctorPerformance, setDoctorPerformance] = useState<DoctorPerf[]>([]);
  const [dailyAppointments, setDailyAppointments] = useState<DailyAppt[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchReportData() {
    try {
      const res = await fetch("/api/owner/reports");
      if (res.ok) {
        const data = await res.json();
        setDoctorPerformance(data.doctorPerformance || []);
        setDailyAppointments(data.dailyAppointments || []);
        setMonthlyRevenue(data.monthlyRevenue || 0);
      }
    } catch (err) {
      console.error("[Owner Reports Error]", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    fetchReportData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReportData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-72 mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="h-64 bg-white rounded-xl border border-slate-200"></div>
            <div className="h-64 bg-white rounded-xl border border-slate-200"></div>
          </div>
          <div className="h-80 bg-white rounded-xl border border-slate-200"></div>
        </main>
      </div>
    );
  }

  const maxDaily = Math.max(...dailyAppointments.map((d) => d.count), 1);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section (Clean title, no subtitle, no icons) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Laporan Keuangan &amp; Analitik Klinis
            </h1>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs h-10 px-4"
          >
            {refreshing ? "Menyegarkan..." : "Segarkan Laporan"}
          </Button>
        </div>

        {/* 2 Top Overview Cards (Solid light cards, no gradients, no black) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily chart (7 Days) */}
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                Kunjungan Harian (7 Hari Terakhir)
              </h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Mingguan
              </span>
            </div>

            <div className="flex items-end gap-3 h-48 pt-6 px-2">
              {dailyAppointments.map((d) => {
                const heightPercent = Math.max((d.count / maxDaily) * 100, 4);
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">
                      {d.count}
                    </span>
                    <div className="w-full bg-slate-100 rounded-t-md overflow-hidden h-36 flex items-end">
                      <div
                        className="w-full rounded-t-md bg-blue-600 transition-all duration-300"
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-slate-500 text-center truncate w-full">
                      {formatDateShort(d.date).split(",")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Revenue Card (Solid light card, no dark colors) */}
          <div className="rounded-xl p-6 bg-emerald-50 border border-emerald-200 text-emerald-950 shadow-xs flex flex-col justify-between">
            <div>
              <div className="pb-3 border-b border-emerald-200/60 mb-4">
                <span className="text-xs font-bold tracking-widest text-emerald-800 uppercase">
                  Penerimaan Bulan Berjalan
                </span>
              </div>

              <span className="text-xs text-emerald-800">Total Transaksi Selesai:</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-mono text-emerald-700 mt-1">
                {formatCurrency(monthlyRevenue)}
              </h2>

              <p className="text-xs text-emerald-900 mt-4 leading-relaxed">
                Diakumulasi secara otomatis dari rekam medis elektronik (EMR) yang telah diselesaikan oleh dokter pemeriksa.
              </p>
            </div>

            <div className="pt-4 border-t border-emerald-200/60 flex items-center justify-between text-xs text-emerald-800">
              <span className="font-semibold">Sinkronisasi otomatis</span>
              <span className="font-bold text-emerald-900">Bulan Ini</span>
            </div>
          </div>
        </div>

        {/* Doctor Performance Table (Solid light card) */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="pb-4 border-b border-slate-100 mb-5">
            <h3 className="text-base font-bold text-slate-900">
              Laporan Kinerja &amp; Produktivitas Dokter
            </h3>
          </div>

          {doctorPerformance.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Belum ada data tindakan medis tercatat untuk periode ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-xs">
                    <th className="py-3 px-4 font-bold">Nama Dokter</th>
                    <th className="py-3 px-4 font-bold text-center">Total Kunjungan Pasien</th>
                    <th className="py-3 px-4 font-bold text-right">Kontribusi Pendapatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctorPerformance.map((d) => (
                    <tr key={d.name} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        Dr. {d.name}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-medium text-slate-700">
                        {d.appointments} Janji Temu
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
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
