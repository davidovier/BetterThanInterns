# M13 - Session-First Experience Implementation Progress

**Started:** 2025-12-04
**Status:** IN PROGRESS

## Objective
Transform Better Than Interns from a project-centric workflow into a session-first, assistant-driven experience where users start talking and the system organizes everything automatically.

## Architecture Changes

### Core Philosophy
- **Before:** Create project → Create process → Map steps → Scan → Generate → Register
- **After:** Start Session → Describe reality → System extracts everything → Results appear in Library

### Top-Level Navigation (New Structure)
1. **Sessions** (primary) - Where users work, like "Documents" in Notion
2. **Library** (secondary) - Where extracted artifacts live
   - Processes
   - Opportunities
   - Blueprints
   - Governance
3. **Account** - Billing, profile, workspaces
4. **Projects** - Moved to bottom, downplayed (power-user feature)

## Implementation Checklist

### Phase 1: Navigation & Structure
- [ ] Update AppShell.tsx with new navigation structure
  - [ ] Add Library section with 4 sub-items
  - [ ] Move Projects to bottom secondary section
  - [ ] Sessions remains at top
- [ ] Create /library route group structure

### Phase 2: Homepage Transformation
- [ ] Dashboard becomes Sessions-first
  - [ ] Already shows sessions (M11)
  - [ ] Remove project-centric language
  - [ ] Emphasize "Start New Session" CTA
  - [ ] Remove demo project suggestions

### Phase 3: Library Pages
- [ ] Create /library/processes
  - [ ] List all processes across sessions
  - [ ] Columns: name, step count, linked session, created date
  - [ ] Link to process detail page
  - [ ] Filter and search capabilities

- [ ] Create /library/opportunities
  - [ ] List all opportunities across sessions
  - [ ] Columns: title, impact, effort, linked process, linked session
  - [ ] Filter by impact level

- [ ] Create /library/blueprints
  - [ ] List all blueprints
  - [ ] Columns: title, linked session, created date
  - [ ] Link to blueprint detail page

- [ ] Create /library/governance
  - [ ] List all AI use cases
  - [ ] Show risk level, status, linked session
  - [ ] Color-coded risk badges

### Phase 4: Cleanup & Refinement
- [ ] Hide manual "Create Process" buttons
  - [ ] Project pages
  - [ ] Process list pages
  - [ ] Session pages (if any exist)

- [ ] Clean up session page
  - [ ] Remove project-centric language
  - [ ] Session is the container (not project)
  - [ ] Keep inspector tabs as-is

- [ ] Update Projects page
  - [ ] Add note: "Advanced: Organize sessions into projects"
  - [ ] Keep functional but not prominent

### Phase 5: Testing & Verification
- [ ] Test navigation flows
- [ ] Test Library pages load correctly
- [ ] Test session creation flow
- [ ] Verify orchestration still works (M12)
- [ ] Verify governance flows work (G1-G3)
- [ ] Run build
- [ ] Test on dev server

## Files to Modify

### Navigation
- `src/components/layout/AppShell.tsx` - Main navigation structure

### Library Pages (NEW)
- `src/app/(dashboard)/library/processes/page.tsx`
- `src/app/(dashboard)/library/opportunities/page.tsx`
- `src/app/(dashboard)/library/blueprints/page.tsx`
- `src/app/(dashboard)/library/governance/page.tsx`

### Existing Pages to Update
- `src/app/(dashboard)/dashboard/page.tsx` - Already sessions-first, minor tweaks
- `src/app/(dashboard)/sessions/[sessionId]/page.tsx` - Remove project references
- `src/app/(dashboard)/projects/page.tsx` - Add contextual note
- `src/app/(dashboard)/projects/[projectId]/page.tsx` - Hide "New Process" button

## Design System Usage
All new pages will use existing M10 design system:
- PageHeader for consistent page titles
- MetricCard for statistics
- Card for list items
- Badge for status indicators
- EmptyState for zero-state experiences
- Table components for data lists

## No Breaking Changes
- ✅ All existing routes remain functional
- ✅ No database schema changes
- ✅ Existing pages accessible (just reorganized)
- ✅ M11 Sessions functionality intact
- ✅ M12 Orchestration intact
- ✅ Governance flows (G1-G3) intact
- ✅ Billing & Stripe intact

## Progress Log

### 2025-12-04 - Setup
- Created M13_PROGRESS.md tracking file
- Defined implementation checklist
- Ready to begin Phase 1

### Phase 1: Navigation - COMPLETE ✅
- Updated AppShell.tsx with new grouped navigation structure
- Added "Library" section with 4 sub-items:
  * Processes (/library/processes)
  * Opportunities (/library/opportunities)
  * Blueprints (/library/blueprints)
  * Governance (/library/governance)
- Moved Projects to "Organize" section (downplayed)
- Sessions remains at top as primary nav item

### Phase 2: Library Pages - COMPLETE ✅

**API Endpoints Created:**
1. GET /api/workspaces/[workspaceId]/processes - All processes across projects
2. GET /api/workspaces/[workspaceId]/opportunities - All opportunities with filtering
3. GET /api/workspaces/[workspaceId]/blueprints - All blueprints with previews

**Library Pages Created:**
1. /library/processes - Process library with metrics, table view, links to details
2. /library/opportunities - Opportunity library with impact filtering and color-coded badges
3. /library/blueprints - Blueprint library with card grid and version info
4. /library/governance - Governance library with status/risk filtering

All pages include:
- Metric cards showing aggregate stats
- Filtering capabilities (where applicable)
- Empty states with helpful messaging
- Loading skeletons
- Links to detail pages
- Responsive design

### Phase 3: Dashboard Updates - COMPLETE ✅
- Updated dashboard description to emphasize session-first approach
- Changed from "Chat with the AI to map processes..."
- To "Start a conversation. The AI extracts processes...automatically"
- Dashboard already shows sessions (from M11)
- Artifact count badges already present (from M12)

---

## Next Steps
1. ✅ Navigation updated
2. ✅ Library pages created
3. ✅ Dashboard messaging updated
4. 🔄 Run build to verify
5. 🔄 Test navigation flows
6. Optional: Hide manual "Create Process" buttons (low priority)
7. Optional: Add contextual help text to Projects page

---

## Notes
- Sessions already have metadata linking to processes, opportunities, blueprints, AI use cases (from M12)
- Library pages are essentially aggregation views across all sessions
- This is a UX refactor, not a technical rewrite
- Keep all existing functionality intact
