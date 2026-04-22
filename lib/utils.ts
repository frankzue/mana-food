import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUSD(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatBs(value: number): string {
  return (
    new Intl.NumberFormat("es-VE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + " Bs"
  );
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export const BUSINESS = {
  name: "Maná Fast Food",
  tagline: "Fast food con el sabor del Orinoco",
  hours: "Todos los días de 6:00 PM a 4:00 AM",
  hoursShort: "6 PM — 4 AM",
  openHour: 18, // 6 PM
  closeHour: 4, // 4 AM (del día siguiente)
  address: "Av. 17 de Diciembre, Frente a la Firestone, 1er Local",
  addressShort: "Av. 17 Dic., Firestone",
  city: "Ciudad Bolívar, Venezuela",
  services: "Delivery y Pickup",
  instagram: "@manafood",
} as const;

/** Link a Google Maps con la dirección del local. */
export const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${BUSINESS.address}, ${BUSINESS.city}`
)}`;

/** ¿El local está abierto ahora mismo? (Abierto si la hora cruza medianoche.) */
export function isOpenNow(date = new Date()): boolean {
  const h = date.getHours();
  // 18 <= h < 24  OR  0 <= h < 4
  return h >= BUSINESS.openHour || h < BUSINESS.closeHour;
}
