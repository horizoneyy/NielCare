"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Smile,
  ArrowRight,
  Phone,
  Mail,
  Clock,
  MapPin,
  UserCheck,
  UserPlus,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

function InstagramIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
    </svg>
  );
}

export default function IntroPage() {
  const router = useRouter();
  const supabase = createClient();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Autoplay video secara eksplisit pada DOM element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Form Booking Online State (Pasien Baru vs Pasien Lama)
  const [patientTab, setPatientTab] = useState<"new" | "existing">("new");
  const [fullName, setFullName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [newPhone, setNewPhone] = useState("");
  const [existingPhone, setExistingPhone] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  // Scroll reveal observer (Blur to clear animation on scroll up and down)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -30px 0px",
      }
    );

    const revealElements = document.querySelectorAll(".reveal-blur");
    revealElements.forEach((el) => observer.observe(el));

    return () => {
      revealElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  // ─── 1. SUBMIT PASIEN BARU ───────────────────────────────────────────────
  const handleSubmitNewPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!fullName.trim() || !dateOfBirth || !gender || !newPhone.trim()) {
      setFormError("Nama, tanggal lahir, jenis kelamin, dan nomor HP wajib diisi.");
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch("/api/auth/patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          full_name: fullName.trim(),
          date_of_birth: dateOfBirth,
          gender,
          phone: newPhone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "already_registered") {
          setFormError("Nomor HP sudah terdaftar. Mengalihkan Anda ke Pasien Lama...");
          setExistingPhone(newPhone.trim());
          setTimeout(() => {
            setPatientTab("existing");
            setFormError("Nomor HP Anda sudah terdaftar di sistem. Cukup klik 'Masuk ke Dashboard'.");
          }, 1200);
          setFormLoading(false);
          return;
        }

        setFormError(data.message || data.error || "Gagal mendaftarkan pasien.");
        setFormLoading(false);
        return;
      }

      if (data.email && data.password) {
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
      }

      router.push("/patient/dashboard");
      router.refresh();
    } catch {
      setFormError("Gagal menghubungi server klinik. Periksa koneksi internet Anda.");
      setFormLoading(false);
    }
  };

  // ─── 2. SUBMIT PASIEN LAMA ───────────────────────────────────────────────
  const handleSubmitExistingPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!existingPhone.trim()) {
      setFormError("Harap masukkan nomor HP Anda.");
      return;
    }

    setFormLoading(true);
    try {
      const res = await fetch("/api/auth/patient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lookup",
          phone: existingPhone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "not_found") {
          setFormError("Nomor HP belum terdaftar. Silakan pilih tab 'Pasien Baru' untuk mendaftar.");
        } else {
          setFormError(data.message || data.error || "Gagal memverifikasi nomor HP.");
        }
        setFormLoading(false);
        return;
      }

      setFormSuccess(`Selamat datang kembali, ${data.patient?.full_name}! Memuat dashboard Anda...`);

      if (data.email && data.password) {
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
      }

      router.push("/patient/dashboard");
      router.refresh();
    } catch {
      setFormError("Gagal menghubungi server klinik. Periksa koneksi internet Anda.");
      setFormLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900 scroll-smooth">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. FLOATING PILL NAVBAR (BATAS HEADER JELAS & KONTRAS TINGGI)       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-4 z-50 px-4 sm:px-8 max-w-7xl mx-auto">
        <nav className="bg-white/95 backdrop-blur-md border border-slate-300/90 rounded-full px-6 py-3.5 shadow-md flex items-center justify-between transition-all">
          {/* Brand Logo */}
          <Link href="#home" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105">
              <Smile className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">
              Niel<span className="text-emerald-500 font-extrabold">Care</span>
            </span>
          </Link>

          {/* Center Pill Menu (Desktop) */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/50 text-xs font-semibold text-slate-600">
            <a
              href="#home"
              className="px-4 py-1.5 rounded-full hover:text-slate-900 hover:bg-white transition-all"
            >
              Home
            </a>
            <a
              href="#about"
              className="px-4 py-1.5 rounded-full hover:text-slate-900 hover:bg-white transition-all"
            >
              About
            </a>
            <a
              href="#services"
              className="px-4 py-1.5 rounded-full hover:text-slate-900 hover:bg-white transition-all"
            >
              Our Service
            </a>
            <a
              href="#book-online"
              className="px-4 py-1.5 rounded-full hover:text-slate-900 hover:bg-white transition-all"
            >
              Book Online
            </a>
          </div>

          {/* Right Action: Login Dokter & Admin (Staff Login) */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-all duration-200 shadow-xs active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              <span>Login Dokter & Admin</span>
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full hover:bg-slate-100 text-slate-700"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-2 bg-white rounded-3xl p-5 border border-slate-200 shadow-xl space-y-3 animate-fade-in">
            <a
              href="#home"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700"
            >
              Home
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700"
            >
              About
            </a>
            <a
              href="#services"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700"
            >
              Our Service
            </a>
            <a
              href="#book-online"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-700"
            >
              Book Online
            </a>
            <div className="pt-2 border-t border-slate-100">
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-3 rounded-2xl shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>Login Dokter & Admin</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2. HERO SECTION (HOME - FULL SCREEN VIEWPORT DENGAN HOLOGRAM 3D)    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section
        id="home"
        className="relative w-full bg-gradient-to-b from-emerald-50/70 via-teal-50/25 to-white border-b border-emerald-100/60 overflow-hidden"
      >
        <div className="min-h-[calc(100vh-5rem)] flex items-center py-8 md:py-12 px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center w-full">
            {/* Left Text Content */}
            <div className="lg:col-span-5 space-y-6 z-10 reveal-blur">
              <div className="space-y-1">
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
                  Your Smile,
                </h1>
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
                  <span className="text-emerald-600">Our</span>{" "}
                  <span className="text-slate-900">Priority</span>
                </h1>
              </div>

              <p className="text-base sm:text-lg text-slate-600 max-w-md leading-relaxed font-normal">
                Welcome to NielCare. Get the best dental care easily, quickly, and professionally.
              </p>

              <div className="pt-2 flex items-center gap-4">
                <a
                  href="#book-online"
                  className="inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full font-semibold text-sm transition-all duration-300 shadow-md shadow-emerald-600/25 active:scale-95 group"
                >
                  <span>Book Now</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </a>
                <a
                  href="#about"
                  className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-emerald-700 px-5 py-4 transition-colors"
                >
                  Explore Clinic &darr;
                </a>
              </div>
            </div>

            {/* Right Visual: Clean Expansive Video Gigi (Tanpa Card, Tanpa HUD Card, Tanpa Laser Bar) */}
            <div className="lg:col-span-7 relative flex items-center justify-center lg:justify-end reveal-blur">
              {/* Hologram Aura Radial Light Waves Background */}
              <div
                className="absolute w-[350px] sm:w-[500px] lg:w-[650px] h-[350px] sm:h-[500px] lg:h-[650px] rounded-full animate-aura pointer-events-none -z-10"
                style={{
                  background:
                    "radial-gradient(circle, rgba(6, 182, 212, 0.22) 0%, rgba(16, 185, 129, 0.18) 35%, rgba(99, 102, 241, 0.08) 60%, transparent 75%)",
                }}
              />

              {/* Clean Video Embed */}
              <div className="w-full max-w-xl lg:max-w-2xl xl:max-w-3xl flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  className="w-full h-auto max-h-[580px] object-contain rounded-2xl drop-shadow-2xl"
                >
                  <source src="/gemini_generated_video_e36851c1.mp4" type="video/mp4" />
                  <source src="/videos/gemini_generated_video_e36851c1.mp4" type="video/mp4" />
                  Browser Anda tidak mendukung pemutar video.
                </video>
              </div>
            </div>
        </div>
      </div>
    </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. ABOUT SECTION (WARNA TERANG SLATE-50 BERSIH DENGAN AKSEN JELAS) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="about" className="w-full bg-[#f8fafc] border-b border-slate-200/90 py-20 md:py-28">
        <div className="px-4 sm:px-8 max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-10 reveal-blur">
            About
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Card: Mission Quote by Andi Daniel */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 flex flex-col justify-between shadow-xs reveal-blur">
              <div className="space-y-6">
                <span className="text-xs font-bold tracking-widest uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/60 inline-block">
                  Our Mission
                </span>
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-900 leading-snug tracking-tight">
                  Help you achieve the best dental care easily, quickly, and professionally for a lifetime of{" "}
                  <span className="text-emerald-600 font-bold">healthy, confident smiles</span>.
                </h3>
              </div>

              <div className="pt-8 text-right">
                <p className="text-sm font-bold text-slate-800 tracking-wide">— Andi Daniel</p>
              </div>
            </div>

            {/* Right Card: Modern Treatment Room Photo with Floating Mini Thumbnails */}
            <div className="lg:col-span-5 relative rounded-3xl overflow-hidden min-h-[380px] sm:min-h-[460px] shadow-lg border border-slate-200 bg-white reveal-blur">
              <Image
                src="/images/dental_clinic_about.jpg"
                alt="Klinik NielCare Dental Interior"
                fill
                className="object-cover object-center hover:scale-103 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-linear-to-t from-slate-900/20 via-transparent to-transparent pointer-events-none" />

              {/* Floating Mini Circle Badges */}
              <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-white/80 shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500 shadow-xs relative">
                    <Image src="/images/dental_tool_service.jpg" alt="Tools" fill className="object-cover" />
                  </div>
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-xs relative">
                    <Image src="/images/dental_white_tooth.jpg" alt="Tooth" fill className="object-cover" />
                  </div>
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-xs relative">
                    <Image src="/images/dental_aligner_hero.jpg" alt="Aligner" fill className="object-cover" />
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-800 tracking-tight pr-2">
                  NielCare Dental Clinic
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. OUR SERVICE SECTION (WARNA TERANG SEGAR MINT/EMERALD TINT)       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="services" className="w-full bg-[#f0fdf4]/50 border-b border-emerald-100 py-20 md:py-28">
        <div className="px-4 sm:px-8 max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-10 reveal-blur">
            Our Service
          </h2>

          {/* Grid Kartu Layanan Resmi NielCare (7 Spesialisasi Resmi Sistem) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 reveal-blur">
            {[
              {
                id: "General Dentist",
                title: "Dokter Gigi Umum",
                badge: "General",
                desc: "Pemeriksaan rutin, penambalan gigi komposit, dan pembersihan plak/karang gigi.",
              },
              {
                id: "Orthodontist",
                title: "Ortodontis",
                badge: "Sp.Ort",
                desc: "Pemasangan kawat gigi (behel) konvensional dan aligner gigi transparan.",
              },
              {
                id: "Periodontist",
                title: "Periodonsia",
                badge: "Sp.Perio",
                desc: "Perawatan kesehatan gusi, radang gingivitis, dan scaling pembersihan karang mendalam.",
              },
              {
                id: "Endodontist",
                title: "Endodontis",
                badge: "Sp.KG",
                desc: "Perawatan saluran akar saraf gigi, pulpa gigi berlubang dalam, dan konservasi gigi.",
              },
              {
                id: "Prosthodontist",
                title: "Prostodontis",
                badge: "Sp.Pros",
                desc: "Pembuatan gigi tiruan lepasan/permanen, mahkota jembatan (crown & bridge), dan restorasi.",
              },
              {
                id: "Oral Surgeon",
                title: "Bedah Mulut",
                badge: "Sp.BM",
                desc: "Operasi cabut gigi bungsu (odontektomi), implan gigi titanium permanen, dan bedah mulut minor.",
              },
              {
                id: "Pediatric Dentist",
                title: "Dokter Gigi Anak",
                badge: "Sp.KGA",
                desc: "Perawatan kesehatan gigi khusus bayi dan anak-anak dengan pendekatan ramah tanpa trauma.",
              },
            ].map((item, idx) => (
              <a
                key={idx}
                href="#book-online"
                className="bg-white hover:bg-emerald-50/40 border border-emerald-200/80 hover:border-emerald-400 rounded-3xl p-6 sm:p-7 text-left transition-all duration-200 hover:shadow-md group block relative overflow-hidden shadow-2xs"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    {item.badge}
                  </span>
                  <span className="text-xs text-slate-400 group-hover:text-emerald-600 transition-colors flex items-center gap-1 font-medium">
                    Book <ArrowRight className="w-3.5 h-3.5 inline group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
                <h4 className="font-bold text-lg text-slate-800 group-hover:text-emerald-700 transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  {item.desc}
                </p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 5. BOOK ONLINE NOW SECTION (WARNA TERANG SLATE-50 DENGAN KARTU PUTIH) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="book-online" className="w-full bg-[#f8fafc] border-b border-slate-200 py-20 md:py-28">
        <div className="px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="max-w-xl mx-auto bg-white border border-emerald-200/90 rounded-3xl p-6 sm:p-10 shadow-lg reveal-blur">
            {/* Form Header */}
            <div className="text-center mb-6">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 flex items-center justify-center gap-1">
                Book Online Now<span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block ml-1" />
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-2">
                Nomor HP Anda menjadi pengenal unik pasien di NielCare Dental.
              </p>
            </div>

            {/* Tab Selector: Pasien Baru vs Pasien Lama */}
            <div className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-2xl mb-6 border border-slate-200/80">
              <button
                type="button"
                onClick={() => {
                  setPatientTab("new");
                  setFormError("");
                  setFormSuccess("");
                }}
                className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  patientTab === "new"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Pasien Baru</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPatientTab("existing");
                  setFormError("");
                  setFormSuccess("");
                }}
                className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
                  patientTab === "existing"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Pasien Lama</span>
              </button>
            </div>

            {/* Alerts */}
            {formError && (
              <div className="flex items-center gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl p-3.5 mb-5 animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 mb-5 animate-fade-in">
                <UserCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* FORM PASIEN BARU */}
            {patientTab === "new" && (
              <form onSubmit={handleSubmitNewPatient} className="space-y-4" autoComplete="off">
                <div>
                  <label className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase block mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Contoh: Andi Daniel"
                    className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase block mb-1">
                      Tanggal Lahir *
                    </label>
                    <input
                      type="date"
                      required
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase block mb-1">
                      Jenis Kelamin *
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as "male" | "female")}
                      className="w-full px-4 py-3 rounded-2xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all text-slate-800 h-[46px]"
                    >
                      <option value="male">Laki-laki</option>
                      <option value="female">Perempuan</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase block mb-1">
                    Nomor HP (WhatsApp) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      placeholder="08123456789"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all text-slate-800"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 mt-2"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Mendaftarkan...
                    </>
                  ) : (
                    <>
                      Daftar & Masuk ke Dashboard <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* FORM PASIEN LAMA */}
            {patientTab === "existing" && (
              <form onSubmit={handleSubmitExistingPatient} className="space-y-4" autoComplete="off">
                <div>
                  <label className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase block mb-1">
                    Nomor HP Terdaftar *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={existingPhone}
                      onChange={(e) => setExistingPhone(e.target.value)}
                      placeholder="Contoh: 08123456789"
                      className="w-full pl-11 pr-4 py-3 rounded-2xl text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition-all text-slate-800"
                    />
                  </div>
                  <p className="text-[11px] text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                    Sistem akan mencari nomor Anda di database dan data lama Anda akan terisi otomatis, tanpa perlu daftar nama dan tanpa kata sandi.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 mt-2"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Mencari Data Pasien...
                    </>
                  ) : (
                    <>
                      Masuk ke Dashboard <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 6. FOOTER / BOTTOM PAGE (WARNA TERANG BERSIH, TEGAS TANPA HITAM)    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <footer className="w-full bg-slate-100 text-slate-700 pt-16 pb-12 border-t-2 border-emerald-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
            {/* Brand & Description */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs">
                  <Smile className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight text-slate-900">
                  Niel<span className="text-emerald-600 font-extrabold">Care</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm">
                NielCare Dental Clinic menyediakan pelayanan kesehatan gigi modern dengan teknologi triage AI, memastikan perawatan yang nyaman, cepat, dan profesional.
              </p>
            </div>

            {/* Contact Details */}
            <div className="md:col-span-3 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                Hubungi Kami
              </span>
              <div className="space-y-2.5 text-xs sm:text-sm text-slate-700">
                <a
                  href="tel:081244790007"
                  className="flex items-center gap-2.5 hover:text-emerald-700 transition-colors"
                >
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">081244790007</span>
                </a>
                <a
                  href="mailto:neyy0127@gmail.com"
                  className="flex items-center gap-2.5 hover:text-emerald-700 transition-colors"
                >
                  <Mail className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">neyy0127@gmail.com</span>
                </a>
                <a
                  href="https://instagram.com/andniell_"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 hover:text-emerald-700 transition-colors"
                >
                  <InstagramIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium">@andniell_</span>
                </a>
              </div>
            </div>

            {/* Clinic Hours */}
            <div className="md:col-span-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                Clinic Hours
              </span>
              <div className="space-y-2.5 text-xs sm:text-sm text-slate-700 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="font-medium text-slate-700">Minggu - Kamis</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs">8am - 5pm</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="font-medium text-slate-700">Jumat</span>
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-0.5 rounded-full text-xs">8am - 4pm</span>
                </div>
                <div className="flex justify-between items-center pt-0.5">
                  <span className="font-medium text-slate-700">Sabtu</span>
                  <span className="font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-full text-xs">Closed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links Nav */}
          <div className="pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-6">
              <a href="#about" className="hover:text-emerald-700 transition-colors">
                About
              </a>
              <a href="#services" className="hover:text-emerald-700 transition-colors">
                Our Services
              </a>
              <a
                href="https://instagram.com/andniell_"
                target="_blank"
                rel="noreferrer"
                className="hover:text-emerald-700 transition-colors flex items-center gap-1.5"
              >
                <InstagramIcon className="w-3.5 h-3.5" /> Instagram (@andniell_)
              </a>
            </div>
            <p className="text-slate-500">&copy; {new Date().getFullYear()} NielCare Dental. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

