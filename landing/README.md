# Matefet Landing Page

Marketing landing page for Matefet — built with Next.js 15 as a static export.

## Stack

- **Next.js 15** (static export)
- **React 19** + **Tailwind CSS v4**
- **Framer Motion** (`motion`) — scroll animations
- **Three.js** + `@react-three/fiber` — 3D hero element
- **Lucide React** — icons

## Getting Started

```bash
npm install
npm run dev       # http://localhost:3001
npm run build     # static export → out/
```

## Deployment

The `out/` directory is deployed as a static site:

- **Azure**: Static Web App (Free tier)
- **Render**: Static site (see root `render.yaml`)

## Structure

```
src/
├── app/
│   ├── layout.tsx      → RTL + Heebo font
│   ├── page.tsx        → All sections composed here
│   └── globals.css     → Design tokens + animations
├── components/
│   ├── Navbar.tsx      → Sticky nav + hamburger menu
│   ├── Hero.tsx        → Hero section + 3D background
│   ├── Stats.tsx       → Animated counter stats
│   ├── Features.tsx    → 8 feature cards
│   ├── HowItWorks.tsx  → 3-step process
│   ├── Compliance.tsx  → Compliance checklist
│   ├── CTA.tsx         → Call to action
│   ├── Footer.tsx      → Footer links
│   └── ui/             → ScrollReveal, ParallaxLayer, GradientBlob
└── lib/
    └── constants.ts    → All Hebrew content + APP_URL
```
