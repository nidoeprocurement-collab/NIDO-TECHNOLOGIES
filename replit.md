# NIDO Procurement Platform

A modern procurement management frontend built with React, TypeScript, and Vite.

## How to run

The app starts automatically via the **Start application** workflow, which runs:

```bash
npm run dev
```

The dev server listens on port **5000** and is accessible in the Replit preview pane.

## Tech stack

- React 18 + TypeScript
- Vite (bundler)
- React Router v6
- Tailwind CSS + Radix UI (shadcn/ui)
- Recharts (charts), jsPDF (PDF export), Framer Motion (animations)

## Project structure

```
src/
├── components/
│   ├── layout/      # Sidebar, top bar, navigation
│   ├── ui/          # Reusable shadcn/ui components
│   └── shared/      # Shared utilities
├── pages/           # One component per route
├── contexts/        # React contexts
├── store/           # Global state
└── App.tsx          # Root component + routing
```

## User preferences

- Keep the existing project structure and dark-themed UI.
