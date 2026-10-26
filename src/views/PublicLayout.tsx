import type { FC, Child } from "hono/jsx";
import { APP_NAME, PUBLIC_BASE_URL } from "../config.ts";
import type { Lang } from "../lib/i18n.ts";

export const PublicLayout: FC<{
  visual?: boolean;
  title?: string;
  description?: string;
  url?: string;
  lang: Lang;
  children: Child;
}> = ({ title, description, url, lang, children, visual = false }) => {
  const resolvedTitle = title || APP_NAME;
  const resolvedDesc =
    description ||
    "Ruang tenang untuk mencatat tilawah dan murojaah, menjaga istiqamah, dan tumbuh bersama komunitas Markaz Talaqqi.";
  const resolvedUrl = url || PUBLIC_BASE_URL;
  const ogImage = `${PUBLIC_BASE_URL}/public/logo.png`;

  return (
    <html lang={lang}>
      <head>
        <meta charset="utf-8" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <title>{resolvedTitle}</title>
        <meta name="description" content={resolvedDesc} />
        <meta property="og:title" content={resolvedTitle} />
        <meta property="og:description" content={resolvedDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={resolvedUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:width" content="320" />
        <meta property="og:image:height" content="320" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={resolvedTitle} />
        <meta name="twitter:description" content={resolvedDesc} />
        <meta name="twitter:image" content={ogImage} />
        <link rel="icon" type="image/png" href="/public/favicon-32.png" />
        <link rel="manifest" href="/public/manifest.json" />
        <meta name="theme-color" content={visual ? "#2859db" : "#1f5c8b"} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Qur'an Tracker" />
        <link rel="apple-touch-icon" href="/public/icon-192.png" />
        <link
          rel="preload"
          href="/public/fonts/plus-jakarta-sans-latin.woff2"
          as="font"
          type="font/woff2"
          crossorigin="anonymous"
        />
        {!visual && <link rel="preload" href="/public/fonts/fraunces-latin.woff2" as="font" type="font/woff2" crossorigin="anonymous" />}
        <link rel="stylesheet" href="/public/redesign.css" />
        {visual && <link rel="stylesheet" href="/public/public-visual.css" />}
      </head>
      <body class={visual ? "visual-public" : undefined}>{children}</body>
    </html>
  );
};
