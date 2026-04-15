import { Box, Text, useInput } from "ink";
import { useState } from "react";
import {
  COLORS,
  capitalTotalsByColor,
  colorTotal,
  type Color,
} from "@capital-lux/engine";
import { store, useStore } from "../store.js";
import { COLOR_HEX } from "../components/CardView.js";

export function RoundEnd() {
  const { game } = useStore();
  const [idx, setIdx] = useState(0);

  if (!game || game.phase.kind !== "roundEnd") return null;
  const caps = capitalTotalsByColor(game);
  const p = game.players[idx]!;
  const excess = game.phase.pendingDiscards[p.id] ?? [];

  useInput((inp, key) => {
    if (key.tab) setIdx((i) => (i + 1) % game.players.length);
    if (inp === "r") {
      store.dispatch({ type: "SKIP_DISCARD_RESOLUTION", player: p.id });
    }
    if (inp >= "1" && inp <= "4") {
      const c = (["blue", "pink", "green", "yellow"] as Color[])[
        Number(inp) - 1
      ]!;
      if (excess.includes(c)) {
        const home = colorTotal(p.hometown.filter((x) => x.color === c));
        const diff = home - caps[c];
        if (diff > 0 && p.gold >= diff) {
          store.dispatch({
            type: "SPEND_GOLD",
            player: p.id,
            color: c,
            amount: diff,
          });
        }
      }
    }
    if (key.return) store.dispatch({ type: "ADVANCE" });
  });

  return (
    <Box flexDirection="column" paddingX={2}>
      <Text color="magenta" bold>
        ══ Round {game.round} end — resolve discards ══
      </Text>
      <Box marginTop={1}>
        <Text>
          Player ({idx + 1}/{game.players.length}):{" "}
          <Text color="magenta" bold>
            {p.id}
          </Text>{" "}
          · gold <Text color="yellow">{p.gold}</Text>
        </Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {COLORS.map((c, i) => {
          const home = colorTotal(p.hometown.filter((x) => x.color === c));
          const diff = home - caps[c];
          const isExcess = excess.includes(c);
          return (
            <Text key={c} color={COLOR_HEX[c]}>
              [{i + 1}] {c.padEnd(7)} capital {String(caps[c]).padStart(3)} vs home{" "}
              {String(home).padStart(3)}
              {"  "}
              {isExcess ? (
                <Text color="red">
                  OVER by {diff}
                  {p.gold >= diff && <Text color="yellow"> (press {i + 1} to spend {diff} gold)</Text>}
                </Text>
              ) : (
                <Text color="gray">ok</Text>
              )}
            </Text>
          );
        })}
      </Box>
      <Box marginTop={1}>
        <Text color="gray">
          [1-4] spend gold · [r] resolve (discard excess) · [tab] next player · [enter] advance round
        </Text>
      </Box>
    </Box>
  );
}
