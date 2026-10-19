"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getDayName } from "@/lib/utils/formatters";
import type { DoctorSchedule } from "@/types";
import {
  Clock,
  Plus,
  Trash2,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function DoctorAvailabilityPage() {
  const supabase = createClient();
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [doctorId, setDoctorId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    day_of_week: "1",
    start_time: "08:00",
    end_time: "17:00",
    slot_duration_minutes: "30",
  });

  useEffect(() => {
    async function fetchSchedules() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data: doctor } = await supabase
          .from("doctors")
          .select("id")
          .eq("user_id", user.id)
          .single();
        if (!doctor) return;
        setDoctorId(doctor.id);
        const { data } = await supabase
          .from("doctor_schedules")
          .select("*")
          .eq("doctor_id", doctor.id)
          .order("day_of_week");
        if (data) setSchedules(data as DoctorSchedule[]);
      } catch (err) {
        console.error("Gagal memuat jadwal dokter:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSchedules();
  }, []);

  const addSchedule = async () => {
    if (!doctorId) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("doctor_schedules")
        .insert({
          doctor_id: doctorId,
          day_of_week: parseInt(newSchedule.day_of_week, 10),
          start_time: newSchedule.start_time,
          end_time: newSchedule.end_time,
          slot_duration_minutes: parseInt(newSchedule.slot_duration_minutes, 10),
          is_available: true,
        })
        .select()
        .single();
      if (data && !error) {
        setSchedules((prev) => [...prev, data as DoctorSchedule]);
      }
    } catch (err) {
      console.error("Gagal menambah jadwal:", err);
    } finally {
      setSaving(false);
    }
  };

  const deleteSchedule = async (id: string) => {
    if (!confirm("Hapus slot hari praktik ini dari jadwal rutin Anda?")) return;
    try {
      await supabase.from("doctor_schedules").delete().eq("id", id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Gagal menghapus jadwal:", err);
    }
  };

  const toggleAvailability = async (id: string, isAvailable: boolean) => {
    try {
      await supabase.from("doctor_schedules").update({ is_available: !isAvailable }).eq("id", id);
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, is_available: !isAvailable } : s))
      );
    } catch (err) {
      console.error("Gagal mengubah status ketersediaan:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/60">
        <Sidebar />
        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-6 bg-slate-200/80 rounded w-48 mb-4"></div>
          <div className="h-10 bg-slate-200/60 rounded-xl w-72 mb-6"></div>
          <div className="h-64 bg-white rounded-2xl border border-slate-200/80 mb-6"></div>
          <div className="h-48 bg-white rounded-2xl border border-slate-200/80"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4 font-medium">
          <Link href="/doctor/dashboard" className="hover:text-slate-600 transition-colors">
            Dashboard
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="text-slate-700 font-semibold">Atur Ketersediaan Praktik</span>
        </div>

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200/70 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                Manajemen Waktu &amp; Shift Praktik
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Ketersediaan Jadwal Praktik
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Tentukan hari, rentang jam praktik, dan durasi tiap sesi pasien untuk booking otomatis
            </p>
          </div>

          <Link href="/doctor/schedule">
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl shadow-xs transition-all cursor-pointer text-xs h-10 px-4"
            >
              <CalendarCheck className="w-4 h-4 mr-1.5 text-blue-600" />
              Cek Kalender Jadwal
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Tambah Jadwal (Left 1 col or Top on mobile) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] sticky top-6">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tambah Hari Praktik</h3>
                  <p className="text-[11px] text-slate-500">Buka slot reservasi baru</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Hari Praktik</Label>
                  <Select
                    value={newSchedule.day_of_week}
                    onValueChange={(v) => setNewSchedule((p) => ({ ...p, day_of_week: v }))}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200 text-xs sm:text-sm h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                        <SelectItem key={d} value={d.toString()}>
                          {getDayName(d)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">
                    Durasi Tiap Pasien (Menit)
                  </Label>
                  <Input
                    type="number"
                    value={newSchedule.slot_duration_minutes}
                    onChange={(e) =>
                      setNewSchedule((p) => ({ ...p, slot_duration_minutes: e.target.value }))
                    }
                    className="rounded-xl border-slate-200 text-xs sm:text-sm h-10"
                    placeholder="30"
                  />
                  <p className="text-[10px] text-slate-400">Umumnya 30 atau 45 menit per pasien</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Jam Mulai</Label>
                    <Input
                      type="time"
                      value={newSchedule.start_time}
                      onChange={(e) =>
                        setNewSchedule((p) => ({ ...p, start_time: e.target.value }))
                      }
                      className="rounded-xl border-slate-200 text-xs h-10"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Jam Selesai</Label>
                    <Input
                      type="time"
                      value={newSchedule.end_time}
                      onChange={(e) =>
                        setNewSchedule((p) => ({ ...p, end_time: e.target.value }))
                      }
                      className="rounded-xl border-slate-200 text-xs h-10"
                    />
                  </div>
                </div>

                <Button
                  onClick={addSchedule}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold h-10 shadow-xs transition-all cursor-pointer mt-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5 mr-1.5" /> Pasang Jadwal Praktik
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Daftar Jadwal Saat Ini (Right 2 cols) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Jadwal Praktik Aktif</h3>
                    <p className="text-[11px] text-slate-500">
                      Total {schedules.length} slot hari terdaftar
                    </p>
                  </div>
                </div>
              </div>

              {schedules.length === 0 ? (
                <div className="text-center py-16 px-4 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Belum Ada Jadwal Didaftarkan</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Pasien tidak dapat melakukan reservasi jika jadwal ketersediaan Anda masih kosong. Silakan gunakan formulir di samping.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules.map((s) => (
                    <div
                      key={s.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border transition-all ${
                        s.is_available
                          ? "bg-white border-slate-200/90 shadow-xs hover:border-blue-300"
                          : "bg-slate-50/70 border-slate-200 opacity-60"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            s.is_available
                              ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {getDayName(s.day_of_week).slice(0, 3)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-900">
                              {getDayName(s.day_of_week)}
                            </h4>
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                s.is_available
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {s.is_available ? "Buka Praktik" : "Nonaktif"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)} WIB
                            <span className="text-slate-300">•</span>
                            <span>{s.slot_duration_minutes} mnt / pasien</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAvailability(s.id, s.is_available)}
                          className={`rounded-xl text-xs font-semibold h-8 px-3 ${
                            s.is_available
                              ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {s.is_available ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteSchedule(s.id)}
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
