import {
  createGame,
  reduce,
  type Action,
  type GameState,
  type PlayerId,
} from "@capital-lux/engine";
import { useSyncExternalStore } from "react";

type Listener = () => void;

interface Store {
  game: GameState | null;
  handoff: boolean;
  draftPicks: Record<PlayerId, number[]>;
}

let state: Store = { game: null, handoff: false, draftPicks: {} };
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

export const store = {
  getState: () => state,
  subscribe: (fn: Listener) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  newGame(seed: number, players: PlayerId[]) {
    state = {
      game: createGame(seed, players),
      handoff: false,
      draftPicks: Object.fromEntries(players.map((p) => [p, []])),
    };
    emit();
  },
  dispatch(a: Action) {
    if (!state.game) return;
    state = { ...state, game: reduce(state.game, a) };
    emit();
  },
  requestHandoff() {
    state = { ...state, handoff: true };
    emit();
  },
  continueAfterHandoff() {
    state = { ...state, handoff: false };
    emit();
  },
  toggleDraftPick(player: PlayerId, cardId: number) {
    const cur = state.draftPicks[player] ?? [];
    const next = cur.includes(cardId)
      ? cur.filter((id) => id !== cardId)
      : cur.length < 2
        ? [...cur, cardId]
        : cur;
    state = { ...state, draftPicks: { ...state.draftPicks, [player]: next } };
    emit();
  },
  submitDraftPick(player: PlayerId) {
    const picks = state.draftPicks[player] ?? [];
    if (picks.length !== 2) return;
    store.dispatch({
      type: "DRAFT_PICK",
      player,
      cardIds: [picks[0]!, picks[1]!],
    });
    state = {
      ...state,
      draftPicks: { ...state.draftPicks, [player]: [] },
    };
    emit();
  },
  reset() {
    state = { game: null, handoff: false, draftPicks: {} };
    emit();
  },
};

export function useStore(): Store {
  return useSyncExternalStore(store.subscribe, store.getState, store.getState);
}
