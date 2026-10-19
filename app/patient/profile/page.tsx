"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/formatters";
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
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-48 mb-6"></div>
          <div className="h-64 bg-white rounded-xl border border-slate-200 p-8"></div>
        </main>
      </div>
    );
  }

  const birthDateFormatted = user?.date_of_birth
    ? new Date(user.date_of_birth).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="pb-6 border-b border-slate-200 mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Patient Profile
          </h1>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header Banner */}
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border border-slate-200 shadow-xs">
                <AvatarFallback className="bg-emerald-600 text-white font-bold text-lg">
                  {user ? getInitials(user.full_name) : "PS"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{user?.full_name}</h2>
                <div className="mt-1">
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                    Verified Patient
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 4 Essential Fields */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-1">
                  Full Name
                </span>
                <p className="text-base font-bold text-slate-900">{user?.full_name || "-"}</p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-1">
                  WhatsApp / Phone Number
                </span>
                <p className="text-base font-semibold text-slate-800 font-mono">{user?.phone || "-"}</p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-1">
                  Gender
                </span>
                <p className="text-base font-semibold text-slate-800 capitalize">
                  {user?.gender === "male" ? "Male" : user?.gender === "female" ? "Female" : "-"}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase block mb-1">
                  Date of Birth
                </span>
                <p className="text-base font-semibold text-slate-800">{birthDateFormatted}</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Identity information stored in clinic records.</span>
              <span className="text-emerald-700 font-semibold">NielCare Dental Clinic</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
