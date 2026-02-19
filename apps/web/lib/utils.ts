import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const roleRank = {
  operador: 1,
  supervisor: 2,
  admin: 3,
} as const;

export type UserRole = keyof typeof roleRank;

export function formatKg(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `${value.toFixed(1)} kg`;
}
