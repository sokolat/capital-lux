import { useGame } from "./store.js";
import { Setup } from "./screens/Setup.js";
import { Draft } from "./screens/Draft.js";
import { Play } from "./screens/Play.js";
import { RoundEnd } from "./screens/RoundEnd.js";
import { GameOver } from "./screens/GameOver.js";
import { Handoff } from "./screens/Handoff.js";

export function App() {
  const game = useGame((s) => s.game);
  const handoff = useGame((s) => s.handoff);

  if (!game) return <Setup />;
  if (handoff) return <Handoff />;

  switch (game.phase.kind) {
    case "draft":
      return <Draft />;
    case "play":
      return <Play />;
    case "roundEnd":
      return <RoundEnd />;
    case "gameOver":
      return <GameOver />;
  }
}
