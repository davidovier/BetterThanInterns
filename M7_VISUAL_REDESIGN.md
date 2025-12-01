# M7 – Visual Redesign & UI Polish

**Status:** In Progress
**Started:** 2025-11-30
**Goal:** Transform the app from generic AI-generated starter to polished, premium SaaS product

## Design Principles

- Light, clean, airy theme
- Rich primary (blue/violet) + warm accent (amber/coral)
- Cards: rounded-2xl, subtle gradients, smooth shadows
- Modern typography: Inter/system fonts
- Smooth micro-interactions and animations
- Enterprise-grade polish for governance sections

---

## Sprint Breakdown

### Sprint 1: Foundation & Design System ✅ COMPLETE
**Estimated effort:** 30-45 min
**Files:** 3-5
**Actual time:** ~30 min

- [x] Update `tailwind.config.ts`
  - Add Inter font family
  - Extend colors: rich primary (brand), warm accent
  - Add custom shadows (soft, medium, strong)
  - Add custom border radius (2xl, 3xl)
  - Configure smooth transitions

- [x] Install framer-motion
  - `npm install framer-motion` ✅

- [x] Create `/src/components/layout/AppShell.tsx`
  - Left sidebar: logo + nav (Dashboard, Projects, Governance)
  - User dropdown with avatar in sidebar footer
  - Content area with pl-64 offset
  - Subtle radial gradient background
  - Active nav state highlighting

- [x] Create `/src/components/layout/PageHeader.tsx`
  - Reusable page title component
  - Breadcrumb support
  - Action buttons slot
  - Max-w-7xl container

- [x] Create `/src/components/layout/SectionCard.tsx`
  - Consistent card wrapper with gradient
  - Title, description, content slots
  - Empty state support
  - Hover transitions

- [x] Create supporting UI components
  - `/src/components/ui/avatar.tsx`
  - `/src/components/ui/dropdown-menu.tsx`
  - Install Radix UI dependencies

**Exit criteria:** ✅ Layout components working, build passes, ready to integrate

---

### Sprint 2: Landing & Pricing Pages ✅ COMPLETE
**Estimated effort:** 45-60 min
**Files:** 2
**Actual time:** ~40 min

- [x] Redesign `/src/app/page.tsx` (Landing)
  - Hero: headline + subheadline + 2 CTAs + product preview card
  - "How it works" section: 4 step cards with staggered animations
  - "Who it's for" section: 3 persona cards
  - Governance teaser: Registry → Risk → Policies timeline
  - CTA section + footer
  - Framer Motion: fade-in on scroll, hero slide-up

- [x] Redesign `/src/app/pricing/page.tsx`
  - 3 plan cards in centered container
  - Pro card: elevated with ring-2 ring-brand-400/60
  - Improve FAQ spacing and typography
  - Add animations on scroll

**Exit criteria:** ✅ Landing and pricing feel premium, animations smooth

---

### Sprint 3: Dashboard & Projects ✅ COMPLETE
**Estimated effort:** 45-60 min
**Files:** 2
**Actual time:** ~35 min

- [x] Polish `/src/app/(dashboard)/dashboard/page.tsx`
  - Wrap in AppShell
  - Quick actions row (New project, Demo project, Governance)
  - Enhanced zero-state card with gradient
  - Project cards: new style, metadata chips
  - Hover states and transitions

- [x] Polish `/src/app/(dashboard)/projects/[projectId]/page.tsx`
  - Use PageHeader component with breadcrumb and actions
  - Visually distinct nudge callouts (brand-50 gradient for "map process")
  - Group sections in SectionCards (Processes, Blueprints, AI Use Cases)
  - Consistent empty states
  - Smooth transitions

**Exit criteria:** ✅ Dashboard and project pages feel cohesive with new design system

---

### Sprint 4: Process Mapping (Hero UX) ✅ COMPLETE
**Estimated effort:** 60-90 min
**Files:** 1 complex file
**Actual time:** ~50 min

- [x] Redesign `/src/app/(dashboard)/projects/[projectId]/processes/[processId]/page.tsx`
  - 3-panel layout: Chat (30-35%) | Graph (45-50%) | Opportunities (20-25%)
  - Chat panel:
    - Bubble UI for messages (left/right alignment)
    - Sticky input bar with rounded-2xl input
    - Gradient backgrounds and shadow-soft polish
    - Animated warm hint callout for demo projects
  - Graph panel:
    - Clean background with no border
    - Top overlay chip: process name + step count + help icon
    - Bottom-right heatmap legend with impact levels
  - Right panel:
    - Mini opportunity cards with rounded-xl borders
    - Impact/effort badges with color coding
    - Match scores displayed
    - Clear hover/selected states with -translate-y-[1px]
  - Animations:
    - New messages fade-in and slide-in-from-bottom
    - Opportunities slide-in-from-right with staggered delay
    - Smooth transitions on all interactive elements

**Exit criteria:** ✅ Process mapping page is now the hero experience

---

### Sprint 5: Governance Pages ✅ COMPLETE
**Estimated effort:** 30-45 min
**Files:** 2
**Actual time:** ~35 min

- [x] Polish `/src/app/(dashboard)/governance/page.tsx`
  - Used PageHeader component
  - Grouped AI use cases by status with icons and dividers
  - Rounded-2xl cards with shadow-soft/medium
  - More restrained colors (outline variants, muted backgrounds)
  - Enterprise-grade polish with uppercase section labels
  - Enhanced zero-state with gradient icon

- [x] Polish `/src/app/(dashboard)/ai-use-cases/[aiUseCaseId]/page.tsx`
  - 2-column layout: Summary (2/5) | Risk/Policies (3/5)
  - Small uppercase heading labels throughout
  - Rounded-2xl cards with improved spacing
  - Gradient backgrounds on linked resources card
  - Status chips with outline variants
  - Hover effects on all buttons
  - Enterprise feel with restrained typography

**Exit criteria:** ✅ Governance pages feel enterprise-grade

---

### Sprint 6: Micro-interactions & Final Polish ✅ COMPLETE
**Estimated effort:** 30-45 min
**Files:** 2
**Actual time:** ~25 min

- [x] Polish demo page
  - Updated layout to max-w-7xl px-8 py-8
  - All cards: rounded-2xl shadow-soft hover:shadow-medium
  - Button hover effects (hover:-translate-y-[1px] hover:shadow-md)
  - Animated LLM response box
  - Checklist items with hover states
  - Consistent typography (text-xs for descriptions)

- [x] Polish blueprints detail page
  - Updated layout to max-w-7xl px-8 py-8
  - All cards: rounded-2xl border-border/60 bg-card shadow-soft hover:shadow-medium
  - Header with gradient icon background
  - All card titles: uppercase tracking-wide
  - Button hover effects
  - Enhanced opportunities with hover backgrounds
  - Table with hover row states
  - Consistent text sizing (text-xs for labels, text-sm for content)

- [x] Build verification passed

**Exit criteria:** ✅ All interactions feel smooth and premium, build passes

---

## Progress Tracking

### Completed Sprints
1. Sprint 1: Foundation & Design System ✅
2. Sprint 2: Landing & Pricing Pages ✅
3. Sprint 3: Dashboard & Projects ✅
4. Sprint 4: Process Mapping (Hero UX) ✅
5. Sprint 5: Governance Pages ✅
6. Sprint 6: Micro-interactions & Final Polish ✅

### Current Sprint
🎉 M7 - Visual Redesign COMPLETE!

### Blockers
*None*

---

## Files Modified (Running List)

### Config Files
- [x] `tailwind.config.ts` - Design system (Sprint 1)
- [x] `package.json` - Add framer-motion (Sprint 1)

### New Components
- [x] `src/components/layout/AppShell.tsx` (Sprint 1)
- [x] `src/components/layout/PageHeader.tsx` (Sprint 1)
- [x] `src/components/layout/SectionCard.tsx` (Sprint 1)
- [x] `src/components/ui/avatar.tsx` (Sprint 1)
- [x] `src/components/ui/dropdown-menu.tsx` (Sprint 1)

### Landing & Marketing
- [x] `src/app/page.tsx` - Landing redesign (Sprint 2)
- [x] `src/app/pricing/page.tsx` - Pricing redesign (Sprint 2)

### Dashboard & Projects
- [x] `src/app/(dashboard)/dashboard/page.tsx` - Dashboard polish (Sprint 3)
- [x] `src/app/(dashboard)/projects/[projectId]/page.tsx` - Project detail polish (Sprint 3)

### Process Mapping
- [x] `src/app/(dashboard)/projects/[projectId]/processes/[processId]/page.tsx` - Hero UX redesign (Sprint 4)

### Governance
- [x] `src/app/(dashboard)/governance/page.tsx` - Governance dashboard (Sprint 5)
- [x] `src/app/(dashboard)/ai-use-cases/[aiUseCaseId]/page.tsx` - Use case detail (Sprint 5)

### Polish & Testing
- [x] `src/app/(dashboard)/demo/page.tsx` - Demo page polish (Sprint 6)
- [x] `src/app/(dashboard)/projects/[projectId]/blueprints/[blueprintId]/page.tsx` - Blueprint detail polish (Sprint 6)

---

## Design Tokens

### Colors (to add to tailwind.config)
```typescript
colors: {
  // Rich primary (blue/violet)
  brand: {
    50: '#f0f4ff',
    100: '#e0e9ff',
    200: '#c7d7fe',
    300: '#a5b8fc',
    400: '#818cf8',
    500: '#6366f1',  // Primary
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  // Warm accent (amber)
  warm: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',  // Accent
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
}
```

### Typography
```typescript
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
}
```

### Shadows
```typescript
boxShadow: {
  'soft': '0 2px 8px 0 rgb(0 0 0 / 0.04)',
  'medium': '0 4px 16px 0 rgb(0 0 0 / 0.08)',
  'strong': '0 8px 24px 0 rgb(0 0 0 / 0.12)',
}
```

### Border Radius
```typescript
borderRadius: {
  '2xl': '1rem',
  '3xl': '1.5rem',
}
```

---

## Safety Checklist (Run Before Commit)

- [ ] `npm run build` passes
- [ ] TypeScript checks pass
- [ ] No Prisma schema changes
- [ ] No .env changes
- [ ] No API logic changes
- [ ] All existing flows still work
- [ ] Responsive design tested (mobile/tablet/desktop)

---

## Known Limitations / Future Polish

- Animations may need performance tuning for slower devices
- Dark mode not implemented (design system ready, needs execution)
- Mobile navigation may need hamburger menu
- Accessibility review needed for motion preferences
- Loading states could use skeleton loaders
- Error states could use illustrations

---

## Context Resume Instructions

**If context is lost, read this file and continue from "Current Sprint":**

1. Check "Progress Tracking" section for current sprint
2. Review "Files Modified" to see what's been done
3. Continue with unchecked items in current sprint
4. Update this file as you complete items
5. Move to next sprint when current sprint exit criteria met

**Quick status check:**
```bash
git status  # See what files are modified
npm run build  # Verify nothing is broken
```
