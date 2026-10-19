"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import type { User } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils/formatters";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function getUser() {
      if (user) return;

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser && isMounted) {
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

  const roleLinks: Record<string, { label: string; href: string }[]> = {
    patient: [
      { label: "Beranda", href: "/patient/dashboard" },
      { label: "Buat Janji", href: "/patient/book" },
      { label: "Riwayat", href: "/patient/appointments" },
      { label: "Profil Saya", href: "/patient/profile" },
    ],
    doctor: [
      { label: "Beranda", href: "/doctor/dashboard" },
      { label: "Janji Temu", href: "/doctor/appointments" },
      { label: "Daftar Pasien", href: "/doctor/patients" },
      { label: "Jadwal", href: "/doctor/schedule" },
      { label: "Ketersediaan", href: "/doctor/availability" },
    ],
    owner: [
      { label: "Beranda", href: "/owner/dashboard" },
      { label: "Daftar Dokter", href: "/owner/doctors" },
      { label: "Laporan Klinik", href: "/owner/reports" },
    ],
  };

  const links = user ? roleLinks[user.role] || [] : [];

  const colorStyles = {
    patient: {
      active: "bg-emerald-50 text-emerald-800 font-bold border-l-4 border-emerald-600",
      hover: "hover:bg-slate-50 hover:text-slate-900",
    },
    doctor: {
      active: "bg-blue-50 text-blue-800 font-bold border-l-4 border-blue-600",
      hover: "hover:bg-slate-50 hover:text-slate-900",
    },
    owner: {
      active: "bg-indigo-50 text-indigo-800 font-bold border-l-4 border-indigo-600",
      hover: "hover:bg-slate-50 hover:text-slate-900",
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
      <div className="md:hidden sticky top-0 z-40 w-full border-b border-slate-200 bg-white px-4 h-16 flex items-center justify-between">
        <Link href={user ? `/${user.role}/dashboard` : "/login"} className="flex items-center">
          <span className="text-xl font-extrabold tracking-tight font-sans">
            <span className="text-slate-900">Niel</span>
            <span className="text-emerald-600">Care</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          {mobileMenuOpen ? "Tutup" : "Menu"}
        </button>
      </div>

      {/* SIDEBAR (DESKTOP) & MOBILE MENU */}
      <aside className={`fixed top-0 left-0 z-50 h-screen w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex flex-col justify-between`}>
        
        {/* Sidebar Header & Links */}
        <div>
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
            <Link
              href={user ? `/${user.role}/dashboard` : "/login"}
              className="flex items-center w-full"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span className="text-2xl font-extrabold tracking-tight font-sans">
                <span className="text-slate-900">Niel</span>
                <span className="text-emerald-600">Care</span>
              </span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1"
            >
              ✕
            </button>
          </div>

          <div className="p-4 space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2.5">
              Menu Utama
            </p>
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3.5 py-2.5 rounded-lg text-xs sm:text-sm transition-all mb-1 ${
                    isActive
                      ? theme.active
                      : `text-slate-600 ${theme.hover}`
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer (User Profile) */}
        {user && (
          <div className="p-4 border-t border-slate-100 bg-slate-50/70">
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <Avatar className="h-9 w-9 border border-slate-200">
                <AvatarFallback className="bg-white text-slate-700 font-bold text-xs">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-800 truncate">
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
              className="w-full justify-center text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-semibold cursor-pointer border border-rose-100 bg-white"
              onClick={handleLogout}
            >
              Keluar Sesi
            </Button>
          </div>
        )}
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-600/20 z-40 backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
}
