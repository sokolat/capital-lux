import { buildDeck, buildModifierDeck, emptyColorPile } from "./cards.js";
import { shuffle } from "./rng.js";
import type { GameState, PlayerId, PlayerState, Card } from "./types.js";
import { COLORS } from "./types.js";

export function createGame(seed: number, playerIds: PlayerId[]): GameState {
  if (playerIds.length < 2 || playerIds.length > 4) {
    throw new Error("Capital Lux supports 2–4 players");
  }
  const handSize = playerIds.length === 4 ? 5 : 6;
  const { items: deck0, rngState: r1 } = shuffle(buildDeck(), seed);

  // Seed capital: one face-up card per color? Rules say ONE card total ("Draw the
  // top card... place on corresponding Capital Card"). Implement singular.
  const seededCard = deck0[0]!;
  const deck1 = deck0.slice(1);
  const capitalCards = emptyColorPile<Card>();
  capitalCards[seededCard.color].push(seededCard);

  // Starting player: draw one modifier per player, highest wins. Simpler: deterministic
  // — shuffle modifier deck, first player who "drew" highest is starting. Emulate by
  // shuffling player order and then picking index of +4.
  const { items: modsShuffled, rngState: r2 } = shuffle(buildModifierDeck(), r1);
  const startIdx = modsShuffled.findIndex((m) => m.value === 4);
  const startingPlayer = playerIds[startIdx % playerIds.length]!;

  // Reshuffle modifier deck (rules: collect, shuffle, place face-down).
  const { items: modDeck, rngState: r3 } = shuffle(buildModifierDeck(), r2);

  // Deal initial hands.
  const players: PlayerState[] = playerIds.map((id) => ({
    id,
    hand: [],
    hometown: [],
    bonusCards: [],
    gold: 0,
  }));

  let cursor = 0;
  const dealt: Record<PlayerId, Card[]> = {};
  for (const p of players) {
    dealt[p.id] = deck1.slice(cursor, cursor + handSize);
    cursor += handSize;
  }
  const deckAfterDeal = deck1.slice(cursor);

  // Draft phase: each player holds their dealt cards as pool, picks empty.
  const pool: Record<PlayerId, Card[]> = {};
  const picks: Record<PlayerId, Card[]> = {};
  for (const p of players) {
    pool[p.id] = dealt[p.id]!;
    picks[p.id] = [];
  }

  return {
    seed,
    rngState: r3,
    round: 1,
    players,
    startingPlayer,
    currentPlayer: startingPlayer,
    deck: deckAfterDeal,
    modifierDeck: modDeck,
    goldPool: 8,
    capital: { cards: capitalCards, modifiers: emptyColorPile() },
    phase: { kind: "draft", handsPassed: 0, picks, pool },
    log: [`Round 1 starts. Starting player: ${startingPlayer}.`],
  };
}

export function leftNeighbor(players: PlayerState[], id: PlayerId): PlayerId {
  const i = players.findIndex((p) => p.id === id);
  return players[(i + 1) % players.length]!.id;
}

export function nextInTurnOrder(players: PlayerState[], id: PlayerId): PlayerId {
  return leftNeighbor(players, id);
}

export { COLORS };
