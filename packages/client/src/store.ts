import {
  createGame,
  reduce,
  type Action,
  type GameState,
  type PlayerId,
} from "@capital-lux/engine";
import { create } from "zustand";

interface StoreState {
  game: GameState | null;
  handoff: boolean; // true when we're between turns and need a confirm screen
  draftPicks: Record<PlayerId, number[]>; // selected card IDs during draft, per player
  newGame: (seed: number, players: PlayerId[]) => void;
  dispatch: (a: Action) => void;
  requestHandoff: () => void;
  continueAfterHandoff: () => void;
  toggleDraftPick: (player: PlayerId, cardId: number) => void;
  submitDraftPick: (player: PlayerId) => void;
  reset: () => void;
}

export const useGame = create<StoreState>((set, get) => ({
  game: null,
  handoff: false,
  draftPicks: {},
  newGame: (seed, players) =>
    set({
      game: createGame(seed, players),
      handoff: false,
      draftPicks: Object.fromEntries(players.map((p) => [p, []])),
    }),
  dispatch: (a) => {
    const g = get().game;
    if (!g) return;
    set({ game: reduce(g, a) });
  },
  requestHandoff: () => set({ handoff: true }),
  continueAfterHandoff: () => set({ handoff: false }),
  toggleDraftPick: (player, cardId) =>
    set((s) => {
      const cur = s.draftPicks[player] ?? [];
      const next = cur.includes(cardId)
        ? cur.filter((id) => id !== cardId)
        : cur.length < 2
          ? [...cur, cardId]
          : cur;
      return { draftPicks: { ...s.draftPicks, [player]: next } };
    }),
  submitDraftPick: (player) => {
    const picks = get().draftPicks[player] ?? [];
    if (picks.length !== 2) return;
    get().dispatch({
      type: "DRAFT_PICK",
      player,
      cardIds: [picks[0]!, picks[1]!],
    });
    set((s) => ({ draftPicks: { ...s.draftPicks, [player]: [] } }));
  },
  reset: () => set({ game: null, handoff: false, draftPicks: {} }),
}));
