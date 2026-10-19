import { Badge } from "@/components/ui/badge";
import type { AppointmentStatus, EmergencyLevel } from "@/types";
import { EMERGENCY_LEVEL_LABELS } from "@/types";
import { capitalize } from "@/lib/utils/formatters";

interface StatusBadgeProps {
  status: AppointmentStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <Badge variant={status as "pending" | "approved" | "rejected" | "done" | "cancelled"}>
      {capitalize(status)}
    </Badge>
  );
}

interface EmergencyBadgeProps {
  level?: EmergencyLevel | null;
  label?: string | null;
}

export function EmergencyBadge({ level, label }: EmergencyBadgeProps) {
  const inferVariant = (): EmergencyLevel => {
    if (level && ["critical", "moderate", "routine"].includes(level)) return level as EmergencyLevel;
    if (label) {
      const l = label.toLowerCase();
      if (l.includes("critical") || l.includes("prioritas")) return "critical";
      if (l.includes("moderate") || l.includes("sedang")) return "moderate";
    }
    return "routine";
  };

  const variant = inferVariant();
  const displayLabel = EMERGENCY_LEVEL_LABELS[variant];

  return (
    <Badge variant={variant} className="px-2.5 py-0.5 font-bold">
      {displayLabel}
    </Badge>
  );
}
