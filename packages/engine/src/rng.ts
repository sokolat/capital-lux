// Mulberry32 — small, deterministic, good enough for shuffling.
export function nextRng(state: number): { value: number; state: number } {
  let t = (state + 0x6d2b79f5) | 0;
  const s = t;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  return { value, state: s };
}

export function shuffle<T>(items: readonly T[], rngState: number): { items: T[]; rngState: number } {
  const arr = items.slice();
  let s = rngState;
  for (let i = arr.length - 1; i > 0; i--) {
    const r = nextRng(s);
    s = r.state;
    const j = Math.floor(r.value * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return { items: arr, rngState: s };
}
