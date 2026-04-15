import { colorTotal } from "./cards.js";
import type { GameState, PlayerId } from "./types.js";

export interface PlayerScore {
  hometown: number;
  bonus: number;
  gold: number;
  total: number;
  sixes: number;
  fives: number;
  fours: number;
  threes: number;
  twos: number;
}

export function scoreGame(s: GameState): Record<PlayerId, PlayerScore> {
  const out: Record<PlayerId, PlayerScore> = {};
  for (const p of s.players) {
    const hometown = colorTotal(p.hometown);
    const bonus = colorTotal(p.bonusCards);
    const gold = p.gold;
    const all = [...p.hometown, ...p.bonusCards];
    const cnt = (v: number) => all.filter((c) => c.value === v).length;
    out[p.id] = {
      hometown,
      bonus,
      gold,
      total: hometown + bonus + gold,
      sixes: cnt(6),
      fives: cnt(5),
      fours: cnt(4),
      threes: cnt(3),
      twos: cnt(2),
    };
  }
  return out;
}

export function winner(s: GameState): PlayerId[] {
  const scores = scoreGame(s);
  const entries = Object.entries(scores);
  entries.sort(([, a], [, b]) => {
    if (b.total !== a.total) return b.total - a.total;
    if (b.sixes !== a.sixes) return b.sixes - a.sixes;
    if (b.fives !== a.fives) return b.fives - a.fives;
    if (b.fours !== a.fours) return b.fours - a.fours;
    if (b.threes !== a.threes) return b.threes - a.threes;
    return b.twos - a.twos;
  });
  const top = entries[0]![1];
  return entries
    .filter(([, v]) => v.total === top.total && v.sixes === top.sixes && v.fives === top.fives && v.fours === top.fours && v.threes === top.threes && v.twos === top.twos)
    .map(([id]) => id);
}
