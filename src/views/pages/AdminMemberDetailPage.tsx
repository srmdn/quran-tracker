import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { Header } from "../components/Header.tsx";
import type { User } from "../../types.ts";
import { SURAHS } from "../../data/quran-meta.ts";
import { APP_NAME } from "../../config.ts";
import type { UserTarget } from "../../lib/targets.ts";
import type { UserStreak } from "../../lib/streak.ts";
import type { ActivityTotals, UserMonthlyActivityRank } from "../../lib/activity-calc.ts";
import type { RecentLogEntry } from "../../routes/dashboard.tsx";
import { t, type Lang } from "../../lib/i18n.ts";

export const AdminMemberDetailPage: FC<{
  adminUser: User;
  member: User;
  lang: Lang;
  target: UserTarget | null;
  streak: UserStreak;
  activityTotals: ActivityTotals;
  todayTilawah: number;
  todayMurojaah: number;
  todayWib: string;
  monthlyRank: UserMonthlyActivityRank;
  recentLogs: RecentLogEntry[];
  success?: string;
  error?: string;
}> = ({
  adminUser,
  member,
  lang,
  target,
  streak,
  activityTotals,
  todayTilawah,
  todayMurojaah,
  todayWib,
  monthlyRank,
  recentLogs,
  success,
  error,
}) => {
  const tilawahPercent = target
    ? Math.min(100, Math.round((todayTilawah / target.tilawah_juz_daily) * 100))
    : 0;
  const murojaahPercent = target
    ? Math.min(100, Math.round((todayMurojaah / target.murojaah_juz_daily) * 100))
    : 0;

  return (
    <Layout title={`${member.name} — ${APP_NAME}`}>
      <Header user={adminUser} currentPath="/admin" lang={lang} />
      <main class="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">

        {/* Back link */}
        <div class="w-full flex items-center justify-between mb-6">
          <a
            href="/admin"
            class="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors"
          >
            <span class="material-symbols-outlined text-base">arrow_back</span>
            {t(lang, "backToAdmin")}
          </a>
          <a
            href={`/admin/members/${member.id}/edit`}
            class="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-dark transition-colors"
          >
            <span class="material-symbols-outlined text-base">edit</span>
            Edit
          </a>
        </div>

        {success && (
          <div class="w-full bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-lg mb-6 border border-emerald-200 flex items-center gap-2">
            <span class="material-symbols-outlined text-lg">check_circle</span>
            {success}
          </div>
        )}
        {error && (
          <div class="w-full bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-6 border border-red-200 flex items-center gap-2">
            <span class="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        {/* Member header */}
        <div class="w-full bg-white border border-border-light rounded-xl p-6 mb-6 flex items-center gap-4">
          {member.avatar_url ? (
            <div
              class="bg-center bg-no-repeat bg-cover rounded-full size-16 flex-shrink-0"
              style={`background-image: url("${member.avatar_url}");`}
            />
          ) : (
            <div class="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-black border border-primary/20 flex-shrink-0">
              {member.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
          )}
          <div class="flex-1 min-w-0">
            <h1 class="text-text-main text-2xl font-black leading-tight">{member.name}</h1>
            <p class="text-text-secondary text-sm">{member.email}</p>
            <div class="flex items-center gap-2 mt-1.5">
              <span class="text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                {member.role}
              </span>
              <span class="text-xs text-text-secondary">{t(lang, "joinedLabel")} {member.created_at.slice(0, 10)}</span>
            </div>
          </div>
          {streak.current_streak > 0 && (
            <div class="text-center flex-shrink-0">
              <span class="text-3xl">🔥</span>
              <p class="text-sm font-bold text-orange-500">{streak.current_streak} {t(lang, "days")}</p>
            </div>
          )}
        </div>

        {/* Today's progress */}
        <div class="w-full bg-white border border-border-light rounded-xl p-6 mb-6">
          <h2 class="text-text-main font-bold mb-4 flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-xl">today</span>
            {t(lang, "todayProgressLabel")}
            <span class="text-xs font-normal text-text-secondary ml-auto">{todayWib}</span>
          </h2>
          {target ? (
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Tilawah */}
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-semibold text-text-main">Tilawah</span>
                  <span class="text-sm font-semibold text-text-secondary">
                    {todayTilawah}/{target.tilawah_juz_daily} {t(lang, "juz")}
                  </span>
                </div>
                <div class="w-full h-3 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                  <div
                    class={`h-full rounded-full transition-all ${tilawahPercent >= 100 ? "bg-emerald-500" : "bg-primary"}`}
                    style={`width: ${tilawahPercent}%`}
                  />
                </div>
                <p class="text-xs text-text-secondary mt-1">
                  {tilawahPercent >= 100
                    ? t(lang, "targetMet")
                    : `${Math.max(0, target.tilawah_juz_daily - todayTilawah).toFixed(1)} ${t(lang, "juzToGo")}`}
                </p>
              </div>
              {/* Murojaah */}
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-semibold text-text-main">Murojaah</span>
                  <span class="text-sm font-semibold text-text-secondary">
                    {todayMurojaah}/{target.murojaah_juz_daily} {t(lang, "juz")}
                  </span>
                </div>
                <div class="w-full h-3 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                  <div
                    class={`h-full rounded-full transition-all ${murojaahPercent >= 100 ? "bg-emerald-500" : "bg-amber-500"}`}
                    style={`width: ${murojaahPercent}%`}
                  />
                </div>
                <p class="text-xs text-text-secondary mt-1">
                  {murojaahPercent >= 100
                    ? t(lang, "targetMet")
                    : `${Math.max(0, target.murojaah_juz_daily - todayMurojaah).toFixed(1)} ${t(lang, "juzToGo")}`}
                </p>
              </div>
            </div>
          ) : (
            <p class="text-text-secondary text-sm">{t(lang, "noTargetSet")}</p>
          )}
        </div>

        {/* Stats row */}
        <div class="w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          <div class="bg-white border border-border-light rounded-xl p-4 text-center">
            <p class="text-text-secondary text-xs font-medium mb-1">{t(lang, "streakLabel")}</p>
            <p class="text-2xl font-black text-orange-500">{streak.current_streak}</p>
            <p class="text-xs text-text-secondary">{t(lang, "days")}</p>
          </div>
          <div class="bg-white border border-border-light rounded-xl p-4 text-center">
            <p class="text-text-secondary text-xs font-medium mb-1">{t(lang, "bestStreakLabel")}</p>
            <p class="text-2xl font-black text-text-main">{streak.longest_streak}</p>
            <p class="text-xs text-text-secondary">{t(lang, "days")}</p>
          </div>
          <div class="bg-white border border-border-light rounded-xl p-4 text-center">
            <p class="text-text-secondary text-xs font-medium mb-1">{t(lang, "monthRank")}</p>
            <p class="text-2xl font-black text-primary">
              {monthlyRank ? `#${monthlyRank.rank}` : "-"}
            </p>
          </div>
          <div class="bg-white border border-border-light rounded-xl p-4 text-center">
            <p class="text-text-secondary text-xs font-medium mb-1">Tilawah</p>
            <p class="text-2xl font-black text-text-main">{activityTotals.tilawahJuz}</p>
            <p class="text-xs text-text-secondary">{t(lang, "juz")} all-time</p>
          </div>
          <div class="bg-white border border-border-light rounded-xl p-4 text-center">
            <p class="text-text-secondary text-xs font-medium mb-1">Murojaah</p>
            <p class="text-2xl font-black text-amber-500">{activityTotals.murojaahJuz}</p>
            <p class="text-xs text-text-secondary">{t(lang, "juz")} all-time</p>
          </div>
          <div class="bg-white border border-border-light rounded-xl p-4 text-center">
            <p class="text-text-secondary text-xs font-medium mb-1">Khatam</p>
            <p class="text-2xl font-black text-primary">{activityTotals.totalKhatam}</p>
            <p class="text-xs text-text-secondary">{t(lang, "times")}</p>
          </div>
        </div>

        {/* Daily target info */}
        {target && (
          <div class="w-full bg-slate-50 border border-border-light rounded-xl px-6 py-4 mb-6 flex items-center gap-6">
            <span class="material-symbols-outlined text-text-secondary text-xl">tune</span>
            <div class="flex items-center gap-8 text-sm">
              <div>
                <span class="text-text-secondary">{t(lang, "dailyTargetInfo")} </span>
                <span class="font-bold text-text-main">{target.tilawah_juz_daily} {t(lang, "juz")}</span>
              </div>
              <div>
                <span class="text-text-secondary">{t(lang, "dailyMurojaahInfo")} </span>
                <span class="font-bold text-text-main">{target.murojaah_juz_daily} {t(lang, "juz")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Log history */}
        <div class="w-full bg-white border border-border-light rounded-xl overflow-hidden">
          <div class="px-6 py-4 border-b border-border-light bg-slate-50/50">
            <h2 class="text-text-main font-bold flex items-center gap-2">
              <span class="material-symbols-outlined text-primary text-xl">history</span>
              {t(lang, "activityLog")}
              <span class="text-xs font-normal text-text-secondary ml-auto">{t(lang, "last30entries")}</span>
            </h2>
          </div>
          <div class="divide-y divide-border-light">
            {recentLogs.length === 0 ? (
              <div class="px-6 py-10 text-center text-text-secondary text-sm">
                {t(lang, "noActivityLogged")}
              </div>
            ) : (
              recentLogs.map((log) => {
                const surahName = log.end_surah
                  ? SURAHS.find((s) => s.number === log.end_surah)?.name
                  : null;
                const isTilawah = log.type === "tilawah";
                return (
                  <div class="px-6 py-3.5 flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                      <span
                        class={`text-xs font-bold px-2 py-0.5 rounded-full ${isTilawah ? "bg-primary/10 text-primary" : "bg-amber-50 text-amber-600"}`}
                      >
                        {isTilawah ? "Tilawah" : "Murojaah"}
                      </span>
                      <div>
                        <p class="text-sm font-semibold text-text-main">
                          {log.juz_amount} {t(lang, "juz")}
                          {log.repetition_count ? ` · ${log.repetition_count}x` : ""}
                        </p>
                        {surahName && (
                          <p class="text-xs text-text-secondary">
                            {t(lang, "endedAt")} · Juz {log.end_juz} · {surahName} : {log.end_ayah}
                          </p>
                        )}
                      </div>
                    </div>
                    <span class="text-xs text-text-secondary whitespace-nowrap">{log.date_wib}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </main>
    </Layout>
  );
};
