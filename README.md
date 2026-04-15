# Capital Lux

Web implementation of **Capital Lux** (Aporta Games, 2016) — 2-4 player card game.

## MVP status

- ✅ Pure TS rules engine (`packages/engine`)
- ✅ 2-player hotseat React client (`packages/client`)
- ⏳ Socket.IO online multiplayer (planned)

## Stack

- pnpm workspaces · TypeScript strict
- React 18 + Vite + Zustand
- Vitest

## Dev

```sh
pnpm install
pnpm test        # engine unit tests
pnpm typecheck
pnpm dev         # http://localhost:5173
```

## Layout

```
packages/
  engine/   pure reducer, no DOM/network. Reused by client & (future) server.
  client/   Vite + React hotseat UI.
```

Engine public API: `createGame`, `reduce`, `scoreGame`, `winner`, `capitalTotalsByColor`, `legalActions`.

## Credits

Game design: Eilif Svensson & Kristian Amundsen Østby · Aporta Games · 2016.
This is an unofficial fan implementation.
