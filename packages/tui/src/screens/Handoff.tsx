import { Box, Text, useInput } from "ink";
import { store, useStore } from "../store.js";

export function Handoff() {
  const { game } = useStore();
  useInput((_, key) => {
    if (key.return || key.tab) store.continueAfterHandoff();
  });
  if (!game) return null;
  return (
    <Box flexDirection="column" alignItems="center" paddingY={2}>
      <Text color="yellow" bold>
        ◎ Pass device to <Text color="magenta">{game.currentPlayer}</Text>
      </Text>
      <Box marginTop={1}>
        <Text color="gray">press [enter] when ready</Text>
      </Box>
    </Box>
  );
}
