import type { Card } from "@capital-lux/engine";
import { useGame } from "../store.js";
import { CardView } from "../components/CardView.js";

export function Draft() {
  const game = useGame((s) => s.game)!;
  const picks = useGame((s) => s.draftPicks);
  const toggle = useGame((s) => s.toggleDraftPick);
  const submit = useGame((s) => s.submitDraftPick);
  if (game.phase.kind !== "draft") return null;
  const { pool } = game.phase;

  return (
    <div className="screen draft">
      <h2>Draft — round {game.round}</h2>
      <p>Each player selects 2 cards. Cards are hidden until your turn to pick.</p>
      {game.players.map((p) => {
        const myPool = pool[p.id] ?? [];
        const mine = picks[p.id] ?? [];
        const done = mine.length === 0 && !myPool.length;
        const hasAlreadyPicked =
          (game.phase.kind === "draft" &&
            game.phase.picks[p.id]!.length ===
              (game.phase.handsPassed + 1) * 2);
        return (
          <div key={p.id} className="draft-row">
            <h3>
              {p.id}
              {hasAlreadyPicked ? " ✓ waiting" : ""}
            </h3>
            {!hasAlreadyPicked && (
              <>
                <div className="cards">
                  {myPool.map((c: Card) => (
                    <div
                      key={c.id}
                      className={mine.includes(c.id) ? "picked" : ""}
                      onClick={() => toggle(p.id, c.id)}
                    >
                      <CardView card={c} />
                    </div>
                  ))}
                </div>
                <button
                  disabled={mine.length !== 2}
                  onClick={() => submit(p.id)}
                >
                  Confirm pick ({mine.length}/2)
                </button>
              </>
            )}
            {done && <em>waiting…</em>}
          </div>
        );
      })}
    </div>
  );
}
