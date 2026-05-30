"use client";
import { useState } from "react";
import { ChevronDown, Ruler } from "lucide-react";
import { UTENSILS, GROUP_LABEL, type UtensilGroup } from "@/lib/utensils";
import { cn } from "@/lib/cn";

const KAT_COLOR: Record<string, string> = {
  Besar: "bg-primary/10 text-primary",
  Sedang: "bg-cta/10 text-cta",
  Kecil: "bg-good/10 text-good",
};

export default function UtensilsReference() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-card border border-line bg-bg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-2 p-3 text-left cursor-pointer hover:bg-line/40 active:scale-[0.997] transition min-h-11"
      >
        <Ruler size={16} className="text-ink-soft" />
        <span className="font-display font-semibold uppercase tracking-wide text-sm flex-1">
          Reference utensils
        </span>
        <span className="text-xs text-ink-soft">
          mention these in your notes
        </span>
        <ChevronDown
          size={18}
          className={cn(
            "text-ink-soft transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="border-t border-line p-3 flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: 260 }}>
          {(Object.keys(UTENSILS) as UtensilGroup[]).map((group) => (
            <div key={group}>
              <h4 className="font-display font-semibold uppercase tracking-wide text-xs text-ink-soft mb-1">
                {GROUP_LABEL[group]}
              </h4>
              <ul className="flex flex-col gap-1">
                {UTENSILS[group].map((u) => (
                  <li
                    key={u.jenis}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span
                      className={cn(
                        "inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide shrink-0",
                        KAT_COLOR[u.kategori]
                      )}
                    >
                      {u.kategori}
                    </span>
                    <span className="font-medium truncate">{u.jenis}</span>
                    <span className="ml-auto text-ink-soft tabular-nums shrink-0">
                      {u.ukuran}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <p className="text-[11px] text-ink-soft leading-relaxed">
            Tip: in your notes you can write things like{" "}
            <span className="font-medium">&ldquo;2 sendok makan rice&rdquo;</span>,{" "}
            <span className="font-medium">&ldquo;1 mangkuk sup&rdquo;</span>, or{" "}
            <span className="font-medium">&ldquo;piring kecil&rdquo;</span> — the
            AI uses them to estimate portion size more accurately.
          </p>
        </div>
      )}
    </div>
  );
}
