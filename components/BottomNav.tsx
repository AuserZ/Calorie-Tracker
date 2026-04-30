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

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 md:right-auto md:top-0 md:w-64 md:h-dvh md:border-r md:border-t-0",
        "border-t border-line bg-surface z-40",
        "pb-[env(safe-area-inset-bottom)]"
      )}
      aria-label="Primary"
    >
      <div className="flex md:flex-col md:gap-1 md:p-4 md:items-stretch">
        <div className="hidden md:flex md:items-center md:gap-2 md:px-2 md:pb-6">
          <Apple className="text-cta" size={28} />
          <span
            className="font-display font-bold uppercase tracking-wide text-2xl"
            aria-label="Eaten"
          >
            Eat<span className="text-cta">·</span>en
          </span>
        </div>
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex-1 md:flex-none flex flex-col md:flex-row items-center md:gap-3 justify-center md:justify-start gap-1 min-h-14 md:min-h-12 md:px-3 md:rounded-lg",
                "text-xs md:text-sm font-display font-semibold uppercase tracking-wide transition",
                active
                  ? "text-primary md:bg-primary/10"
                  : "text-ink-soft hover:text-ink"
              )}
            >
              <Icon size={22} aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
