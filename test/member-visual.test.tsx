import { describe, expect, test } from "bun:test";
import { renderToString } from "hono/jsx/dom/server";
import { LogForm } from "../src/views/components/LogForm.tsx";
import { ActivityHistory } from "../src/views/components/ActivityHistory.tsx";

const log = {id:7,type:"tilawah" as const,date_wib:"2026-10-26",juz_amount:0.25,log_unit:"pages",log_amount:5.5,start_surah:3,start_ayah:93,end_surah:3,end_ayah:100,end_juz:4,created_at:"2026-10-26 00:00:00",updated_at:null};
describe("member reading forms and history",()=>{
  test("editing a page record preserves half pages and both Quran endpoints",()=>{
    const html=renderToString(<LogForm kind="tilawah" lang="id" todayWib="2026-10-26" dateDisabled initial={{logUnit:"pages",logAmount:5.5,startSurah:3,startAyah:93,endSurah:3,endAyah:100}}/>);
    expect(html).toContain('name="pages_whole"');
    expect(html).toMatch(/name="pages_half"[^>]*checked/);
    expect(html).toMatch(/name="start_ayah"[^>]*value="93"/);
    expect(html).toMatch(/name="end_ayah"[^>]*value="100"/);
    expect(html).not.toContain('<details');
    expect(html).toContain('data-total-ayahs="200"');
  });
  test("continuation is available for a saved position but never silently wraps after An-Nas",()=>{
    const last={date_wib:"2026-10-26",juz_amount:1,log_unit:"juz",log_amount:1,end_surah:3,end_ayah:100,end_juz:4};
    const normal=renderToString(<LogForm kind="tilawah" lang="id" todayWib="2026-10-26" lastLog={last}/>);
    const complete=renderToString(<LogForm kind="tilawah" lang="id" todayWib="2026-10-26" lastLog={{...last,end_surah:114,end_ayah:6,end_juz:30}}/>);
    expect(normal).toContain('data-continue-surah="3"');
    expect(complete).not.toContain('data-continue-surah');
  });
  test("recent history exposes both endpoints and a protected deletion form",()=>{
    const html=renderToString(<ActivityHistory logs={[log]} todayWib="2026-10-26" lang="id" removable/>);
    expect(html).toContain('Awal:');expect(html).toContain('Akhir:');
    expect(html).toContain('action="/tilawah/logs/7/delete"');
    expect(html).toContain('name="_csrf"');expect(html).toContain('data-confirm=');
    expect(html).toContain('/tilawah/logs/7/edit');
  });
  test("history does not offer edit or delete for records older than seven days",()=>{
    const html=renderToString(<ActivityHistory logs={[{...log,date_wib:"2026-10-19"}]} todayWib="2026-10-26" lang="id" removable/>);
    expect(html).not.toContain('/edit');expect(html).not.toContain('/delete');
    expect(html).toContain('5½ halaman');
  });
});
