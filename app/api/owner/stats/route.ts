import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Parse actual treatment cost from joined medical_records
function getActualCost(appointment: any): number {
  if (!appointment.medical_records) return 0;
  const records = Array.isArray(appointment.medical_records) 
    ? appointment.medical_records 
    : [appointment.medical_records];
  return records[0]?.treatment_cost || 0;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = await createAdminClient();

  // Jalankan query secara paralel via Promise.all
  const [
    userProfileRes,
    patientCountRes,
    doctorCountRes,
    appointmentsRes
  ] = await Promise.all([
    adminSupabase.from("users").select("role").eq("id", user.id).single(),
    adminSupabase.from("users").select("id", { count: "exact", head: true }).eq("role", "patient"),
    adminSupabase.from("doctors").select("id", { count: "exact", head: true }).eq("is_active", true),
    adminSupabase.from("appointments").select("id, appointment_date, status, emergency_level, medical_records(treatment_cost)").order("appointment_date", { ascending: false }),
  ]);

  const userData = userProfileRes.data;
  if (userData?.role !== "owner" && user.user_metadata?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allAppointments = appointmentsRes.data || [];
  const patientCount = patientCountRes.count || 0;
  const doctorCount = doctorCountRes.count || 0;
  const totalAppointments = allAppointments.length;

  const doneAppointments = allAppointments.filter(a => a.status === "done");
  const totalRevenue = doneAppointments.reduce(
    (sum: number, a: any) => sum + getActualCost(a),
    0
  );

  // Breakdown prioritas untuk widget AI Triage
  const priorityBreakdown = {
    critical: allAppointments.filter(a => a.emergency_level === "critical").length,
    moderate: allAppointments.filter(a => a.emergency_level === "moderate").length,
    routine: allAppointments.filter(a => a.emergency_level === "routine").length,
  };

  // Komputasi 6 bulan terakhir dalam memori tanpa network round-trip tambahan
  const monthlyBreakdown: { month: string; label: string; appointments: number; revenue: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const startStr = [
      start.getFullYear(),
      String(start.getMonth() + 1).padStart(2, "0"),
      "01"
    ].join("-");
    const endStr = [
      end.getFullYear(),
      String(end.getMonth() + 1).padStart(2, "0"),
      "01"
    ].join("-");

    const monthStr = startStr.slice(0, 7);
    const label = start.toLocaleString("id-ID", { month: "short", year: "numeric" });

    const monthAppts = allAppointments.filter(
      a => a.appointment_date >= startStr && a.appointment_date < endStr
    );

    const monthRevenue = monthAppts
      .filter(a => a.status === "done")
      .reduce((sum: number, a: any) => sum + getActualCost(a), 0);

    monthlyBreakdown.push({
      month: monthStr,
      label,
      appointments: monthAppts.length,
      revenue: monthRevenue,
    });
  }

  return NextResponse.json({
    totalPatients: patientCount,
    totalAppointments,
    totalDoctors: doctorCount,
    totalRevenue,
    monthlyBreakdown,
    priorityBreakdown,
    recentAppointments: allAppointments.slice(0, 5),
  });
}
