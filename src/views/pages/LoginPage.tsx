import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { APP_NAME, ORG_NAME } from "../../config.ts";

export const LoginPage: FC<{ error?: string }> = ({ error }) => {
  return (
    <Layout title={`Sign In - ${APP_NAME}`}>
      <div class="flex-1 flex items-center justify-center px-4">
        <div class="w-full max-w-md">
          <div class="bg-white border border-border-light rounded-2xl p-8 shadow-lg text-center">
            <div class="size-20 mx-auto mb-6">
              <img src="/public/logo.png" alt="Markaz Talaqqi Logo" class="w-full h-full object-contain" />
            </div>
            <h1 class="text-text-main text-2xl font-black tracking-tight mb-2">
              {APP_NAME}
            </h1>
            <p class="text-text-secondary text-sm mb-8">
              Qur'an memorization and activity tracking system for {ORG_NAME} Islamic boarding school.
            </p>

            {error && (
              <div class="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6 border border-red-200">
                {error}
              </div>
            )}

            <a
              href="/auth/google"
              class="flex items-center justify-center gap-3 w-full px-6 py-3 bg-white border-2 border-border-light rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all text-text-main font-semibold text-sm shadow-sm"
            >
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </a>

            <div class="my-5 flex items-center gap-3">
              <div class="h-px flex-1 bg-border-light" />
              <span class="text-xs text-text-secondary">or sign in with email</span>
              <div class="h-px flex-1 bg-border-light" />
            </div>

            <form method="post" action="/auth/email/login" class="space-y-3 text-left">
              <div>
                <label class="block text-xs font-semibold text-text-secondary mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-text-secondary mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm"
                  placeholder="Your password"
                  required
                />
              </div>
              <button
                type="submit"
                class="w-full px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary-dark transition-all shadow-sm"
              >
                Sign in with Email
              </button>
            </form>

            <p class="text-text-secondary text-xs mt-6">
              New members need admin approval before accessing the leaderboard.
            </p>
          </div>

          <div class="text-center mt-6">
            <p class="text-text-secondary text-xs">
              Markaz Talaqqi Islamic Boarding School
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};
