import type { Card, CardValue, Color, Modifier, ModifierValue } from "./types.js";
import { COLORS } from "./types.js";

// 18 per color: 3×2, 4×3, 4×4, 4×5, 3×6
const COUNTS: Record<CardValue, number> = { 2: 3, 3: 4, 4: 4, 5: 4, 6: 3 };

export function buildDeck(): Card[] {
  const cards: Card[] = [];
  let id = 0;
  for (const color of COLORS) {
    for (const v of [2, 3, 4, 5, 6] as CardValue[]) {
      for (let i = 0; i < COUNTS[v]; i++) {
        cards.push({ id: id++, color, value: v });
      }
    }
  }
  return cards;
}

export function buildModifierDeck(): Modifier[] {
  return ([-3, -1, 2, 4] as ModifierValue[]).map((value) => ({ value }));
}

export function emptyColorPile<T>(): Record<Color, T[]> {
  return { blue: [], pink: [], green: [], yellow: [] };
}

export function colorTotal(cards: readonly Card[]): number {
  let t = 0;
  for (const c of cards) t += c.value;
  return t;
}

export function byColor(cards: readonly Card[]): Record<Color, Card[]> {
  const out = emptyColorPile<Card>();
  for (const c of cards) out[c.color].push(c);
  return out;
}
