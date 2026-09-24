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
}: {
  className: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`h-5 w-5 rounded-md border ${className}`}
      />

      <span>{label}</span>
    </div>
  );
}