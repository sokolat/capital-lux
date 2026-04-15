import { Box, Text, useInput } from "ink";
import { useState } from "react";
import { store, useStore } from "../store.js";
import { CardView } from "../components/CardView.js";

export function Draft() {
  const { game, draftPicks } = useStore();
  const [cursor, setCursor] = useState(0);

  if (!game || game.phase.kind !== "draft") return null;
  const phase = game.phase;

  // Find next player who still needs to pick this round.
  const expected = (phase.handsPassed + 1) * 2;
  const activePlayer = game.players.find(
    (p) => (phase.picks[p.id] ?? []).length < expected,
  );

  useInput((inp, key) => {
    if (!activePlayer) return;
    const pool = phase.pool[activePlayer.id] ?? [];
    if (key.leftArrow) setCursor((c) => (c - 1 + pool.length) % pool.length);
    if (key.rightArrow) setCursor((c) => (c + 1) % pool.length);
    if (inp === " ") {
      const card = pool[cursor];
      if (card) store.toggleDraftPick(activePlayer.id, card.id);
    }
    if (key.return) {
      const picks = draftPicks[activePlayer.id] ?? [];
      if (picks.length === 2) {
        store.submitDraftPick(activePlayer.id);
        setCursor(0);
      }
    }
  });

  if (!activePlayer) {
    return <Text color="gray">drafting…</Text>;
  }

  const pool = phase.pool[activePlayer.id] ?? [];
  const picks = draftPicks[activePlayer.id] ?? [];

  return (
    <Box flexDirection="column" paddingX={2}>
      <Text>
        Draft · round <Text color="cyan">{game.round}</Text> · pass{" "}
        <Text color="cyan">{phase.handsPassed + 1}</Text>/2
      </Text>
      <Text>
        <Text color="magenta" bold>
          {activePlayer.id}
        </Text>
        : pick 2 ({picks.length}/2)
      </Text>
      <Box marginTop={1} gap={1}>
        {pool.map((c, i) => (
          <Box key={c.id} flexDirection="column" alignItems="center">
            <CardView card={c} selected={picks.includes(c.id)} />
            <Text color={i === cursor ? "yellow" : "gray"}>
              {i === cursor ? "▲" : " "}
            </Text>
          </Box>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text color="gray">
          [←/→] move · [space] toggle · [enter] confirm
        </Text>
      </Box>
    </Box>
  );
}

