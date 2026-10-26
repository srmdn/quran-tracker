import { Icon } from "./Icon.tsx";
import { CsrfInput } from "./CsrfInput.tsx";
import { SURAHS } from "../../data/quran-meta.ts";
import { formatLogAmount } from "../../lib/format-juz.ts";
import { t, type Lang } from "../../lib/i18n.ts";

export type HistoryEntry = {
  id: number; type: "tilawah" | "murojaah"; date_wib: string; juz_amount: number;
  log_unit: string | null; log_amount: number | null; repetition_count?: number | null;
  start_surah: number | null; start_ayah: number | null;
  end_surah: number | null; end_ayah: number | null; end_juz: number | null;
  created_at: string; updated_at?: string | null;
};
export function ActivityHistory({ logs, todayWib, lang, removable = false }: {
  logs: HistoryEntry[]; todayWib: string; lang: Lang; removable?: boolean;
}) {
  const cutoff = new Date(`${todayWib}T00:00:00Z`); cutoff.setUTCDate(cutoff.getUTCDate() - 6);
  const firstEditableDate = cutoff.toISOString().slice(0, 10);
  if (!logs.length) return <div class="empty-state"><Icon name="book" size={28} /><h3>{t(lang, "visualNoRecords")}</h3><p>{t(lang, "visualEmptyHistory")}</p><a class="btn btn-secondary" href="/tilawah">{t(lang, "logTilawah")}</a></div>;
  return <div class="activity-list">{logs.map(log => {
    const start = SURAHS.find(s => s.number === log.start_surah);
    const end = SURAHS.find(s => s.number === log.end_surah);
    const canEdit = log.date_wib >= firstEditableDate;
    const date = new Intl.DateTimeFormat("id-ID", {day:"numeric",month:"short",timeZone:"UTC"}).format(new Date(log.date_wib+"T00:00:00Z"));
    const time = new Intl.DateTimeFormat("id-ID", {hour:"2-digit",minute:"2-digit",timeZone:"Asia/Jakarta"}).format(new Date(log.created_at.replace(" ","T")+"Z"));
    return <article class="activity-row">
      <div class={`activity-mark${log.type === "murojaah" ? " teal" : ""}`}><Icon name={log.type === "tilawah" ? "book" : "repeat"} size={17} /></div>
      <div class="activity-main"><strong>{log.type === "tilawah" ? "Tilawah" : "Murojaah"}</strong>
        <span>{date} · {time} WIB{log.repetition_count ? ` · ${log.repetition_count}×` : ""}{log.updated_at ? ` · ${t(lang, "editedLabel")}` : ""}</span>
        {start && log.start_ayah && <span class="position-text">{t(lang, "visualStart")}: {start.name} {log.start_ayah}</span>}
        {end && log.end_ayah && <span class="position-text">{t(lang, "visualEnd")}: {end.name} {log.end_ayah}{log.end_juz ? ` · Juz ${log.end_juz}` : ""}</span>}
      </div>
      <div class="activity-side"><strong>{formatLogAmount(log.juz_amount, log.log_unit, log.log_amount, lang)}</strong>
        {canEdit && <div class="log-actions"><a class="activity-edit" href={`/${log.type}/logs/${log.id}/edit`} aria-label={`${t(lang, "editEntry")}: ${log.type}, ${date}, ${time}`}><Icon name="edit" size={16} /><span>{t(lang, "memberEdit")}</span></a>
          {removable && <form method="post" action={`/${log.type}/logs/${log.id}/delete`} data-confirm={t(lang, "visualDeleteConfirm")}><CsrfInput /><button class="delete-entry" type="submit" aria-label={`${t(lang, "delete")}: ${log.type}, ${date}, ${time}`}><Icon name="close" size={15} /><span>{t(lang, "delete")}</span></button></form>}
        </div>}
      </div>
    </article>;
  })}</div>;
}
