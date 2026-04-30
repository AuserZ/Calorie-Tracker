"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Apple, Scale, History as HistoryIcon } from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/", label: "Today", icon: Apple },
  { href: "/weight", label: "Weight", icon: Scale },
  { href: "/history", label: "History", icon: HistoryIcon },
];

/**
 * App navigation.
 *  - Mobile (default): sticky bottom tab bar.
 *  - md+ : slim sticky top header with wordmark + horizontal tabs.
 *
 * Intentionally NOT a sidebar/dashboard layout — content stays a centered
 * single column at every breakpoint.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Top header (md+) */}
      <header className="hidden md:block sticky top-0 z-40 bg-surface/85 backdrop-blur border-b border-line">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 cursor-pointer min-h-11"
            aria-label="Eaten — home"
          >
            <Apple className="text-cta" size={22} aria-hidden />
            <span className="font-display font-bold uppercase tracking-wide text-xl">
              Eat<span className="text-cta">·</span>en
            </span>
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-1">
            {items.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex items-center gap-2 h-10 px-3 rounded-lg font-display font-semibold uppercase tracking-wide text-sm transition cursor-pointer",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-ink-soft hover:text-ink hover:bg-line/40"
                  )}
                >
                  <Icon size={16} aria-hidden />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Bottom tab bar (mobile only) */}
      <nav
        aria-label="Primary"
        className="md:hidden fixed bottom-0 left-0 right-0 border-t border-line bg-surface z-40 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 min-h-14 text-xs font-display font-semibold uppercase tracking-wide transition",
                  active ? "text-primary" : "text-ink-soft hover:text-ink"
                )}
              >
                <Icon size={22} aria-hidden />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
