import type { FC, Child } from "hono/jsx";
import { APP_NAME } from "../config.ts";

export const Layout: FC<{ title?: string; description?: string; children: Child }> = ({ title, description, children }) => {
  const resolvedTitle = title || APP_NAME;
  const resolvedDesc = description || "Track your daily Tilawah and Murojaah, build streaks, and compete with your community.";
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
        <meta property="og:image" content="/public/logo.png" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={resolvedTitle} />
        <meta name="twitter:description" content={resolvedDesc} />
        <link rel="icon" type="image/png" href="/public/logo.png" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  "primary": "#2A65AE",
                  "primary-dark": "#1e4f8a",
                  "primary-light": "#eff6ff",
                  "background": "#f8fafd",
                  "surface": "#ffffff",
                  "border-light": "#e2e8f0",
                  "text-main": "#1e293b",
                  "text-secondary": "#64748b",
                },
                fontFamily: {
                  "display": ["Plus Jakarta Sans", "sans-serif"]
                },
                borderRadius: {
                  "DEFAULT": "0.25rem",
                  "lg": "0.5rem",
                  "xl": "0.75rem",
                  "2xl": "1rem",
                  "full": "9999px"
                },
              },
            },
          }
        `,
          }}
        />
        <style
          type="text/tailwindcss"
          dangerouslySetInnerHTML={{
            __html: `
          @layer base {
            html { scroll-behavior: smooth; }
            body {
              @apply bg-background text-text-main font-display;
            }
          }
        `,
          }}
        />
      </head>
      <body class="min-h-screen flex flex-col">{children}</body>
    </html>
  );
};
