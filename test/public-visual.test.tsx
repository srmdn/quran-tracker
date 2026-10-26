import { expect, test } from "bun:test";
import { renderToString } from "hono/jsx/dom/server";
import { LoginPage } from "../src/views/pages/LoginPage.tsx";
import { LandingPage } from "../src/views/pages/LandingPage.tsx";
import { FASTABIQ_ENTRIES } from "../src/lib/fastabiq-verses.ts";
test("login retains both sign-in methods and protected credentials form",()=>{
 const html=renderToString(<LoginPage lang="id" error="Email atau password salah"/>);
 expect(html).toContain('class="visual-public"');expect(html).toContain('href="/auth/google"');
 expect(html).toContain('action="/auth/email/login"');expect(html).toContain('name="_csrf"');
 expect(html).toContain('autocomplete="current-password"');expect(html).toContain('role="alert"');
 expect(html).not.toContain('href="/enroll"');
});
test("landing separates illustrative reading from actual totals and preserves religious text",()=>{
 const entry=FASTABIQ_ENTRIES[0]!;
 const html=renderToString(<LandingPage lang="id" totalMembers={1234} totalTilawahJuz={45.5} totalMurojaahJuz={12} totalKhatam={3} fastabiqEntry={entry}/>);
 expect(html).toContain('Contoh tampilan');expect(html).toContain('1.234');expect(html).toContain('45,5');
 expect(html).toContain(entry.verseArabic);expect(html).toContain(entry.hadithArabic);
 for(const id of ['cara-kerja','untuk-siapa','manfaat'])expect(html).toContain(`id="${id}"`);
 expect(html).toContain('href="/login"');expect(html).not.toContain('href="/enroll"');
 expect(html).not.toContain('class="seal"');expect(html).not.toContain('class="arch"');
});
