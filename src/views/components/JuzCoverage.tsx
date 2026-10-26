import { t, type Lang } from "../../lib/i18n.ts";
export function JuzCoverage({coverage, lang}: {coverage: Record<number,number>; lang: Lang}) {
  const count=Object.values(coverage).filter(n=>n>0).length;
  return <div class="juz-coverage"><p class="coverage-summary"><strong>{count}</strong><span>{t(lang,"visualJuzWithRecords")}</span></p>
    <div class="juz-grid" role="img" aria-label={`${count} ${t(lang,"visualJuzWithRecords")}: ${Object.keys(coverage).filter(k=>coverage[Number(k)]>0).join(", ")}`}>
      {Array.from({length:30},(_,i)=>i+1).map(juz=><span class="juz-cell" data-level={(coverage[juz]??0)>0?"4":"0"} title={`Juz ${juz}: ${coverage[juz]??0} ${t(lang,"entries")}`}>{juz}</span>)}
    </div><p class="coverage-hint">{t(lang,"visualCoverageHint")}</p>
  </div>;
}
