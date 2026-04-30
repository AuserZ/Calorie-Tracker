"use client";
import { useEffect, useState } from "react";
import {
  isFirebaseConfigured,
  logWeight,
  subscribeWeights,
  deleteWeight,
} from "@/lib/store";
import type { WeightEntry } from "@/lib/types";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import WeightChart from "@/components/WeightChart";
import MissingConfigNotice from "@/components/MissingConfigNotice";
import { Trash2 } from "lucide-react";

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
    <div className="p-4 max-w-2xl mx-auto flex flex-col gap-4">
      <Card>
        <div className="flex items-baseline gap-3">
          <span className="font-display font-bold text-5xl tabular-nums text-primary">
            {latest ? latest.kg.toFixed(1) : "—"}
          </span>
          <span className="text-ink-soft uppercase tracking-wide text-sm">
            kg
          </span>
          {latest && previous && (
            <span
              className={`ml-auto text-sm font-semibold tabular-nums ${
                diff > 0 ? "text-bad" : diff < 0 ? "text-good" : "text-ink-soft"
              }`}
            >
              {diff > 0 ? "+" : ""}
              {diff.toFixed(1)} kg
            </span>
          )}
        </div>
        <div className="text-xs text-ink-soft uppercase tracking-wide mt-1">
          Current weight
        </div>
      </Card>

      <Card>
        <form onSubmit={submit} className="flex gap-2 items-end">
          <Input
            id="newWeight"
            label="Log new weight (kg)"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={20}
            max={400}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="e.g. 72.4"
            className="flex-1"
            required
          />
          <Button type="submit" variant="cta" disabled={saving}>
            {saving ? "…" : "Add"}
          </Button>
        </form>
        {err && (
          <div role="alert" className="bg-bad/10 text-bad rounded-lg p-2 text-xs mt-2">
            {err}
          </div>
        )}
      </Card>

      <Card>
        <h3 className="font-display font-bold text-lg uppercase tracking-wide mb-2">
          Trend
        </h3>
        <WeightChart entries={entries} />
      </Card>

      {entries.length > 0 && (
        <Card>
          <h3 className="font-display font-bold text-lg uppercase tracking-wide mb-2">
            History
          </h3>
          <ul className="divide-y divide-line">
            {entries.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-ink-soft">{e.dateKey}</span>
                <span className="font-semibold tabular-nums">
                  {e.kg.toFixed(1)} kg
                </span>
                <button
                  type="button"
                  onClick={() => deleteWeight(e.id)}
                  aria-label={`Delete entry from ${e.dateKey}`}
                  className="min-w-11 min-h-11 inline-flex items-center justify-center rounded-lg text-ink-soft hover:text-bad hover:bg-bad/10 active:scale-95 transition cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
