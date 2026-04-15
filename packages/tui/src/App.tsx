import { Box, Text } from "ink";
import { useStore } from "./store.js";
import { Setup } from "./screens/Setup.js";
import { Draft } from "./screens/Draft.js";
import { Play } from "./screens/Play.js";
import { RoundEnd } from "./screens/RoundEnd.js";
import { GameOver } from "./screens/GameOver.js";
import { Handoff } from "./screens/Handoff.js";

export function App() {
  const { game, handoff } = useStore();

  return (
    <Box flexDirection="column">
      <Header />
      {!game && <Setup />}
      {game && handoff && <Handoff />}
      {game && !handoff && game.phase.kind === "draft" && <Draft />}
      {game && !handoff && game.phase.kind === "play" && <Play />}
      {game && !handoff && game.phase.kind === "roundEnd" && <RoundEnd />}
      {game && !handoff && game.phase.kind === "gameOver" && <GameOver />}
    </Box>
  );
}

function Header() {
  return (
    <Box
      borderStyle="round"
      borderColor="magenta"
      paddingX={1}
      marginBottom={1}
    >
      <Text bold color="magenta">
        ░▒▓█ CAPITAL LUX █▓▒░
      </Text>
      <Text color="gray"> · terminal edition</Text>
    </Box>
  );
}
