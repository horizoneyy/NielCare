interface EmergencyBannerProps {
  message?: string;
}

export function EmergencyBanner({ message }: EmergencyBannerProps) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-4">
      <div>
        <h4 className="text-sm font-bold text-red-800">
          Darurat Medis Kritis
        </h4>
        <p className="text-xs text-red-700 mt-0.5">
          {message || "Janji temu ini ditandai sebagai kritis. Disarankan penanganan segera."}
        </p>
      </div>
    </div>
  );
}
