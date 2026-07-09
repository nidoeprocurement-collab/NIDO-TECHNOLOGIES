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

## Design system

The full font/color/spacing/component spec lives in **STYLE_GUIDE.md**, sourced
from `attached_assets/Font_and_styles_for_Nido_Tech_1783617058230.docx`. All new
UI (current and future) must follow it — use the `.text-*` typography utilities
and Tailwind color tokens defined in `src/index.css` / `tailwind.config.js`
rather than hardcoding fonts, sizes, or hex colors.

## User preferences

- Keep the existing project structure and dark-themed UI.
- Follow STYLE_GUIDE.md (Inter/Poppins fonts, enterprise blue palette, 8pt spacing) for all UI work, now and in future.
