import Link from "next/link";
import { StatusBadge, EmergencyBadge } from "@/components/shared/StatusBadge";
import { formatDate, formatTime } from "@/lib/utils/formatters";
import type { Appointment } from "@/types";
import { Calendar, Clock, User, Stethoscope, Brain, ChevronRight } from "lucide-react";

interface AppointmentCardProps {
  appointment: Appointment;
  linkPrefix: string; // e.g. "/patient/appointments" or "/doctor/appointments"
  showPatient?: boolean;
  showDoctor?: boolean;
}

export function AppointmentCard({
  appointment,
  linkPrefix,
  showPatient = false,
  showDoctor = true,
}: AppointmentCardProps) {
  // Extract possibleCondition from AI analysis result
  let possibleCondition: string | null = null;
  try {
    if (appointment.ai_analysis_result) {
      const ai =
        typeof appointment.ai_analysis_result === "string"
          ? JSON.parse(appointment.ai_analysis_result)
          : appointment.ai_analysis_result;
      possibleCondition = ai?.possibleCondition || null;
    }
  } catch {
    possibleCondition = null;
  }

  const title = possibleCondition || appointment.symptom_description?.slice(0, 50) || "Pemeriksaan Gigi";

  return (
    <Link href={`${linkPrefix}/${appointment.id}`} className="block group">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-slate-300 transition-all duration-200 cursor-pointer">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 rounded-md bg-indigo-50 text-indigo-600">
                <Brain className="h-3.5 w-3.5" />
              </span>
              <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors text-sm sm:text-base truncate">
                {title}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                {formatDate(appointment.appointment_date)}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 font-mono">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {formatTime(appointment.slot_time)} WIB
              </span>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0 pt-1 sm:pt-0">
            <StatusBadge status={appointment.status} />
            {(() => {
              try {
                const ai =
                  typeof appointment.ai_analysis_result === "string"
                    ? JSON.parse(appointment.ai_analysis_result)
                    : null;
                const label = ai?.emergencyLevel ?? null;
                return <EmergencyBadge level={appointment.emergency_level} label={label} />;
              } catch {
                return <EmergencyBadge level={appointment.emergency_level} />;
              }
            })()}
          </div>
        </div>

        {/* Doctor Info */}
        {showDoctor && appointment.doctor?.user && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                DR
              </div>
              <span className="font-semibold text-slate-800">
                Dr. {appointment.doctor.user.full_name}
              </span>
              <span className="text-slate-400 hidden sm:inline">
                • {appointment.doctor.specialization}
              </span>
            </div>
            <span className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all text-xs flex items-center font-medium">
              Rincian <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        )}

        {/* Patient Info */}
        {showPatient && appointment.patient && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-[10px]">
                <User className="h-3 w-3" />
              </div>
              <span className="font-semibold text-slate-800">
                {appointment.patient.full_name}
              </span>
              {appointment.patient.phone && (
                <span className="text-slate-400 hidden sm:inline">
                  • {appointment.patient.phone}
                </span>
              )}
            </div>
            <span className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all text-xs flex items-center font-medium">
              Periksa <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </span>
          </div>
        )}

        {appointment.symptom_description && (
          <p className="text-xs text-slate-400 mt-2.5 pt-2 border-t border-dashed border-slate-100 line-clamp-1 italic">
            &ldquo;{appointment.symptom_description}&rdquo;
          </p>
        )}
      </div>
    </Link>
  );
}
