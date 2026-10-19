"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils/formatters";

import {
  Menu,
  X,
  LogOut,
  Stethoscope,
  LayoutDashboard,
  CalendarDays,
  History,
  User as UserIcon,
  Users,
  Clock,
  CalendarCheck,
  FileBarChart
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function getUser() {
      // Jika user sudah terload, jangan query ulang
      if (user) return;

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser && isMounted) {
        // Ambil dari metadata dulu agar instan
        const pathRole = pathname.startsWith("/owner") ? "owner"
          : pathname.startsWith("/doctor") ? "doctor"
          : "patient";

        const initialUser: User = {
          id: authUser.id,
          email: authUser.email || "",
          username: authUser.email?.split("@")[0] || "user",
          role: authUser.user_metadata?.role || pathRole,
          full_name: authUser.user_metadata?.full_name || authUser.email?.split("@")[0] || "User",
          is_active: true,
          created_at: new Date().toISOString(),
        };
        setUser(initialUser);

        // Fetch detail profil lengkap
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (data && isMounted) {
          setUser(data as User);
        }
      }
    }
    getUser();
    return () => { isMounted = false; };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const roleLinks: Record<string, { label: string; href: string, icon: React.ElementType }[]> = {
    patient: [
      { label: "Beranda", href: "/patient/dashboard", icon: LayoutDashboard },
      { label: "Buat Janji", href: "/patient/book", icon: CalendarPlus },
      { label: "Riwayat", href: "/patient/appointments", icon: History },
      { label: "Profil Saya", href: "/patient/profile", icon: UserIcon },
    ],
    doctor: [
      { label: "Beranda", href: "/doctor/dashboard", icon: LayoutDashboard },
      { label: "Janji Temu", href: "/doctor/appointments", icon: CalendarDays },
      { label: "Daftar Pasien", href: "/doctor/patients", icon: Users },
      { label: "Jadwal", href: "/doctor/schedule", icon: CalendarCheck },
      { label: "Ketersediaan", href: "/doctor/availability", icon: Clock },
    ],
    owner: [
      { label: "Beranda", href: "/owner/dashboard", icon: LayoutDashboard },
      { label: "Daftar Dokter", href: "/owner/doctors", icon: Stethoscope },
      { label: "Laporan Klinik", href: "/owner/reports", icon: FileBarChart },
    ],
  };

  const links = user ? roleLinks[user.role] || [] : [];

  let themeColor = "green";
  if (user?.role === "doctor") themeColor = "blue";
  if (user?.role === "owner") themeColor = "purple";

  const colorStyles = {
    patient: {
      text: "text-emerald-800 font-semibold",
      bg: "bg-emerald-50/90 text-emerald-800 shadow-xs border border-emerald-100/80",
      hover: "hover:bg-emerald-50/50 hover:text-emerald-700",
      gradient: "from-emerald-600 to-teal-500",
      textGradient: "from-emerald-700 to-teal-600",
      indicator: "bg-emerald-600",
    },
    doctor: {
      text: "text-blue-800 font-semibold",
      bg: "bg-blue-50/90 text-blue-800 shadow-xs border border-blue-100/80",
      hover: "hover:bg-blue-50/50 hover:text-blue-700",
      gradient: "from-blue-600 to-indigo-600",
      textGradient: "from-blue-700 to-indigo-600",
      indicator: "bg-blue-600",
    },
    owner: {
      text: "text-indigo-900 font-semibold",
      bg: "bg-indigo-50/90 text-indigo-900 shadow-xs border border-indigo-100/80",
      hover: "hover:bg-indigo-50/50 hover:text-indigo-700",
      gradient: "from-slate-900 via-indigo-950 to-slate-900",
      textGradient: "from-slate-900 to-indigo-700",
      indicator: "bg-indigo-600",
    }
  };

  const userRole = (user?.role || "patient") as keyof typeof colorStyles;
  const theme = colorStyles[userRole] || colorStyles.patient;

  return (
    <>
      {/* GLOBAL STYLE TO PUSH MAIN CONTENT ON DESKTOP */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 768px) {
          main {
            margin-left: 16rem !important; /* 64 = 16rem */
            max-width: calc(100% - 16rem) !important;
            padding-left: 2rem !important;
            padding-right: 2rem !important;
          }
        }
      `}} />

      {/* MOBILE NAVBAR HEADER */}
      <div className="md:hidden sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md px-4 h-16 flex items-center justify-between">
        <Link href={user ? `/${user.role}/dashboard` : "/login"} className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${theme.gradient} shadow-sm text-white`}>
            <Stethoscope className="h-4 w-4" />
          </div>
          <span className={`text-lg font-extrabold tracking-tight bg-gradient-to-r ${theme.textGradient} bg-clip-text text-transparent`}>
            NielCare
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* SIDEBAR (DESKTOP) & MOBILE MENU */}
      <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200/80 transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col justify-between`}>
        
        {/* Sidebar Header & Links */}
        <div>
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
            <Link href={user ? `/${user.role}/dashboard` : "/login"} className="flex items-center gap-2.5 group w-full" onClick={() => setMobileMenuOpen(false)}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br ${theme.gradient} shadow-xs group-hover:scale-105 transition-transform text-white`}>
                <Stethoscope className="h-4 w-4" />
              </div>
              <span className={`text-xl font-extrabold tracking-tight bg-gradient-to-r ${theme.textGradient} bg-clip-text text-transparent`}>
                NielCare
              </span>
            </Link>
            <button onClick={() => setMobileMenuOpen(false)} className="md:hidden p-1 text-slate-400 hover:text-slate-600 cursor-pointer">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2.5">
              Menu Utama
            </p>
            {links.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all mb-1 cursor-pointer ${
                    isActive
                      ? `${theme.bg}`
                      : `text-slate-600 hover:text-slate-900 ${theme.hover}`
                  }`}
                >
                  {isActive && (
                    <span className={`absolute left-0 top-2 bottom-2 w-1 rounded-r-full ${theme.indicator}`} />
                  )}
                  <Icon className={`h-4 w-4 ${isActive ? "" : "text-slate-400"}`} />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer (User Profile) */}
        {user && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <Avatar className="h-9 w-9 border border-slate-200">
                <AvatarFallback className="bg-slate-200/80 text-slate-700 font-bold text-xs">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user.full_name}
                </p>
                <p className="text-[11px] text-slate-500 capitalize">
                  {user.role === 'owner' ? 'Administrator' : user.role === 'patient' ? 'Pasien Klinik' : 'Dokter Praktik'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="h-3.5 w-3.5 mr-2" />
              Keluar Sesi
            </Button>
          </div>
        )}
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-900/20 z-40 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}

// Icon workaround for CalendarPlus
function CalendarPlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <path d="M21 13V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h8" />
      <path d="M3 10h18" />
      <path d="M16 19h6" />
      <path d="M19 16v6" />
    </svg>
  )
}
