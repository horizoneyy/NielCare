import Link from "next/link";
import { StatusBadge, EmergencyBadge } from "@/components/shared/StatusBadge";
import { formatDate, formatTime } from "@/lib/utils/formatters";
import type { Appointment } from "@/types";

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

  const title = possibleCondition || appointment.symptom_description?.slice(0, 50) || "Dental Examination";

  return (
    <Link href={`${linkPrefix}/${appointment.id}`} className="block group">
      <div className="bg-white rounded-xl p-5 border border-slate-200 hover:border-blue-400 transition-all duration-200 cursor-pointer shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors text-sm sm:text-base truncate mb-1.5">
              {title}
            </h3>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 font-medium">
              <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200">
                {formatDate(appointment.appointment_date)}
              </span>
              <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 font-mono">
                {formatTime(appointment.slot_time)}
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
            <div className="flex items-center gap-2 text-slate-700">
              <span className="font-bold text-slate-800">
                Dr. {appointment.doctor.user.full_name}
              </span>
              <span className="text-slate-400 hidden sm:inline">
                • {appointment.doctor.specialization}
              </span>
            </div>
            <span className="text-blue-600 group-hover:underline text-xs font-semibold">
              View Details
            </span>
          </div>
        )}

        {/* Patient Info */}
        {showPatient && appointment.patient && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <span className="font-bold text-slate-800">
                {appointment.patient.full_name}
              </span>
              {appointment.patient.phone && (
                <span className="text-slate-400 hidden sm:inline">
                  • {appointment.patient.phone}
                </span>
              )}
            </div>
            <span className="text-blue-600 group-hover:underline text-xs font-semibold">
              View Patient
            </span>
          </div>
        )}

        {appointment.symptom_description && (
          <p className="text-xs text-slate-500 mt-2.5 pt-2 border-t border-dashed border-slate-100 line-clamp-1 italic">
            &ldquo;{appointment.symptom_description}&rdquo;
          </p>
        )}
      </div>
    </Link>
  );
}
