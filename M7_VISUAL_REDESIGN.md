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

### Sprint 4: Process Mapping (Hero UX) ⏸️ NOT STARTED
**Estimated effort:** 60-90 min
**Files:** 1 complex file

- [ ] Redesign `/src/app/(dashboard)/projects/[projectId]/processes/[processId]/page.tsx`
  - 3-panel layout: Chat (30-35%) | Graph (45-50%) | Opportunities (20-25%)
  - Chat panel:
    - Bubble UI for messages (left/right alignment)
    - Sticky input bar with rounded-full input
    - Subtle shadow and polish
  - Graph panel:
    - Card wrapper with no inner border
    - Top overlay chip: process name + #steps + help icon
  - Right panel:
    - Mini opportunity cards
    - Impact/effort badges
    - Match scores
    - Clear hover/selected states
  - Animations:
    - New messages fade in
    - New nodes animate in
    - Opportunities slide in

**Exit criteria:** Process mapping page is the hero experience

---

### Sprint 5: Governance Pages ⏸️ NOT STARTED
**Estimated effort:** 30-45 min
**Files:** 2-3

- [ ] Polish `/src/app/(dashboard)/governance/page.tsx`
  - Wrap in AppShell
  - Group AI use cases by status in columns
  - More restrained primary color usage
  - Enterprise feel

- [ ] Polish `/src/app/(dashboard)/ai-use-cases/[aiUseCaseId]/page.tsx`
  - 2-column layout: Summary | Risk/Policies
  - Small uppercase heading labels
  - Improved spacing and typography
  - Status chips and metadata
  - Subtle animations

**Exit criteria:** Governance feels enterprise-grade

---

### Sprint 6: Micro-interactions & Final Polish ⏸️ NOT STARTED
**Estimated effort:** 30-45 min
**Files:** Multiple (updates)

- [ ] Add hover states to all buttons
  - `hover:-translate-y-[1px]`
  - `hover:shadow-md`
  - Smooth transitions

- [ ] Add hover states to all cards
  - `hover:border-primary/40`
  - `hover:bg-muted/40`
  - `hover:shadow-md`

- [ ] Add page entrance animations
  - Fade in content
  - Staggered list animations

- [ ] Review and ensure consistency
  - All pages use AppShell
  - All sections use SectionCard
  - All headers use PageHeader
  - Consistent spacing and typography

**Exit criteria:** All interactions feel smooth and premium

---

## Progress Tracking

### Completed Sprints
1. Sprint 1: Foundation & Design System ✅
2. Sprint 2: Landing & Pricing Pages ✅
3. Sprint 3: Dashboard & Projects ✅

### Current Sprint
Sprint 4: Process Mapping (Hero UX) (ready to start)

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
- [ ] `src/app/(dashboard)/projects/[projectId]/processes/[processId]/page.tsx` - Hero UX redesign

### Governance
- [ ] `src/app/(dashboard)/governance/page.tsx` - Governance dashboard
- [ ] `src/app/(dashboard)/ai-use-cases/[aiUseCaseId]/page.tsx` - Use case detail

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
