"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle, ArrowRight, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const router = useRouter();
  const supabase = createClient();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email.trim(),
        password: data.password,
      });

      if (authError) {
        console.error("[Login authError]", authError);
        // Pesan generik agar peretas tidak dapat menebak keberadaan email/admin
        setError("Email atau kata sandi tidak valid. Silakan periksa kembali.");
        setLoading(false);
        return;
      }

      const user = authData?.user;
      if (!user) {
        setError("Gagal memverifikasi identitas akun.");
        setLoading(false);
        return;
      }

      // Cek peran langsung dari metadata JWT sesi untuk respon instan
      let role = user.user_metadata?.role;

      if (!role) {
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("role, is_active")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError || !profile || !profile.is_active) {
          await supabase.auth.signOut();
          setError("Akun tidak memiliki izin akses portal.");
          setLoading(false);
          return;
        }
        role = profile.role;
      }

      if (role === "doctor") {
        router.push("/doctor/dashboard");
      } else if (role === "owner") {
        router.push("/owner/dashboard");
      } else {
        router.push("/patient/dashboard");
      }
    } catch (err: any) {
      console.error("[Login Error]", err);
      setError("Terjadi kesalahan pada sistem. Silakan coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10 relative">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Masuk ke Akun Anda</h1>
          <p className="text-xs text-slate-500 mt-1">
            Silakan masukkan email dan kata sandi Anda untuk melanjutkan
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 mb-5 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Email Akun</label>
            <input
              type="email"
              placeholder="nama@nielcare.com"
              autoComplete="off"
              {...register("email")}
              className="w-full px-4 py-3 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
            {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Kata Sandi</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                {...register("password")}
                className="w-full px-4 py-3 rounded-xl text-sm bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 pr-10 outline-none focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm text-white bg-emerald-700 hover:bg-emerald-800 active:scale-98 transition-all shadow-md shadow-emerald-700/20 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Memverifikasi...
              </>
            ) : (
              <>
                Masuk Sistem <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <Loader2 className="animate-spin text-emerald-700 w-8 h-8" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
