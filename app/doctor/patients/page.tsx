"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/shared/Sidebar";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/formatters";

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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-72 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-28 bg-white rounded-xl border border-slate-200"></div>
            <div className="h-28 bg-white rounded-xl border border-slate-200"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header (Clean title, no top badge, no subtitle) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Your Patient Directory
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-xs">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Total Patients
              </p>
              <p className="text-base font-extrabold text-blue-700 font-mono">
                {patients.length} Patients
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar (No icon) */}
        <div className="mb-6">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by patient name or email address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 rounded-lg bg-white border-slate-200 text-xs sm:text-sm focus:border-blue-500 shadow-xs px-3.5"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Patient Grid List */}
        {filteredPatients.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-xl">
            <h4 className="text-sm font-bold text-slate-800">
              {searchQuery ? "No Matching Patients" : "No Patients Yet"}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No patients found matching "${searchQuery}".`
                : "Patients who have scheduled an appointment with you will appear here."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredPatients.map((p) => (
              <Link key={p.id} href={`/doctor/patients/${p.id}`} className="group block">
                <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-400 transition-all duration-200 flex items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Avatar className="h-12 w-12 border border-slate-200 flex-shrink-0">
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

                  <div className="text-right flex-shrink-0">
                    <span className="text-base font-extrabold text-blue-700 font-mono">
                      {p.appointmentCount}
                    </span>
                    <p className="text-[10px] text-slate-400 font-medium">Visits</p>
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
