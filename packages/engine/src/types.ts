export type Color = "blue" | "pink" | "green" | "yellow";
// blue=agent, pink=cleric, green=scholar, yellow=merchant
export const COLORS: readonly Color[] = ["blue", "pink", "green", "yellow"];

export type CardValue = 2 | 3 | 4 | 5 | 6;

export type CardId = number;

export interface Card {
  id: CardId;
  color: Color;
  value: CardValue;
}

export type ModifierValue = -3 | -1 | 2 | 4;
export interface Modifier {
  value: ModifierValue;
}

export type PlayerId = string;

export interface PlayerState {
  id: PlayerId;
  hand: Card[];
  hometown: Card[];
  bonusCards: Card[];
  gold: number;
}

// Cards grouped per color (value-sorted descending on display, but stored as list).
export type ColorPile = Record<Color, Card[]>;

export interface CapitalState {
  // cards in capital by color
  cards: ColorPile;
  // face-down modifiers per color (revealed at round end)
  modifiers: Record<Color, Modifier[]>;
}

export type Phase =
  | { kind: "draft"; handsPassed: 0 | 1; picks: Record<PlayerId, Card[]>; pool: Record<PlayerId, Card[]> }
  | { kind: "play"; lastRoundTriggeredBy: PlayerId | null; remainingLastTurns: PlayerId[] }
  | { kind: "roundEnd"; pendingDiscards: Record<PlayerId, Color[]> }
  | { kind: "gameOver" };

export interface GameState {
  seed: number;
  rngState: number;
  round: 1 | 2 | 3;
  players: PlayerState[]; // turn order
  startingPlayer: PlayerId;
  currentPlayer: PlayerId;
  deck: Card[];
  modifierDeck: Modifier[];
  goldPool: number;
  capital: CapitalState;
  phase: Phase;
  log: string[];
}

export type Action =
  | { type: "DRAFT_PICK"; player: PlayerId; cardIds: [CardId, CardId] }
  | { type: "PLAY_TO_HOMETOWN"; player: PlayerId; cardId: CardId }
  | { type: "PLAY_TO_CAPITAL"; player: PlayerId; cardId: CardId; // sub-payload per color
      clericTakeColor?: Exclude<Color, "pink">;
      agentPlaceAboveColor?: Color;
    }
  | { type: "SPEND_GOLD"; player: PlayerId; color: Color; amount: number }
  | { type: "SKIP_DISCARD_RESOLUTION"; player: PlayerId }
  | { type: "ADVANCE" }; // advance phase after discards resolved
