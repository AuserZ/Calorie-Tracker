"use client";
import { useEffect, useRef, useState } from "react";
import { useCountUp } from "@/lib/useCountUp";

type Props = {
  consumed: number;
  target: number;
  /**
   * The amount (in ml) being added in the current "pour" cycle.
   * While this is > 0 the waterfall is visible and the fill animation duration
   * scales with it. Pass 0 (or omit) when idle.
   */
  fillAmount?: number;
  /** Slide phase for the waterfall — drives slide-in/slide-out animation. */
  slidePhase?: 'in' | 'out' | 'idle';
};

/**
 * Map ml added to fill duration in ms.
 * 150ml → 600ms, 500ml → 1500ms, with a sensible floor/ceiling.
 */
function pourDurationMs(ml: number): number {
  if (!ml || ml <= 0) return 0;
  const ms = ml * 2.4; // ~150ms per ml
  return Math.max(500, Math.min(2200, Math.round(ms)));
}

/* ─── Animated water glass with waterfall ───────── */
function WaterGlass({ consumed, target, fillAmount = 0, slidePhase = 'idle' }: Props) {
  const duration = pourDurationMs(fillAmount);
  const consumedAnim = useCountUp(consumed, {
    duration: duration || 1200,
    delay: 0,
  });
  const pct = Math.max(0, Math.min(1, consumed / target));
  const animPct = Math.max(0, Math.min(1, consumedAnim / target));

  /* Percentage text shown inside glass */
  const displayPct = animPct * 100;

  /* The waterfall is visible while pouring or during slide-out exit. */
  const pouring = fillAmount > 0;
  const showWaterfall = (pouring || slidePhase !== 'idle') && animPct < 1;
  const waterfallAnimation =
    slidePhase === 'in'
      ? 'streamSlideIn 0.5s cubic-bezier(.2,.8,.2,1) both'
      : slidePhase === 'out'
      ? 'streamSlideOut 0.5s cubic-bezier(.2,.8,.2,1) both'
      : undefined;

  return (
    <div
      style={{ position: "relative", width: 220, height: 300 }}
      aria-hidden
    >
      {/* ── Glass body ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "12px 12px 20px 20px",
          border: "3px solid rgba(21,20,15,.12)",
          overflow: "hidden",
          background: "rgba(255,255,255,.3)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,.5) inset, 0 8px 24px rgba(46,91,255,.08)",
        }}
      >
        {/* ── Water fill with wavy top (only when there's something to fill) ── */}
        {animPct > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: -2,
              right: -2,
              height: `${animPct * 100}%`,
              transition: `height ${duration}ms cubic-bezier(.45,.05,.55,.95)`,
            }}
          >
          {/* Body of water — rich gradient: bright cyan-blue at the surface,
              deepening through teal to a near-navy at the base. */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(80,170,255,.7) 0%, rgba(40,130,235,.85) 25%, rgba(25,95,200,.92) 65%, rgba(15,60,160,.96) 100%)",
            }}
          />

          {/* Slow-drifting light shaft inside the body — suggests light
              refracting through water. Animates left↔right over 7s. */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "70%",
              background:
                "linear-gradient(105deg, transparent 30%, rgba(180,220,255,.18) 48%, transparent 60%)",
              backgroundSize: "200% 100%",
              backgroundRepeat: "no-repeat",
              animation: "sheenDrift 7s ease-in-out infinite",
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          />

          {/* Faint surface highlight — a soft white glow sitting just below
              the wave line to sell the "wet meniscus". */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 6,
              background:
                "linear-gradient(180deg, rgba(255,255,255,.45) 0%, rgba(255,255,255,0) 100%)",
              pointerEvents: "none",
            }}
          />

          {/* Wave surface layer — moves at its own pace.
              The SVG is 2× as wide as the glass (viewBox=240) so
              the translateX(-50%→0) loop is seamless and visible seams
              never appear at the container edges. */}
          <svg
            viewBox="0 0 240 24"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              top: -14,
              left: 0,
              width: "200%",
              height: 24,
              display: "block",
              animation: "wave1 3.2s ease-in-out infinite",
              transformOrigin: "left center",
              zIndex: 2,
            }}
          >
            <defs>
              <linearGradient id="waveSurf1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(100,160,255,.85)" />
                <stop offset="80%" stopColor="rgba(80,140,255,.35)" />
                <stop offset="100%" stopColor="rgba(80,140,255,0)" />
              </linearGradient>
            </defs>
            <path
              d="M0 12 Q15 5, 30 12 T60 12 T90 12 T120 12 T150 12 T180 12 T210 12 T240 12 V24 H0 Z"
              fill="url(#waveSurf1)"
            />
          </svg>

          {/* Second wave — counter-directional, smaller amplitude. Creates
              a subtle roiling effect when combined with the primary wave. */}
          <svg
            viewBox="0 0 240 16"
            preserveAspectRatio="none"
            style={{
              position: "absolute",
              top: -8,
              left: 0,
              width: "200%",
              height: 16,
              display: "block",
              animation: "wave2 4.4s ease-in-out infinite",
              transformOrigin: "left center",
              mixBlendMode: "soft-light",
              zIndex: 1,
              opacity: 0.5,
            }}
          >
            <path
              d="M0 8 Q15 12, 30 8 T60 8 T90 8 T120 8 T150 8 T180 8 T210 8 T240 8 V16 H0 Z"
              fill="rgba(60,120,255,.45)"
            />
          </svg>
          </div>
        )}

        {/* ── Measurement marks ── */}
        <div
          style={{
            position: "absolute",
            right: 12,
            top: 40,
            bottom: 40,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {[0.25, 0.5, 0.75, 1].map((fraction) => (
            <div
              key={fraction}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <div
                style={{
                  width: fraction === 1 ? 12 : 10,
                  height: 1,
                  background: "rgba(21,20,15,.12)",
                }}
              />
              <span
                className="mono text-[9px] text-ink-soft"
                style={{ opacity: 0.5 }}
              >
                {Math.round(fraction * 100)}%
              </span>
            </div>
          ))}
        </div>

        {/* ── Glass rim highlight ── */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 12,
            right: 12,
            height: 4,
            borderRadius: "12px 12px 0 0",
            background: "rgba(21,20,15,.06)",
          }}
        />

        {/* ── Splash at the water surface (only while pouring) ──
              Three layered effects:
              1. Bright white pop at the impact point
              2. Expanding concentric ripple ring
              3. Two small "droplet splashbacks" arcing up either side */}
        {pouring && animPct > 0 && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: `${animPct * 100}%`,
              width: 60,
              height: 16,
              transform: "translate(-50%, 50%)",
              pointerEvents: "none",
              zIndex: 3,
            }}
          >
            {/* Expanding ripple ring */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 24,
                height: 8,
                borderRadius: "50%",
                border: "1.5px solid rgba(180,220,255,.7)",
                animation: "ripple .9s ease-out infinite",
              }}
            />
            {/* Second ripple, slightly delayed for depth */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 18,
                height: 6,
                borderRadius: "50%",
                border: "1px solid rgba(220,240,255,.5)",
                animation: "ripple .9s ease-out .3s infinite",
              }}
            />
            {/* Bright pop */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 14,
                height: 6,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                background:
                  "radial-gradient(ellipse, rgba(255,255,255,.95) 0%, rgba(255,255,255,0) 70%)",
                animation: "splashPulse .5s ease-out infinite",
              }}
            />
            {/* Left splashback droplet */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 3,
                height: 3,
                borderRadius: "50%",
                background: "rgba(180,220,255,.9)",
                animation:
                  "splashBack 0.6s cubic-bezier(.3,.1,.6,1) infinite",
              }}
            />
            {/* Right splashback droplet */}
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 2.5,
                height: 2.5,
                borderRadius: "50%",
                background: "rgba(200,230,255,.85)",
                animation:
                  "splashBackR 0.6s cubic-bezier(.3,.1,.6,1) .15s infinite",
              }}
            />
          </div>
        )}
      </div>

      {/* ── Waterfall / stream above the glass (slides in/out) ──
          The stream originates above the glass and terminates exactly at the
          water surface line. As animPct rises, the stream visibly shortens.
          The container slides in from above when pouring starts and slides
          back up out of frame when the pour ends. */}
      {showWaterfall && (() => {
        const GLASS_HEIGHT = 300; // matches the outer container height
        const emptyPx = GLASS_HEIGHT * (1 - animPct); // empty space above water
        const ABOVE_GLASS = 80; // distance the stream sits above glass top
        const containerHeight = ABOVE_GLASS + emptyPx; // reaches from spout down to water surface
        return (
          <div
            style={{
              position: "absolute",
              top: -ABOVE_GLASS,
              left: "50%",
              transform: "translateX(-50%)",
              width: 8,
              height: containerHeight,
              pointerEvents: "none",
              zIndex: 4,
              transition: `height ${duration}ms cubic-bezier(.45,.05,.55,.95)`,
              animation: waterfallAnimation,
            }}
          >
            {/* Spout */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: "translateX(-50%)",
                width: 24,
                height: 6,
                borderRadius: 3,
                background:
                  "linear-gradient(180deg, rgba(21,20,15,.55) 0%, rgba(21,20,15,.25) 100%)",
              }}
            />
            {/* Swaying wrapper — moves the stream ±0.6px horizontally so
                the falling water bends slightly rather than reading as a
                rigid bar. Uses transform (composited) so it stays smooth. */}
            <div
              style={{
                position: "absolute",
                top: 4,
                left: "50%",
                width: 6,
                height: "calc(100% - 4px)",
                animation: "streamSway 0.55s ease-in-out infinite",
                transformOrigin: "top center",
              }}
            >
              {/* Stream body — gentle tail-fade near the impact point
                  via a mask so the stream blends into the surface splash
                  instead of cutting off sharply. */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "0 0 6px 6px",
                  background:
                    "linear-gradient(180deg, rgba(120,170,255,.75) 0%, rgba(70,130,255,.9) 50%, rgba(30,140,220,.95) 85%, rgba(140,200,255,.4) 100%)",
                  animation: "streamFlow 0.4s linear infinite",
                  boxShadow:
                    "0 0 10px rgba(46,91,255,.5), inset 1px 0 0 rgba(255,255,255,.4)",
                  maskImage:
                    "linear-gradient(180deg, #000 0%, #000 70%, transparent 100%)",
                  WebkitMaskImage:
                    "linear-gradient(180deg, #000 0%, #000 70%, transparent 100%)",
                }}
              />
              {/* Highlight stripe — narrower, sits to the right of center
                  for a wet specular gleam. */}
              <div
                style={{
                  position: "absolute",
                  top: 2,
                  left: 1.5,
                  width: 1.5,
                  height: "calc(100% - 4px)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,.6), rgba(255,255,255,.15))",
                  borderRadius: 1,
                }}
              />
              {/* Detached droplet 1 — drops just below the spout */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  width: 4,
                  height: 5,
                  borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                  background:
                    "linear-gradient(180deg, rgba(180,220,255,.95) 0%, rgba(60,140,255,.9) 100%)",
                  transformOrigin: "center top",
                  animation: "dropletFall 0.55s ease-in infinite",
                  boxShadow: "0 0 4px rgba(80,150,255,.5)",
                }}
              />
              {/* Detached droplet 2 — slightly offset & delayed for natural rhythm */}
              <div
                style={{
                  position: "absolute",
                  top: -2,
                  left: "50%",
                  width: 3,
                  height: 4,
                  borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
                  background:
                    "linear-gradient(180deg, rgba(200,230,255,.9) 0%, rgba(70,150,255,.85) 100%)",
                  animation: "dropletFall 0.55s ease-in .18s infinite",
                  boxShadow: "0 0 3px rgba(80,150,255,.5)",
                }}
              />
            </div>
          </div>
        );
      })()}

      {/* ── Center text overlay ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 5,
        }}
      >
        <span
          className="serif tnum"
          style={{
            fontSize: 36,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--color-ink)",
            textShadow: "0 1px 2px rgba(255,255,255,.6)",
          }}
        >
          {Math.round(displayPct)}
          <span style={{ fontSize: 20, opacity: 0.6 }}>%</span>
        </span>
        <span
          className="tnum text-ink-soft text-xs mt-0.5"
          style={{ textShadow: "0 1px 1px rgba(255,255,255,.6)" }}
        >
          {Math.round(consumedAnim)} / {target} ml
        </span>
      </div>

      {/* ── Side reflections on glass ── */}
      <div
        style={{
          position: "absolute",
          left: 14,
          top: 30,
          bottom: 30,
          width: 3,
          borderRadius: 2,
          background: "linear-gradient(180deg, rgba(255,255,255,.4), transparent 60%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}

/* ─── Main component ────────────────────────────── */
export default function WaterSummary({ consumed, target }: Props) {
  /* Track the previous consumed total so we can compute the delta when
   * the user logs water. That delta becomes the "pour amount" passed to the
   * glass and drives the waterfall duration. */
  const prevConsumedRef = useRef(consumed);
  const [pourMl, setPourMl] = useState(0);
  const pourTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Waterfall slide: play slide-in when pouring starts, slide-out when it ends.
  const [streamPhase, setStreamPhase] = useState<'in' | 'out' | 'idle'>('idle');
  const slideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevConsumedRef.current;
    const delta = consumed - prev;
    if (delta > 0) {
      setPourMl(delta);
      if (pourTimer.current) clearTimeout(pourTimer.current);
      if (slideTimer.current) clearTimeout(slideTimer.current);
      // Force re-trigger of slide animation by briefly setting idle.
      setStreamPhase('idle');
      // Next paint triggers the slide-in.
      requestAnimationFrame(() => setStreamPhase('in'));
      // When the pour timer fires, slide the stream back out — without
      // this, the waterfall keeps rendering because streamPhase stays 'in'.
      pourTimer.current = setTimeout(() => {
        setPourMl(0);
        setStreamPhase('out');
        slideTimer.current = setTimeout(() => setStreamPhase('idle'), 500);
      }, 2600);
    } else if (consumed === 0 && prev !== 0) {
      setPourMl(0);
      // Slide out before clearing the state.
      setStreamPhase('out');
      slideTimer.current = setTimeout(() => setStreamPhase('idle'), 500);
    }
    prevConsumedRef.current = consumed;
    return () => {
      if (pourTimer.current) clearTimeout(pourTimer.current);
      if (slideTimer.current) clearTimeout(slideTimer.current);
    };
  }, [consumed]);

  const pct = target > 0 ? consumed / target : 0;
  const overGoal = pct >= 1;
  const label =
    consumed === 0
      ? "Start sipping"
      : overGoal
      ? "Goal smashed"
      : pct >= 0.75
      ? "Almost there"
      : pct >= 0.4
      ? "Keep flowing"
      : "Stay hydrated";

  const chipBg = overGoal ? "rgba(31,179,107,.12)" : "rgba(46,91,255,.12)";
  const chipColor = overGoal ? "#0F8F4D" : "var(--color-blue)";

  return (
    <div className="flex flex-col gap-4">
      <section
        className="relative overflow-hidden bg-surface rounded-[28px] border border-line p-5"
        style={{
          boxShadow:
            "0 1px 0 rgba(255,255,255,.7) inset, 0 12px 30px -16px rgba(21,20,15,.18)",
          animation: "fadeUp .7s cubic-bezier(.2,.8,.2,1) both",
        }}
      >
        <div className="relative flex justify-center">
          <WaterGlass consumed={consumed} target={target} fillAmount={pourMl} slidePhase={streamPhase} />
        </div>

        <div className="flex justify-center mt-4">
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
                background: overGoal ? "#1FB36B" : "var(--color-blue)",
                animation: "pulseRing 2s infinite",
              }}
            />
            {label}
          </span>
        </div>
      </section>
    </div>
  );
}