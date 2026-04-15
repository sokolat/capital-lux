import { describe, expect, it } from "vitest";
import { buildDeck, buildModifierDeck } from "../src/cards.js";

describe("deck composition", () => {
  it("has 72 profession cards", () => {
    expect(buildDeck()).toHaveLength(72);
  });
  it("has 18 of each color", () => {
    const d = buildDeck();
    for (const c of ["blue", "pink", "green", "yellow"] as const) {
      expect(d.filter((x) => x.color === c)).toHaveLength(18);
    }
  });
  it("distributes values 3/4/4/4/3 for 2/3/4/5/6", () => {
    const d = buildDeck().filter((c) => c.color === "blue");
    expect(d.filter((c) => c.value === 2)).toHaveLength(3);
    expect(d.filter((c) => c.value === 3)).toHaveLength(4);
    expect(d.filter((c) => c.value === 4)).toHaveLength(4);
    expect(d.filter((c) => c.value === 5)).toHaveLength(4);
    expect(d.filter((c) => c.value === 6)).toHaveLength(3);
  });
  it("has 4 modifier cards summing to +2", () => {
    const m = buildModifierDeck();
    expect(m).toHaveLength(4);
    expect(m.reduce((a, x) => a + x.value, 0)).toBe(2);
  });
});
