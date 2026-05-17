import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AuthUser {
  id: string;
  name: string;
  username?: string;
  phone?: string; // E.164-ish, e.g. +911234567890
  passwordHash?: string;
  createdAt: number;
}

type Result = { ok: true } | { ok: false; error: string };

interface AuthState {
  users: Record<string, AuthUser>; // keyed by id
  byPhone: Record<string, string>; // phone -> userId
  byUsername: Record<string, string>; // username (lowercased) -> userId
  currentUserId: string | null;
  pendingOtp: { phone: string; code: string; mode: "login" | "signup"; name?: string; expiresAt: number } | null;

  // OTP flow
  requestOtp: (input: { phone: string; mode: "login" | "signup"; name?: string }) =>
    | { ok: true; code: string }
    | { ok: false; error: string };
  verifyOtp: (code: string) => Result;

  // Username + password flow
  signupWithPassword: (input: { name: string; username: string; password: string; phone?: string }) => Result;
  loginWithPassword: (input: { username: string; password: string }) => Result;

  logout: () => void;
  isAuthenticated: () => boolean;
  currentUser: () => AuthUser | null;
}

const uid = () => Math.random().toString(36).slice(2, 10);
const genCode = () => Math.floor(100000 + Math.random() * 900000).toString();
const OTP_TTL = 5 * 60 * 1000;

// Lightweight hash for demo (NOT cryptographically secure — replace with server-side bcrypt in production)
const hashPwd = (pwd: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < pwd.length; i++) {
    h ^= pwd.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return `wl_${h.toString(16)}_${btoa(pwd).slice(-6)}`;
};

const validatePhone = (p: string) => /^\+?\d{8,15}$/.test(p.replace(/\s+/g, ""));

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      users: {},
      byPhone: {},
      byUsername: {},
      currentUserId: null,
      pendingOtp: null,

      requestOtp: ({ phone, mode, name }) => {
        const normalized = phone.replace(/\s+/g, "");
        if (!validatePhone(normalized)) {
          return { ok: false, error: "Enter a valid mobile number with country code." };
        }
        const exists = !!get().byPhone[normalized];
        if (mode === "login" && !exists) {
          return { ok: false, error: "No account found for this number. Please sign up." };
        }
        if (mode === "signup" && exists) {
          return { ok: false, error: "Account already exists. Please log in." };
        }
        if (mode === "signup" && !name?.trim()) {
          return { ok: false, error: "Please enter your name." };
        }
        const code = genCode();
        set({
          pendingOtp: {
            phone: normalized,
            code,
            mode,
            name: name?.trim(),
            expiresAt: Date.now() + OTP_TTL,
          },
        });
        return { ok: true, code };
      },

      verifyOtp: (code) => {
        const p = get().pendingOtp;
        if (!p) return { ok: false, error: "No OTP requested." };
        if (Date.now() > p.expiresAt) return { ok: false, error: "OTP expired. Request a new one." };
        if (code.trim() !== p.code) return { ok: false, error: "Invalid OTP. Please try again." };

        const users = { ...get().users };
        const byPhone = { ...get().byPhone };
        let userId = byPhone[p.phone];
        if (!userId) {
          const id = uid();
          users[id] = {
            id,
            phone: p.phone,
            name: p.name || "Investor",
            createdAt: Date.now(),
          };
          byPhone[p.phone] = id;
          userId = id;
        }
        set({ users, byPhone, currentUserId: userId, pendingOtp: null });
        return { ok: true };
      },

      signupWithPassword: ({ name, username, password, phone }) => {
        const uname = username.trim().toLowerCase();
        if (!name.trim()) return { ok: false, error: "Please enter your name." };
        if (!/^[a-z0-9_.]{3,20}$/.test(uname)) {
          return { ok: false, error: "Username must be 3-20 chars (letters, numbers, _ or .)." };
        }
        if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
        if (get().byUsername[uname]) return { ok: false, error: "Username is already taken." };
        if (phone && !validatePhone(phone)) return { ok: false, error: "Invalid phone number." };
        if (phone && get().byPhone[phone]) return { ok: false, error: "Phone already registered." };

        const id = uid();
        const user: AuthUser = {
          id,
          name: name.trim(),
          username: uname,
          phone: phone || undefined,
          passwordHash: hashPwd(password),
          createdAt: Date.now(),
        };
        const users = { ...get().users, [id]: user };
        const byUsername = { ...get().byUsername, [uname]: id };
        const byPhone = { ...get().byPhone, ...(phone ? { [phone]: id } : {}) };
        set({ users, byUsername, byPhone, currentUserId: id });
        return { ok: true };
      },

      loginWithPassword: ({ username, password }) => {
        const uname = username.trim().toLowerCase();
        const id = get().byUsername[uname];
        if (!id) return { ok: false, error: "No account found with that username." };
        const user = get().users[id];
        if (!user?.passwordHash || user.passwordHash !== hashPwd(password)) {
          return { ok: false, error: "Incorrect password." };
        }
        set({ currentUserId: id });
        return { ok: true };
      },

      logout: () => set({ currentUserId: null, pendingOtp: null }),
      isAuthenticated: () => !!get().currentUserId,
      currentUser: () => {
        const id = get().currentUserId;
        if (!id) return null;
        return get().users[id] ?? null;
      },
    }),
    { name: "wealthlens-auth", version: 2 },
  ),
);
