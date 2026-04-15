import type { Action, Card, Color, GameState, PlayerId } from "./types.js";

// Helper: for a given card a player wants to play to capital, enumerate required sub-choices.
export function capitalSubChoices(
  s: GameState,
  card: Card,
): { clericTakeColor?: Exclude<Color, "pink">[]; agentPlaceAboveColor?: Color[] } {
  if (card.color === "pink") {
    const colors = (["blue", "green", "yellow"] as const).filter(
      (c) => s.capital.cards[c].length > 0,
    );
    return { clericTakeColor: colors.length ? (colors as Exclude<Color, "pink">[]) : ["blue"] };
  }
  if (card.color === "blue") {
    return { agentPlaceAboveColor: ["blue", "pink", "green", "yellow"] };
  }
  return {};
}

export function currentPlayerHand(s: GameState): Card[] {
  const p = s.players.find((pl) => pl.id === s.currentPlayer);
  return p?.hand ?? [];
}

export function isActive(s: GameState, id: PlayerId): boolean {
  return s.phase.kind === "play" && s.currentPlayer === id;
}

export function legalActions(s: GameState): Action[] {
  if (s.phase.kind !== "play") return [];
  const p = s.players.find((pl) => pl.id === s.currentPlayer);
  if (!p) return [];
  const actions: Action[] = [];
  for (const c of p.hand) {
    actions.push({ type: "PLAY_TO_HOMETOWN", player: p.id, cardId: c.id });
    // Capital placements — sub-choices are required but we enumerate at UI level.
    actions.push({ type: "PLAY_TO_CAPITAL", player: p.id, cardId: c.id });
  }
  return actions;
}
