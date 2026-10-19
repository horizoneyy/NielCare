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
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-72 mb-6"></div>
          <div className="h-64 bg-white rounded-xl border border-slate-200 mb-6"></div>
          <div className="h-48 bg-white rounded-xl border border-slate-200"></div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header (Clean title, no top badge, no subtitle, no icons) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Ketersediaan Jadwal Praktik
            </h1>
          </div>

          <Link href="/doctor/schedule">
            <Button
              variant="outline"
              size="sm"
              className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg text-xs h-10 px-4"
            >
              Cek Kalender Jadwal
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Tambah Jadwal */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
              <div className="pb-3 border-b border-slate-100 mb-4">
                <h3 className="text-sm font-bold text-slate-900">Tambah Hari Praktik</h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Hari Praktik</Label>
                  <Select
                    value={newSchedule.day_of_week}
                    onValueChange={(v) => setNewSchedule((p) => ({ ...p, day_of_week: v }))}
                  >
                    <SelectTrigger className="rounded-lg border-slate-200 text-xs sm:text-sm h-10">
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
                    className="rounded-lg border-slate-200 text-xs sm:text-sm h-10"
                    placeholder="30"
                  />
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
                      className="rounded-lg border-slate-200 text-xs h-10"
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
                      className="rounded-lg border-slate-200 text-xs h-10"
                    />
                  </div>
                </div>

                <Button
                  onClick={addSchedule}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold h-10 mt-2"
                >
                  {saving ? "Menyimpan..." : "Pasang Jadwal Praktik"}
                </Button>
              </div>
            </div>
          </div>

          {/* Daftar Jadwal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
              <div className="pb-4 border-b border-slate-100 mb-5">
                <h3 className="text-sm font-bold text-slate-900">
                  Jadwal Praktik Aktif ({schedules.length} Slot)
                </h3>
              </div>

              {schedules.length === 0 ? (
                <div className="text-center py-16 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                  <h4 className="text-sm font-bold text-slate-800">Belum Ada Jadwal Didaftarkan</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Pasien tidak dapat melakukan reservasi jika jadwal ketersediaan Anda masih kosong.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules.map((s) => (
                    <div
                      key={s.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border transition-all ${
                        s.is_available
                          ? "bg-white border-slate-200 shadow-xs"
                          : "bg-slate-50 border-slate-200 opacity-60"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-slate-900">
                            {getDayName(s.day_of_week)}
                          </h4>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              s.is_available
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {s.is_available ? "Buka Praktik" : "Nonaktif"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)} WIB • {s.slot_duration_minutes} mnt / pasien
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleAvailability(s.id, s.is_available)}
                          className={`rounded-lg text-xs font-semibold h-8 px-3 ${
                            s.is_available
                              ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {s.is_available ? "Nonaktifkan" : "Aktifkan"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSchedule(s.id)}
                          className="h-8 px-2.5 text-xs text-red-600 hover:bg-red-50 rounded-lg font-semibold"
                        >
                          Hapus
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
