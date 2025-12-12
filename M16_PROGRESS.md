# M16 - First-Time Session Onboarding & In-Session Guidance

## Overview

Implemented comprehensive onboarding and guidance features for the unified 3-panel workspace to improve UX for new and early-stage sessions.

## Implementation Summary

### 1. First-Time Welcome State (SessionChatPane)

**Trigger Conditions:**
- `messages.length === 0` AND `hasProcesses === false`

**Features:**
- Centered welcome UI with brand gradient icon
- Clear value proposition: "Let's map your process"
- Helpful copy explaining the product
- 3 clickable starter prompts that immediately send the message:
  - "Help me map my invoice approval process"
  - "Map how we onboard new employees"
  - "Map how we handle support tickets"

**Behavior:**
- Welcome state disappears as soon as:
  - User sends their first message, OR
  - Session has at least 1 process
- Starter prompts pre-fill input and auto-send via `setTimeout` (50ms delay)
- All prompts disabled while loading

**Location:** `src/components/session/SessionChatPane.tsx` (lines 90-141)

---

### 2. In-Session "What You Can Ask" Helper (SessionChatPane)

**Trigger Conditions:**
- `messages.length > 0` AND `messages.length <= 2` AND `hasProcesses === false` AND `!isLoading`

**Features:**
- Subtle helper above input area
- Shows 2 example prompts:
  - "We do X → Y → Z when a client signs up…"
  - "We approve invoices like this…"
- Automatically hidden once a process exists

**Design:**
- Minimal, muted text styling
- Sparkles icon for brand consistency
- Smooth animation in/out

**Location:** `src/components/session/SessionChatPane.tsx` (lines 225-244)

---

### 3. Empty Graph State (SessionGraphPane)

**Trigger Conditions:**
- `processes.length === 0`

**Features:**
- Centered empty state in graph panel
- Updated copy:
  - Title: "Your process map will appear here"
  - Body: "Describe a workflow in the chat and we'll sketch it out for you. No need for perfect wording—start with 'First we... then we...'"
- Clean design with slate color scheme

**Behavior:**
- Disappears as soon as first process with steps is created

**Location:** `src/components/session/SessionGraphPane.tsx` (lines 193-210)

---

### 4. Scan for Opportunities Suggestion Pill (SessionArtifactPane)

**Trigger Conditions:**
- At least 1 process with >= 2 steps, AND
- No opportunities exist yet, AND
- User hasn't dismissed the pill

**Features:**
- Gradient background pill (brand-50 to amber-50)
- Helpful copy: "Ready to find automation opportunities?"
- Full-width "Scan for Opportunities" button
- Dismissible via X button (top-right)
- Calls existing `scanForOpportunities` function from UnifiedSessionWorkspace

**Behavior:**
- Appears at top of artifacts pane
- Dismissed when:
  - User clicks X button, OR
  - User clicks "Scan for Opportunities" button
- Smooth animation in/out using Framer Motion
- State managed per-session (component state)

**Location:** `src/components/session/SessionArtifactPane.tsx` (lines 81-124)

---

## Files Modified

### Core Component Changes

1. **`src/components/session/SessionChatPane.tsx`**
   - Added `hasProcesses` prop (optional, defaults to `false`)
   - Added first-time welcome state with starter prompts
   - Added early-session helper hints
   - Added `handleStarterClick` function for auto-sending prompts
   - Updated placeholder text based on `isFirstTime` state

2. **`src/components/session/SessionGraphPane.tsx`**
   - Updated empty state with M16 copy
   - Improved visual design (slate color scheme, rounded corners)

3. **`src/components/session/SessionArtifactPane.tsx`**
   - Added `onScanForOpportunities` prop (optional callback)
   - Added scan suggestion pill logic and UI
   - Added dismissible state management
   - Imported `Button`, `X`, and `motion`/`AnimatePresence` from framer-motion

4. **`src/components/session/UnifiedSessionWorkspace.tsx`**
   - Updated `SessionChatPane` to pass `hasProcesses={artifacts.processes.length > 0}`
   - Updated `SessionArtifactPane` to pass `onScanForOpportunities={scanForOpportunities}`

---

## State Logic & Conditions

### Welcome State Logic
```typescript
const isFirstTime = messages.length === 0 && !hasProcesses;
```

### Early Helper Logic
```typescript
const showEarlyHelper = messages.length > 0 && messages.length <= 2 && !hasProcesses;
```

### Scan Suggestion Logic
```typescript
const hasProcessWithSteps = artifacts.processes.some(p =>
  (p._count?.steps || p.steps?.length || 0) >= 2
);
const hasOpportunities = artifacts.opportunities.length > 0;
const shouldShowScanSuggestion = hasProcessWithSteps && !hasOpportunities && showScanSuggestion;
```

---

## Design Principles Applied

- **Progressive Disclosure**: Show guidance when needed, hide when not
- **Witty but Helpful Tone**: "Better Than Interns" brand voice
- **Minimal Friction**: Auto-send starter prompts, no extra clicks
- **Dismissible Suggestions**: User control over UI elements
- **Smooth Animations**: Framer Motion for polished feel
- **Existing Design System**: Uses shadcn/ui components, brand colors, and Tailwind utilities

---

## Testing Checklist

- [ ] New session (0 messages, 0 processes) shows welcome state
- [ ] Clicking a starter prompt pre-fills and sends message
- [ ] Welcome state disappears after first message
- [ ] Early helper appears after 1-2 messages (no processes)
- [ ] Early helper disappears once process is created
- [ ] Graph shows empty state when no processes exist
- [ ] Scan suggestion pill appears after process with 2+ steps is created
- [ ] Scan suggestion pill is dismissible (X button)
- [ ] Scan suggestion pill calls scanForOpportunities function
- [ ] Scan suggestion pill disappears after opportunities are created
- [ ] TypeScript compiles without errors
- [ ] `npm run build` passes

---

## Notes

- No API changes required
- No database schema changes
- All state is managed at component level (no global state)
- Backward compatible with existing sessions
- Does NOT affect the existing "Scan for Opportunities" header button (M15.3.3)
- The scan suggestion pill acts as a contextual nudge, not a replacement
