"use client";
import { useRef, useState } from "react";
import { Camera, X, Loader2, Sparkles } from "lucide-react";
import Button from "./ui/Button";
import UtensilsReference from "./UtensilsReference";
import type { AnalysisResult } from "@/lib/types";

type Props = {
  open: boolean;
  onClose: () => void;
  onLogged: (
    result: Extract<AnalysisResult, { ok: true }>
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
    reset();
    onClose();
  }

  function pick(f: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setError(null);
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
      await onLogged(result);
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save meal.");
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={handleClose}
    >
      <div
        className="bg-surface w-full md:max-w-md rounded-t-2xl md:rounded-2xl border border-line max-h-[92dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Log a meal"
      >
        <header className="flex items-center justify-between p-4 border-b border-line sticky top-0 bg-surface">
          <h2 className="font-display font-bold text-xl">Log a meal</h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="min-w-11 min-h-11 inline-flex items-center justify-center rounded-lg text-ink-soft hover:bg-line/60 active:scale-95 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </header>

        <div className="p-4 flex flex-col gap-4">
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

          {!previewUrl ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="aspect-square w-full rounded-card border-2 border-dashed border-line bg-bg flex flex-col items-center justify-center gap-2 text-ink-soft hover:border-primary hover:text-primary active:scale-[0.99] transition cursor-pointer"
            >
              <Camera size={48} />
              <span className="font-display font-semibold uppercase tracking-wide">
                Take a photo
              </span>
              <span className="text-xs">or pick from gallery</span>
            </button>
          ) : (
            <div className="relative aspect-square w-full rounded-card overflow-hidden bg-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Food preview"
                className="w-full h-full object-cover"
              />
              {analyzing && (
                <div className="absolute inset-0 bg-ink/60 flex flex-col items-center justify-center text-white gap-2">
                  <Loader2 className="animate-spin" size={36} />
                  <span className="font-display font-semibold uppercase tracking-wide">
                    Analyzing…
                  </span>
                </div>
              )}
            </div>
          )}

          <label htmlFor="meal-notes" className="flex flex-col gap-1">
            <span className="font-medium text-ink-soft uppercase tracking-wide text-xs">
              Details (optional)
            </span>
            <textarea
              id="meal-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="e.g. 2 sendok makan rice, fried in 1 sendok teh oil, 1 piring kecil — helps the AI estimate portions"
              disabled={analyzing}
              className="w-full px-3 py-2 rounded-lg border border-line bg-surface text-ink resize-y focus:outline-2 focus:outline-offset-2 focus:outline-primary placeholder:text-ink-soft/60 text-sm leading-snug disabled:opacity-60"
            />
            <span className="text-[11px] text-ink-soft tabular-nums self-end">
              {notes.length}/1000
            </span>
          </label>

          <UtensilsReference />

          {error && (
            <div
              role="alert"
              className="bg-bad/10 text-bad rounded-lg p-3 text-sm"
            >
              {error}
            </div>
          )}

          {result && result.ok && (
            <div className="bg-bg rounded-card p-3 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-cta" />
                <span className="font-semibold">{result.name}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <Stat label="kcal" value={result.calories} big />
                <Stat label="P" value={`${result.protein_g}g`} />
                <Stat label="C" value={`${result.carbs_g}g`} />
                <Stat label="F" value={`${result.fat_g}g`} />
              </div>
              <div className="text-xs text-ink-soft">
                Confidence: {result.confidence}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            {previewUrl && !result?.ok && (
              <Button
                variant="primary"
                block
                disabled={!file || analyzing}
                onClick={analyze}
              >
                {analyzing ? "Analyzing…" : "Analyze"}
              </Button>
            )}
            {result?.ok && (
              <>
                <Button variant="ghost" onClick={() => fileRef.current?.click()}>
                  Retake
                </Button>
                <Button
                  variant="cta"
                  block
                  disabled={saving}
                  onClick={save}
                >
                  {saving ? "Saving…" : "Log this meal"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  big,
}: {
  label: string;
  value: number | string;
  big?: boolean;
}) {
  return (
    <div className="bg-surface rounded-lg p-2">
      <div
        className={
          (big ? "text-2xl " : "text-base ") +
          "font-display font-bold tabular-nums"
        }
      >
        {value}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-ink-soft">
        {label}
      </div>
    </div>
  );
}
