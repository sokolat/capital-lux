import { describe, expect, it } from "vitest";
import { createGame } from "../src/setup.js";
import { reduce } from "../src/reduce.js";
import { scoreGame } from "../src/score.js";

describe("setup", () => {
  it("creates a 2-player game with draft phase and 6-card pools", () => {
    const s = createGame(42, ["A", "B"]);
    expect(s.phase.kind).toBe("draft");
    if (s.phase.kind !== "draft") throw new Error();
    expect(s.phase.pool["A"]).toHaveLength(6);
    expect(s.phase.pool["B"]).toHaveLength(6);
  });
  it("creates a 4-player game with 5-card pools", () => {
    const s = createGame(1, ["A", "B", "C", "D"]);
    if (s.phase.kind !== "draft") throw new Error();
    expect(s.phase.pool["A"]).toHaveLength(5);
  });
  it("seeds the capital with one face-up card", () => {
    const s = createGame(7, ["A", "B"]);
    const total = (["blue", "pink", "green", "yellow"] as const)
      .map((c) => s.capital.cards[c].length)
      .reduce((a, b) => a + b, 0);
    expect(total).toBe(1);
  });
});

describe("draft", () => {
  it("4-player draft completes in one pick+pass+pick", () => {
    const s0 = createGame(1, ["A", "B", "C", "D"]);
    if (s0.phase.kind !== "draft") throw new Error();
    // Each player picks 2 from own pool.
    let s = s0;
    for (const p of ["A", "B", "C", "D"]) {
      if (s.phase.kind !== "draft") throw new Error();
      const pool = s.phase.pool[p]!;
      s = reduce(s, {
        type: "DRAFT_PICK",
        player: p,
        cardIds: [pool[0]!.id, pool[1]!.id],
      });
    }
    // Now pools passed left; each picks final 2.
    for (const p of ["A", "B", "C", "D"]) {
      if (s.phase.kind !== "draft") {
        // already advanced to play phase -> we're done
        break;
      }
      const pool = s.phase.pool[p]!;
      s = reduce(s, {
        type: "DRAFT_PICK",
        player: p,
        cardIds: [pool[0]!.id, pool[1]!.id],
      });
    }
    expect(s.phase.kind).toBe("play");
    for (const p of s.players) expect(p.hand).toHaveLength(5);
  });
});

describe("scoring", () => {
  it("unused gold scores 1 point each", () => {
    const s = createGame(1, ["A", "B"]);
    const playerA = s.players.find((p) => p.id === "A")!;
    playerA.gold = 3;
    const sc = scoreGame(s);
    expect(sc["A"]!.total).toBe(3);
  });
});
