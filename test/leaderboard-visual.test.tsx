import { expect, test } from "bun:test";
import { renderToString } from "hono/jsx/dom/server";
import { ActivityLeaderboardPage } from "../src/views/pages/ActivityLeaderboardPage.tsx";
import type { User } from "../src/types.ts";
const user: User = { id:1,name:"Alya Contoh",email:"alya@example.test",google_id:"manual:demo",avatar_url:null,role:"santri",created_at:"2026-10-01",updated_at:"2026-10-01" };
const row = {id:1,name:'Alya <script>contoh</script>',avatar_url:null,role:"santri",tilawah_juz:1.25,murojaah_juz:2.5,khatam_count:1,score:330,rank:2,current_streak:7,streak_active:true};
const props = {user,lang:"id" as const,year:2026,month:10,rows:[row],total:2,isCurrentMonth:true,prevMonth:{year:2026,month:9},nextMonth:null};
test("rankings keep supplied rank, score, own anchor, localized month and escaped names",()=>{
 const html=renderToString(<ActivityLeaderboardPage {...props}/>);
 expect(html).toContain('class="app-body visual-app"');
 expect(html).toContain('aria-current="page"');
 expect(html).toContain('id="my-rank"');
 expect(html).toContain('href="#my-rank"');
 expect(html).toContain('Oktober 2026');
 expect(html).toContain('year=2026&amp;month=9');
 expect(html).toContain('1,25');
 expect(html).toContain('330');
 expect(html).toContain('&lt;script&gt;');
 expect(html).not.toContain('<script>contoh');
 expect(html).not.toContain('material-symbols-outlined');
});
test("archive retains saved results and navigation without presenting a live streak",()=>{
 const html=renderToString(<ActivityLeaderboardPage {...props} month={9} isCurrentMonth={false} nextMonth={{year:2026,month:10}}/>);
 expect(html).toContain('Arsip bulanan');
 expect(html).toContain('330');
 expect(html).not.toContain('ranking-streak');
 expect(html).toContain('perhitungan khatam yang berbeda');
 expect(html).toContain('href="#my-rank"');
 expect(html).toContain('year=2026&amp;month=10');
});
test("empty and absent-member states show useful text without a broken rank link",()=>{
 for(const isCurrentMonth of [true,false]){
  const html=renderToString(<ActivityLeaderboardPage {...props} rows={[]} total={0} isCurrentMonth={isCurrentMonth}/>);
  expect(html).not.toContain('href="#my-rank"');
  expect(html).toContain(isCurrentMonth?'Belum ada peringkat':'Arsip bulan ini belum tersedia');
 }
});
