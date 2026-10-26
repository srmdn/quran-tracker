import type { FC } from "hono/jsx";
import { MemberLayout } from "../MemberLayout.tsx";
import { Icon } from "../components/Icon.tsx";
import type { User } from "../../types.ts";
import type { MonthlyActivityRow } from "../../lib/activity-calc.ts";
import { t, type Lang } from "../../lib/i18n.ts";

type EnrichedRow = MonthlyActivityRow & { current_streak: number; streak_active: boolean };
export const ActivityLeaderboardPage: FC<{
  user: User; lang: Lang; year: number; month: number; rows: EnrichedRow[];
  total: number; isCurrentMonth: boolean;
  prevMonth: { year: number; month: number } | null;
  nextMonth: { year: number; month: number } | null;
}> = ({ user, lang, year, month, rows, total, isCurrentMonth, prevMonth, nextMonth }) => {
  const locale = lang === "id" ? "id-ID" : "en-US";
  const monthName = (m: number, y: number) => new Intl.DateTimeFormat(locale, {month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(Date.UTC(y,m-1,1)));
  const monthLabel = monthName(month,year);
  const number = (value: number) => new Intl.NumberFormat(locale,{maximumFractionDigits:2}).format(value);
  const myRow = rows.find(row => row.id === user.id);
  const monthLink = (period: {year:number;month:number}) => `/activity/leaderboard?year=${period.year}&month=${period.month}`;
  return <MemberLayout title={t(lang,"memberNavCommunity")} user={user} lang={lang} currentPath="/activity/leaderboard">
    <header class="page-head"><div><p class="eyebrow">{t(lang,"visualCommunityEyebrow")}</p><h1>{t(lang,"leaderboard")}</h1><p>{t(lang,"visualCommunityLead")}</p></div></header>
    <nav class="card ranking-period" aria-label={t(lang,"visualRankingPeriod")}>
      {prevMonth ? <a class="ranking-month-arrow ranking-prev" href={monthLink(prevMonth)} aria-label={monthName(prevMonth.month,prevMonth.year)}><Icon name="arrow" /></a> : <span />}
      <div><strong>{monthLabel}</strong><span class="ranking-status">{t(lang,isCurrentMonth ? "visualRankingLive" : "visualRankingArchive")}</span></div>
      {nextMonth ? <a class="ranking-month-arrow" href={monthLink(nextMonth)} aria-label={monthName(nextMonth.month,nextMonth.year)}><Icon name="arrow" /></a> : <span />}
    </nav>
    {myRow ? <a class="ranking-personal" href="#my-rank"><span class="ranking-personal-icon"><Icon name="chart" size={22} /></span><div><span>{t(lang,"visualYourRank")}</span><strong>#{myRow.rank} <small>{t(lang,"visualRankingOf").replace("{count}",number(total))}</small></strong></div><div class="ranking-personal-score"><strong>{number(myRow.score)}</strong><span>{t(lang,"ptsLabel")}</span></div><Icon name="arrow" /></a>
      : <div class="card ranking-unlisted"><Icon name="users" /><p>{t(lang,isCurrentMonth ? "visualRankingUnlisted" : "visualRankingArchiveUnlisted")}</p></div>}
    {!isCurrentMonth && <p class="ranking-archive-note">{t(lang,"visualRankingArchiveNote")}</p>}
    <section class="card ranking-list" aria-labelledby="ranking-title">
      <div class="ranking-list-head"><div><h2 id="ranking-title">{t(lang,"allRankings")}</h2><p>{t(lang,"visualRankingMembers").replace("{count}",number(total))}</p></div><Icon name="users" size={20} /></div>
      {rows.length ? <><div class="ranking-columns" aria-hidden="true"><span>#</span><span>{t(lang,"nameCol")}</span><span>Tilawah</span><span>Murojaah</span><span>Khatam</span>{isCurrentMonth && <span>{t(lang,"streakCol")}</span>}<span>{t(lang,"scoreCol")}</span></div>
        <ol class={`ranking-rows ${isCurrentMonth ? "ranking-live" : "ranking-archived"}`}>
          {rows.map(row => <li value={row.rank} id={row.id===user.id ? "my-rank" : undefined} class={`ranking-row ${row.id===user.id ? "ranking-self" : ""} ${row.rank<=3 ? "ranking-top" : ""}`}>
            <span class="ranking-number" aria-label={`${t(lang,"visualRankLabel")} ${row.rank}`}>{row.rank}</span>
            <div class="ranking-member">{row.avatar_url ? <img class="ranking-avatar" src={row.avatar_url} alt="" loading="lazy" width="36" height="36" /> : <span class="ranking-avatar" aria-hidden="true">{row.name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0]).join("").toUpperCase()}</span>}<div><strong>{row.name}</strong>{row.id===user.id && <span class="ranking-you">{t(lang,"youLabel")}</span>}</div></div>
            <dl class="ranking-metrics"><div><dt>Tilawah</dt><dd>{number(row.tilawah_juz)} <span>juz</span></dd></div><div><dt>Murojaah</dt><dd>{number(row.murojaah_juz)} <span>juz</span></dd></div><div><dt>Khatam</dt><dd>{number(row.khatam_count)}</dd></div>{isCurrentMonth && <div class={`ranking-streak ${row.streak_active ? "is-active" : ""}`}><dt>{t(lang,"streakCol")}</dt><dd><Icon name="flame" size={13} />{row.current_streak}</dd></div>}</dl>
            <div class="ranking-score"><strong>{number(row.score)}</strong><span>{t(lang,"ptsLabel")}</span></div>
          </li>)}
        </ol></> : <div class="ranking-empty"><Icon name="chart" size={28} /><h3>{t(lang,isCurrentMonth ? "visualRankingEmpty" : "visualRankingNoSnapshot")}</h3><p>{t(lang,isCurrentMonth ? "visualRankingEmptyHint" : "visualRankingNoSnapshotHint")}</p></div>}
    </section>
    <details class="card ranking-formula"><summary>{t(lang,"scoreFormulaLabel")}</summary><p>{t(lang,"visualRankingFormula")}</p><p>{t(lang,"visualRankingKhatam")}</p></details>
  </MemberLayout>;
};
