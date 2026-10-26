import type { FC } from "hono/jsx";
import { APP_NAME, ORG_NAME } from "../../config.ts";
import { t, type Lang } from "../../lib/i18n.ts";
export const PublicHeader: FC<{lang:Lang;landing?:boolean;showLogin?:boolean}> = ({lang,landing=false,showLogin=true}) => <>
  <a class="skip-link" href="#main">{t(lang,"memberSkip")}</a>
  <header class="public-header"><div class="container"><a class="brand" href="/landing"><img src="/public/logo-128.png" alt="" width="34" height="34"/><span>{APP_NAME}<small>{ORG_NAME}</small></span></a>{landing && <nav aria-label={t(lang,"visualMainNav")}><a href="#cara-kerja">{t(lang,"marketingHowEyebrow")}</a><a href="#untuk-siapa">{t(lang,"marketingWhoEyebrow")}</a><a href="#manfaat">{t(lang,"marketingBenefitEyebrow")}</a></nav>}{showLogin && <a class="btn btn-secondary btn-sm" href="/login">{t(lang,"marketingLogin")}</a>}</div></header>
</>;
