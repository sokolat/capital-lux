import type { Card, Color } from "@capital-lux/engine";

const labels: Record<Color, string> = {
  blue: "Agent",
  pink: "Cleric",
  green: "Scholar",
  yellow: "Merchant",
};

export function CardView({ card }: { card: Card }) {
  return (
    <div className={`card card-${card.color}`}>
      <div className="value">{card.value}</div>
      <div className="name">{labels[card.color]}</div>
    </div>
  );
}
