import type { FC } from "hono/jsx";

export type IconName =
  | "book"
  | "repeat"
  | "chart"
  | "users"
  | "user"
  | "target"
  | "calendar"
  | "edit"
  | "snow"
  | "flame"
  | "check"
  | "trophy"
  | "arrow"
  | "close"
  | "shield";

export const Icon: FC<{ name: IconName; size?: number; class?: string }> = ({
  name,
  size = 18,
  class: className = "icon",
}) => (
  <svg
    class={className}
    viewBox="0 0 24 24"
    aria-hidden="true"
    style={`width:${size}px;height:${size}px`}
  >
    {name === "book" && (
      <>
        <path d="M3 5.5A2.5 2.5 0 0 1 5.5 3H20v16H5.5A2.5 2.5 0 0 0 3 21.5z" />
        <path d="M3 5.5v16M7 7h9M7 11h7" />
      </>
    )}
    {name === "repeat" && (
      <>
        <path d="M17 2l4 4-4 4" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <path d="M7 22l-4-4 4-4" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </>
    )}
    {name === "chart" && (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 16v-5M13 16V7M18 16v-8" />
      </>
    )}
    {name === "users" && (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    )}
    {name === "user" && (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    )}
    {name === "target" && (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
      </>
    )}
    {name === "calendar" && (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18" />
      </>
    )}
    {name === "edit" && (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
      </>
    )}
    {name === "snow" && (
      <>
        <path d="M12 2v20M4.2 6.5l15.6 11M19.8 6.5l-15.6 11" />
        <path d="M9 4l3 3 3-3M9 20l3-3 3 3" />
      </>
    )}
    {name === "flame" && (
      <path d="M12 22c4 0 7-2.7 7-6.5 0-3-1.8-5.2-3.5-7.1C14 6.6 13 4.6 13 2c-2.5 1.5-4 3.8-4 6.5 0 1.4.5 2.6 1.2 3.6C8.4 11.2 7 9.5 7 7c-1.3 1.8-2 3.8-2 6 0 4.4 3 9 7 9z" />
    )}
    {name === "check" && <path d="M20 6L9 17l-5-5" />}
    {name === "trophy" && (
      <>
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
        <path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3" />
      </>
    )}
    {name === "arrow" && <path d="M5 12h14M13 6l6 6-6 6" />}
    {name === "close" && <path d="M6 6l12 12M18 6L6 18" />}
    {name === "shield" && (
      <>
        <path d="M12 3l7 3v5c0 4.5-2.9 7.7-7 9-4.1-1.3-7-4.5-7-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </>
    )}
  </svg>
);
