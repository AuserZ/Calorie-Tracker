"use client";
import { useEffect, useState } from "react";
import {
  isFirebaseConfigured,
  logWeight,
  subscribeWeights,
  deleteWeight,
} from "@/lib/store";
import type { WeightEntry } from "@/lib/types";
import Button from "@/components/ui/Button";
import WeightChart from "@/components/WeightChart";
import MissingConfigNotice from "@/components/MissingConfigNotice";
import Wordmark from "@/components/Wordmark";
import { useCountUp } from "@/lib/useCountUp";

function CountUpDisplay({
  to,
  digits = 0,
}: {
  to: number;
  digits?: number;
}) {
  const v = useCountUp(to, { duration: 1200 });
  return <>{v.toFixed(digits)}</>;
}

export default function WeightPage() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [val, setVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return subscribeWeights(setEntries);
  }, []);

  if (!isFirebaseConfigured) return <MissingConfigNotice />;

  const latest = entries[0];
  const previous = entries[1];
  const diff = latest && previous ? latest.kg - previous.kg : 0;
  const start = entries[entries.length - 1];
  const totalDiff = latest && start ? latest.kg - start.kg : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const kg = Number(val);
    if (!Number.isFinite(kg) || kg < 20 || kg > 400) {
      setErr("Enter a weight between 20 and 400 kg.");
      return;
    }
    setSaving(true);
    try {
      await logWeight(kg);
      setVal("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative min-h-full md:ml-60">
      {/* Floating blob */}
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: "-40px",
          right: "-60px",
          width: 200,
          height: 200,
          background:
            "radial-gradient(circle, rgba(46,91,255,.28), transparent 65%)",
          filter: "blur(20px)",
          animation: "blob1 14s ease-in-out infinite",
        }}
      />

      <div className="relative max-w-2xl mx-auto px-4 pt-3.5 pb-8 flex flex-col gap-3.5">
        {/* Top bar */}
        <div className="flex items-center justify-between md:hidden">
          <Wordmark />
        </div>

        {/* Header */}
        <header className="pt-1">
          <div className="text-[11px] tracking-[.16em] uppercase text-ink-soft font-semibold mb-1.5">
            {entries.length > 0 ? `${entries.length} entries` : "—"}
          </div>
          <h1
            className="serif m-0 text-ink leading-[.95]"
            style={{ fontSize: 42, letterSpacing: "-0.02em" }}
          >
            Weight{" "}
            <em style={{ color: "var(--color-blue)" }}>flow</em>
          </h1>
          <p className="text-[13px] text-ink-soft mt-2">
            A gentle line, not a verdict.
          </p>
        </header>

        {/* Hero current weight */}
        {latest && (
          <section
            className="relative overflow-hidden text-cream rounded-[28px] p-5"
            style={{
              background:
                "linear-gradient(140deg, var(--color-ink) 0%, #1e2434 60%, #2a3858 100%)",
              animation: "fadeUp .6s both",
            }}
          >
            <div
              aria-hidden
              className="absolute inset-0 opacity-50 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 80% 20%, rgba(46,91,255,.5), transparent 60%)",
              }}
            />
            {/* Dot texture */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,.06) 1px, transparent 1px)",
                backgroundSize: "14px 14px",
              }}
            />
            <div className="relative">
              <div className="text-[11px] tracking-[.16em] uppercase opacity-60 font-semibold">
                Now
              </div>
              <div className="flex items-baseline gap-2.5 mt-1">
                <span
                  className="serif tnum leading-[.9]"
                  style={{
                    fontSize: 84,
                    letterSpacing: "-0.03em",
                  }}
                >
                  <CountUpDisplay to={latest.kg} digits={1} />
                </span>
                <span className="text-lg opacity-60">kg</span>
                {previous && (
                  <span
                    className="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold"
                    style={{
                      background:
                        diff <= 0
                          ? "rgba(200,232,74,.18)"
                          : "rgba(230,70,70,.18)",
                      color:
                        diff <= 0
                          ? "var(--color-lime)"
                          : "#FF8B8B",
                    }}
                  >
                    {diff <= 0 ? "↓" : "↑"} {Math.abs(diff).toFixed(1)}{" "}
                    kg
                  </span>
                )}
              </div>
              {entries.length > 1 && (
                <div className="text-[13px] opacity-65 mt-1.5">
                  <span className="tnum">
                    {totalDiff > 0 ? "+" : ""}
                    {totalDiff.toFixed(1)} kg
                  </span>{" "}
                  in {entries.length} days
                </div>
              )}
            </div>
          </section>
        )}

        {/* Chart */}
        <section
          className="bg-surface rounded-[24px] border border-line p-4"
          style={{ animation: "fadeUp .6s .12s both" }}
        >
          <div className="flex items-baseline justify-between px-2 pb-3">
            <h3
              className="serif m-0"
              style={{ fontSize: 22, fontStyle: "italic" }}
            >
              Trend
            </h3>
          </div>
          <WeightChart entries={entries} />
        </section>

        {/* Quick log */}
        <section
          className="bg-surface rounded-[20px] border border-line p-4"
          style={{ animation: "fadeUp .6s .2s both" }}
        >
          <div className="text-[10px] tracking-[.16em] uppercase text-ink-soft font-bold mb-2.5">
            Quick log
          </div>
          <form
            onSubmit={submit}
            className="flex gap-2 items-center"
          >
            <input
              type="number"
              inputMode="decimal"
              step="0.1"
              min={20}
              max={400}
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder="72.4"
              className="flex-1 px-4 py-3.5 border border-line rounded-[14px] outline-none bg-cream serif text-2xl"
              required
            />
            <span className="text-sm text-ink-soft mr-1.5">kg</span>
            <Button type="submit" variant="cta" disabled={saving}>
              Add
            </Button>
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

        {/* Recent entries */}
        {entries.length > 0 && (
          <section style={{ animation: "fadeUp .6s .28s both" }}>
            <h3
              className="serif m-0 mb-2"
              style={{ fontSize: 22, fontStyle: "italic" }}
            >
              Recent
            </h3>
            <ul className="list-none p-0 m-0 bg-surface rounded-[18px] border border-line overflow-hidden">
              {entries.slice(0, 7).map((e, i) => {
                const prevEntry = entries[i + 1];
                const d = prevEntry ? e.kg - prevEntry.kg : 0;
                return (
                  <li
                    key={e.id}
                    className="flex items-center gap-2.5 px-4 py-3"
                    style={{
                      borderTop: i
                        ? "1px solid var(--color-line)"
                        : "none",
                    }}
                  >
                    <span className="text-[13px] text-ink-soft w-16">
                      {e.dateKey.slice(5)}
                    </span>
                    <span className="tnum serif text-xl flex-1">
                      {e.kg.toFixed(1)}
                      <span className="text-[11px] text-ink-soft ml-0.5">
                        kg
                      </span>
                    </span>
                    {prevEntry && (
                      <span
                        className="tnum text-[11px] font-semibold"
                        style={{
                          color:
                            d <= 0
                              ? "#0F8F4D"
                              : "var(--color-bad)",
                        }}
                      >
                        {d <= 0 ? "↓" : "↑"}
                        {Math.abs(d).toFixed(1)}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteWeight(e.id)}
                      aria-label={`Delete entry from ${e.dateKey}`}
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
                );
              })}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
