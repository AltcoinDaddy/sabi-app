export const AUTH_COOKIE = "sabi_user_phone";
export const POINTS_KEY = "sabi_points_v1";
export const PICKS_KEY = "sabi_picks_v1";

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  if (!match) return null;
  try {
    return decodeURIComponent(match.split("=").slice(1).join("="));
  } catch {
    return null;
  }
}

export function setCookie(name: string, value: string, days = 365) {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
}

export function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function getStoredPhone(): string | null {
  const fromCookie = getCookie(AUTH_COOKIE);
  if (fromCookie) return fromCookie;
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(AUTH_COOKIE);
}

export function setStoredPhone(phone: string) {
  setCookie(AUTH_COOKIE, phone);
  try {
    window.localStorage.setItem(AUTH_COOKIE, phone);
  } catch {
    /* noop */
  }
}

export function clearStoredPhone() {
  clearCookie(AUTH_COOKIE);
  try {
    window.localStorage.removeItem(AUTH_COOKIE);
  } catch {
    /* noop */
  }
}

export function isAuthenticated(): boolean {
  const phone = getStoredPhone();
  return !!phone && phone.replace(/\D/g, "").length >= 10;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 7) return phone;
  return `${digits.slice(0, 4)}***${digits.slice(-3)}`;
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "").slice(-11);
}

/** Mock OTP for prototype — in production this comes via SMS. */
export const DEMO_OTP = "1234";
