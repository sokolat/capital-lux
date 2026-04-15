import { Box, Text } from "ink";
import type { Card, Color } from "@capital-lux/engine";

export const COLOR_HEX: Record<Color, string> = {
  blue: "cyan",
  pink: "magenta",
  green: "green",
  yellow: "yellow",
};

const LABEL: Record<Color, string> = {
  blue: "AGENT",
  pink: "CLERIC",
  green: "SCHOLAR",
  yellow: "MERCH",
};

export function CardView({
  card,
  selected,
  dim,
}: {
  card: Card;
  selected?: boolean;
  dim?: boolean;
}) {
  const color = COLOR_HEX[card.color];
  return (
    <Box
      borderStyle={selected ? "double" : "round"}
      borderColor={selected ? "yellow" : color}
      width={10}
      height={5}
      flexDirection="column"
      paddingX={1}
    >
      <Text color={color} bold dimColor={dim ?? false}>
        {card.value}
      </Text>
      <Text color={color} dimColor={dim ?? false}>
        {LABEL[card.color]}
      </Text>
    </Box>
  );
}

export function CardBack() {
  return (
    <Box
      borderStyle="round"
      borderColor="gray"
      width={10}
      height={5}
      flexDirection="column"
      paddingX={1}
    >
      <Text color="gray">░▒░▒</Text>
      <Text color="gray">▒░▒░</Text>
    </Box>
  );
}
