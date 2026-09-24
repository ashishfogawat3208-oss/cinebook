interface BookingStatusBadgeProps {
  status: string;
  category?: string;
}

export default function BookingStatusBadge({
  status,
  category,
}: BookingStatusBadgeProps) {
  const config = getStatusConfig(status, category);

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${config.className}`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${config.dotClass}`}
      />

      {config.label}
    </span>
  );
}

function getStatusConfig(
  status: string,
  category?: string
) {
  if (status === "CONFIRMED") {
    if (category === "COMPLETED") {
      return {
        label: "Completed",
        className:
          "border-zinc-500/20 bg-zinc-500/10 text-zinc-400",
        dotClass: "bg-zinc-500",
      };
    }

    return {
      label: "Confirmed",
      className:
        "border-green-500/20 bg-green-500/10 text-green-400",
      dotClass: "bg-green-500",
    };
  }

  if (status === "PENDING") {
    return {
      label: "Payment Pending",
      className:
        "border-yellow-500/20 bg-yellow-500/10 text-yellow-400",
      dotClass: "bg-yellow-500",
    };
  }

  if (status === "FAILED") {
    return {
      label: "Failed",
      className:
        "border-red-500/20 bg-red-500/10 text-red-400",
      dotClass: "bg-red-500",
    };
  }

  if (status === "EXPIRED") {
    return {
      label: "Expired",
      className:
        "border-zinc-500/20 bg-zinc-500/10 text-zinc-500",
      dotClass: "bg-zinc-600",
    };
  }

  if (status === "CANCELLED") {
    return {
      label: "Cancelled",
      className:
        "border-orange-500/20 bg-orange-500/10 text-orange-400",
      dotClass: "bg-orange-500",
    };
  }

  return {
    label: status,
    className:
      "border-white/10 bg-white/5 text-zinc-400",
    dotClass: "bg-zinc-500",
  };
}