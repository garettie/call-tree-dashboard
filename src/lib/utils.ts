import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const date = new Date(iso);
  
  const month = date.toLocaleString("en-US", { month: "long", timeZone: "UTC" });
  const day = date.toLocaleString("en-US", { day: "numeric", timeZone: "UTC" });
  const time = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  });

  return `${month} ${day}, ${time}`;
}

export function formatPhoneNumber(num: string | null | undefined): string {
  if (!num) return "-";
  // Strip everything except digits
  const digits = num.replace(/\D/g, "");
  // 10-digit PH mobile starting with 9 → +63 9XX XXX XXXX
  if (digits.length === 10 && digits.startsWith("9")) {
    return `+63${digits}`;
  }
  // 12-digit starting with 63 (e.g. 639...) → +63 9XX...
  if (digits.length === 12 && digits.startsWith("63")) {
    return `+${digits}`;
  }
  // 11-digit starting with 0 (e.g. 09...) → +63 9XX...
  if (digits.length === 11 && digits.startsWith("0")) {
    return `+63${digits.slice(1)}`;
  }
  // Already looks okay or unknown format — return with + prefix if digits only
  return num.startsWith("+") ? num : `+${digits}`;
}

export function localNowAsUTC(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}Z`;
}

export function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hrs}h ${rem}m`;
}

export function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatTimeShort(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}
