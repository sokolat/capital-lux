import type { Color } from "@capital-lux/engine";
import { capitalTotalsByColor, colorTotal, COLORS } from "@capital-lux/engine";
import { useGame } from "../store.js";

export function RoundEnd() {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  if (game.phase.kind !== "roundEnd") return null;
  const caps = capitalTotalsByColor(game);

  return (
    <div className="screen roundEnd">
      <h2>Round {game.round} — end</h2>
      {game.players.map((p) => {
        const excess = game.phase.kind === "roundEnd" ? game.phase.pendingDiscards[p.id] ?? [] : [];
        return (
          <div key={p.id} className="player-resolve">
            <h3>
              {p.id} — gold {p.gold}
            </h3>
            <table>
              <thead>
                <tr>
                  <th>Color</th>
                  <th>Capital</th>
                  <th>Hometown</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {COLORS.map((c: Color) => {
                  const home = colorTotal(p.hometown.filter((x) => x.color === c));
                  const diff = home - caps[c];
                  const isExcess = excess.includes(c);
                  return (
                    <tr key={c}>
                      <td>{c}</td>
                      <td>{caps[c]}</td>
                      <td>{home}</td>
                      <td>
                        {isExcess ? (
                          <>
                            Excess {diff}.{" "}
                            {p.gold >= diff && (
                              <button
                                onClick={() =>
                                  dispatch({
                                    type: "SPEND_GOLD",
                                    player: p.id,
                                    color: c,
                                    amount: diff,
                                  })
                                }
                              >
                                Spend {diff} gold
                              </button>
                            )}
                          </>
                        ) : (
                          "ok"
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <button
              onClick={() =>
                dispatch({ type: "SKIP_DISCARD_RESOLUTION", player: p.id })
              }
            >
              Resolve (discard excess)
            </button>
          </div>
        );
      })}
      <button className="primary" onClick={() => dispatch({ type: "ADVANCE" })}>
        Advance to next phase
      </button>
    </div>
  );
}
