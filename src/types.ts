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

import type { Lang } from "./lib/i18n.ts";

export type Env = {
  Variables: {
    user: User;
    lang: Lang;
  };
};
