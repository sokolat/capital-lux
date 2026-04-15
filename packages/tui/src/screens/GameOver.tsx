import { Box, Text, useInput, useApp } from "ink";
import { scoreGame, winner } from "@capital-lux/engine";
import { store, useStore } from "../store.js";

export function GameOver() {
  const { game } = useStore();
  const { exit } = useApp();
  useInput((inp) => {
    if (inp === "n") store.reset();
    if (inp === "q") exit();
  });
  if (!game) return null;
  const scores = scoreGame(game);
  const winners = winner(game);

  return (
    <Box flexDirection="column" paddingX={2}>
      <Text color="magenta" bold>
        ══════ GAME OVER ══════
      </Text>
      <Text color="yellow" bold>
        ★ Winner{winners.length > 1 ? "s (tied)" : ""}: {winners.join(", ")}
      </Text>
      <Box flexDirection="column" marginTop={1}>
        <Text color="cyan" bold>
          {"PLAYER".padEnd(14)} HT   BONUS  GOLD  TOTAL
        </Text>
        {Object.entries(scores).map(([id, s]) => (
          <Text key={id}>
            {id.padEnd(14)}
            {String(s.hometown).padStart(3)}  {String(s.bonus).padStart(4)}   {String(s.gold).padStart(3)}   <Text bold color="yellow">{s.total}</Text>
          </Text>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text color="gray">[n] new game · [q] quit</Text>
      </Box>
    </Box>
  );
}
