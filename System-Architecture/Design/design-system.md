# Design System — FertilityOS

## Overview

The FertilityOS design system is the single source of truth for all UI components, patterns, and visual standards across the platform. Built with Tailwind CSS and shadcn/ui.

Reference: See `branding-guidelines.md` for colors, typography, and voice/tone.

---

## Component Library

### Buttons

```tsx
// Primary
<button className="px-4 py-2 bg-blue-700 text-white rounded-xl font-semibold hover:bg-blue-800">
  Primary Action
</button>

// Secondary
<button className="px-4 py-2 border-2 border-slate-200 text-slate-800 rounded-xl font-semibold hover:border-blue-300">
  Secondary Action
</button>

// Danger
<button className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600">
  Destructive Action
</button>
```

### Form Inputs

```tsx
<input
  type="text"
  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
/>
```

### Cards

```tsx
// Standard card
<div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
  {/* content */}
</div>

// Highlighted card
<div className="bg-white rounded-2xl border-2 border-blue-400 ring-2 ring-blue-100 shadow-lg p-6">
  {/* content */}
</div>
```

### Badges / Pills

```tsx
// Info
<span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
  Core
</span>

// Success
<span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-semibold">
  Active
</span>

// Warning
<span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
  Pending
</span>
```

---

## Spacing & Layout

All pages use the max-width container:
```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {/* content */}
</div>
```

Section vertical padding: `py-24` (top and bottom sections), `py-16` (tighter sections).

---

## Color Usage in Components

| Component | Background | Text | Border |
|---|---|---|---|
| Page background | `bg-white` or `bg-slate-50` | `text-slate-900` | — |
| Primary section (dark) | `bg-slate-900` | `text-white` | — |
| Card | `bg-white` | `text-slate-900` | `border-slate-200` |
| Navbar | `bg-white/90` (frosted) | `text-slate-900` | `border-slate-200` |
| Footer | `bg-slate-900` | `text-white` | — |
| Alert / Info | `bg-blue-50` | `text-blue-800` | `border-blue-200` |
| Alert / Success | `bg-teal-50` | `text-teal-800` | `border-teal-200` |
| Alert / Warning | `bg-amber-50` | `text-amber-800` | `border-amber-200` |
| Alert / Error | `bg-red-50` | `text-red-800` | `border-red-200` |

---

## Icon Usage

- Library: **Lucide React** (`lucide-react`)
- Default size: `w-5 h-5` (20px)
- Stroke width: default (`strokeWidth={2}`)
- In buttons: `w-4 h-4` with `gap-2`
- In feature cards: `w-5 h-5` or `w-6 h-6`

---

## Accessibility Standards

- All interactive elements must have visible focus states
- Color contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- All form inputs must have associated `<label>` elements
- Images must have meaningful `alt` text
- Navigation landmarks: `<header>`, `<main>`, `<footer>`, `<nav>`
- Keyboard navigable throughout

---

## Animation & Motion

- Hover transforms: `hover:-translate-y-0.5` (subtle lift)
- Transitions: `transition-all` or `transition-colors` (150ms default)
- Loading states: skeleton screens (not spinners) for content areas
- Avoid animations that could trigger vestibular disorders (`prefers-reduced-motion`)
