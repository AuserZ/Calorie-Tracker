"use client";
import { verdict, verdictLabel } from "@/lib/calories";
import { useCountUp } from "@/lib/useCountUp";

type Props = {
  eaten: number;
  target: number;
  protein: number;
  carbs: number;
  fat: number;
};

/* ─── Animated gradient arc ring ────────────────────── */
function DailyRing({
  eaten,
  target,
  size = 228,
}: {
  eaten: number;
  target: number;
  size?: number;
}) {
  const eatenAnim = useCountUp(eaten, { duration: 1200, delay: 120 });
  const pct = Math.max(0, Math.min(1.4, eaten / target));
  const animPct = Math.max(0, Math.min(1.4, eatenAnim / target));
  const over = pct > 1;
  const r = size * 0.42;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  const dash = C * Math.min(1, animPct);
  const overflowDash = over ? C * Math.min(1, animPct - 1) : 0;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {/* Glow halo */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: "-10%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,106,26,.18), transparent 60%)",
          filter: "blur(14px)",
          animation: "float 6s ease-in-out infinite",
        }}
      />
      <svg
        viewBox={`0 0 ${size} ${size}`}
        style={{
          position: "relative",
          display: "block",
          overflow: "visible",
        }}
      >
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-tang)" />
            <stop offset="55%" stopColor="var(--color-tang-2)" />
            <stop offset="100%" stopColor="var(--color-lime)" />
          </linearGradient>
          <linearGradient id="ringOver" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#E64646" />
            <stop offset="100%" stopColor="#FF6A1A" />
          </linearGradient>
          <filter id="ringGlow">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>
        {/* Track */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="rgba(21,20,15,.07)"
          strokeWidth={size * 0.08}
          fill="none"
        />
        {/* Dotted target tick */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="rgba(21,20,15,.18)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="2 6"
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
        />
        {/* Main arc — glow layer */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={size * 0.085}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          opacity=".35"
          filter="url(#ringGlow)"
        />
        {/* Main arc — solid */}
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={size * 0.085}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: "stroke-dasharray .4s linear" }}
        />
        {/* Overflow arc */}
        {over && (
          <circle
            cx={cx}
            cy={cy}
            r={r - size * 0.085 - 3}
            stroke="url(#ringOver)"
            strokeWidth={size * 0.04}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${overflowDash} ${C}`}
            transform={`rotate(-90 ${cx} ${cy})`}
          />
        )}
        {/* Moving dot at progress end */}
        {animPct > 0.02 && (
          <circle
            cx={
              cx +
              r *
                Math.cos(
                  -Math.PI / 2 + 2 * Math.PI * Math.min(1, animPct)
                )
            }
            cy={
              cy +
              r *
                Math.sin(
                  -Math.PI / 2 + 2 * Math.PI * Math.min(1, animPct)
                )
            }
            r={size * 0.045}
            fill="#fff"
            stroke="var(--color-tang)"
            strokeWidth="2"
            style={{
              filter: "drop-shadow(0 2px 6px rgba(255,106,26,.4))",
            }}
          />
        )}
      </svg>
      {/* Center text */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <span className="text-[11px] tracking-[.16em] uppercase text-ink-soft font-semibold">
          {over ? "Over" : "Remaining"}
        </span>
        <span
          className="serif tnum text-ink"
          style={{ fontSize: size * 0.32, lineHeight: 0.95, marginTop: 2 }}
        >
          {Math.round(
            over ? eatenAnim - target : target - eatenAnim
          )}
        </span>
        <span className="text-[13px] text-ink-soft mt-1">
          <span className="tnum font-semibold text-ink">
            {Math.round(eatenAnim)}
          </span>
          <span> / {target} kcal</span>
        </span>
      </div>
    </div>
  );
}

/* ─── Macro pill with animated bar ──────────────────── */
function MacroPill({
  label,
  value,
  max,
  color,
  delay = 0,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  delay?: number;
}) {
  const v = useCountUp(value, { duration: 1100, delay });
  const pct = Math.min(1, value / max);

  return (
    <div
      className="flex flex-col gap-1.5 p-2.5 bg-surface rounded-[14px] border border-line flex-1 min-w-0"
    >
      <div className="flex items-baseline justify-between">
        <span className="text-[11px] tracking-[.08em] uppercase text-ink-soft font-semibold">
          {label}
        </span>
        <span className="tnum text-[11px] text-ink-soft">{Math.round(max)}g</span>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span
          className="serif tnum text-ink"
          style={{ fontSize: 30, lineHeight: 1 }}
        >
          {Math.round(v)}
        </span>
        <span className="text-xs text-ink-soft ml-0.5">g</span>
      </div>
      {/* Progress bar */}
      <div className="relative h-1.5 bg-ink/[.06] rounded-full overflow-hidden">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            width: `${pct * 100}%`,
            background: color,
            transition: `width 1.1s cubic-bezier(.2,.8,.2,1)`,
            transitionDelay: `${delay}ms`,
          }}
        />
        {/* Shimmer overlay */}
        <div
          className="absolute top-0 bottom-0 left-0 rounded-full mix-blend-overlay"
          style={{
            width: `${pct * 100}%`,
            background:
              "linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent)",
            backgroundSize: "200% 100%",
            animation: `shimmer 2.4s ${1 + delay / 1000}s infinite linear`,
            transition: `width 1.1s cubic-bezier(.2,.8,.2,1)`,
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>
    </div>
  );
}

/* ─── Confetti burst ────────────────────────────────── */
function ConfettiBurst() {
  const pieces = Array.from({ length: 28 });
  const colors = ["#FF6A1A", "#2E5BFF", "#C8E84A", "#FFA245", "#3F0F47"];

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden z-[5]"
      aria-hidden
    >
      {pieces.map((_, i) => {
        const c = colors[i % colors.length];
        const cx = `${Math.random() * 100}%`;
        const dx = `${Math.random() * 200 - 100}px`;
        const delay = Math.random() * 0.4;
        const dur = 1.4 + Math.random() * 1.2;
        const sz = 6 + Math.random() * 8;
        const isCircle = i % 3 === 0;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: cx,
              top: "-10px",
              width: sz,
              height: sz,
              background: c,
              borderRadius: isCircle ? "50%" : "2px",
              animation: `confettiFall ${dur}s ${delay}s cubic-bezier(.3,.7,.4,1) forwards`,
              ["--cx" as string]: "0px",
              ["--dx" as string]: dx,
            }}
          />
        );
      })}
    </div>
  );
}

/* ─── Main component ────────────────────────────────── */
export default function DailySummary({
  eaten,
  target,
  protein,
  carbs,
  fat,
}: Props) {
  const v = verdict(eaten, target);
  const showConfetti =
    eaten >= target * 0.95 && eaten <= target * 1.05 && eaten > 0;

  const verdictText = verdictLabel(v, eaten, target);
  const verdictDotColor =
    v === "on-track" ? "#1FB36B" : v === "over" || v === "way-over" ? "#E64646" : "var(--color-tang)";
  const chipBg =
    v === "on-track"
      ? "rgba(31,179,107,.12)"
      : "rgba(21,20,15,.06)";
  const chipColor =
    v === "on-track" ? "#1FB36B" : "var(--color-ink-2)";

  return (
    <div className="flex flex-col gap-4">
      {/* Hero ring card */}
      <section
        className="relative overflow-hidden bg-surface rounded-[28px] border border-line p-5"
        style={{
          boxShadow:
            "0 1px 0 rgba(255,255,255,.7) inset, 0 12px 30px -16px rgba(21,20,15,.18)",
          animation: "fadeUp .7s cubic-bezier(.2,.8,.2,1) both",
        }}
      >
        {/* Dotted texture */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(rgba(21,20,15,.06) 1px, transparent 1px)",
            backgroundSize: "14px 14px",
          }}
        />
        {showConfetti && <ConfettiBurst />}

        <div className="relative flex justify-center">
          <DailyRing eaten={eaten} target={target} size={200} />
        </div>

        {/* Verdict pill */}
        <div className="flex justify-center mt-3.5">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-[.04em]"
            style={{ background: chipBg, color: chipColor }}
          >
            <span
              className="relative"
              style={{
                width: 6,
                height: 6,
                borderRadius: 9999,
                background: verdictDotColor,
                animation: "pulseRing 2s infinite",
              }}
            />
            {verdictText}
          </span>
        </div>
      </section>

      {/* Macro pills */}
      <section
        className="grid grid-cols-3 gap-2"
        style={{
          animation: "fadeUp .7s .12s cubic-bezier(.2,.8,.2,1) both",
        }}
      >
        <MacroPill
          label="Protein"
          value={protein}
          max={120}
          color="linear-gradient(90deg,var(--color-blue),var(--color-blue-2))"
          delay={120}
        />
        <MacroPill
          label="Carbs"
          value={carbs}
          max={240}
          color="linear-gradient(90deg,var(--color-tang),var(--color-tang-2))"
          delay={240}
        />
        <MacroPill
          label="Fat"
          value={fat}
          max={80}
          color="linear-gradient(90deg,#7BB12A,var(--color-lime))"
          delay={360}
        />
      </section>
    </div>
  );
}
