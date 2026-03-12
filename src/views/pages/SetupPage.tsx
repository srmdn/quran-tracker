import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import type { User } from "../../types.ts";
import type { UserTarget } from "../../lib/targets.ts";
import { APP_NAME, ORG_NAME } from "../../config.ts";

export const SetupPage: FC<{
  user: User;
  existing: UserTarget | null;
  error?: string;
}> = ({ user, existing, error }) => {
  return (
    <Layout title={`Set Your Daily Target - ${APP_NAME}`}>
      <div class="flex-1 flex items-center justify-center px-4 py-12">
        <div class="w-full max-w-md">
          <div class="text-center mb-8">
            <div class="size-16 mx-auto mb-4">
              <img src="/public/logo.png" alt="Logo" class="w-full h-full object-contain" />
            </div>
            <h1 class="text-text-main text-2xl font-black tracking-tight mb-2">
              {existing ? "Update Your Daily Target" : "Set Your Daily Target"}
            </h1>
            <p class="text-text-secondary text-sm">
              {existing
                ? "Adjust your daily Tilawah and Murojaah goals."
                : `Before you start, set your daily Quran goals at ${ORG_NAME}. You can change these anytime.`}
            </p>
          </div>

          <div class="bg-white border border-border-light rounded-2xl p-8 shadow-sm">
            {error && (
              <div class="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6 border border-red-200">
                {error}
              </div>
            )}

            <form method="post" action="/setup" class="space-y-6">
              <div>
                <label class="block text-sm font-bold text-text-main mb-1">
                  Daily Tilawah Target
                </label>
                <p class="text-xs text-text-secondary mb-2">How many juz do you want to read each day? (max 3)</p>
                <div class="relative">
                  <input
                    type="number"
                    name="tilawah_juz_daily"
                    min="0.5"
                    max="3"
                    step="0.5"
                    value={existing ? String(existing.tilawah_juz_daily) : "1"}
                    class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm pr-12"
                    required
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary font-medium">juz/day</span>
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-text-main mb-1">
                  Daily Murojaah Target
                </label>
                <p class="text-xs text-text-secondary mb-2">How many juz do you want to revise each day? (max 5)</p>
                <div class="relative">
                  <input
                    type="number"
                    name="murojaah_juz_daily"
                    min="0.5"
                    max="5"
                    step="0.5"
                    value={existing ? String(existing.murojaah_juz_daily) : "1"}
                    class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm pr-12"
                    required
                  />
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary font-medium">juz/day</span>
                </div>
              </div>

              <button
                type="submit"
                class="w-full py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-all shadow-sm"
              >
                {existing ? "Save Changes" : "Start Tracking"}
              </button>
            </form>
          </div>

          <p class="text-center text-xs text-text-secondary mt-6">
            Signed in as {user.name} &bull; <a href="/auth/logout" class="hover:underline">Sign out</a>
          </p>
        </div>
      </div>
    </Layout>
  );
};
