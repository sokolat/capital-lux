import { useState } from "react";
import type { Card, Color, PlayerState } from "@capital-lux/engine";
import { capitalTotalsByColor, COLORS } from "@capital-lux/engine";
import { useGame } from "../store.js";
import { CardView } from "../components/CardView.js";

type Side = "south" | "north";
const DRAG_MIME = "application/x-capital-lux-card";

export function Play() {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const requestHandoff = useGame((s) => s.requestHandoff);
  const [pending, setPending] = useState<{ card: Card } | null>(null);
  const [dragCardId, setDragCardId] = useState<number | null>(null);

  const active = game.currentPlayer;
  const me = game.players.find((p) => p.id === active)!;
  const caps = capitalTotalsByColor(game);

  const south = game.players[0]!;
  const north = game.players[1] ?? null;

  const playCard = (card: Card, dest: "capital" | "hometown") => {
    if (dest === "hometown") {
      dispatch({ type: "PLAY_TO_HOMETOWN", player: active, cardId: card.id });
      requestHandoff();
      return;
    }
    if (card.color === "pink" || card.color === "blue") {
      setPending({ card });
      return;
    }
    dispatch({ type: "PLAY_TO_CAPITAL", player: active, cardId: card.id });
    requestHandoff();
  };

  const resolvePending = (color: Color) => {
    if (!pending) return;
    const base = { type: "PLAY_TO_CAPITAL" as const, player: active, cardId: pending.card.id };
    if (pending.card.color === "pink") {
      dispatch({ ...base, clericTakeColor: color as Exclude<Color, "pink"> });
    } else {
      dispatch({ ...base, agentPlaceAboveColor: color });
    }
    setPending(null);
    requestHandoff();
  };

  const cardFromDrag = (e: React.DragEvent): Card | null => {
    const raw = e.dataTransfer.getData(DRAG_MIME) || (dragCardId !== null ? String(dragCardId) : "");
    if (!raw) return null;
    const id = Number(raw);
    return me.hand.find((c) => c.id === id) ?? null;
  };

  return (
    <div className="table-ns">
      {north && (
        <div className="row row-north">
          <SeatView
            player={north}
            isActive={active === north.id}
            side="north"
            onPlay={playCard}
            onDragStart={setDragCardId}
            onDragEnd={() => setDragCardId(null)}
            dragCardId={dragCardId}
            cardFromDrag={cardFromDrag}
          />
        </div>
      )}

      <section className="row row-center">
        <div className={`capital-mid ${dragCardId !== null ? "drop-hint" : ""}`}>
          <div className="capital-header">
            <span>Capital</span>
            <span className="dim">Round {game.round} · Deck {game.deck.length} · Gold pool {game.goldPool}</span>
          </div>
          <div className="capital-colors">
            {COLORS.map((c) => {
              const dragCard = dragCardId !== null ? me.hand.find((x) => x.id === dragCardId) : null;
              const canDrop = dragCard ? dragCard.color === c : false;
              return (
                <div
                  key={c}
                  className={`cap-col cap-${c} ${canDrop ? "droppable" : ""}`}
                  onDragOver={(e) => {
                    if (canDrop) {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = "move";
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const card = cardFromDrag(e);
                    if (card && card.color === c) playCard(card, "capital");
                  }}
                >
                  <div className="cap-total">
                    <span className="cap-name">{c}</span>
                    <span className="cap-value">{caps[c]}</span>
                    {game.capital.modifiers[c].length > 0 && (
                      <span className="cap-mod">+{game.capital.modifiers[c].length}?</span>
                    )}
                  </div>
                  <div className="cards tight">
                    {game.capital.cards[c].map((card) => (
                      <CardView key={card.id} card={card} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="row row-south">
        <SeatView
          player={south}
          isActive={active === south.id}
          side="south"
          onPlay={playCard}
          onDragStart={setDragCardId}
          onDragEnd={() => setDragCardId(null)}
          dragCardId={dragCardId}
          cardFromDrag={cardFromDrag}
        />
      </div>

      {pending && (
        <div className="modal">
          <div className="modal-inner">
            {pending.card.color === "pink" ? (
              <>
                <h3>Cleric: take lowest from which color?</h3>
                {(["blue", "green", "yellow"] as const).map((c) => (
                  <button key={c} disabled={game.capital.cards[c].length === 0} onClick={() => resolvePending(c)}>
                    {c} ({game.capital.cards[c].length})
                  </button>
                ))}
              </>
            ) : (
              <>
                <h3>Agent: place modifier above which color?</h3>
                {COLORS.map((c) => (
                  <button key={c} onClick={() => resolvePending(c)}>{c}</button>
                ))}
              </>
            )}
            <button onClick={() => setPending(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

interface SeatProps {
  player: PlayerState;
  isActive: boolean;
  side: Side;
  onPlay: (c: Card, dest: "capital" | "hometown") => void;
  onDragStart: (cardId: number) => void;
  onDragEnd: () => void;
  dragCardId: number | null;
  cardFromDrag: (e: React.DragEvent) => Card | null;
}

function SeatView({
  player, isActive, side, onPlay, onDragStart, onDragEnd, dragCardId, cardFromDrag,
}: SeatProps) {
  const hometownDroppable = isActive && dragCardId !== null;
  return (
    <section className={`seat seat-${side} ${isActive ? "active" : ""}`}>
      <div className="seat-head">
        <strong>{player.id}</strong>
        {isActive && <span className="badge">turn</span>}
        <span className="dim">· gold {player.gold} · hand {player.hand.length}</span>
      </div>
      <div
        className={`seat-row ${hometownDroppable ? "droppable" : ""}`}
        onDragOver={(e) => {
          if (hometownDroppable) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }
        }}
        onDrop={(e) => {
          if (!isActive) return;
          e.preventDefault();
          const card = cardFromDrag(e);
          if (card) onPlay(card, "hometown");
        }}
      >
        <span className="label">HT</span>
        <div className="cards tight">
          {player.hometown.length === 0 && <em className="dim">drop here</em>}
          {player.hometown.map((c) => (
            <CardView key={c.id} card={c} />
          ))}
        </div>
      </div>
      <div className="seat-row hand">
        <span className="label">Hand</span>
        <div className="cards">
          {isActive
            ? player.hand.map((c) => (
                <div
                  key={c.id}
                  className={`hand-card ${dragCardId === c.id ? "dragging" : ""}`}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData(DRAG_MIME, String(c.id));
                    onDragStart(c.id);
                  }}
                  onDragEnd={onDragEnd}
                >
                  <CardView card={c} />
                  <div className="actions">
                    <button onClick={() => onPlay(c, "hometown")}>HT</button>
                    <button onClick={() => onPlay(c, "capital")}>Cap</button>
                  </div>
                </div>
              ))
            : player.hand.map((c) => <div key={c.id} className="card card-back" />)}
        </div>
      </div>
    </section>
  );
}
