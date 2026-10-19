"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";
import { AppointmentCard } from "@/components/shared/AppointmentCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import type { Appointment } from "@/types";

export default function PatientAppointmentsPage() {
  const supabase = createClient();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAppointments() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const res = await fetch(`/api/appointments?patient_id=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setAppointments(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAppointments();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-8 bg-slate-200 rounded w-64 mb-6"></div>
          <div className="h-10 bg-slate-200 rounded w-72 mb-6"></div>
          <div className="space-y-4">
            <div className="h-28 bg-white rounded-xl border border-slate-200 p-5"></div>
            <div className="h-28 bg-white rounded-xl border border-slate-200 p-5"></div>
          </div>
        </main>
      </div>
    );
  }

  const upcoming = appointments.filter((a) => ["pending", "approved"].includes(a.status));
  const past = appointments.filter((a) => ["done", "rejected", "cancelled"].includes(a.status));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <Sidebar />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Appointment Schedule &amp; History
            </h1>
          </div>

          <Link href="/patient/book">
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg text-xs h-9 px-4 shadow-xs"
            >
              Book New Appointment
            </Button>
          </Link>
        </div>

        {/* Tabs Filter */}
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="mb-6 bg-slate-200/70 p-1 rounded-lg w-full sm:w-auto">
            <TabsTrigger
              value="upcoming"
              className="rounded-md text-xs font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 transition-all"
            >
              Upcoming ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger
              value="past"
              className="rounded-md text-xs font-semibold px-4 py-2 data-[state=active]:bg-white data-[state=active]:text-slate-900 transition-all"
            >
              Past &amp; Completed ({past.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming">
            {upcoming.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-xl">
                <h4 className="text-sm font-bold text-slate-800">
                  No Upcoming Appointments
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  You have no active appointments scheduled. Click the button above to make a new reservation.
                </p>
                <Link href="/patient/book">
                  <Button
                    size="sm"
                    className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Book New Appointment
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    linkPrefix="/patient/appointments"
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past">
            {past.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white border border-dashed border-slate-200 rounded-xl">
                <h4 className="text-sm font-bold text-slate-800">
                  No Past Appointment Records
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Appointments that have been completed or cancelled will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {past.map((a) => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    linkPrefix="/patient/appointments"
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
