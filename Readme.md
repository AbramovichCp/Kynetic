# Kinetic

A modern React application for generating images and videos with **kinetic text animation** effects.

Turn words and short phrases into expressive animated compositions where individual letters scatter across the screen, then converge to form a target word silhouette — creating a mesmerising particle-based typography effect.

## Tech Stack

- **React 18+** (Vite, TypeScript)
- **Tailwind CSS v4** + **shadcn/ui** components
- **HTML5 Canvas** — pure Canvas API with `requestAnimationFrame`
- **MediaRecorder API** — export animations as WebM video

## Features

- Real-time canvas animation with configurable particle physics
- Background letters drift chaotically; duplicates fly to form a target word silhouette
- Settings panel for live adjustment of text, font, speed, jitter, density, and phase timing
- Resolution presets (720p / 1080p / 1440p / 2160p) with one-click video export
- Modular architecture: animation engine separated from UI via custom hooks

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to see the app.
