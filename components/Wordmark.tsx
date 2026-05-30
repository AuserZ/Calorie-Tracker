export default function Wordmark({ size = 22, active = false }: { size?: number; active?: boolean }) {
  return (
    <div
      className="inline-flex items-center gap-1.5"
      style={{ fontFamily: "'Instrument Serif', serif" }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        className="block"
        aria-hidden
      >
        <defs>
          <linearGradient id="wmGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-tang)" />
            <stop offset="100%" stopColor="var(--color-tang-2)" />
          </linearGradient>
        </defs>
        <path
          d="M12 3c4.5 0 8 3.5 8 8.2 0 5.6-4 9.8-8 9.8s-8-4.2-8-9.8C4 6.5 7.5 3 12 3z"
          fill={active ? "var(--color-tang)" : "url(#wmGrad)"}
        />
        <path
          d="M14 4c1 0 1.8.5 2.4 1.4-.6 1.2-2 2-3.4 2-.5-1.4 0-2.7 1-3.4z"
          fill={active ? "var(--color-lime)" : "var(--color-lime)"}
        />
        <ellipse
          cx="9"
          cy="10"
          rx="1.2"
          ry="2"
          fill="rgba(255,255,255,.5)"
          opacity={active ? 0 : 0.5}
        />
      </svg>
      <span
        style={{ fontSize: size, lineHeight: 1, fontStyle: "italic" }}
        className="text-ink"
      >
        eat·en
      </span>
    </div>
  );
}
