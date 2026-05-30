"use client";
import { useRef, useState } from "react";
import Button from "./ui/Button";
import UtensilsReference from "./UtensilsReference";
import type { AnalysisResult } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onLogged: (
    result: Extract<AnalysisResult, { ok: true }>,
    notes: string
  ) => Promise<void>;
};

export default function FoodCapture({ open, onClose, onLogged }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);

  function reset() {
    setFile(null);
    setPreviewUrl((u) => {
      if (u) URL.revokeObjectURL(u);
      return null;
    });
    setNotes("");
    setResult(null);
    setError(null);
    setAnalyzing(false);
    setSaving(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose() {
    setClosing(true);
    setTimeout(() => {
      reset();
      onClose();
      setClosing(false);
    }, 300);
  }

  function pick(f: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setError(null);
    setImgIdx(0);
  }

  async function analyze() {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("image", file);
      if (notes.trim()) fd.append("notes", notes.trim());
      const res = await fetch("/api/analyze", { method: "POST", body: fd });
      const json = (await res.json()) as AnalysisResult;
      if (!json.ok) {
        setError(
          json.error === "not_food"
            ? "That doesn't look like food. Try another photo."
            : json.message ?? "Couldn't analyze that image."
        );
        setResult(null);
      } else {
        setResult(json);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setAnalyzing(false);
    }
  }

  async function save() {
    if (!result || !result.ok) return;
    setSaving(true);
    try {
      await onLogged(result, notes.trim());
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save meal.");
      setSaving(false);
    }
  }

  const step = result?.ok
    ? "result"
    : analyzing
    ? "analyzing"
    : "camera";

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center overflow-hidden"
      style={{
        background: closing ? "transparent" : "rgba(15,14,10,.45)",
        backdropFilter: closing ? "none" : "blur(8px)",
        WebkitBackdropFilter: closing ? "none" : "blur(8px)",
        animation: closing ? "fadeOut .3s" : "fadeIn .25s",
        pointerEvents: closing ? "none" : "auto",
      }}
      onClick={handleClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full md:max-w-md bg-cream flex flex-col overflow-y-auto"
        style={{
          borderRadius: "28px 28px 0 0",
          padding: "14px 20px 30px",
          animation: closing ? "sheetDown .32s cubic-bezier(.4,0,1,1)" : "sheetUp .42s cubic-bezier(.2,.8,.2,1)",
          maxHeight: "90%",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Log a meal"
      >
        {/* Drag handle */}
        <div
          className="w-11 h-[5px] rounded-full mx-auto mb-3.5 mt-1"
          style={{ background: "rgba(21,20,15,.18)" }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="serif text-[30px] leading-none tracking-tight m-0">
            {step === "camera" && "Snap a meal"}
            {step === "analyzing" && (
              <em style={{ color: "var(--color-tang)" }}>Tasting…</em>
            )}
            {step === "result" && "Here's what I see"}
          </h2>
          <button
            aria-label="Close"
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-ink/[.06] border-none text-ink cursor-pointer flex items-center justify-center hover:bg-ink/10 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 5l14 14M19 5L5 19"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) pick(f);
          }}
        />

        {/* Photo area */}
        <div
          className="relative overflow-hidden mb-3.5"
          style={{
            aspectRatio: "4/3",
            borderRadius: 22,
            background: "var(--color-cream-2)",
          }}
        >
          {previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Food preview"
                className="w-full h-full object-cover"
                style={{
                  transform:
                    step === "analyzing" ? "scale(1.04)" : "scale(1)",
                  transition: "transform 1.2s ease-out",
                }}
              />
              {step === "analyzing" && (
                <>
                  {/* Scan line */}
                  <div
                    className="absolute left-0 right-0"
                    style={{
                      height: 80,
                      background:
                        "linear-gradient(180deg,transparent,rgba(255,162,69,.5),transparent)",
                      animation:
                        "scanline 1.6s ease-in-out infinite alternate",
                    }}
                  />
                  {/* Corner brackets */}
                  {(
                    [
                      { top: 12, left: 12, bw: "2px 0 0 2px" },
                      { top: 12, right: 12, bw: "2px 2px 0 0" },
                      { bottom: 12, left: 12, bw: "0 0 2px 2px" },
                      { bottom: 12, right: 12, bw: "0 2px 2px 0" },
                    ] as const
                  ).map(({ bw, ...pos }, i) => (
                    <span
                      key={i}
                      className="absolute"
                      style={{
                        width: 24,
                        height: 24,
                        borderColor: "var(--color-lime)",
                        borderStyle: "solid",
                        borderWidth: bw,
                        ...pos,
                        animation: "fadeIn .3s",
                      }}
                    />
                  ))}
                  {/* Status text */}
                  <div className="absolute bottom-[18px] left-0 right-0 flex justify-center gap-2 items-center text-white">
                    <span
                      className="rounded-full"
                      style={{
                        width: 8,
                        height: 8,
                        background: "var(--color-lime)",
                        animation: "pulseRing 1.4s infinite",
                      }}
                    />
                    <span
                      className="mono text-[11px] tracking-[.18em] uppercase"
                      style={{
                        textShadow: "0 1px 6px rgba(0,0,0,.6)",
                      }}
                    >
                      Detecting · Counting · Estimating
                    </span>
                  </div>
                </>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full h-full flex flex-col items-center justify-center gap-2 text-ink-soft hover:text-tang transition cursor-pointer"
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                className="opacity-50"
              >
                <rect
                  x="3"
                  y="6.5"
                  width="18"
                  height="13"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
                <path
                  d="M8 6.5l1.5-2h5L16 6.5"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="13"
                  r="3.4"
                  stroke="currentColor"
                  strokeWidth="1.4"
                />
              </svg>
              <span className="font-semibold text-sm">
                Take a photo
              </span>
              <span className="text-xs">or pick from gallery</span>
            </button>
          )}
        </div>

        {/* Photo thumbnail selector */}
        {previewUrl && step === "camera" && (
          <div className="flex gap-2 mb-3.5">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => fileRef.current?.click()}
                className={`relative rounded-xl overflow-hidden border-2 transition ${
                  imgIdx === i ? "border-tang" : "border-transparent"
                }`}
                style={{ width: 64, height: 64 }}
              >
                {imgIdx === i && previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-cream-2 flex items-center justify-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Notes textarea */}
        {step !== "analyzing" && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add details — '2 sendok rice, 1 telur ceplok'…"
            className="w-full p-3 rounded-2xl border border-line bg-surface text-ink text-[13px] resize-none outline-none mb-3.5 placeholder:text-ink-soft/60"
            style={{ minHeight: 64, fontFamily: "inherit" }}
          />
        )}

        <UtensilsReference />

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="bg-bad/10 text-bad rounded-2xl p-3 text-sm mt-3"
          >
            {error}
          </div>
        )}

        {/* Result card */}
        {result?.ok && (
          <div
            className="bg-surface rounded-[20px] p-3.5 border border-line mt-3"
            style={{ animation: "scaleIn .4s cubic-bezier(.2,.8,.2,1)" }}
          >
            <div className="flex items-center gap-2 mb-2.5 flex-nowrap">
              <span className="text-lg">✨</span>
              <span
                className="serif text-[22px]"
                style={{ fontStyle: "italic" }}
              >
                {result.name}
              </span>
              <span className="shrink-0">
                <span
                  className="text-[11px] px-2.5 py-1 rounded-full font-bold tracking-[.04em]"
                  style={{
                    background: "rgba(31,179,107,.12)",
                    color: "#0F8F4D",
                    whiteSpace: "nowrap",
                  }}
                >
                  High match
                </span>
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                {
                  label: "kcal",
                  val: result.calories,
                  big: true,
                },
                { label: "P", val: `${result.protein_g}g` },
                { label: "C", val: `${result.carbs_g}g` },
                { label: "F", val: `${result.fat_g}g` },
              ].map((s, i) => (
                <div
                  key={i}
                  className="bg-cream rounded-[14px] p-2.5 text-center"
                >
                  <div
                    className="serif tnum"
                    style={{
                      fontSize: s.big ? 28 : 18,
                      lineHeight: 1,
                    }}
                  >
                    {s.val}
                  </div>
                  <div className="text-[9px] tracking-[.12em] uppercase text-ink-soft font-bold mt-1">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-3.5">
          {step === "camera" && previewUrl && (
            <Button
              variant="cta"
              block
              disabled={!file || analyzing}
              onClick={analyze}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 4l3-2h8l3 2M3 6h18v14H3V6zm9 4a4 4 0 100 8 4 4 0 000-8z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
              Analyze this
            </Button>
          )}
          {step === "camera" && !previewUrl && (
            <Button
              variant="cta"
              block
              onClick={() => fileRef.current?.click()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect
                  x="3"
                  y="6.5"
                  width="18"
                  height="13"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="M8 6.5l1.5-2h5L16 6.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <circle
                  cx="12"
                  cy="13"
                  r="3.4"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
              </svg>
              Take a photo
            </Button>
          )}
          {step === "analyzing" && (
            <Button variant="soft" block disabled>
              <span className="inline-flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="rounded-full"
                    style={{
                      width: 6,
                      height: 6,
                      background: "var(--color-tang)",
                      animation: `pulseRing 1.2s ${i * 0.15}s infinite`,
                    }}
                  />
                ))}
              </span>
              <span className="ml-2">Finding flavor…</span>
            </Button>
          )}
          {step === "result" && (
            <>
              <Button
                variant="soft"
                onClick={() => setResult(null)}
              >
                Retake
              </Button>
              <Button
                variant="cta"
                block
                disabled={saving}
                onClick={save}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M5 12l5 5L20 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {saving ? "Saving…" : "Log it"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
