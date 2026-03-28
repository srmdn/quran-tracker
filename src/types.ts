export interface User {
  id: number;
  google_id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  password_hash?: string | null;
  role:
    | "pending"
    | "member"
    | "admin"
    | "super_admin"
    | "santri"
    | "alumni"
    | "asatidz";
  suspended_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: number;
  expires_at: string;
  created_at: string;
}

export interface ProgressEntry {
  id: number;
  user_id: number;
  surah_number: number;
  last_ayah: number;
  completed: number;
  created_at: string;
  updated_at: string;
}

export interface ProgressLog {
  id: number;
  user_id: number;
  surah_number: number;
  ayah_from: number;
  ayah_to: number;
  logged_at: string;
}

export interface RankedUser {
  id: number;
  name: string;
  avatar_url: string | null;
  rank: number;
  total_memorized: number;
  juz_completed: number;
  progress_percent: number;
  current_surah: string;
  current_surah_number: number;
  current_ayah: number;
  current_juz: number;
  trend: number;
  streak_days: number;
  joined_label: string;
}

import type { Lang } from "./lib/i18n.ts";

export type Env = {
  Variables: {
    user: User;
    lang: Lang;
  };
};
