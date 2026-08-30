import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { Header } from "../components/Header.tsx";
import type { User } from "../../types.ts";
import { SURAHS } from "../../data/quran-meta.ts";
import { APP_NAME } from "../../config.ts";
import { t, type Lang } from "../../lib/i18n.ts";

export type EditableLog = {
  id: number;
  date_wib: string;
  log_unit: string | null;
  log_amount: number | null;
  repetition_count?: number | null;
  start_surah: number | null;
  start_ayah: number | null;
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
  const isPages = log.log_unit === "pages";
  const pagesWhole = isPages && log.log_amount ? Math.floor(log.log_amount) : null;
  const pagesHalf = isPages && log.log_amount ? log.log_amount % 1 === 0.5 : false;
  const title = logType === "tilawah" ? "Tilawah" : "Murojaah";
  const backLabel = logType === "tilawah" ? t(lang, "backToTilawah") : t(lang, "backToMurojaah");

  return (
    <Layout title={`${t(lang, "editLogTitle")} - ${APP_NAME}`}>
      <Header user={user} currentPath={`/${logType}`} lang={lang} />
      <main class="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-8 max-w-2xl mx-auto">
        <div class="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 class="text-text-main text-3xl font-black leading-tight tracking-[-0.033em]">
              {t(lang, "editLogTitle")} · {title}
            </h1>
            <p class="text-text-secondary text-sm mt-1">{t(lang, "editLogHint")}</p>
          </div>
          <a href={backPath} class="px-4 py-2.5 rounded-lg border border-border-light bg-white text-sm font-semibold text-text-main hover:bg-slate-50">
            {backLabel}
          </a>
        </div>

        <div class="w-full bg-white border border-border-light rounded-xl p-6">
          <form method="post" action={`/${logType}/logs/${log.id}/edit`} class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-text-secondary mb-1">{t(lang, "dateWib")}</label>
              <input type="text" value={log.date_wib} disabled
                class="w-full rounded-lg border-slate-200 bg-slate-100 text-sm text-text-secondary" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-text-secondary mb-1">{t(lang, "juzAmount")}</label>
              <div class="flex rounded-lg overflow-hidden border border-slate-200 bg-slate-50 mb-2">
                <button type="button" id={`${logType}-edit-btn-juz`}
                  class={`flex-1 py-1.5 text-xs font-bold transition-colors rounded-l-lg ${!isPages ? "bg-primary text-white" : "text-text-secondary"}`}>
                  {t(lang, "inputModeJuz")}
                </button>
                <button type="button" id={`${logType}-edit-btn-pages`}
                  class={`flex-1 py-1.5 text-xs font-bold transition-colors rounded-r-lg ${isPages ? "bg-primary text-white" : "text-text-secondary"}`}>
                  {t(lang, "inputModePages")}
                </button>
              </div>
              <input type="hidden" name="input_mode" id={`${logType}-edit-input-mode`} value={isPages ? "pages" : "juz"} />
              <div id={`${logType}-edit-juz-fields`} style={isPages ? "display:none" : ""}>
                <input type="number" name="amount" min="1" max="30" step="1" value={!isPages && log.log_amount ? log.log_amount : ""}
                  class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" />
              </div>
              <div id={`${logType}-edit-pages-fields`} style={isPages ? "" : "display:none"}>
                <div class="flex items-center gap-3">
                  <input type="number" name="pages_whole" min="0" max="30" step="1" value={pagesWhole ?? ""}
                    class="flex-1 rounded-lg border-slate-200 bg-slate-50 text-sm" />
                  <label class="flex items-center gap-1.5 text-sm text-text-secondary whitespace-nowrap cursor-pointer">
                    <input type="checkbox" name="pages_half" checked={pagesHalf} class="rounded" />
                    ½ {lang === "id" ? "halaman" : "page"}
                  </label>
                </div>
              </div>
              <p class="text-xs text-text-secondary/70 mt-1">{lang === "id" ? "Biarkan kosong untuk hitung otomatis dari posisi awal dan akhir." : "Leave empty to auto-calculate from start and end position."}</p>
            </div>
            {logType === "murojaah" && (
              <div>
                <label class="block text-xs font-semibold text-text-secondary mb-1">{t(lang, "repetitionCount")}</label>
                <input type="number" name="repetition_count" min="1" max="100" step="1" value={log.repetition_count ?? ""}
                  class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" />
              </div>
            )}
            <div class="border-t border-border-light pt-4">
              <p class="text-xs font-bold text-text-secondary mb-3">{t(lang, "startingPosition")}</p>
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-semibold text-text-secondary mb-1">Surah</label>
                  <select name="start_surah" id={`${logType}-edit-start-surah`} class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm">
                    <option value="">Select surah...</option>
                    {SURAHS.map((s) => (
                      <option value={String(s.number)} selected={log.start_surah === s.number}>
                        {s.number}. {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-text-secondary mb-1">Ayah</label>
                  <input type="number" name="start_ayah" min="1" step="1" value={log.start_ayah ?? ""}
                    class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" />
                  <p id={`${logType}-edit-start-hint`} class="text-xs text-text-secondary mt-1"></p>
                </div>
              </div>
            </div>
            <div class="border-t border-border-light pt-4">
              <p class="text-xs font-bold text-text-secondary mb-3">{t(lang, "endingPosition")}</p>
              <div class="space-y-3">
                <div>
                  <label class="block text-xs font-semibold text-text-secondary mb-1">Surah</label>
                  <select name="end_surah" id={`${logType}-edit-end-surah`} class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" required>
                    <option value="">Select surah...</option>
                    {SURAHS.map((s) => (
                      <option value={String(s.number)} selected={log.end_surah === s.number}>
                        {s.number}. {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-text-secondary mb-1">Ayah</label>
                  <input type="number" name="end_ayah" min="1" step="1" value={log.end_ayah ?? ""}
                    class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" required />
                  <p id={`${logType}-edit-end-hint`} class="text-xs text-text-secondary mt-1"></p>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-3 pt-2">
              <button type="submit"
                class="flex-1 py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors">
                {t(lang, "saveChanges")}
              </button>
              <a href={backPath}
                class="px-4 py-2.5 rounded-lg border border-border-light bg-white text-sm font-semibold text-text-secondary hover:bg-slate-50">
                {lang === "id" ? "Batal" : "Cancel"}
              </a>
            </div>
          </form>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `(function(){
  var AC=${JSON.stringify(Object.fromEntries(SURAHS.map(s => [s.number, s.totalAyahs])))};
  var type='${logType}';
  function updSel(id){var s=document.getElementById(type+'-edit-'+id+'-surah');var h=document.getElementById(type+'-edit-'+id+'-hint');function u(){var v=parseInt(s.value,10);if(h)h.textContent=v&&AC[v]?'max: '+AC[v]:'';}if(h){s.addEventListener('change',u);u();}}
  updSel('start');updSel('end');
  var btnJuz=document.getElementById(type+'-edit-btn-juz');
  var btnPages=document.getElementById(type+'-edit-btn-pages');
  var modeInp=document.getElementById(type+'-edit-input-mode');
  var juzFields=document.getElementById(type+'-edit-juz-fields');
  var pagesFields=document.getElementById(type+'-edit-pages-fields');
  function setMode(m){
    modeInp.value=m;
    if(m==='pages'){
      btnJuz.className='flex-1 py-1.5 text-xs font-bold text-text-secondary transition-colors rounded-l-lg';
      btnPages.className='flex-1 py-1.5 text-xs font-bold bg-primary text-white transition-colors rounded-r-lg';
      juzFields.style.display='none';
      pagesFields.style.display='';
    }else{
      btnJuz.className='flex-1 py-1.5 text-xs font-bold bg-primary text-white transition-colors rounded-l-lg';
      btnPages.className='flex-1 py-1.5 text-xs font-bold text-text-secondary transition-colors rounded-r-lg';
      juzFields.style.display='';
      pagesFields.style.display='none';
    }
  }
  btnJuz.addEventListener('click',function(){setMode('juz');});
  btnPages.addEventListener('click',function(){setMode('pages');});
})();` }} />
      </main>
    </Layout>
  );
};
