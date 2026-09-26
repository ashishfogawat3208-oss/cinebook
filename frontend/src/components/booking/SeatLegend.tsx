import {
  Check,
  Clock3,
  LockKeyhole,
} from "lucide-react";

export default function SeatLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-zinc-500">
      <LegendItem
        className="border-white/10 bg-white/[0.04]"
        label="Available"
      />

      <LegendItem
        className="border-red-400 bg-red-600"
        label="Selected"
        icon={<Check size={12} />}
      />

      <LegendItem
        className="border-amber-500/40 bg-amber-500/10"
        label="Temporarily Reserved"
        icon={<Clock3 size={12} />}
      />

      <LegendItem
        className="border-blue-500/40 bg-blue-500/10"
        label="Your Reservation"
        icon={<LockKeyhole size={12} />}
      />

      <LegendItem
        className="border-zinc-800 bg-zinc-900"
        label="Booked"
      />
    </div>
  );
}

function LegendItem({
  className,
  label,
  icon,
}: {
  className: string;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-md border ${className}`}
      >
        {icon}
      </span>

      <span>{label}</span>
    </div>
  );
}