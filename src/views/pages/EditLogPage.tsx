import type { FC } from "hono/jsx";
import { MemberLayout } from "../MemberLayout.tsx";
import { LogForm } from "../components/LogForm.tsx";
import type { User } from "../../types.ts";
import { t, type Lang } from "../../lib/i18n.ts";

function longDate(ymd: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "id" ? "id-ID" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${ymd}T00:00:00Z`));
}

export type EditableLog = {
  id: number;
  date_wib: string;
  juz_amount: number;
  log_unit: string | null;
  log_amount: number | null;
  repetition_count?: number | null;
  start_surah: number | null;
  start_ayah: number | null;
  start_juz: number | null;
  end_surah: number | null;
  end_ayah: number | null;
  end_juz: number | null;
};

export const EditLogPage: FC<{
  user: User;
  lang: Lang;
  logType: "tilawah" | "murojaah";
  log: EditableLog;
  backPath: string;
}> = ({ user, lang, logType, log, backPath }) => {
  const typeTitle = logType === "tilawah" ? "Tilawah" : "Murojaah";
  return (
    <MemberLayout
      title={`${t(lang, "editLogTitle")} ${typeTitle}`}
      description={t(lang, "editLogHint")}
      user={user}
      lang={lang}
      currentPath={`/${logType}`}
    >
      <div class="page-head reveal">
        <div>
          <p class="eyebrow">{t(lang, "editLogTitle")}</p>
          <h1>{t(lang, "editLogTitle")} · {typeTitle}</h1>
          <p>{t(lang, "editLogHint")}</p>
        </div>
      </div>

      <div class="log-layout">
        <LogForm
          kind={logType}
          lang={lang}
          todayWib={log.date_wib}
          dateValue={log.date_wib}
          dateDisabled
          title={t(lang, "logEntryDetails")}
          submitLabel={t(lang, "saveChanges")}
          cancelHref={backPath}
          hasRepetition={logType === "murojaah"}
          action={`/${logType}/logs/${log.id}/edit`}
          initial={{
            juzAmount: log.juz_amount,
            logUnit: log.log_unit,
            logAmount: log.log_amount,
            startSurah: log.start_surah,
            startAyah: log.start_ayah,
            endSurah: log.end_surah,
            endAyah: log.end_ayah,
            repetitionCount: log.repetition_count ?? null,
          }}
        />

        <aside class="side-stack">
          <section class="side-note" style="border-color: rgba(184, 134, 47, 0.45); background: rgba(234, 216, 180, 0.18)">
            <h3>{t(lang, "logEditWindowTitle")}</h3>
            <p>{t(lang, "logEditWindowText")}</p>
          </section>
          <section class="side-note">
            <h3>{t(lang, "logLastEntry")}</h3>
            <p>{longDate(log.date_wib, lang)}</p>
          </section>
        </aside>
      </div>
    </MemberLayout>
  );
};
