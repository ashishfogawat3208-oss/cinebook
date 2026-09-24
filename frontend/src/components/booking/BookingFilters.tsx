"use client";

export type BookingCategory =
  | ""
  | "upcoming"
  | "completed"
  | "pending"
  | "failed"
  | "expired"
  | "cancelled";

interface BookingFiltersProps {
  active: BookingCategory;
  onChange: (category: BookingCategory) => void;
}

const filters: {
  value: BookingCategory;
  label: string;
}[] = [
  { value: "", label: "All" },
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

export default function BookingFilters({
  active,
  onChange,
}: BookingFiltersProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onChange(filter.value)}
          className={`shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold transition ${
            active === filter.value
              ? "bg-red-600 text-white"
              : "border border-white/10 bg-white/[0.03] text-zinc-500 hover:bg-white/10 hover:text-white"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}