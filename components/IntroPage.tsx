"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  Phone,
  Mail,
  Clock,
  UserCheck,
  UserPlus,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

function ToothIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2C8.8 2 6.5 4.2 6.5 7.5c0 2.3.6 4.6 1 7.2.5 2.8 1.4 6.3 2.8 6.3 1.3 0 1.5-2.5 1.7-2.5s.4 2.5 1.7 2.5c1.4 0 2.3-3.5 2.8-6.3.4-2.6 1-4.9 1-7.2C17.5 4.2 15.2 2 12 2z" />
      <path d="M9 7.5a3.5 3.5 0 0 1 6 0" />
    </svg>
  );
}

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

  // Active section indicator state
  const [activeSection, setActiveSection] = useState<string>("home");

  // Autoplay video secara eksplisit pada DOM element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  // Scroll spy to update active indicator
  useEffect(() => {
    const handleScroll = () => {
      const sections = ["home", "about", "services", "book-online"];
      const scrollPosition = window.scrollY + 180;
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth dynamic scroll handler (durasi proporsional jarak perpindahan)
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    setMobileMenuOpen(false);

    const navHeight = 85;
    const elementPosition = element.getBoundingClientRect().top + window.scrollY;
    const targetPosition = Math.max(0, elementPosition - navHeight);
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;

    // Kecepatan dinamis proporsional jarak antar seksi (cepat & mulus tanpa teleport)
    const duration = Math.min(650, Math.max(280, Math.abs(distance) * 0.32));
    let startTime: number | null = null;

    const easeInOutCubic = (t: number) => {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const animation = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      window.scrollTo(0, startPosition + distance * ease);

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        setActiveSection(id);
      }
    };

    requestAnimationFrame(animation);
  };

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
      {/* 1. FLOATING GLASSMORPHISM NAVBAR DENGAN INDIKATOR AKTIF              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-4 z-50 px-4 sm:px-8 max-w-7xl mx-auto">
        <nav className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-emerald-950/5 rounded-full px-6 py-3 flex items-center justify-between transition-all">
          {/* Brand Logo dengan Ikon Gigi (Tooth) */}
          <button
            type="button"
            onClick={() => scrollToSection("home")}
            className="flex items-center gap-2 group cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-xs transition-transform group-hover:scale-105">
              <ToothIcon className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight text-slate-900">
              Niel<span className="text-emerald-500 font-extrabold">Care</span>
            </span>
          </button>

          {/* Center Links (Desktop) - Bersih Tanpa Background Kotak Pembungkus */}
          <div className="hidden md:flex items-center gap-7 text-xs font-semibold">
            {[
              { id: "home", label: "Home" },
              { id: "about", label: "About" },
              { id: "services", label: "Our Service" },
              { id: "book-online", label: "Book Online" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={`relative py-1 cursor-pointer transition-colors duration-200 ${
                  activeSection === item.id
                    ? "text-emerald-700 font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <span>{item.label}</span>
                {activeSection === item.id && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-emerald-600 rounded-full animate-fade-in" />
                )}
              </button>
            ))}
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
          <div className="md:hidden mt-2 bg-white/90 backdrop-blur-xl rounded-3xl p-5 border border-white/80 shadow-xl space-y-2 animate-fade-in">
            {[
              { id: "home", label: "Home" },
              { id: "about", label: "About" },
              { id: "services", label: "Our Service" },
              { id: "book-online", label: "Book Online" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={`w-full text-left block px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${
                  activeSection === item.id
                    ? "text-emerald-700 bg-emerald-50/70 font-bold"
                    : "text-slate-700 hover:text-emerald-700"
                }`}
              >
                {item.label}
              </button>
            ))}
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
      {/* 2. HERO SECTION (HOME - VIDEO BARU MURNI TANPA LINGKARAN AURA)      */}
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
                <button
                  type="button"
                  onClick={() => scrollToSection("book-online")}
                  className="inline-flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full font-semibold text-sm transition-all duration-300 shadow-md shadow-emerald-600/25 active:scale-95 group cursor-pointer"
                >
                  <span>Book Now</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollToSection("about")}
                  className="text-xs sm:text-sm font-semibold text-slate-700 hover:text-emerald-700 px-5 py-4 transition-colors cursor-pointer"
                >
                  Explore Clinic &darr;
                </button>
              </div>
            </div>

            {/* Right Visual: Clean Expansive Video Gigi Baru (Tanpa Lingkaran Aura) */}
            <div className="lg:col-span-7 relative flex items-center justify-center lg:justify-end reveal-blur">
              <div className="w-full max-w-xl lg:max-w-2xl xl:max-w-3xl flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  className="w-full h-auto max-h-[580px] object-contain rounded-2xl drop-shadow-xl"
                >
                  <source src="/videos/gemini_generated_video_1e5ea4ae.mp4" type="video/mp4" />
                  <source src="/gemini_generated_video_1e5ea4ae.mp4" type="video/mp4" />
                  Browser Anda tidak mendukung pemutar video.
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 3. ABOUT SECTION (VISI ANDI DANIEL & PENJELASAN SISTEM NIELCARE)    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="about" className="w-full bg-[#f8fafc] border-b border-slate-200/90 py-20 md:py-28">
        <div className="px-4 sm:px-8 max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-10 reveal-blur">
            About
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Card: Mission Quote by Andi Daniel (Tanpa Badge Our Mission) */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 flex flex-col justify-between shadow-xs reveal-blur">
              <div className="space-y-6">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-900 leading-snug tracking-tight">
                  Help you achieve the best dental care easily, quickly, and professionally for a lifetime of{" "}
                  <span className="text-emerald-600 font-bold">healthy, confident smiles</span>.
                </h3>
              </div>

              <div className="pt-8 text-right">
                <p className="text-sm font-bold text-slate-800 tracking-wide">— drg. Andi Daniel</p>
              </div>
            </div>

            {/* Right Card: Penjelasan Sistem NielCare Dental (Menggantikan Kartu Foto) */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 flex flex-col justify-between shadow-xs reveal-blur space-y-6">
              <div className="space-y-5">
                <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                  Sistem Manajemen Klinik Modern NielCare
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Platform pelayanan kesehatan gigi terintegrasi yang menghadirkan efisiensi dan kemudahan akses bagi seluruh pasien dan staf medis:
                </p>

                <div className="space-y-3.5 pt-1">
                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 text-xs font-bold">
                      01
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-800">Triage Analisis Gejala AI</h5>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Evaluasi keluhan awal otomatis berbasis AI untuk menentukan tingkat urgensi dan rekomendasi dokter spesialis yang paling tepat.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 text-xs font-bold">
                      02
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-800">Booking Cepat via Nomor HP</h5>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Pendaftaran pasien baru ringkas dan reservasi pasien lama cukup satu nomor HP tanpa perlu mengingat akun atau kata sandi.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 text-xs font-bold">
                      03
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-800">Rekam Medis Elektronik (EMR)</h5>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                        Integrasi pencatatan odontogram, riwayat diagnosa, tindakan, dan jadwal dokter secara terpusat dan aman.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 4. OUR SERVICE SECTION (VIEW ONLY - TANPA DOKTER GIGI UMUM & BADGE) */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="services" className="w-full bg-[#f0fdf4]/50 border-b border-emerald-100 py-20 md:py-28">
        <div className="px-4 sm:px-8 max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-10 reveal-blur">
            Our Service
          </h2>

          {/* Grid Kartu Layanan Resmi NielCare (View Only - Tanpa Dokter Gigi Umum & Tanpa Badge) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 reveal-blur">
            {[
              {
                id: "Orthodontist",
                title: "Ortodontis",
                desc: "Pemasangan kawat gigi (behel) konvensional dan aligner gigi transparan.",
              },
              {
                id: "Periodontist",
                title: "Periodonsia",
                desc: "Perawatan kesehatan gusi, radang gingivitis, dan scaling pembersihan karang mendalam.",
              },
              {
                id: "Endodontist",
                title: "Endodontis",
                desc: "Perawatan saluran akar saraf gigi, pulpa gigi berlubang dalam, dan konservasi gigi.",
              },
              {
                id: "Prosthodontist",
                title: "Prostodontis",
                desc: "Pembuatan gigi tiruan lepasan/permanen, mahkota jembatan (crown & bridge), dan restorasi.",
              },
              {
                id: "Oral Surgeon",
                title: "Bedah Mulut",
                desc: "Operasi cabut gigi bungsu (odontektomi), implan gigi titanium permanen, dan bedah mulut minor.",
              },
              {
                id: "Pediatric Dentist",
                title: "Dokter Gigi Anak",
                desc: "Perawatan kesehatan gigi khusus bayi dan anak-anak dengan pendekatan ramah tanpa trauma.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-emerald-200/80 rounded-3xl p-6 sm:p-7 text-left shadow-2xs hover:shadow-xs transition-shadow"
              >
                <h4 className="font-bold text-lg text-slate-800">
                  {item.title}
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 mt-2.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 5. BOOK ONLINE NOW SECTION (HAPUS TITIK HIJAU PADA FORMULIR)       */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section id="book-online" className="w-full bg-[#f8fafc] border-b border-slate-200 py-20 md:py-28">
        <div className="px-4 sm:px-8 max-w-7xl mx-auto">
          <div className="max-w-xl mx-auto bg-white border border-emerald-200/90 rounded-3xl p-6 sm:p-10 shadow-lg reveal-blur">
            {/* Form Header Tanpa Titik Hijau */}
            <div className="text-center mb-6">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                Book Online Now
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
                className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
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
                className={`py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
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
                  className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 mt-2 cursor-pointer"
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
                  className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs sm:text-sm font-bold rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 mt-2 cursor-pointer"
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
      {/* 6. FOOTER / BOTTOM PAGE (CLINIC HOURS SELARAS DENGAN HUBUNGI KAMI)  */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <footer className="w-full bg-slate-100 text-slate-700 pt-16 pb-12 border-t-2 border-emerald-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
            {/* Brand & Description */}
            <div className="md:col-span-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shadow-xs">
                  <ToothIcon className="w-4 h-4 text-white" />
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

            {/* Clinic Hours (Tanpa Card, Format Bersih Sama dengan Hubungi Kami) */}
            <div className="md:col-span-4 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 block">
                Clinic Hours
              </span>
              <div className="space-y-2 text-xs sm:text-sm text-slate-700">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-medium text-slate-800">
                      Minggu - Kamis: <span className="font-semibold text-slate-900">8am - 5pm</span>
                    </p>
                    <p className="font-medium text-slate-800">
                      Jumat: <span className="font-semibold text-slate-900">8am - 4pm</span>
                    </p>
                    <p className="font-medium text-rose-600">
                      Sabtu: Closed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links Nav */}
          <div className="pt-8 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => scrollToSection("about")}
                className="hover:text-emerald-700 transition-colors cursor-pointer"
              >
                About
              </button>
              <button
                type="button"
                onClick={() => scrollToSection("services")}
                className="hover:text-emerald-700 transition-colors cursor-pointer"
              >
                Our Services
              </button>
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

