"use client";
import { useRef, useState } from "react";
import Button from "./ui/Button";
import UtensilsReference from "./UtensilsReference";
import { resolveFood } from "@/lib/foods";
import type { AnalysisFoodItem } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onLogged: (items: AnalysisFoodItem[], notes: string) => Promise<void>;
};

export default function FoodCapture({ open, onClose, onLogged }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [items, setItems] = useState<AnalysisFoodItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [altIdx, setAltIdx] = useState<Record<number, number>>({});

  function reset() {
    setFile(null);
    setPreviewUrl((u) => {
      if (u) URL.revokeObjectURL(u);
      return null;
    });
    setNotes("");
    setItems([]);
    setError(null);
    setAnalyzing(false);
    setSaving(false);
    setCompressing(false);
    setAltIdx({});
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
    const url = URL.createObjectURL(f);
    if (f.size > 5 * 1024 * 1024) {
      setCompressing(true);
      compressImage(url, 1024 * 1024 * 1.5).then((compressed) => {
        setFile(compressed.file);
        setPreviewUrl(compressed.url);
        setCompressing(false);
      });
    } else {
      setFile(f);
      setPreviewUrl(url);
    }
    setItems([]);
    setError(null);
  }

  function compressImage(
    url: string,
    maxSizeBytes: number
  ): Promise<{ file: File; url: string }> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const MAX_DIM = 1600;
        if (width > MAX_DIM || height > MAX_DIM) {
          const scale = MAX_DIM / Math.max(width, height);
          width = Math.round(width * scale);
          height = Math.round(height * scale);
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.85;
        const tryWrite = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob || blob.size <= maxSizeBytes || quality <= 0.3) {
                const file = new File(
                  [blob ?? new Blob()],
                  "photo.jpg",
                  { type: "image/jpeg" }
                );
                resolve({ file, url });
                return;
              }
              quality -= 0.1;
              tryWrite();
            },
            "image/jpeg",
            quality
          );
        };
        tryWrite();
      };
      img.src = url;
    });
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

      let json: { ok: boolean; items?: AnalysisFoodItem[]; imageUrl?: string; error?: string; message?: string };
      try {
        json = (await res.json()) as typeof json;
      } catch {
        const bodyText = await res.text().catch(() => "");
        if (res.status === 413) {
          setError("Photo is too large. Try taking a smaller photo.");
        } else if (res.status === 0) {
          setError("Network error — check your connection.");
        } else if (res.status >= 500) {
          setError("Server error. Try again in a moment.");
        } else {
          setError(bodyText || `Request failed (${res.status})`);
        }
        setAnalyzing(false);
        return;
      }

      if (!json.ok) {
        setError(
          json.error === "not_food"
            ? "That doesn't look like food. Try another photo."
            : json.message ?? "Couldn't analyze that image."
        );
        setItems([]);
      } else {
        // Resolve LLM estimates with food DB where possible
        const resolved = (json.items ?? []).map((item) => {
          if (item.food_key) {
            const r = resolveFood(item.food_key, item.portion_grams);
            if (r) {
              return {
                ...item,
                calories: r.calories,
                protein_g: r.protein_g,
                carbs_g: r.carbs_g,
                fat_g: r.fat_g,
              };
            }
          }
          return item;
        });
        resolved.forEach((_, i) => {
          if (!resolved[i].uid) resolved[i].uid = `${Date.now()}-${i}`;
        });
        setItems(resolved);
        setError(null);
      }
    } catch (e) {
      setError("Network error");
    } finally {
      setAnalyzing(false);
    }
  }

  function updateItem(index: number, patch: Partial<AnalysisFoodItem>) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function useAlternative(index: number, altIndex: number) {
    const item = items[index];
    if (!item?.alternatives?.[altIndex]) return;
    const alt = item.alternatives[altIndex];
    setAltIdx((prev) => ({ ...prev, [index]: altIndex }));

    // Re-resolve via food DB
    if (alt.food_key) {
      const r = resolveFood(alt.food_key, item.portion_grams);
      if (r) {
        updateItem(index, {
          name: alt.name,
          calories: r.calories,
          protein_g: r.protein_g,
          carbs_g: r.carbs_g,
          fat_g: r.fat_g,
        });
        return;
      }
    }
    updateItem(index, { name: alt.name, food_key: alt.food_key });
  }

  function totals() {
    return items.reduce(
      (acc, it) => ({
        cal: acc.cal + it.calories,
        p: acc.p + it.protein_g,
        c: acc.c + it.carbs_g,
        f: acc.f + it.fat_g,
      }),
      { cal: 0, p: 0, c: 0, f: 0 }
    );
  }

  async function save() {
    if (items.length === 0) return;
    setSaving(true);
    try {
      await onLogged(items, notes.trim());
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save meal.");
      setSaving(false);
    }
  }

  const step = items.length > 0 ? "result" : analyzing ? "analyzing" : "camera";

  if (!open) return null;

  const t = totals();
  const lowConfCount = items.filter((it) => it.confidence === "low").length;

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
        <div
          className="w-11 h-[5px] rounded-full mx-auto mb-3.5 mt-1"
          style={{ background: "rgba(21,20,15,.18)" }}
        />

        <div className="flex items-center justify-between mb-3">
          <h2 className="serif text-[30px] leading-none tracking-tight m-0">
            {step === "camera" && "Snap a meal"}
            {step === "analyzing" && (
              <em style={{ color: "var(--color-tang)" }}>Tasting…</em>
            )}
            {step === "result" && "Review your plate"}
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
            touchAction: "manipulation",
          }}
        >
          {previewUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Food preview"
                className="w-full h-full object-cover pointer-events-none"
              />
              {compressing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/40 rounded-[22px]">
                  <div
                    className="rounded-full"
                    style={{
                      width: 12,
                      height: 12,
                      background: "var(--color-tang)",
                      animation: "pulseRing 1s infinite",
                    }}
                  />
                  <span className="text-white text-xs font-semibold tracking-wide">
                    Optimizing photo…
                  </span>
                </div>
              )}
              {items.length > 0 && (
                <div className="absolute top-3 right-3 bg-ink/60 text-white text-[11px] px-2 py-0.5 rounded-full font-semibold backdrop-blur-sm">
                  {items.length} item{items.length > 1 ? "s" : ""} detected
                </div>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{
                width: "100%",
                height: "100%",
                fontSize: 16,
                minHeight: "44px",
                touchAction: "manipulation",
              }}
              className="flex flex-col items-center justify-center gap-2 text-ink-soft hover:text-tang transition cursor-pointer"
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
              <span className="font-semibold text-sm">Take a photo</span>
              <span className="text-xs">or pick from gallery</span>
            </button>
          )}
        </div>

        {/* Notes textarea */}
        {step === "camera" && previewUrl && (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add details — '2 sendok rice, 1 telur ceplok'…"
            className="w-full p-3 rounded-2xl border border-line bg-surface text-ink text-[13px] resize-none outline-none mb-3.5 placeholder:text-ink-soft/60"
            style={{ minHeight: 64, fontFamily: "inherit" }}
          />
        )}

        <UtensilsReference />

        {/* Low confidence warning */}
        {lowConfCount > 0 && step === "result" && (
          <div className="bg-warn/10 text-warn rounded-2xl p-3 text-sm mt-3">
            ⚠ {lowConfCount} item{lowConfCount > 1 ? "s have" : " has"} low confidence — review or pick an alternative below.
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="bg-bad/10 text-bad rounded-2xl p-3 text-sm mt-3"
          >
            {error}
          </div>
        )}

        {/* Items list (confirm/edit screen) */}
        {items.length > 0 && (
          <div style={{ animation: "scaleIn .4s cubic-bezier(.2,.8,.2,1)" }}>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold tracking-[.1em] uppercase text-ink-soft">
                Plate total
              </span>
              <span className="text-sm font-bold">
                {t.cal} kcal · P:{t.p} C:{t.c} F:{t.f}
              </span>
            </div>

            {items.map((item, i) => (
              <div
                key={item.uid ?? i}
                className="bg-surface rounded-[20px] p-3.5 border border-line mb-2.5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-lg shrink-0">
                      {item.cooking_method === "fried" || item.cooking_method === "goreng"
                        ? "🍳"
                        : item.cooking_method === "grilled" || item.cooking_method === "bakar"
                        ? "🔥"
                        : "🍽️"}
                    </span>
                    <span
                      className="serif text-[18px] truncate"
                      style={{ fontStyle: "italic" }}
                      title={item.name}
                    >
                      {item.name}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold tracking-[.04em] shrink-0 ${
                        item.confidence === "high"
                          ? "bg-good/15 text-good"
                          : item.confidence === "medium"
                          ? "bg-warn/15 text-warn"
                          : "bg-bad/15 text-bad"
                      }`}
                    >
                      {item.confidence === "high"
                        ? "High"
                        : item.confidence === "medium"
                        ? "Medium"
                        : "Low"}
                    </span>
                  </div>
                  <button
                    onClick={() => removeItem(i)}
                    className="w-7 h-7 flex items-center justify-center text-ink-soft/50 hover:text-bad/70 transition cursor-pointer ml-2 shrink-0"
                    aria-label="Remove item"
                    style={{ border: "none", background: "none" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 text-center bg-cream rounded-[14px] p-2">
                    <div className="serif tnum text-[22px]">{item.calories}</div>
                    <div className="text-[9px] tracking-[.12em] uppercase text-ink-soft font-bold">kcal</div>
                  </div>
                  <div className="flex-1 text-center bg-cream rounded-[14px] p-2">
                    <div className="serif tnum text-[14px]">
                      {item.portion_label ?? `${item.portion_grams}g`}
                    </div>
                    <div className="text-[9px] tracking-[.12em] uppercase text-ink-soft font-bold">portion</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-2">
                  {[
                    { label: "Protein", val: `${item.protein_g}g` },
                    { label: "Carbs", val: `${item.carbs_g}g` },
                    { label: "Fat", val: `${item.fat_g}g` },
                  ].map((m, mi) => (
                    <div key={mi} className="bg-cream rounded-[10px] p-1.5 text-center">
                      <div className="tnum text-[14px]">{m.val}</div>
                      <div className="text-[8px] tracking-[.1em] uppercase text-ink-soft font-bold">{m.label}</div>
                    </div>
                  ))}
                </div>

                {/* Alternatives picker for low-confidence items */}
                {item.confidence === "low" && item.alternatives && item.alternatives.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-dashed border-line/40">
                    <div className="text-[11px] text-ink-soft font-semibold mb-1.5">
                      Could also be…
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {item.alternatives.map((alt, ai) => (
                        <button
                          key={ai}
                          onClick={() => useAlternative(i, ai)}
                          className={`text-xs px-2.5 py-1.5 rounded-full border transition font-medium cursor-pointer ${
                            (altIdx[i] ?? -1) === ai
                              ? "border-tang bg-tang/10 text-tang"
                              : "border-line/60 bg-surface text-ink-soft hover:border-tang/40"
                          }`}
                        >
                          {alt.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button
              onClick={() => setItems([])}
              className="w-full text-center text-[13px] text-ink-soft font-semibold tracking-[.06em] uppercase cursor-pointer hover:text-tang transition mt-3 bg-transparent border-none"
            >
              ← Retake photo
            </button>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-3.5">
          {step === "camera" && previewUrl && items.length === 0 && (
            <Button
              variant="cta"
              block
              disabled={!!compressing}
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
                <rect x="3" y="6.5" width="18" height="13" rx="3" stroke="currentColor" strokeWidth="1.6" />
                <path d="M8 6.5l1.5-2h5L16 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <circle cx="12" cy="13" r="3.4" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              Take a photo
            </Button>
          )}
          {step === "result" && (
            <Button
              variant="cta"
              block
              disabled={saving || items.length === 0}
              onClick={save}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {saving ? "Saving…" : `Log ${items.length} item${items.length > 1 ? "s" : ""}`}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
