import type { FC } from "hono/jsx";
import { Layout } from "../Layout.tsx";
import { Header } from "../components/Header.tsx";
import type { User } from "../../types.ts";
import { SURAHS, JUZ_BOUNDARIES } from "../../data/quran-meta.ts";
import { APP_NAME } from "../../config.ts";
import type { UserTarget } from "../../lib/targets.ts";
import { t, type Lang } from "../../lib/i18n.ts";
import { formatJuz, formatLogAmount } from "../../lib/format-juz.ts";

type LogEntry = {
  id: number;
  date_wib: string;
  juz_amount: number;
  log_unit: string | null;
  log_amount: number | null;
  start_surah: number | null;
  start_ayah: number | null;
  start_juz: number | null;
  end_surah: number | null;
  end_ayah: number | null;
  end_juz: number | null;
  created_at: string;
};

function fmtWibTime(utcStr: string): string {
  return new Date(utcStr.replace(" ", "T") + "Z").toLocaleString("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

// Compute surah→juz map (first juz the surah starts in)
const surahToJuz: Record<number, number> = {};
for (const juz of JUZ_BOUNDARIES) {
  for (let s = juz.startSurah; s <= juz.endSurah; s++) {
    if (!(s in surahToJuz)) surahToJuz[s] = juz.juzNumber;
  }
}
const surahToJuzJson = JSON.stringify(surahToJuz);

function juzCellStyle(count: number): string {
  if (count === 0) return "background:#e2e8f0";
  if (count === 1) return "background:#93b8df";
  if (count === 2) return "background:#5a8fc7";
  return "background:#2A65AE";
}

function JuzGrid({ coverage }: { coverage: Record<number, number> }) {
  return (
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px">
      {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => {
        const cnt = coverage[juz] ?? 0;
        return (
          <div
            title={`Juz ${juz}: ${cnt}x`}
            style={`height:36px;border-radius:6px;cursor:default;user-select:none;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:${cnt === 0 ? "#94a3b8" : cnt >= 3 ? "#fff" : "#1e4f8a"};${juzCellStyle(cnt)}`}
          >
            {juz}
          </div>
        );
      })}
    </div>
  );
}

export const TilawahPage: FC<{
  user: User;
  lang: Lang;
  success?: string;
  error?: string;
  todayWib: string;
  todayTotal: number;
  target: UserTarget;
  lastLog: LogEntry | null;
  recentLogs: LogEntry[];
  allTimeJuz: number;
  thisMonthJuz: number;
  totalKhatam: number;
  page: number;
  totalLogs: number;
  perPage: number;
  juzCoverageMonth: Record<number, number>;
  juzCoverageAllTime: Record<number, number>;
}> = ({ user, lang, success, error, todayWib, todayTotal, target, lastLog, recentLogs, allTimeJuz, thisMonthJuz, totalKhatam, page, totalLogs, perPage, juzCoverageMonth, juzCoverageAllTime }) => {
  const totalPages = Math.max(1, Math.ceil(totalLogs / perPage));
  const todayPercent = Math.min(100, Math.round((todayTotal / target.tilawah_juz_daily) * 100));
  const lastSurahName = lastLog?.end_surah ? SURAHS.find((s) => s.number === lastLog.end_surah)?.name : null;

  return (
    <Layout title={`Tilawah - ${APP_NAME}`}>
      <Header user={user} currentPath="/tilawah" lang={lang} />
      <main class="flex-1 flex flex-col items-center w-full px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">

        <div class="w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 class="text-text-main text-3xl font-black leading-tight tracking-[-0.033em]">Tilawah</h1>
            <p class="text-text-secondary text-sm">{t(lang, "tilawahSubtitle")}</p>
          </div>
          <a href="/murojaah" class="px-4 py-2.5 rounded-lg border border-border-light bg-white text-sm font-semibold text-text-main hover:bg-slate-50">
            {t(lang, "switchToMurojaah")}
          </a>
        </div>

        {success && (
          <div class="w-full bg-emerald-50 text-emerald-700 text-sm px-4 py-3 rounded-lg mb-4 border border-emerald-200">{success}</div>
        )}
        {error && (
          <div class="w-full bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 border border-red-200">{error}</div>
        )}

        {/* Today progress */}
        <div class="w-full bg-white border border-border-light rounded-xl p-6 mb-6">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-text-main font-bold">{t(lang, "todayProgress")}</h2>
            <span class="text-sm font-semibold text-text-secondary">{formatJuz(todayTotal, lang)} / {target.tilawah_juz_daily} juz</span>
          </div>
          <div class="w-full h-3 rounded-full bg-slate-100 border border-slate-200 overflow-hidden mb-1">
            <div class={`h-full rounded-full ${todayPercent >= 100 ? "bg-emerald-500" : "bg-primary"}`} style={`width: ${todayPercent}%`} />
          </div>
          <p class="text-xs text-text-secondary">{todayPercent >= 100 ? t(lang, "dailyTargetMet") : `${formatJuz(Math.max(0, target.tilawah_juz_daily - todayTotal), lang)} ${t(lang, "toGo")}`}</p>
        </div>

        {/* Last position */}
        {lastLog && lastLog.end_surah && (
          <div class="w-full bg-primary-light border border-primary/20 rounded-xl p-5 mb-6">
            <p class="text-xs font-bold text-primary uppercase mb-1">{t(lang, "lastRecordedPosition")}</p>
            <p class="text-text-main font-bold">
              Juz {lastLog.end_juz} &bull; {lastSurahName} &bull; Ayah {lastLog.end_ayah}
            </p>
            <p class="text-xs text-text-secondary mt-1">{t(lang, "loggedOn")} {lastLog.date_wib}</p>
          </div>
        )}

        <div class="w-full grid md:grid-cols-2 gap-6 mb-8">
          {/* Log form */}
          <div class="bg-white border border-border-light rounded-xl p-6">
            <h3 class="text-text-main text-lg font-bold mb-4">{t(lang, "logTilawah")}</h3>
            {todayPercent >= 100 ? (
              <div class="flex flex-col items-center justify-center gap-4 py-6 text-center">
                <div class="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span class="material-symbols-outlined text-emerald-600 text-3xl">check_circle</span>
                </div>
                <div>
                  <p class="font-bold text-text-main">{t(lang, "targetMetForToday")}</p>
                  <p class="text-xs text-text-secondary mt-1 max-w-xs">{t(lang, "targetMetForTodayDesc")}</p>
                </div>
                <a href="/setup" class="text-xs font-semibold text-primary hover:underline">{t(lang, "updateTargetLink")}</a>
              </div>
            ) : (
              <form method="post" action="/tilawah" class="space-y-4">
                <div>
                  <label class="block text-xs font-semibold text-text-secondary mb-1">{t(lang, "dateWib")}</label>
                  <input type="date" name="date_wib" value={todayWib}
                    class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" required />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-text-secondary mb-1">{t(lang, "juzAmount")}</label>
                  <div class="flex rounded-lg overflow-hidden border border-slate-200 bg-slate-50 mb-2">
                    <button type="button" id="til-btn-juz"
                      class="flex-1 py-1.5 text-xs font-bold bg-primary text-white transition-colors rounded-l-lg">
                      {t(lang, "inputModeJuz")}
                    </button>
                    <button type="button" id="til-btn-pages"
                      class="flex-1 py-1.5 text-xs font-bold text-text-secondary transition-colors rounded-r-lg">
                      {t(lang, "inputModePages")}
                    </button>
                  </div>
                  <input type="hidden" name="input_mode" id="til-input-mode" value="juz" />
                  <div id="til-juz-fields">
                    <input type="number" name="amount" id="til-amount-inp" min="1" max="30" step="1" placeholder="e.g. 1"
                      class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" />
                  </div>
                  <div id="til-pages-fields" style="display:none">
                    <div class="flex items-center gap-3">
                      <input type="number" name="pages_whole" id="til-pages-whole" min="0" max="30" step="1" placeholder="e.g. 10"
                        class="flex-1 rounded-lg border-slate-200 bg-slate-50 text-sm" />
                      <label class="flex items-center gap-1.5 text-sm text-text-secondary whitespace-nowrap cursor-pointer">
                        <input type="checkbox" name="pages_half" id="til-pages-half" class="rounded" />
                        ½ {lang === "id" ? "halaman" : "page"}
                      </label>
                    </div>
                  </div>
                  <p id="til-mode-hint" class="text-xs text-text-secondary mt-1"></p>
                  <p class="text-xs text-text-secondary/70 mt-1">{lang === "id" ? "Biarkan kosong untuk hitung otomatis dari posisi awal dan akhir." : "Leave empty to auto-calculate from start and end position."}</p>
                </div>
                <div class="border-t border-border-light pt-4">
                  <p class="text-xs font-bold text-text-secondary mb-3">{t(lang, "startingPosition")}</p>
                  <div class="space-y-3">
                    <div>
                      <label class="block text-xs font-semibold text-text-secondary mb-1">Surah</label>
                      <select name="start_surah" id="til-start-surah-sel"
                        data-last={String(lastLog?.end_surah ?? "")}
                        data-last-ayah={String(lastLog?.end_ayah ?? "")}
                        class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm">
                        <option value="">Select surah...</option>
                        {SURAHS.map((s) => (
                          <option value={String(s.number)}>
                            {s.number}. {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-text-secondary mb-1">Ayah</label>
                      <input type="number" name="start_ayah" id="til-start-ayah-inp" min="1" step="1" placeholder="e.g. 1"
                        class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" />
                      <p id="til-start-ayah-hint" class="text-xs text-text-secondary mt-1"></p>
                    </div>
                  </div>
                </div>
                <div class="border-t border-border-light pt-4">
                  <p class="text-xs font-bold text-text-secondary mb-3">{t(lang, "endingPosition")}</p>
                  <div class="space-y-3">
                    <div>
                      <label class="block text-xs font-semibold text-text-secondary mb-1">Surah</label>
                      <select name="end_surah" id="til-surah-sel"
                        data-last={String(lastLog?.end_surah ?? "")}
                        data-last-juz={String(lastLog?.end_juz ?? "")}
                        class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" required>
                        <option value="">Select surah...</option>
                        {SURAHS.map((s) => (
                          <option value={String(s.number)}>
                            {s.number}. {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs font-semibold text-text-secondary mb-1">Ayah</label>
                      <input type="number" name="end_ayah" id="til-ayah-inp" min="1" step="1" placeholder="e.g. 25"
                        class="w-full rounded-lg border-slate-200 bg-slate-50 text-sm" required />
                      <p id="til-ayah-hint" class="text-xs text-text-secondary mt-1"></p>
                    </div>
                  </div>
                </div>
                <button type="submit"
                  class="w-full py-2.5 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-dark transition-colors">
                  {t(lang, "saveTilawah")}
                </button>
              </form>
            )}
            {todayPercent < 100 && (
              <script dangerouslySetInnerHTML={{ __html: `(function(){
  var AC=${JSON.stringify(Object.fromEntries(SURAHS.map(s => [s.number, s.totalAyahs])))};
  var SJ=${surahToJuzJson};
  // Start position pre-fill
  var startSel=document.getElementById('til-start-surah-sel');
  var startAyahInp=document.getElementById('til-start-ayah-inp');
  var startHint=document.getElementById('til-start-ayah-hint');
  function updStart(){var v=parseInt(startSel.value,10);startHint.textContent=v&&AC[v]?'max: '+AC[v]:'';}
  startSel.addEventListener('change',updStart);
  var lastStart=startSel.getAttribute('data-last');
  var lastStartAyah=startSel.getAttribute('data-last-ayah');
  if(lastStart){startSel.value=lastStart;updStart();}
  if(lastStartAyah){startAyahInp.value=lastStartAyah;}
  // End position
  var sel=document.getElementById('til-surah-sel');
  var hint=document.getElementById('til-ayah-hint');
  var form=sel.closest('form');
  var lastJuz=parseInt(sel.getAttribute('data-last-juz')||'',10);
  function upd(){var v=parseInt(sel.value,10);hint.textContent=v&&AC[v]?'max: '+AC[v]:'';}
  sel.addEventListener('change',upd);
  var last=sel.getAttribute('data-last');
  if(last){sel.value=last;upd();}
  if(lastJuz&&form){
    form.addEventListener('submit',function(e){
      var v=parseInt(sel.value,10);
      if(!v||!SJ[v])return;
      var newJuz=SJ[v];
      if(Math.abs(newJuz-lastJuz)>5){
        var ok=confirm('Your last position was Juz '+lastJuz+'. You are now claiming Juz '+newJuz+'. Continue?');
        if(!ok)e.preventDefault();
      }
    });
  }
  // Mode toggle
  var btnJuz=document.getElementById('til-btn-juz');
  var btnPages=document.getElementById('til-btn-pages');
  var modeInp=document.getElementById('til-input-mode');
  var modeHint=document.getElementById('til-mode-hint');
  var juzFields=document.getElementById('til-juz-fields');
  var pagesFields=document.getElementById('til-pages-fields');
  var activeClass='flex-1 py-1.5 text-xs font-bold bg-primary text-white transition-colors';
  var inactiveClass='flex-1 py-1.5 text-xs font-bold text-text-secondary transition-colors';
  function setMode(m){
    modeInp.value=m;
    if(m==='pages'){
      btnJuz.className=inactiveClass+' rounded-l-lg';
      btnPages.className=activeClass+' rounded-r-lg';
      juzFields.style.display='none';
      pagesFields.style.display='';
      modeHint.textContent='${lang === "id" ? "20 halaman = 1 juz (Mushaf Madinah)" : "20 pages = 1 juz (Medina Mushaf)"}';
    }else{
      btnJuz.className=activeClass+' rounded-l-lg';
      btnPages.className=inactiveClass+' rounded-r-lg';
      juzFields.style.display='';
      pagesFields.style.display='none';
      modeHint.textContent='';
    }
  }
  btnJuz.addEventListener('click',function(){setMode('juz');});
  btnPages.addEventListener('click',function(){setMode('pages');});
})();` }} />
            )}
          </div>

          {/* Stats */}
          <div class="flex flex-col gap-4">
            <div class="bg-white border border-border-light rounded-xl p-5">
              <p class="text-xs text-text-secondary mb-1">{t(lang, "thisMonthTilawahStat")}</p>
              <p class="text-3xl font-black text-text-main">{thisMonthJuz.toFixed(1)} <span class="text-base font-medium text-text-secondary">{t(lang, "juz")}</span></p>
            </div>
            <div class="bg-white border border-border-light rounded-xl p-5">
              <p class="text-xs text-text-secondary mb-1">{t(lang, "allTimeTilawahStat")}</p>
              <p class="text-3xl font-black text-text-main">{allTimeJuz} <span class="text-base font-medium text-text-secondary">{t(lang, "juz")}</span></p>
            </div>
            <div class="bg-white border border-border-light rounded-xl p-5">
              <p class="text-xs text-text-secondary mb-1">Total Khatam</p>
              <p class="text-3xl font-black text-primary">{totalKhatam}</p>
              <p class="text-xs text-text-secondary mt-1">{t(lang, "verifiedCompletions")}</p>
            </div>
            <a href="/activity/leaderboard"
              class="bg-white border border-border-light rounded-xl p-5 hover:bg-slate-50 transition-colors text-center">
              <p class="text-sm font-bold text-primary">{t(lang, "viewLeaderboard")}</p>
            </a>
          </div>
        </div>

        {/* Juz coverage map */}
        <div class="w-full bg-white border border-border-light rounded-xl p-6 mb-8">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-text-main font-bold">{lang === "id" ? "Peta Juz" : "Juz Coverage Map"}</h3>
              <p class="text-xs text-text-secondary mt-0.5">{lang === "id" ? "Juz mana yang sudah kamu baca" : "Which juz you have read"}</p>
            </div>
            <div class="flex rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
              <button type="button" id="cov-btn-month"
                class="px-3 py-1.5 text-xs font-bold bg-primary text-white transition-colors rounded-l-lg">
                {lang === "id" ? "Bulan Ini" : "This Month"}
              </button>
              <button type="button" id="cov-btn-alltime"
                class="px-3 py-1.5 text-xs font-bold text-text-secondary transition-colors rounded-r-lg">
                {lang === "id" ? "Semua Waktu" : "All Time"}
              </button>
            </div>
          </div>
          <div id="cov-month">
            <JuzGrid coverage={juzCoverageMonth} />
          </div>
          <div id="cov-alltime" style="display:none">
            <JuzGrid coverage={juzCoverageAllTime} />
          </div>
          <div class="flex items-center gap-4 mt-3 text-xs text-text-secondary">
            <span class="flex items-center gap-1"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:#e2e8f0"></span> {lang === "id" ? "Belum" : "None"}</span>
            <span class="flex items-center gap-1"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:#93b8df"></span> 1x</span>
            <span class="flex items-center gap-1"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:#5a8fc7"></span> 2x</span>
            <span class="flex items-center gap-1"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:#2A65AE"></span> 3x+</span>
          </div>
          <script dangerouslySetInnerHTML={{ __html: `(function(){
  var btnM=document.getElementById('cov-btn-month');
  var btnA=document.getElementById('cov-btn-alltime');
  var divM=document.getElementById('cov-month');
  var divA=document.getElementById('cov-alltime');
  var activeC='px-3 py-1.5 text-xs font-bold bg-primary text-white transition-colors';
  var inactiveC='px-3 py-1.5 text-xs font-bold text-text-secondary transition-colors';
  btnM.addEventListener('click',function(){
    divM.style.display='';divA.style.display='none';
    btnM.className=activeC+' rounded-l-lg';btnA.className=inactiveC+' rounded-r-lg';
  });
  btnA.addEventListener('click',function(){
    divM.style.display='none';divA.style.display='';
    btnM.className=inactiveC+' rounded-l-lg';btnA.className=activeC+' rounded-r-lg';
  });
})();` }} />
        </div>

        {/* Recent logs */}
        <div class="w-full bg-white border border-border-light rounded-xl overflow-hidden">
          <div class="px-6 py-4 border-b border-border-light bg-slate-50/50 flex items-center justify-between">
            <h3 class="text-text-main text-lg font-bold">{t(lang, "tilawahLogs")}</h3>
            <span class="text-xs text-text-secondary">{totalLogs} {t(lang, "entries")}</span>
          </div>
          <div class="divide-y divide-border-light">
            {recentLogs.length === 0 ? (
              <div class="px-6 py-10 text-center text-text-secondary text-sm">{t(lang, "noTilawahYet")}</div>
            ) : (() => {
                const cutoff = new Date(todayWib);
                cutoff.setDate(cutoff.getDate() - 6);
                const cutoffStr = cutoff.toISOString().slice(0, 10);
                return recentLogs.map((log) => {
                  const startSurahName = log.start_surah ? SURAHS.find((s) => s.number === log.start_surah)?.name : null;
                  const surahName = log.end_surah ? SURAHS.find((s) => s.number === log.end_surah)?.name : null;
                  const canDelete = log.date_wib >= cutoffStr;
                  return (
                    <div class="px-6 py-4 flex items-center justify-between gap-4">
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-semibold text-text-main">{formatLogAmount(log.juz_amount, log.log_unit, log.log_amount, lang)}</p>
                        {surahName ? (
                          startSurahName ? (
                            <p class="text-xs text-text-secondary">
                              {t(lang, "startedAt")} Juz {log.start_juz} &bull; {startSurahName} : {log.start_ayah} &rarr; {t(lang, "endedAt")} Juz {log.end_juz} &bull; {surahName} : {log.end_ayah}
                            </p>
                          ) : (
                            <p class="text-xs text-text-secondary">
                              {t(lang, "endedAt")} Juz {log.end_juz} &bull; {surahName} : {log.end_ayah}
                            </p>
                          )
                        ) : (
                          <p class="text-xs text-text-secondary">{t(lang, "noPositionRecorded")}</p>
                        )}
                      </div>
                      <div class="flex items-center gap-3 flex-shrink-0">
                        <div class="text-right">
                          <span class="text-xs text-text-secondary block">{log.date_wib}</span>
                          <span class="text-xs text-text-secondary/60">{fmtWibTime(log.created_at)} WIB</span>
                        </div>
                        {canDelete && (
                          <form method="POST" action={`/tilawah/logs/${log.id}/delete`}
                            onsubmit="return confirm('Delete this entry?')">
                            <button type="submit" title={t(lang, "delete")}
                              class="text-slate-400 hover:text-red-500 transition-colors">
                              <span class="material-symbols-outlined text-lg">delete</span>
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                });
              })()
            }
          </div>
          {totalPages > 1 && (
            <div class="px-6 py-4 border-t border-border-light bg-slate-50/50 flex items-center justify-between gap-4">
              <span class="text-xs text-text-secondary">{t(lang, "page")} {page} {t(lang, "of")} {totalPages}</span>
              <div class="flex items-center gap-2">
                {page > 1 && (
                  <a href={`/tilawah?page=${page - 1}`}
                    class="px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary-light transition-colors">
                    {t(lang, "prev")}
                  </a>
                )}
                {page < totalPages && (
                  <a href={`/tilawah?page=${page + 1}`}
                    class="px-3 py-1.5 text-xs font-semibold text-primary border border-primary/30 rounded-lg hover:bg-primary-light transition-colors">
                    {t(lang, "next")}
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};
