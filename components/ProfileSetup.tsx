"use client";
import { useState } from "react";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Input from "./ui/Input";
import Select from "./ui/Select";
import type { Profile } from "@/lib/types";

type Props = {
  initial?: Partial<Profile>;
  initialWeightKg?: number;
  onSave: (profile: Profile, weightKg: number) => Promise<void>;
};

export default function ProfileSetup({
  initial,
  initialWeightKg,
  onSave,
}: Props) {
  const [age, setAge] = useState(initial?.age?.toString() ?? "30");
  const [sex, setSex] = useState<Profile["sex"]>(initial?.sex ?? "male");
  const [heightCm, setHeightCm] = useState(
    initial?.heightCm?.toString() ?? "170"
  );
  const [weightKg, setWeightKg] = useState((initialWeightKg ?? 70).toString());
  const [activity, setActivity] = useState<Profile["activityLevel"]>(
    initial?.activityLevel ?? "light"
  );
  const [goal, setGoal] = useState<Profile["goal"]>(initial?.goal ?? "maintain");
  const [override, setOverride] = useState(
    initial?.dailyTargetOverride?.toString() ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const profile: Profile = {
      age: Number(age),
      sex,
      heightCm: Number(heightCm),
      activityLevel: activity,
      goal,
      ...(override ? { dailyTargetOverride: Number(override) } : {}),
    };
    if (
      !Number.isFinite(profile.age) ||
      !Number.isFinite(profile.heightCm) ||
      !Number.isFinite(Number(weightKg))
    ) {
      setErr("Please enter valid numbers.");
      return;
    }
    setSaving(true);
    try {
      await onSave(profile, Number(weightKg));
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Couldn't save.");
      setSaving(false);
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <h2 className="font-display font-bold text-2xl mb-1">Quick setup</h2>
      <p className="text-sm text-ink-soft mb-4">
        We need a few details to estimate your daily calorie target.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="age"
            label="Age"
            type="number"
            inputMode="numeric"
            min={10}
            max={120}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />
          <Select
            id="sex"
            label="Sex"
            value={sex}
            onChange={(e) => setSex(e.target.value as Profile["sex"])}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            id="height"
            label="Height (cm)"
            type="number"
            inputMode="numeric"
            min={100}
            max={250}
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            required
          />
          <Input
            id="weight"
            label="Weight (kg)"
            type="number"
            inputMode="decimal"
            step="0.1"
            min={20}
            max={400}
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            required
          />
        </div>
        <Select
          id="activity"
          label="Activity"
          value={activity}
          onChange={(e) =>
            setActivity(e.target.value as Profile["activityLevel"])
          }
        >
          <option value="sedentary">Sedentary (desk job, no exercise)</option>
          <option value="light">Light (1-3 days/week)</option>
          <option value="moderate">Moderate (3-5 days/week)</option>
          <option value="active">Active (6-7 days/week)</option>
        </Select>
        <Select
          id="goal"
          label="Goal"
          value={goal}
          onChange={(e) => setGoal(e.target.value as Profile["goal"])}
        >
          <option value="lose">Lose weight</option>
          <option value="maintain">Maintain</option>
          <option value="gain">Gain weight</option>
        </Select>
        <Input
          id="override"
          label="Daily target override (optional kcal)"
          type="number"
          inputMode="numeric"
          min={500}
          max={6000}
          value={override}
          onChange={(e) => setOverride(e.target.value)}
          placeholder="Leave blank to auto-calculate"
        />
        {err && (
          <div role="alert" className="bg-bad/10 text-bad rounded-lg p-3 text-sm">
            {err}
          </div>
        )}
        <Button type="submit" variant="cta" block disabled={saving}>
          {saving ? "Saving…" : "Save and continue"}
        </Button>
      </form>
    </Card>
  );
}
