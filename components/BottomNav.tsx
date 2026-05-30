"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Wordmark from "@/components/Wordmark";
import { cn } from "@/lib/cn";

/* ─── Custom SVG icons matching the design ─────────── */
function TodayIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3c4 0 7 3 7 7.5C19 16 15 21 12 21s-7-5-7-10.5C5 6 8 3 12 3z"
        fill={active ? "var(--color-tang)" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {active && (
        <path
          d="M14 4.5c.8 0 1.4.4 1.8 1.1-.5.9-1.6 1.5-2.6 1.5-.4-1 .1-2 .8-2.6z"
          fill="var(--color-lime)"
        />
      )}
    </svg>
  );
}

function WeightIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 8h14l-1.5 11h-11L5 8z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill={active ? "rgba(46,91,255,.18)" : "none"}
      />
      <circle
        cx="12"
        cy="12"
        r="2"
        fill="currentColor"
        opacity={active ? 1 : 0.5}
      />
    </svg>
  );
}

function HistoryIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle
        cx="12"
        cy="13"
        r="7.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill={active ? "rgba(255,106,26,.15)" : "none"}
      />
      <path
        d="M12 9v4l3 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 3v3M9 4l2 2M15 4l-2 2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const items = [
  { href: "/", label: "Today", Icon: TodayIcon },
  { href: "/weight", label: "Weight", Icon: WeightIcon },
  { href: "/history", label: "History", Icon: HistoryIcon },
] as const;

/**
 * App navigation.
 *  - Mobile (default): frosted-glass sticky bottom tab bar with custom icons.
 *  - md+ : sidebar rail with wordmark + vertical tabs.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* ─── Desktop sidebar (md+) ─────────────────────── */}
      <aside className="hidden md:flex fixed top-0 left-0 bottom-0 w-60 border-r border-line bg-surface flex-col gap-1.5 p-5 z-40">
        <div className="px-1.5 pb-5">
          <Wordmark size={26} />
        </div>

        {items.map(({ href, label, Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer",
                active
                  ? "bg-cream text-ink"
                  : "text-ink-soft hover:text-ink hover:bg-cream/60"
              )}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-tang rounded-full" />
              )}
              <Icon active={active} />
              {label}
            </Link>
          );
        })}

        <div className="flex-1" />

        {/* Mini today summary */}
        <div className="p-3.5 bg-cream rounded-[14px] border border-line">
          <div className="text-[10px] tracking-[.16em] uppercase text-ink-soft font-bold">
            Today
          </div>
          <div className="serif tnum text-2xl leading-none mt-1 text-ink">
            —
            <span className="text-xs text-ink-soft ml-1">kcal</span>
          </div>
        </div>
      </aside>

      {/* ─── Mobile bottom bar ─────────────────────────── */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-line"
        style={{
          background: "rgba(255,253,248,.85)",
          backdropFilter: "blur(20px) saturate(160%)",
          WebkitBackdropFilter: "blur(20px) saturate(160%)",
          bottom: "env(safe-area-inset-bottom)",
          paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex justify-around items-center py-1.5 px-4">
          {items.map(({ href, label, Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center gap-1 py-2 px-4 transition cursor-pointer",
                  active ? "text-ink" : "text-ink-soft"
                )}
              >
                {active && (
                  <span
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-[3px] bg-tang rounded-full"
                    style={{ animation: "fadeIn .3s" }}
                  />
                )}
                <Icon active={active} />
                <span className="text-[10px] font-semibold tracking-[.04em]">
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
