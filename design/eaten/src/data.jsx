// data.jsx — mock state for prototype
const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

const SEED_MEALS = [
  {
    id: 'm1',
    name: 'Nasi goreng with fried egg',
    calories: 612,
    protein: 22,
    carbs: 78,
    fat: 24,
    confidence: 'high',
    time: '12:42',
    img: 'meals/meal1.jpg',
    notes: '1 piring penuh, 1 telur ceplok, sedikit minyak.',
    tag: 'Lunch',
  },
  {
    id: 'm2',
    name: 'Iced latte (oat milk)',
    calories: 145,
    protein: 4,
    carbs: 18,
    fat: 6,
    confidence: 'medium',
    time: '09:18',
    img: 'meals/meal2.jpg',
    notes: '1 gelas besar, no sugar.',
    tag: 'Snack',
  },
  {
    id: 'm3',
    name: 'Avocado toast & poached egg',
    calories: 388,
    protein: 17,
    carbs: 32,
    fat: 22,
    confidence: 'high',
    time: '07:55',
    img: 'meals/meal3.jpg',
    notes: '2 slices sourdough, 1/2 avocado.',
    tag: 'Breakfast',
  },
];

const HISTORY_DAYS = [
  { dateKey: 'Today',     date: 'Apr 30',  total: 1145, target: 1980, meals: 3, trend: [380,150,610,0,0] },
  { dateKey: 'Yesterday', date: 'Apr 29',  total: 1860, target: 1980, meals: 4, trend: [420,180,720,540] },
  { dateKey: 'Mon',       date: 'Apr 28',  total: 2240, target: 1980, meals: 5, trend: [320,180,680,540,520] },
  { dateKey: 'Sun',       date: 'Apr 27',  total: 1720, target: 1980, meals: 3, trend: [510,440,770] },
  { dateKey: 'Sat',       date: 'Apr 26',  total: 2520, target: 1980, meals: 6, trend: [310,260,640,520,420,370] },
  { dateKey: 'Fri',       date: 'Apr 25',  total: 1410, target: 1980, meals: 3, trend: [400,330,680] },
  { dateKey: 'Thu',       date: 'Apr 24',  total: 1980, target: 1980, meals: 4, trend: [380,310,710,580] },
];

// 14 days of weight, gentle downward trend with noise
const WEIGHT_ENTRIES = [
  { date: 'Apr 17', kg: 74.6 },
  { date: 'Apr 18', kg: 74.4 },
  { date: 'Apr 19', kg: 74.5 },
  { date: 'Apr 20', kg: 74.2 },
  { date: 'Apr 21', kg: 74.0 },
  { date: 'Apr 22', kg: 74.1 },
  { date: 'Apr 23', kg: 73.8 },
  { date: 'Apr 24', kg: 73.6 },
  { date: 'Apr 25', kg: 73.7 },
  { date: 'Apr 26', kg: 73.4 },
  { date: 'Apr 27', kg: 73.2 },
  { date: 'Apr 28', kg: 73.3 },
  { date: 'Apr 29', kg: 73.0 },
  { date: 'Apr 30', kg: 72.8 },
];

const TARGET = 1980;

// ─── Smooth animated number hook ────────────────────────────
function useCountUp(target, { duration = 900, delay = 0 } = {}) {
  const [v, setV] = useState(0);
  const fromRef = useRef(0);
  const startRef = useRef(0);
  const rafRef = useRef(0);
  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    const from = fromRef.current;
    const to = target;
    const t0 = performance.now() + delay;
    const tick = (now) => {
      if (now < t0) { rafRef.current = requestAnimationFrame(tick); return; }
      const t = Math.min(1, (now - t0) / duration);
      // easeOutExpo
      const e = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      const cur = from + (to - from) * e;
      setV(cur);
      fromRef.current = cur;
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
      else fromRef.current = to;
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, delay]);
  return v;
}

// In-view trigger
function useInView(ref, { once = true } = {}) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); if (once) io.disconnect(); }
      else if (!once) setSeen(false);
    }, { threshold: 0.2 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [ref, once]);
  return seen;
}

Object.assign(window, {
  SEED_MEALS, HISTORY_DAYS, WEIGHT_ENTRIES, TARGET,
  useCountUp, useInView,
});
