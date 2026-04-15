import { Box, Text, useInput } from "ink";
import { useState } from "react";
import {
  COLORS,
  capitalTotalsByColor,
  colorTotal,
  type Card,
  type Color,
  type PlayerState,
} from "@capital-lux/engine";
import { store, useStore } from "../store.js";
import { CardView, CardBack, COLOR_HEX } from "../components/CardView.js";

type Mode =
  | { kind: "hand"; cursor: number }
  | { kind: "dest" }
  | { kind: "clericColor" }
  | { kind: "agentColor" };

export function Play() {
  const { game } = useStore();
  const [mode, setMode] = useState<Mode>({ kind: "hand", cursor: 0 });
  const [pending, setPending] = useState<Card | null>(null);
  const [colorCursor, setColorCursor] = useState(0);

  if (!game || game.phase.kind !== "play") return null;
  const me = game.players.find((p) => p.id === game.currentPlayer)!;
  const caps = capitalTotalsByColor(game);

  const playCard = (card: Card, dest: "capital" | "hometown") => {
    if (dest === "hometown") {
      store.dispatch({ type: "PLAY_TO_HOMETOWN", player: me.id, cardId: card.id });
      store.requestHandoff();
      setMode({ kind: "hand", cursor: 0 });
      return;
    }
    if (card.color === "pink") {
      setPending(card);
      setColorCursor(0);
      setMode({ kind: "clericColor" });
      return;
    }
    if (card.color === "blue") {
      setPending(card);
      setColorCursor(0);
      setMode({ kind: "agentColor" });
      return;
    }
    store.dispatch({ type: "PLAY_TO_CAPITAL", player: me.id, cardId: card.id });
    store.requestHandoff();
    setMode({ kind: "hand", cursor: 0 });
  };

  useInput((inp, key) => {
    if (mode.kind === "hand") {
      if (key.leftArrow) setMode({ kind: "hand", cursor: (mode.cursor - 1 + me.hand.length) % me.hand.length });
      if (key.rightArrow) setMode({ kind: "hand", cursor: (mode.cursor + 1) % me.hand.length });
      if (key.return || inp === " ") setMode({ kind: "dest" });
      return;
    }
    if (mode.kind === "dest") {
      const card = me.hand[(mode as any).cursor ?? 0] ?? me.hand[0];
      if (!card) return;
      if (inp === "h") playCard(card, "hometown");
      if (inp === "c") playCard(card, "capital");
      if (key.escape) setMode({ kind: "hand", cursor: 0 });
      return;
    }
    if (mode.kind === "clericColor" || mode.kind === "agentColor") {
      const opts: Color[] =
        mode.kind === "clericColor" ? ["blue", "green", "yellow"] : ["blue", "pink", "green", "yellow"];
      if (key.leftArrow) setColorCursor((c) => (c - 1 + opts.length) % opts.length);
      if (key.rightArrow) setColorCursor((c) => (c + 1) % opts.length);
      if (key.escape) {
        setPending(null);
        setMode({ kind: "hand", cursor: 0 });
      }
      if (key.return || inp === " ") {
        if (!pending) return;
        const chosen = opts[colorCursor]!;
        if (mode.kind === "clericColor") {
          if (game.capital.cards[chosen].length === 0) return;
          store.dispatch({
            type: "PLAY_TO_CAPITAL",
            player: me.id,
            cardId: pending.id,
            clericTakeColor: chosen as Exclude<Color, "pink">,
          });
        } else {
          store.dispatch({
            type: "PLAY_TO_CAPITAL",
            player: me.id,
            cardId: pending.id,
            agentPlaceAboveColor: chosen,
          });
        }
        setPending(null);
        store.requestHandoff();
        setMode({ kind: "hand", cursor: 0 });
      }
    }
  });

  // Layout: N seat, then row [W | capital | E], then S seat.
  const seats = {
    south: game.players[0],
    north: game.players[1],
    east: game.players[2],
    west: game.players[3],
  } as const;

  return (
    <Box flexDirection="column">
      <StatusBar game={game} me={me} />

      {seats.north && <Seat player={seats.north} isActive={seats.north.id === me.id} side="N" />}

      <Box>
        <Box flexGrow={1} justifyContent="flex-end">
          {seats.west && <Seat player={seats.west} isActive={seats.west.id === me.id} side="W" />}
        </Box>
        <CapitalView game={game} caps={caps} />
        <Box flexGrow={1}>
          {seats.east && <Seat player={seats.east} isActive={seats.east.id === me.id} side="E" />}
        </Box>
      </Box>

      {seats.south && <Seat player={seats.south} isActive={seats.south.id === me.id} side="S" />}

      <HandStrip me={me} mode={mode} />

      {(mode.kind === "clericColor" || mode.kind === "agentColor") && (
        <ColorPicker
          mode={mode.kind}
          cursor={colorCursor}
          caps={game.capital.cards}
        />
      )}

      <Footer mode={mode} />
    </Box>
  );
}

function StatusBar({
  game,
  me,
}: {
  game: ReturnType<typeof useStore>["game"] & object;
  me: PlayerState;
}) {
  return (
    <Box paddingX={1}>
      <Text>
        round <Text color="cyan">{game.round}/3</Text>
        {"  "}deck <Text color="cyan">{game.deck.length}</Text>
        {"  "}gold pool <Text color="yellow">{game.goldPool}</Text>
        {"  ·  "}
        <Text color="magenta" bold>
          {me.id}
        </Text>{" "}
        turn · gold <Text color="yellow">{me.gold}</Text>
      </Text>
    </Box>
  );
}

function CapitalView({
  game,
  caps,
}: {
  game: ReturnType<typeof useStore>["game"] & object;
  caps: Record<Color, number>;
}) {
  return (
    <Box
      borderStyle="double"
      borderColor="magenta"
      flexDirection="column"
      paddingX={1}
      flexShrink={0}
    >
      <Text color="magenta" bold>
        ▓ CAPITAL ▓
      </Text>
      <Box gap={1} marginTop={1}>
        {COLORS.map((c) => (
          <Box key={c} flexDirection="column" borderStyle="single" borderColor={COLOR_HEX[c]} paddingX={1}>
            <Text color={COLOR_HEX[c]} bold>
              {c.padEnd(6)} {caps[c]}
              {game.capital.modifiers[c].length > 0 && (
                <Text color="yellow"> +{game.capital.modifiers[c].length}?</Text>
              )}
            </Text>
            <Box flexDirection="column">
              {game.capital.cards[c].length === 0 ? (
                <Text dimColor>—</Text>
              ) : (
                <Text>
                  {game.capital.cards[c].map((x) => x.value).join(" ")}
                </Text>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function Seat({
  player,
  isActive,
  side,
}: {
  player: PlayerState;
  isActive: boolean;
  side: "N" | "S" | "E" | "W";
}) {
  return (
    <Box
      borderStyle={isActive ? "double" : "round"}
      borderColor={isActive ? "magenta" : "cyan"}
      paddingX={1}
      flexDirection="column"
      marginY={0}
    >
      <Text>
        <Text color="cyan">[{side}]</Text>{" "}
        <Text bold color={isActive ? "magenta" : "white"}>
          {player.id}
        </Text>
        <Text color="gray">
          {"  "}gold <Text color="yellow">{player.gold}</Text> · hand{" "}
          {isActive ? player.hand.length : `${player.hand.length}?`}
        </Text>
      </Text>
      <Box>
        <Text dimColor>HT </Text>
        {player.hometown.length === 0 ? (
          <Text dimColor>empty</Text>
        ) : (
          <Text>
            {COLORS.map((c) => {
              const cards = player.hometown.filter((x) => x.color === c);
              if (cards.length === 0) return null;
              const total = colorTotal(cards);
              return (
                <Text key={c}>
                  <Text color={COLOR_HEX[c]}>
                    {" "}
                    {c[0]!.toUpperCase()}:{cards.map((x) => x.value).join(",")}({total})
                  </Text>
                </Text>
              );
            })}
          </Text>
        )}
      </Box>
    </Box>
  );
}

function HandStrip({ me, mode }: { me: PlayerState; mode: Mode }) {
  const cursor = mode.kind === "hand" ? mode.cursor : -1;
  return (
    <Box flexDirection="column" marginTop={1}>
      <Text color="cyan" bold>
        ═══ YOUR HAND ═══
      </Text>
      <Box gap={1}>
        {me.hand.map((c, i) => (
          <Box key={c.id} flexDirection="column" alignItems="center">
            <CardView card={c} selected={i === cursor} />
            <Text color={i === cursor ? "yellow" : "gray"}>
              {i === cursor ? "▲" : " "}
            </Text>
          </Box>
        ))}
        {me.hand.length === 0 && <Text dimColor>hand empty</Text>}
      </Box>
    </Box>
  );
}

function ColorPicker({
  mode,
  cursor,
  caps,
}: {
  mode: "clericColor" | "agentColor";
  cursor: number;
  caps: Record<Color, Card[]>;
}) {
  const opts: Color[] =
    mode === "clericColor" ? ["blue", "green", "yellow"] : ["blue", "pink", "green", "yellow"];
  return (
    <Box borderStyle="round" borderColor="yellow" paddingX={1} flexDirection="column" marginTop={1}>
      <Text color="yellow" bold>
        {mode === "clericColor" ? "Cleric: take lowest from…" : "Agent: modifier above…"}
      </Text>
      <Box gap={2}>
        {opts.map((c, i) => {
          const count = caps[c].length;
          const disabled = mode === "clericColor" && count === 0;
          return (
            <Text
              key={c}
              color={i === cursor ? "yellow" : COLOR_HEX[c]}
              dimColor={disabled}
              bold={i === cursor}
            >
              {i === cursor ? "▶ " : "  "}
              {c}
              {mode === "clericColor" && ` (${count})`}
            </Text>
          );
        })}
      </Box>
      <Text color="gray">[←/→] choose · [enter] confirm · [esc] cancel</Text>
    </Box>
  );
}

function Footer({ mode }: { mode: Mode }) {
  let hint = "";
  if (mode.kind === "hand") hint = "[←/→] select card · [enter/space] continue";
  if (mode.kind === "dest") hint = "[h] → hometown · [c] → capital · [esc] back";
  return (
    <Box marginTop={1} paddingX={1}>
      <Text color="gray">{hint}</Text>
    </Box>
  );
}
