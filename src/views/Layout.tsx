import type { FC, Child } from "hono/jsx";
import { APP_NAME, PUBLIC_BASE_URL } from "../config.ts";

export const Layout: FC<{ title?: string; description?: string; url?: string; children: Child }> = ({ title, description, url, children }) => {
  const resolvedTitle = title || APP_NAME;
  const resolvedDesc = description || "Track your daily Tilawah and Murojaah, build streaks, and compete with your community.";
  const resolvedUrl = url || PUBLIC_BASE_URL;
  const ogImage = `${PUBLIC_BASE_URL}/public/logo.png`;
  return (
    <html lang="en">
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
        <link rel="icon" type="image/png" href="/public/logo.png" />
        <link rel="manifest" href="/public/manifest.json" />
        <meta name="theme-color" content="#16a34a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Qur'an Tracker" />
        <link rel="apple-touch-icon" href="/public/icon-192.png" />
        <link rel="stylesheet" href="/public/fonts/material-symbols-outlined.css" />
        <link rel="stylesheet" href="/public/tailwind.css" />
      </head>
      <body class="min-h-screen flex flex-col">{children}</body>
    </html>
  );
};
