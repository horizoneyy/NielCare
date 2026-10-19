"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials, formatDate } from "@/lib/utils/formatters";
import { ArrowLeft, User as UserIcon, Phone, Calendar, ShieldCheck, HeartPulse } from "lucide-react";
import type { User } from "@/types";

export default function PatientProfilePage() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) return;
        const { data } = await supabase.from("users").select("*").eq("id", authUser.id).single();
        if (data) {
          setUser(data as User);
        } else {
          setUser({
            id: authUser.id,
            email: authUser.email || "",
            username: authUser.user_metadata?.phone || authUser.email?.split("@")[0] || "user",
            full_name: authUser.user_metadata?.full_name || "Pasien",
            phone: authUser.user_metadata?.phone || "",
            gender: "male",
            role: "patient",
            is_active: true,
            created_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60">
        <Sidebar />
        <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-8 bg-slate-200/80 rounded-xl w-48 mb-6"></div>
          <div className="h-64 bg-white rounded-2xl border border-slate-100 p-8"></div>
        </main>
      </div>
    );
  }

  const birthDateFormatted = user?.date_of_birth
    ? new Date(user.date_of_birth).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="pb-6 border-b border-slate-200/70 mb-8">
          <Link
            href="/patient/dashboard"
            className="inline-flex items-center text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Dashboard Pasien
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Profil Identitas Pasien
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Data rekam identitas terdaftar Anda di sistem klinik NielCare Dental
          </p>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Header Banner */}
          <div className="p-6 bg-gradient-to-r from-emerald-50 via-teal-50 to-white border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                <AvatarFallback className="bg-emerald-600 text-white font-bold text-lg">
                  {user ? getInitials(user.full_name) : "PS"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{user?.full_name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Pasien Terverifikasi
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Essential Fields (INS-013) */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mb-1">
                  <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                  Nama Lengkap
                </span>
                <p className="text-base font-bold text-slate-900">{user?.full_name || "-"}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mb-1">
                  <Phone className="w-3.5 h-3.5 text-blue-600" />
                  Nomor WhatsApp / HP
                </span>
                <p className="text-base font-semibold text-slate-800 font-mono">{user?.phone || "-"}</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mb-1">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                  Jenis Kelamin
                </span>
                <p className="text-base font-semibold text-slate-800 capitalize">
                  {user?.gender === "male" ? "Laki-laki" : user?.gender === "female" ? "Perempuan" : "-"}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase flex items-center gap-1.5 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  Tanggal Lahir
                </span>
                <p className="text-base font-semibold text-slate-800">{birthDateFormatted}</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Informasi identitas bersifat baca-saja.</span>
              <span className="text-emerald-700 font-medium">Klinik Gigi NielCare</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
