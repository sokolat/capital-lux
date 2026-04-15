import { useState } from "react";
import { useGame } from "../store.js";

export function Setup() {
  const newGame = useGame((s) => s.newGame);
  const [names, setNames] = useState(["Alice", "Bob"]);

  return (
    <div className="screen setup">
      <h1>Capital Lux</h1>
      <p className="subtitle">2-player hotseat</p>
      <div className="inputs">
        {names.map((n, i) => (
          <input
            key={i}
            value={n}
            onChange={(e) =>
              setNames((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))
            }
          />
        ))}
      </div>
      <button
        className="primary"
        onClick={() =>
          newGame(Math.floor(Math.random() * 2 ** 31), names.filter((n) => n.trim()))
        }
      >
        Start game
      </button>
    </div>
  );
}
