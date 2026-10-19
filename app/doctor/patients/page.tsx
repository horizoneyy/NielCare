"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/shared/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/formatters";
import {
  Users,
  Search,
  ChevronRight,
  UserCheck,
  Calendar,
  FileText,
  Activity,
  ArrowRight,
} from "lucide-react";

interface PatientRow {
  id: string;
  full_name: string;
  email: string;
  appointmentCount: number;
}

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchPatients() {
      try {
        const res = await fetch("/api/doctor/stats");
        if (res.ok) {
          const data = await res.json();
          setPatients(data.patients || []);
        }
      } catch (err) {
        console.error("Gagal memuat pasien:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients;
    const q = searchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        p.full_name?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)
    );
  }, [patients, searchQuery]);

  const totalVisits = useMemo(() => {
    return patients.reduce((acc, p) => acc + (p.appointmentCount || 0), 0);
  }, [patients]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60">
        <Sidebar />
        <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-6 bg-slate-200/80 rounded w-48 mb-4"></div>
          <div className="h-10 bg-slate-200/60 rounded-xl w-72 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <span className="text-slate-700 font-semibold">Direktori Pasien</span>
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                Database Pasien Terdaftar
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Direktori Pasien Anda
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pantau riwayat konsultasi, diagnosa berkala, dan data kontak pasien Anda
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Total Pasien
                </p>
                <p className="text-base font-extrabold text-slate-900 font-mono">
                  {patients.length} Orang
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari nama pasien atau alamat email..."
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

        {/* Patient Grid List */}
        {filteredPatients.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-2xl">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {searchQuery ? "Tidak Ada Pasien yang Cocok" : "Belum Ada Pasien"}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `Tidak ditemukan pasien dengan kata kunci "${searchQuery}".`
                : "Pasien yang pernah menjadwalkan janji temu dengan Anda akan muncul di sini."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPatients.map((p) => (
              <Link key={p.id} href={`/doctor/patients/${p.id}`} className="group block">
                <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-blue-300 transition-all duration-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar className="h-12 w-12 border border-slate-100 flex-shrink-0">
                      <AvatarFallback className="bg-blue-50 text-blue-700 font-bold text-sm">
                        {getInitials(p.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                        {p.full_name}
                      </h4>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{p.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-blue-700 font-mono">
                        {p.appointmentCount}
                      </span>
                      <p className="text-[10px] text-slate-400 font-medium">Kunjungan</p>
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-blue-50 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
