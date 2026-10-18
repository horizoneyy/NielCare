"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils/formatters";
import type { Doctor } from "@/types";
import { Loader2, Plus, Stethoscope, Eye, EyeOff, ArrowLeft, CheckCircle2, ShieldCheck, Mail, Phone, Award } from "lucide-react";

const SPECIALIZATIONS = [
  { id: "General Dentist", label: "General Dentist (Dokter Gigi Umum)", title: "" },
  { id: "Orthodontist", label: "Orthodontist (Spesialis Ortodonti)", title: "Sp.Ort" },
  { id: "Periodontist", label: "Periodontist (Spesialis Periodonsia)", title: "Sp.Perio" },
  { id: "Endodontist", label: "Endodontist (Spesialis Konservasi Gigi)", title: "Sp.KG" },
  { id: "Prosthodontist", label: "Prosthodontist (Spesialis Prostodonsia)", title: "Sp.Pros" },
  { id: "Oral Surgeon", label: "Oral Surgeon (Spesialis Bedah Mulut)", title: "Sp.BM" },
  { id: "Pediatric Dentist", label: "Pediatric Dentist (Spesialis Gigi Anak)", title: "Sp.KGA" },
];

export default function OwnerDoctorsPage() {
  const supabase = createClient();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    username: "",
    phone: "",
    password: "",
    specialization: "",
    bio: "",
    years_experience: "3",
  });

  useEffect(() => {
    async function fetchDoctors() {
      try {
        const res = await fetch("/api/doctors");
        if (res.ok) {
          const data = await res.json();
          setDoctors(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctors();
  }, []);

  const handleCreate = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, years_experience: parseInt(form.years_experience) || 0 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Gagal membuat dokter");
        setSaving(false);
        return;
      }
      setDialogOpen(false);
      setForm({
        full_name: "",
        email: "",
        username: "",
        phone: "",
        password: "",
        specialization: "",
        bio: "",
        years_experience: "3",
      });

      // Refresh data dokter
      const refreshRes = await fetch("/api/doctors");
      if (refreshRes.ok) {
        const updated = await refreshRes.json();
        setDoctors(updated);
      }
    } catch {
      setError("Gagal menghubungi server untuk membuat akun dokter.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60">
        <Sidebar />
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-8 bg-slate-200/80 rounded-xl w-60 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-44 bg-white rounded-2xl border border-slate-100 p-5"></div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/owner/dashboard"
                className="inline-flex items-center text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Dashboard
              </Link>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Manajemen Tim Medis &amp; Dokter
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Kelola profil, spesialisasi keahlian klinis, dan akun portal dokter klinik
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl shadow-xs hover:shadow transition-all cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                Tambah Dokter Baru
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-6">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-slate-900">Pendaftaran Akun Dokter</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Dokter baru akan langsung memiliki akun aktif untuk mengakses antrean dan rekam medis pasien.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3.5 mt-4">
                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Nama Lengkap *</Label>
                    <Input
                      autoComplete="off"
                      placeholder="drg. Budi Santoso"
                      value={form.full_name}
                      onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                      className="rounded-xl border-slate-200 text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Username *</Label>
                    <Input
                      autoComplete="off"
                      placeholder="dr.budi"
                      value={form.username}
                      onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))}
                      className="rounded-xl border-slate-200 text-xs h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Email Login *</Label>
                  <Input
                    autoComplete="off"
                    type="email"
                    placeholder="dr.budi@nielcare.test"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className="rounded-xl border-slate-200 text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Nomor WhatsApp / HP</Label>
                  <Input
                    autoComplete="off"
                    placeholder="08123456789"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className="rounded-xl border-slate-200 text-xs h-9"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Spesialisasi Gigi *</Label>
                  <Select
                    value={form.specialization}
                    onValueChange={(v) => setForm((p) => ({ ...p, specialization: v }))}
                  >
                    <SelectTrigger className="w-full rounded-xl border-slate-200 text-xs h-9">
                      <SelectValue placeholder="Pilih Spesialisasi" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {SPECIALIZATIONS.map((spec) => (
                        <SelectItem key={spec.id} value={spec.id} className="text-xs">
                          {spec.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-700">Bio &amp; Keahlian Klinis</Label>
                  <Textarea
                    placeholder="Fokus penanganan penambalan estetika, scaling, kawat gigi..."
                    value={form.bio}
                    onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                    rows={2}
                    className="rounded-xl border-slate-200 text-xs resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Pengalaman (Thn)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.years_experience}
                      onChange={(e) => {
                        const v = parseInt(e.target.value) || 0;
                        setForm((p) => ({ ...p, years_experience: Math.max(0, v).toString() }));
                      }}
                      className="rounded-xl border-slate-200 text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">Kata Sandi *</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                        className="rounded-xl border-slate-200 text-xs h-9 pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleCreate}
                  disabled={
                    saving ||
                    !form.full_name ||
                    !form.email ||
                    !form.username ||
                    !form.password ||
                    !form.specialization
                  }
                  className="w-full mt-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs h-10 transition-all cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Mendaftarkan Dokter...
                    </>
                  ) : (
                    "Buat Akun Dokter"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {doctors.map((d) => {
            const specData = SPECIALIZATIONS.find((s) => s.id === d.specialization);
            const title = specData?.title ? `, ${specData.title}` : "";

            return (
              <div
                key={d.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] hover:shadow-md transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3.5">
                      <Avatar className="h-12 w-12 border border-slate-100 shadow-xs">
                        <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-sm">
                          {d.user ? getInitials(d.user.full_name) : "DR"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-snug">
                          {d.user?.full_name?.startsWith("dr") ? "" : "drg. "}
                          {d.user?.full_name}
                          {title}
                        </h3>
                        <span className="inline-flex items-center gap-1 mt-0.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100/60">
                          {d.specialization}
                        </span>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Aktif Praktik
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-4">
                    {d.bio || "Dokter spesialis berkompeten di NielCare Dental Clinic."}
                  </p>
                </div>

                <div className="pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      {d.years_experience} Tahun Pengalaman
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                      {d.user?.email}
                    </span>
                  </div>

                  {d.user?.phone && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Phone className="w-3.5 h-3.5" />
                      {d.user.phone}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
