"use client";

import { formatBs, formatUSD } from "@/lib/utils";

type Props = {
  usd: number;
  tasaBs: number;
  simbolo?: string;
  stacked?: boolean;
  className?: string;
};

export function MoneyDisplay({
  usd,
  tasaBs,
  simbolo = "Bs",
  stacked = false,
  className = "",
}: Props) {
  const bs = usd * tasaBs;
  if (stacked) {
    return (
      <div className={`flex flex-col items-end leading-tight ${className}`}>
        <span className="font-display text-xl font-extrabold text-mana-red">
          {formatUSD(usd)}
        </span>
        <span className="text-xs font-medium text-mana-muted">
          ≈ {formatBs(bs).replace("Bs", simbolo)}
        </span>
      </div>
    );
  }
  return (
    <span className={className}>
      <span className="font-bold text-mana-red">{formatUSD(usd)}</span>{" "}
      <span className="text-xs text-mana-muted">
        · {formatBs(bs).replace("Bs", simbolo)}
      </span>
    </span>
  );
}
