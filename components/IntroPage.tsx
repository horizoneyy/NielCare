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

  // ─── TYPEWRITER EFFECT: HERO HEADLINE ("Your Smile, Our Priority") ───
  const [heroTyped1, setHeroTyped1] = useState("");
  const [heroTyped2, setHeroTyped2] = useState("");
  const [heroStep, setHeroStep] = useState<"line1" | "line2" | "done">("line1");

  useEffect(() => {
    const text1 = "Your Smile,";
    const text2 = "Our Priority";
    let i1 = 0;
    let i2 = 0;

    const timer1 = setInterval(() => {
      i1++;
      setHeroTyped1(text1.slice(0, i1));
      if (i1 >= text1.length) {
        clearInterval(timer1);
        setTimeout(() => {
          setHeroStep("line2");
          const timer2 = setInterval(() => {
            i2++;
            setHeroTyped2(text2.slice(0, i2));
            if (i2 >= text2.length) {
              clearInterval(timer2);
              setHeroStep("done");
            }
          }, 50);
        }, 160);
      }
    }, 50);

    return () => clearInterval(timer1);
  }, []);

  // ─── TYPEWRITER EFFECT: ABOUT MISSION QUOTE ───
  const fullQuoteText =
    "Help you achieve the best dental care easily, quickly, and professionally for a lifetime of healthy, confident smiles.";
  const quoteCardRef = useRef<HTMLDivElement>(null);
  const [quoteChars, setQuoteChars] = useState(0);
  const [isTypingQuote, setIsTypingQuote] = useState(false);
  const [quoteStarted, setQuoteStarted] = useState(false);

  useEffect(() => {
    if (!quoteCardRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !quoteStarted) {
            setQuoteStarted(true);
            setIsTypingQuote(true);
            let current = 0;
            const total = fullQuoteText.length;
            const timer = setInterval(() => {
              current++;
              setQuoteChars(current);
              if (current >= total) {
                clearInterval(timer);
                setIsTypingQuote(false);
              }
            }, 18);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(quoteCardRef.current);
    return () => observer.disconnect();
  }, [quoteStarted]);

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

  // Scroll reveal observer: dua arah (scrolling atas ke bawah & bawah ke atas tetap ada efek blur-to-clear)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else {
            // Reset status saat elemen keluar viewport (baik lewat atas saat scroll ke bawah,
            // maupun lewat bawah saat scroll ke atas), sehingga saat di-scroll kembali
            // efek motion blur muncul kembali secara mulus di kedua arah.
            entry.target.classList.remove("is-visible");
          }
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    const revealElements = document.querySelectorAll(".reveal-blur");
    revealElements.forEach((el) => {
      // Inisialisasi awal: jika elemen sudah ada di dalam viewport saat load, langsung aktifkan
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add("is-visible");
      }
      observer.observe(el);
    });

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
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 1. FLOATING GLASSMORPHISM NAVBAR DENGAN INDIKATOR AKTIF              */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-4 z-50 px-4 sm:px-8 max-w-7xl mx-auto">
        <nav className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-lg shadow-emerald-950/5 rounded-full px-6 py-3 flex items-center justify-between transition-all">
          {/* Brand Logo Bersih Tanpa Ikon Gigi */}
          <button
            type="button"
            onClick={() => scrollToSection("home")}
            className="flex items-center group cursor-pointer text-left"
          >
            <span className="font-bold text-xl tracking-tight text-slate-900 transition-colors group-hover:text-emerald-700">
              Niel<span className="text-emerald-600 font-extrabold">Care</span>
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

          {/* Right Action: Login Dokter & Admin (Staff Login Bersih Tanpa Ikon) */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-5 py-2.5 rounded-full transition-all duration-200 shadow-xs active:scale-95"
            >
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
                className="w-full flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-3 rounded-2xl shadow-xs"
              >
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
            {/* Left Text Content with Typewriter Headline */}
            <div className="lg:col-span-5 space-y-6 z-10 animate-fade-in">
              <div className="space-y-1 min-h-[120px] sm:min-h-[160px] md:min-h-[190px] flex flex-col justify-center">
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
                  {heroTyped1}
                  {heroStep === "line1" && (
                    <span className="inline-block w-[3px] sm:w-[4px] h-[0.85em] bg-emerald-600 ml-1.5 animate-pulse align-middle" />
                  )}
                </h1>
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05]">
                  {heroTyped2.length > 0 && (
                    <>
                      <span className="text-emerald-600">
                        {heroTyped2.slice(0, Math.min(heroTyped2.length, 3))}
                      </span>
                      {heroTyped2.length > 3 && (
                        <>
                          {" "}
                          <span className="text-slate-900">
                            {heroTyped2.slice(4)}
                          </span>
                        </>
                      )}
                    </>
                  )}
                  {heroStep === "line2" && (
                    <span className="inline-block w-[3px] sm:w-[4px] h-[0.85em] bg-emerald-600 ml-1.5 animate-pulse align-middle" />
                  )}
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

            {/* Right Visual: Seamless 3D Floating Tooth (Menyatu alami dengan background, tanpa card/border) */}
            <div className="lg:col-span-7 relative flex items-center justify-center lg:justify-end animate-fade-in select-none">
              {/* Ambient radial spotlight halus untuk menyatukan background hero dengan video gigi */}
              <div
                aria-hidden="true"
                className="absolute inset-0 max-w-2xl mx-auto rounded-full bg-radial from-white via-emerald-100/30 to-transparent blur-3xl pointer-events-none scale-110"
              />

              <div
                className="w-full max-w-xl lg:max-w-2xl xl:max-w-3xl flex items-center justify-center relative"
                style={{
                  maskImage:
                    "radial-gradient(ellipse 72% 72% at 50% 50%, #000 36%, rgba(0,0,0,0.85) 52%, rgba(0,0,0,0.2) 68%, transparent 78%)",
                  WebkitMaskImage:
                    "radial-gradient(ellipse 72% 72% at 50% 50%, #000 36%, rgba(0,0,0,0.85) 52%, rgba(0,0,0,0.2) 68%, transparent 78%)",
                }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  loop
                  muted
                  playsInline
                  preload="auto"
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    v.muted = true;
                    v.play().catch(() => {});
                  }}
                  className="w-full h-auto max-h-[580px] object-contain transition-all duration-500"
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
            {/* Left Card: Mission Quote by Andi Daniel with Typewriter Effect */}
            <div
              ref={quoteCardRef}
              className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 flex flex-col justify-between shadow-xs reveal-blur reveal-delay-1"
            >
              <div className="space-y-6">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-slate-900 leading-snug tracking-tight min-h-[140px] sm:min-h-[160px]">
                  {quoteStarted ? (
                    <>
                      <span>{fullQuoteText.slice(0, Math.min(quoteChars, 91))}</span>
                      {quoteChars > 91 && (
                        <span className="text-emerald-600 font-bold">
                          {fullQuoteText.slice(91, quoteChars)}
                        </span>
                      )}
                      {isTypingQuote && (
                        <span className="inline-block w-[2.5px] sm:w-[3px] h-[0.85em] bg-emerald-600 ml-1 animate-pulse align-middle" />
                      )}
                    </>
                  ) : (
                    <span className="opacity-0">
                      Help you achieve the best dental care easily, quickly, and professionally for a lifetime of healthy, confident smiles.
                    </span>
                  )}
                </h3>
              </div>

              <div className="pt-8 text-right">
                <p className="text-sm font-bold text-slate-800 tracking-wide">— Andi Daniel</p>
              </div>
            </div>

            {/* Right Card: Penjelasan Sistem NielCare Dental (Poin-Poin Muncul Satu per Satu) */}
            <div className="lg:col-span-6 bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 flex flex-col justify-between shadow-xs space-y-6">
              <div className="space-y-5">
                <h4 className="text-lg font-bold text-slate-900 tracking-tight">
                  Sistem Manajemen Klinik Modern NielCare
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Platform pelayanan kesehatan gigi terintegrasi yang menghadirkan efisiensi dan kemudahan akses bagi seluruh pasien dan staf medis:
                </p>

                <div className="space-y-3.5 pt-1">
                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 reveal-blur reveal-delay-1">
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

                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 reveal-blur reveal-delay-3">
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

                  <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 reveal-blur reveal-delay-5">
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

          {/* Grid Kartu Layanan Resmi NielCare (View Only - Staggered Blur Reveal per Card) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                id: "Orthodontist",
                title: "Ortodontis",
                desc: "Pemasangan kawat gigi (behel) konvensional dan aligner gigi transparan.",
                delay: "reveal-delay-1",
              },
              {
                id: "Periodontist",
                title: "Periodonsia",
                desc: "Perawatan kesehatan gusi, radang gingivitis, dan scaling pembersihan karang mendalam.",
                delay: "reveal-delay-2",
              },
              {
                id: "Endodontist",
                title: "Endodontis",
                desc: "Perawatan saluran akar saraf gigi, pulpa gigi berlubang dalam, dan konservasi gigi.",
                delay: "reveal-delay-3",
              },
              {
                id: "Prosthodontist",
                title: "Prostodontis",
                desc: "Pembuatan gigi tiruan lepasan/permanen, mahkota jembatan (crown & bridge), dan restorasi.",
                delay: "reveal-delay-4",
              },
              {
                id: "Oral Surgeon",
                title: "Bedah Mulut",
                desc: "Operasi cabut gigi bungsu (odontektomi), implan gigi titanium permanen, dan bedah mulut minor.",
                delay: "reveal-delay-5",
              },
              {
                id: "Pediatric Dentist",
                title: "Dokter Gigi Anak",
                desc: "Perawatan kesehatan gigi khusus bayi dan anak-anak dengan pendekatan ramah tanpa trauma.",
                delay: "reveal-delay-6",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`bg-white border border-emerald-200/80 rounded-3xl p-6 sm:p-7 text-left shadow-2xs hover:shadow-xs transition-shadow reveal-blur ${item.delay}`}
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
            {/* Brand & Description (Bersih Tanpa Ikon Gigi) */}
            <div className="md:col-span-5 space-y-4 reveal-blur">
              <div className="flex items-center">
                <span className="font-bold text-2xl tracking-tight text-slate-900">
                  Niel<span className="text-emerald-600 font-extrabold">Care</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm">
                NielCare Dental Clinic menyediakan pelayanan kesehatan gigi modern dengan teknologi triage AI, memastikan perawatan yang nyaman, cepat, dan profesional.
              </p>
            </div>

            {/* Contact Details */}
            <div className="md:col-span-3 space-y-3 reveal-blur reveal-delay-2">
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

            {/* Clinic Hours (Format Rapi & Terstruktur Sesuai Foto 1) */}
            <div className="md:col-span-4 space-y-3 reveal-blur reveal-delay-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  Clinic Hours
                </span>
              </div>
              <div className="space-y-2 text-xs sm:text-sm text-slate-700 max-w-[280px]">
                <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-600 font-medium">Minggu - Kamis</span>
                  <span className="font-semibold text-slate-900">8am - 5pm</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-200/80">
                  <span className="text-slate-600 font-medium">Jumat</span>
                  <span className="font-semibold text-slate-900">8am - 4pm</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-600 font-medium">Sabtu</span>
                  <span className="font-semibold text-rose-600">Closed</span>
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

