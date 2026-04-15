import { buildModifierDeck, colorTotal } from "./cards.js";
import { shuffle } from "./rng.js";
import { leftNeighbor, nextInTurnOrder } from "./setup.js";
import type {
  Action,
  Card,
  Color,
  GameState,
  PlayerId,
  PlayerState,
} from "./types.js";
import { COLORS } from "./types.js";

function clone<T>(x: T): T {
  return structuredClone(x);
}

function findPlayer(s: GameState, id: PlayerId): PlayerState {
  const p = s.players.find((pl) => pl.id === id);
  if (!p) throw new Error(`unknown player ${id}`);
  return p;
}

function removeFromHand(p: PlayerState, cardId: number): Card {
  const idx = p.hand.findIndex((c) => c.id === cardId);
  if (idx < 0) throw new Error(`card ${cardId} not in ${p.id}'s hand`);
  return p.hand.splice(idx, 1)[0]!;
}

export function reduce(state: GameState, action: Action): GameState {
  const s = clone(state);
  switch (action.type) {
    case "DRAFT_PICK":
      return draftPick(s, action);
    case "PLAY_TO_HOMETOWN":
      return playToHometown(s, action);
    case "PLAY_TO_CAPITAL":
      return playToCapital(s, action);
    case "SPEND_GOLD":
      return spendGold(s, action);
    case "SKIP_DISCARD_RESOLUTION":
      return resolveDiscards(s, action.player);
    case "ADVANCE":
      return advance(s);
  }
}

function draftPick(
  s: GameState,
  a: Extract<Action, { type: "DRAFT_PICK" }>,
): GameState {
  if (s.phase.kind !== "draft") throw new Error("not in draft");
  const { picks, pool, handsPassed } = s.phase;
  const myPool = pool[a.player];
  if (!myPool) throw new Error("no pool");
  const chosen: Card[] = [];
  for (const id of a.cardIds) {
    const idx = myPool.findIndex((c) => c.id === id);
    if (idx < 0) throw new Error(`card ${id} not in pool`);
    chosen.push(myPool.splice(idx, 1)[0]!);
  }
  picks[a.player] = [...(picks[a.player] ?? []), ...chosen];

  // All picked for this phase step?
  const allPicked = s.players.every(
    (p) => picks[p.id]!.length === (handsPassed + 1) * 2,
  );
  if (!allPicked) return s;

  // Draft flow (both 2-3p and 4p): pick 2, pass left, pick 2, pass left, keep
  // remaining card(s) — 2-3p keep 2, 4p keep 1.
  if (handsPassed === 0) {
    // Pass pools left.
    const newPool: Record<PlayerId, Card[]> = {};
    for (const p of s.players) {
      newPool[leftNeighbor(s.players, p.id)] = pool[p.id]!;
    }
    s.phase = { kind: "draft", handsPassed: 1, picks, pool: newPool };
    return s;
  }

  {
    // Second pick complete. Pass remaining cards left; receiver keeps them.
    const finalPool: Record<PlayerId, Card[]> = {};
    for (const p of s.players) {
      finalPool[leftNeighbor(s.players, p.id)] = pool[p.id]!;
    }
    for (const p of s.players) {
      p.hand = [...picks[p.id]!, ...(finalPool[p.id] ?? [])];
    }
    s.phase = {
      kind: "play",
      lastRoundTriggeredBy: null,
      remainingLastTurns: [],
    };
    s.currentPlayer = s.startingPlayer;
    s.log.push("Draft complete. Play phase begins.");
  }
  return s;
}


function playToHometown(
  s: GameState,
  a: Extract<Action, { type: "PLAY_TO_HOMETOWN" }>,
): GameState {
  assertActivePlayer(s, a.player);
  const p = findPlayer(s, a.player);
  const card = removeFromHand(p, a.cardId);
  p.hometown.push(card);
  s.log.push(`${p.id} plays ${card.color} ${card.value} to hometown.`);
  return afterTurn(s, card, { playedToCapital: false });
}

function playToCapital(
  s: GameState,
  a: Extract<Action, { type: "PLAY_TO_CAPITAL" }>,
): GameState {
  assertActivePlayer(s, a.player);
  const p = findPlayer(s, a.player);
  const card = removeFromHand(p, a.cardId);
  s.capital.cards[card.color].push(card);
  s.log.push(`${p.id} plays ${card.color} ${card.value} to capital.`);

  switch (card.color) {
    case "green": {
      // Scholar: draw top profession card.
      const drawn = s.deck.shift();
      if (drawn) {
        p.hand.push(drawn);
        s.log.push(`${p.id} draws a card.`);
      }
      break;
    }
    case "yellow": {
      // Merchant: take 1 gold.
      if (s.goldPool > 0) {
        s.goldPool--;
        p.gold++;
        s.log.push(`${p.id} takes a gold disc.`);
      }
      break;
    }
    case "pink": {
      // Cleric: take lowest non-pink from capital.
      const color = a.clericTakeColor;
      if (!color)
        throw new Error("cleric requires clericTakeColor (non-pink)");
      if (color === ("pink" as Color))
        throw new Error("cleric cannot take pink");
      const pile = s.capital.cards[color];
      if (pile.length > 0) {
        let minIdx = 0;
        for (let i = 1; i < pile.length; i++)
          if (pile[i]!.value < pile[minIdx]!.value) minIdx = i;
        const taken = pile.splice(minIdx, 1)[0]!;
        p.hometown.push(taken);
        s.log.push(`${p.id} (cleric) takes ${taken.color} ${taken.value}.`);
      }
      break;
    }
    case "blue": {
      // Agent: draw modifier, place face-down above chosen color.
      const target = a.agentPlaceAboveColor;
      if (!target) throw new Error("agent requires agentPlaceAboveColor");
      const mod = s.modifierDeck.shift();
      if (mod) {
        s.capital.modifiers[target].push(mod);
        s.log.push(`${p.id} (agent) places modifier above ${target}.`);
      }
      break;
    }
  }

  return afterTurn(s, card, { playedToCapital: true });
}

function afterTurn(
  s: GameState,
  playedCard: Card,
  ctx: { playedToCapital: boolean },
): GameState {
  if (s.phase.kind !== "play") return s;

  const p = findPlayer(s, s.currentPlayer);
  const handEmpty = p.hand.length === 0;

  // Scholar exception: green-to-capital as last card does NOT trigger round end
  // if the player drew a replacement card (hand is non-empty again).
  const scholarSaved =
    ctx.playedToCapital && playedCard.color === "green" && !handEmpty;

  if (
    handEmpty &&
    !scholarSaved &&
    s.phase.lastRoundTriggeredBy === null
  ) {
    // Trigger: all other players get one last turn (clockwise from current).
    const order: PlayerId[] = [];
    let id = nextInTurnOrder(s.players, p.id);
    while (id !== p.id) {
      order.push(id);
      id = nextInTurnOrder(s.players, id);
    }
    s.phase.lastRoundTriggeredBy = p.id;
    s.phase.remainingLastTurns = order;
    s.log.push(`${p.id} emptied hand. Last turns begin.`);
  }

  return advanceTurn(s);
}

function advanceTurn(s: GameState): GameState {
  if (s.phase.kind !== "play") return s;
  if (s.phase.lastRoundTriggeredBy !== null) {
    const q = s.phase.remainingLastTurns;
    if (q.length === 0) return enterRoundEnd(s);
    s.currentPlayer = q.shift()!;
    return s;
  }
  s.currentPlayer = nextInTurnOrder(s.players, s.currentPlayer);
  return s;
}

function assertActivePlayer(s: GameState, id: PlayerId) {
  if (s.phase.kind !== "play") throw new Error("not in play phase");
  if (s.currentPlayer !== id) throw new Error(`not ${id}'s turn`);
}

function enterRoundEnd(s: GameState): GameState {
  // Remaining hand cards -> hometown face up.
  for (const p of s.players) {
    if (p.hand.length > 0) {
      s.log.push(`${p.id}'s remaining ${p.hand.length} card(s) → hometown.`);
      p.hometown.push(...p.hand);
      p.hand = [];
    }
  }
  // Compute excesses.
  const capitalTotals = capitalTotalsByColor(s);
  const pendingDiscards: Record<PlayerId, Color[]> = {};
  for (const p of s.players) {
    const excess: Color[] = [];
    for (const c of COLORS) {
      const home = colorTotal(p.hometown.filter((x) => x.color === c));
      if (home > capitalTotals[c]) excess.push(c);
    }
    pendingDiscards[p.id] = excess;
  }
  s.phase = { kind: "roundEnd", pendingDiscards };
  s.log.push("Round end. Resolve discards.");
  return s;
}

export function capitalTotalsByColor(s: GameState): Record<Color, number> {
  const out: Record<Color, number> = { blue: 0, pink: 0, green: 0, yellow: 0 };
  for (const c of COLORS) {
    out[c] =
      colorTotal(s.capital.cards[c]) +
      s.capital.modifiers[c].reduce((a, m) => a + m.value, 0);
  }
  return out;
}

function spendGold(
  s: GameState,
  a: Extract<Action, { type: "SPEND_GOLD" }>,
): GameState {
  if (s.phase.kind !== "roundEnd") throw new Error("not in round end");
  const p = findPlayer(s, a.player);
  if (a.amount <= 0 || a.amount > p.gold) throw new Error("bad gold amount");
  const capTotal = capitalTotalsByColor(s)[a.color];
  const homeTotal = colorTotal(p.hometown.filter((c) => c.color === a.color));
  const diff = homeTotal - capTotal;
  if (diff <= 0) throw new Error("no excess for this color");
  if (a.amount < diff) throw new Error("must cover full difference");
  p.gold -= a.amount;
  s.goldPool += a.amount;
  s.phase.pendingDiscards[a.player] = s.phase.pendingDiscards[a.player]!.filter(
    (c) => c !== a.color,
  );
  s.log.push(`${p.id} spends ${a.amount} gold to keep ${a.color}.`);
  return s;
}

function resolveDiscards(s: GameState, player: PlayerId): GameState {
  if (s.phase.kind !== "roundEnd") throw new Error("not in round end");
  const p = findPlayer(s, player);
  const colors = s.phase.pendingDiscards[player] ?? [];
  for (const c of colors) {
    p.hometown = p.hometown.filter((card) => card.color !== c);
    s.log.push(`${p.id} discards all ${c} cards.`);
  }
  s.phase.pendingDiscards[player] = [];
  return s;
}

function advance(s: GameState): GameState {
  if (s.phase.kind !== "roundEnd") throw new Error("advance only after round end");
  // All discards must be resolved (no excess colors remaining).
  for (const p of s.players) {
    if ((s.phase.pendingDiscards[p.id] ?? []).length > 0) {
      // Auto-resolve: discard.
      resolveDiscards(s, p.id);
    }
  }
  // Award bonus cards per color.
  awardBonusCards(s);

  if (s.round === 3) {
    s.phase = { kind: "gameOver" };
    s.log.push("Game over.");
    return s;
  }
  // Prepare next round.
  return startNextRound(s);
}

function awardBonusCards(s: GameState) {
  for (const c of COLORS) {
    // Sort players by hometown color total desc, tiebreak by turn order from starting player.
    const starterIdx = s.players.findIndex((p) => p.id === s.startingPlayer);
    const ordered = s.players
      .map((p, i) => ({
        p,
        order: (i - starterIdx + s.players.length) % s.players.length,
        total: colorTotal(p.hometown.filter((x) => x.color === c)),
      }))
      .filter((x) => x.total > 0)
      .sort((a, b) => b.total - a.total || a.order - b.order);

    // Groups of tied totals get highest remaining capital cards.
    const pile = s.capital.cards[c].slice().sort((a, b) => b.value - a.value);
    let ci = 0;
    for (const entry of ordered) {
      if (ci >= pile.length) break;
      const taken = pile[ci++]!;
      entry.p.bonusCards.push(taken);
      // Remove from capital.
      const idx = s.capital.cards[c].findIndex((x) => x.id === taken.id);
      if (idx >= 0) s.capital.cards[c].splice(idx, 1);
      s.log.push(`${entry.p.id} wins ${c} bonus card (value ${taken.value}).`);
    }
  }
}

function startNextRound(s: GameState): GameState {
  // New starting player: highest hometown total (all colors).
  const starterIdx = s.players.findIndex((p) => p.id === s.startingPlayer);
  const ranked = s.players
    .map((p, i) => ({
      p,
      order: (i - starterIdx + s.players.length) % s.players.length,
      total: colorTotal(p.hometown),
    }))
    .sort((a, b) => b.total - a.total || a.order - b.order);
  s.startingPlayer = ranked[0]!.p.id;
  s.round = (s.round + 1) as 1 | 2 | 3;

  // Reshuffle modifier deck.
  const { items: mods, rngState } = shuffle(buildModifierDeck(), s.rngState);
  s.modifierDeck = mods;
  s.rngState = rngState;

  // Deal new hands (remaining deck). Rare case handled: deal as many as possible equally.
  const baseHand = s.players.length === 4 ? 5 : 6;
  const total = s.players.length * baseHand;
  const handSize =
    s.deck.length >= total ? baseHand : Math.floor(s.deck.length / s.players.length);

  const pool: Record<PlayerId, Card[]> = {};
  const picks: Record<PlayerId, Card[]> = {};
  let cursor = 0;
  for (const p of s.players) {
    pool[p.id] = s.deck.slice(cursor, cursor + handSize);
    picks[p.id] = [];
    cursor += handSize;
  }
  s.deck = s.deck.slice(cursor);
  s.phase = { kind: "draft", handsPassed: 0, picks, pool };
  s.currentPlayer = s.startingPlayer;
  s.log.push(`Round ${s.round} starts. Starting player: ${s.startingPlayer}.`);
  return s;
}

