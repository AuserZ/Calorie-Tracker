"use client";
import { useEffect, useState } from "react";
import {
  isFirebaseConfigured,
  getLatestWeight,
  logWater,
  subscribeWaterForDay,
  deleteWater,
} from "@/lib/store";
import { todayKey } from "@/lib/calories";
import { dailyWaterTarget } from "@/lib/water";
import type { WaterEntry } from "@/lib/types";
import WaterSummary from "@/components/WaterSummary";
import MissingConfigNotice from "@/components/MissingConfigNotice";
import Wordmark from "@/components/Wordmark";
import { cn } from "@/lib/cn";

const QUICK_ADDS = [150, 250, 500] as const;

function timeOfDay(ts: { toMillis?: () => number } | undefined): string {
  const ms = ts?.toMillis?.();
  if (!ms) return "";
  const d = new Date(ms);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function WaterPage() {
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [weightKg, setWeightKg] = useState<number | null>(null);
  const [val, setVal] = useState("");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let unsub: (() => void) | null = null;
    (async () => {
      const w = await getLatestWeight();
      setWeightKg(w);
      unsub = subscribeWaterForDay(todayKey(), setEntries);
      setReady(true);
    })();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  if (!isFirebaseConfigured) return <MissingConfigNotice />;

  const target = dailyWaterTarget(weightKg);
  const consumed = entries.reduce((sum, e) => sum + e.ml, 0);

  async function addMl(ml: number) {
    if (!Number.isFinite(ml) || ml <= 0) return;
    setErr(null);
    setSaving(true);
    try {
      await logWater(ml);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ml = Number(val);
    if (!Number.isFinite(ml) || ml < 1 || ml > 5000) {
      setErr("Enter a volume between 1 and 5000 ml.");
      return;
    }
    await addMl(ml);
    setVal("");
  }

  return (
    <div className="relative min-h-screen md:ml-60">
      {/* Floating blob */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: "-60px",
          right: "-80px",
          width: 220,
          height: 220,
          background:
            "radial-gradient(circle, rgba(46,150,255,.32), transparent 65%)",
          filter: "blur(20px)",
          animation: "blob1 14s ease-in-out infinite",
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: "320px",
          left: "-100px",
          width: 200,
          height: 200,
          background:
            "radial-gradient(circle, rgba(91,127,255,.22), transparent 65%)",
          filter: "blur(20px)",
          animation: "blob2 18s ease-in-out infinite",
        }}
      />

      <div className="relative max-w-2xl mx-auto px-4 pt-3.5 pb-8 flex flex-col gap-4">
        {/* Top bar */}
        <div className="flex items-center justify-between md:hidden">
          <Wordmark />
        </div>

        {/* Header */}
        <header className="pt-1 pb-1">
          <div className="text-[11px] tracking-[.16em] uppercase text-ink-soft font-semibold mb-1.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </div>
          <h1
            className="serif m-0 text-ink leading-[.95]"
            style={{ fontSize: 42, letterSpacing: "-0.02em" }}
          >
            Daily{" "}
            <em style={{ color: "var(--color-blue)" }}>water</em>
          </h1>
          <p className="text-[13px] text-ink-soft mt-2">
            Tiny sips, steady flow.
          </p>
        </header>

        {/* Ring */}
        {ready && <WaterSummary consumed={consumed} target={target} />}

        {/* Quick-add buttons */}
        <section
          className="bg-surface rounded-[20px] border border-line p-4"
          style={{ animation: "fadeUp .6s .14s both" }}
        >
          <div className="text-[10px] tracking-[.16em] uppercase text-ink-soft font-bold mb-2.5">
            Quick add
          </div>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_ADDS.map((ml, i) => (
              <button
                key={ml}
                type="button"
                onClick={() => addMl(ml)}
                disabled={saving}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-3 rounded-[14px] border transition cursor-pointer",
                  "border-line bg-cream hover:bg-blue/5 hover:border-blue/30 active:scale-[.97]",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                style={{
                  animation: `fadeUp .5s ${0.2 + i * 0.06}s both`,
                }}
              >
                <span
                  className="serif tnum text-ink"
                  style={{ fontSize: 24, lineHeight: 1 }}
                >
                  +{ml}
                </span>
                <span className="text-[10px] uppercase tracking-[.08em] text-ink-soft font-semibold">
                  ml
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Custom volume */}
        <section
          className="bg-surface rounded-[20px] border border-line p-4"
          style={{ animation: "fadeUp .6s .22s both" }}
        >
          <div className="text-[10px] tracking-[.16em] uppercase text-ink-soft font-bold mb-2.5">
            Custom volume
          </div>
          <form onSubmit={submit} className="flex gap-2 items-center">
            <input
              type="number"
              inputMode="numeric"
              step="1"
              min={1}
              max={5000}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="350"
              className="flex-1 px-4 py-3.5 border border-line rounded-[14px] outline-none bg-cream serif text-2xl"
              required
            />
            <span className="text-sm text-ink-soft mr-1.5">ml</span>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-3 rounded-[14px] bg-ink text-cream font-semibold text-sm cursor-pointer border-none hover:bg-ink-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </form>
          {err && (
            <div
              role="alert"
              className="bg-bad/10 text-bad rounded-xl p-2 text-xs mt-2"
            >
              {err}
            </div>
          )}
        </section>

        {/* Today's log */}
        <section style={{ animation: "fadeUp .6s .3s both" }}>
          <div className="flex items-baseline justify-between mb-2">
            <h3
              className="serif m-0"
              style={{ fontSize: 22, fontStyle: "italic" }}
            >
              Today{" "}
              <span className="text-ink-soft not-italic text-sm font-semibold tnum">
                · {entries.length}
              </span>
            </h3>
            {entries.length > 0 && (
              <span className="text-[11px] text-ink-soft tnum">
                avg {Math.round(consumed / entries.length)} ml
              </span>
            )}
          </div>

          {entries.length === 0 ? (
            <div className="p-8 text-center bg-surface rounded-[20px] border border-dashed border-line">
              <div className="text-4xl mb-1.5">💧</div>
              <div
                className="serif text-[22px]"
                style={{ fontStyle: "italic" }}
              >
                nothing logged yet
              </div>
              <div className="text-[13px] text-ink-soft mt-1">
                Tap a quick-add button to start.
              </div>
            </div>
          ) : (
            <ul className="list-none p-0 m-0 bg-surface rounded-[18px] border border-line overflow-hidden">
              {entries.map((e, i) => (
                <li
                  key={e.id}
                  className="flex items-center gap-2.5 px-4 py-3"
                  style={{
                    borderTop: i
                      ? "1px solid var(--color-line)"
                      : "none",
                  }}
                >
                  <span className="text-[13px] text-ink-soft w-20 tnum">
                    {timeOfDay(e.loggedAt)}
                  </span>
                  <span className="tnum serif text-xl flex-1">
                    {e.ml}
                    <span className="text-[11px] text-ink-soft ml-0.5">
                      ml
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteWater(e.id)}
                    aria-label={`Delete ${e.ml}ml entry`}
                    className="min-w-9 min-h-9 inline-flex items-center justify-center rounded-xl text-ink-soft hover:text-bad hover:bg-bad/10 active:scale-95 transition cursor-pointer"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M5 7h14M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M7 7l1 12a2 2 0 002 2h4a2 2 0 002-2l1-12"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}