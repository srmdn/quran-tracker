import type { Child, FC } from "hono/jsx";
import { MemberLayout } from "./MemberLayout.tsx";
import { Icon } from "./components/Icon.tsx";
import type { User } from "../types.ts";
import type { Lang } from "../lib/i18n.ts";
export function adminRoleLabel(role: string) {
  const labels: Record<string,string> = {pending:"Menunggu",member:"Anggota",santri:"Santri",alumni:"Alumni",asatidz:"Asatidz",admin:"Admin",super_admin:"Super admin"};
  return labels[role] || role;
}
export const AdminLayout: FC<{title:string;user:User;lang:Lang;section?:"members"|"email";children:Child}> = ({title,user,lang,section="members",children}) => <MemberLayout title={title} user={user} lang={lang} currentPath={section==="email"?"/admin/email-log":"/admin"} adminPage>
  <div class="admin-workspace">
    <p class="eyebrow admin-eyebrow">PENGELOLAAN KOMUNITAS</p>
    <nav class="admin-tabs" aria-label="Menu admin"><a href="/admin" aria-current={section==="members"?"page":undefined}><Icon name="users" size={17}/>Anggota</a><a href="/admin/email-log" aria-current={section==="email"?"page":undefined}><Icon name="mail" size={17}/>Riwayat email</a></nav>
    {children}
  </div>
</MemberLayout>;
