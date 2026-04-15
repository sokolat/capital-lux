import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { useState } from "react";
import { store } from "../store.js";

export function Setup() {
  const [count, setCount] = useState<2 | 3 | 4>(2);
  const [names, setNames] = useState<string[]>(["Alice", "Bob", "Carol", "Dan"]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [started, setStarted] = useState(false);

  useInput((input, key) => {
    if (started) return;
    if (key.tab) setActiveIdx((i) => (i + 1) % count);
    if (key.ctrl && input === "2") setCount(2);
    if (key.ctrl && input === "3") setCount(3);
    if (key.ctrl && input === "4") setCount(4);
    if (key.return && activeIdx === count - 1) {
      setStarted(true);
      store.newGame(
        Math.floor(Math.random() * 2 ** 31),
        names.slice(0, count),
      );
    }
  });

  return (
    <Box flexDirection="column" paddingX={2}>
      <Text>Players: <Text color="cyan">{count}</Text>  <Text color="gray">(ctrl+2/3/4)</Text></Text>
      <Box marginTop={1} flexDirection="column">
        {Array.from({ length: count }).map((_, i) => (
          <Box key={i}>
            <Text color={i === activeIdx ? "magenta" : "gray"}>{i === activeIdx ? "▶ " : "  "}P{i + 1}: </Text>
            {i === activeIdx ? (
              <TextInput
                value={names[i] ?? ""}
                onChange={(v) => setNames((prev) => prev.map((n, j) => (j === i ? v : n)))}
                onSubmit={() => setActiveIdx((i) => (i + 1) % count)}
              />
            ) : (
              <Text>{names[i]}</Text>
            )}
          </Box>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text color="gray">[tab] next · [enter on last] start</Text>
      </Box>
    </Box>
  );
}
