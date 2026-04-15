import { useGame } from "../store.js";

export function Handoff() {
  const continueAfter = useGame((s) => s.continueAfterHandoff);
  const game = useGame((s) => s.game)!;
  const nextPlayer = game.currentPlayer;
  return (
    <div className="screen handoff">
      <h2>Pass device to {nextPlayer}</h2>
      <button className="primary" onClick={continueAfter}>
        I am {nextPlayer} — continue
      </button>
    </div>
  );
}
