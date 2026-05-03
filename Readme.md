# Kinetic

## Why this exists.

My wife hit a wall trying to create custom animations. Every tool she found fell into two camps: After Effects extensions that were powerful but hard to bend into exactly what she needed (even after a lot of setup), or brittle custom scripts that barely responded to tweaking. Building something focused and straightforward looked like the shorter path — so this project exists.\n+\n+And yes, she ended up using just one animation exactly once in her work — but at that point I was already having too much fun, so I kept experimenting and expanding the playground with more customizable animations.

A modern React application for generating images and videos with **kinetic text animation** effects.

Turn words and short phrases into expressive animated compositions where individual letters scatter across the screen, then converge to form a target word silhouette — creating a mesmerising particle-based typography effect.

## Features

- **Several animation styles** — presets are fully customizable and kept simple so you can iterate quickly and see results right away.
- **Background control** — swap the background to match your scene or brand.
- **Flexible video export** — render up to **4K**, or pick lower resolutions when you need smaller files or faster turnaround.
- Real-time canvas animation with configurable particle physics
- Background letters drift chaotically; duplicates fly to form a target word silhouette
- Settings panel for live adjustment of text, font, speed, jitter, density, and phase timing
- Resolution presets (720p / 1080p / 1440p / 2160p) with one-click video export
- Modular architecture: animation engine separated from UI via custom hooks

## Tech Stack

- **React 18+** (Vite, TypeScript)
- **Tailwind CSS v4** + **shadcn/ui** components
- **HTML5 Canvas** — pure Canvas API with `requestAnimationFrame`
- **MediaRecorder API** — export animations as WebM video

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to see the app.
