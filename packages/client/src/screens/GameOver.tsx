import { scoreGame, winner } from "@capital-lux/engine";
import { useGame } from "../store.js";

export function GameOver() {
  const game = useGame((s) => s.game)!;
  const reset = useGame((s) => s.reset);
  const scores = scoreGame(game);
  const winners = winner(game);

  return (
    <div className="screen gameOver">
      <h2>Game over</h2>
      <h3>Winner{winners.length > 1 ? "s (tied)" : ""}: {winners.join(", ")}</h3>
      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Hometown</th>
            <th>Bonus</th>
            <th>Gold</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(scores).map(([id, s]) => (
            <tr key={id}>
              <td>{id}</td>
              <td>{s.hometown}</td>
              <td>{s.bonus}</td>
              <td>{s.gold}</td>
              <td>
                <strong>{s.total}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={reset}>New game</button>
    </div>
  );
}
