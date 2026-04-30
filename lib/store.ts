"use client";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from "firebase/firestore";
import { db, USER_ID, isFirebaseConfigured } from "./firebase";
import type { Meal, Profile, WeightEntry } from "./types";
import { todayKey } from "./calories";

export { isFirebaseConfigured };

export const userDoc = () => doc(db(), "users", USER_ID);
const mealsCol = () => collection(db(), "users", USER_ID, "meals");
const weightsCol = () => collection(db(), "users", USER_ID, "weights");

export async function getProfile(): Promise<Profile | null> {
  const snap = await getDoc(userDoc());
  return snap.exists() ? (snap.data() as Profile) : null;
}

export async function saveProfile(profile: Profile): Promise<void> {
  await setDoc(userDoc(), profile, { merge: true });
}

export async function logMeal(meal: {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl: string;
  confidence: Meal["confidence"];
}): Promise<void> {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  await setDoc(doc(mealsCol(), id), {
    ...meal,
    loggedAt: serverTimestamp(),
    dateKey: todayKey(),
  });
}

export async function deleteMeal(id: string): Promise<void> {
  await deleteDoc(doc(mealsCol(), id));
}

export function subscribeMealsForDay(
  dateKey: string,
  cb: (meals: Meal[]) => void
): () => void {
  const q = query(mealsCol(), where("dateKey", "==", dateKey));
  return onSnapshot(q, (snap) => {
    const items = snap.docs
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Meal, "id">) }))
      .sort(
        (a, b) =>
          (b.loggedAt?.toMillis?.() ?? 0) - (a.loggedAt?.toMillis?.() ?? 0)
      );
    cb(items);
  });
}

export async function getAllMeals(): Promise<Meal[]> {
  const snap = await getDocs(query(mealsCol(), orderBy("loggedAt", "desc")));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Meal, "id">) }));
}

export async function logWeight(kg: number): Promise<void> {
  const id = `${Date.now()}`;
  await setDoc(doc(weightsCol(), id), {
    kg,
    loggedAt: serverTimestamp(),
    dateKey: todayKey(),
  });
}

export async function deleteWeight(id: string): Promise<void> {
  await deleteDoc(doc(weightsCol(), id));
}

export function subscribeWeights(
  cb: (entries: WeightEntry[]) => void
): () => void {
  const q = query(weightsCol(), orderBy("loggedAt", "desc"));
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<WeightEntry, "id">),
    }));
    cb(items);
  });
}

export async function getLatestWeight(): Promise<number | null> {
  const snap = await getDocs(query(weightsCol(), orderBy("loggedAt", "desc")));
  const first = snap.docs[0];
  return first ? (first.data().kg as number) : null;
}

export function tsNow(): Timestamp {
  return Timestamp.now();
}
