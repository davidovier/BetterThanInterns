# Better Than Interns - Complete Application Documentation

## Executive Summary

**Better Than Interns** is a Next.js 14+ web application that helps teams map, analyze, and optimize business processes through conversational AI. Users describe their workflows in natural language, and the AI assistant extracts structured process information while generating real-time visual workflow graphs.

**Current State**: The application has been elevated to CEO-grade quality through three executive elevation milestones (M18-M20). The sessions list page now features session states, featured sessions, and directional metrics. The session workspace has been transformed into an executive working file with document-style entries, session briefs, and decision gravity. First-run experience provides calm, invisible onboarding that feels like documentation, not tutorial. All changes are frontend-only with no backend modifications required.

## Architecture & Tech Stack

### Frontend
- **Next.js 14.2.35** with App Router and TypeScript (updated for security fixes)
- **React 18** with Server and Client Components
- **React Flow** for interactive process graph visualization
- **Shadcn/ui + Radix UI** for accessible component primitives
- **Tailwind CSS** with custom design system
- **Framer Motion** for animations and transitions
- **NextAuth** for authentication
- **date-fns** for relative timestamp formatting

### Backend
- **Next.js API Routes** (App Router)
- **Prisma ORM** with PostgreSQL database
- **OpenAI GPT-4** for conversational AI and orchestration
- **Zod** for schema validation
- **bcryptjs** for password hashing

### Infrastructure
- **Vercel** deployment platform
- **Supabase** PostgreSQL database
- **GitHub** version control

## Project Structure

```
/src
├── app/
│   ├── (auth)/              # Authentication pages (login, signup)
│   ├── (dashboard)/         # Main app pages (sessions, account)
│   ├── (marketing)/         # Public pages (landing, pricing)
│   ├── api/                 # API routes
│   └── layout.tsx           # Root layout
├── components/
│   ├── ui/                  # Shadcn/ui primitives + tooltip
│   ├── layout/              # AppShell, navigation
│   ├── workspace/           # Workspace context
│   ├── sessions/            # SessionsHeader, SessionsFilterBar, SessionCard, FeaturedSession, AnimatedBackground (M16, M18)
│   ├── session/             # SessionChatPane, SessionGraphPane, SessionArtifactPane, UnifiedSessionWorkspace, AssistantPresence (M17-M20)
│   ├── artifacts/           # ProcessCard, OpportunityCard, BlueprintCard, GovernanceCard
│   ├── design-system/       # EmptyState, MetricCard
│   └── process/             # step-details-dialog, other process components
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   ├── prisma.ts           # Prisma client
│   ├── openai.ts           # OpenAI client
│   └── sessionUtils.ts     # Session state derivation and first-run detection (M18, M20)
└── types/
    └── artifacts.ts         # Artifact type definitions

/prisma
├── schema.prisma           # Database schema
└── migrations/             # Migration history
```

## Database Schema

### Core Models

**User**
- `id`, `email`, `password`, `name`
- Has many WorkspaceMembers

**Workspace**
- `id`, `name`, `plan` (starter/pro/enterprise)
- Has many WorkspaceMembers, Sessions, Processes

**WorkspaceMember**
- Links Users to Workspaces
- `role` (owner/admin/member)

**AssistantSession**
- `id`, `title`, `workspaceId`
- Has many ChatMessages, Processes, Opportunities

**ChatMessage**
- `id`, `role`, `content`, `sessionId`
- Stores conversation history

**Process**
- `id`, `name`, `description`, `workspaceId`, `sessionId`
- Has many ProcessSteps, ProcessLinks

**ProcessStep**
- `id`, `label`, `stepType`, `owner`, `inputs`, `outputs`, `frequency`, `duration`, `position`
- Represents workflow steps

**ProcessLink**
- `id`, `sourceStepId`, `targetStepId`
- Represents flow connections

**Opportunity**
- `id`, `title`, `description`, `category`, `impact`, `effort`, `processId`, `sessionId`
- AI-identified automation opportunities

## Design System

### Brand Colors
```css
--brand-50: #f0f9ff
--brand-100: #e0f2fe
--brand-200: #bae6fd
--brand-500: #0ea5e9
--brand-600: #0284c7
--brand-700: #0369a1
```

### Visual Style (Post-M16)
**Sessions Page**: Premium, CEO-level aesthetic
- Clean slate-50 background
- Subtle 3D animated gradient blobs (2-4% opacity) for depth
- Professional iconography (Briefcase, GitBranch, Target)
- White cards with minimal slate-200 borders
- Single brand accent color (brand-600) used sparingly
- High contrast typography with generous whitespace
- Hover effects: subtle lift (-1px), shadow increase, brand accent reveals

**Session Detail**: Clean, minimal workflow visualization
- React Flow nodes: White backgrounds with subtle borders
- Impact-based subtle colors: high (red border/bg), medium (amber), low (blue)
- Gray edges (stroke: #9ca3af) instead of vibrant gradients
- Professional, readable design

### Typography
- **Headings**: `font-bold tracking-tight`
- **Body**: `text-sm` to `text-base`
- **Muted text**: `text-muted-foreground`

### Component Patterns
- **Cards**: Rounded corners (`rounded-xl` to `rounded-3xl`), soft shadows
- **Buttons**: Primary gradient backgrounds with hover effects
- **Dialogs**: Modal overlays with backdrop blur
- **Toasts**: Bottom-right notifications
- **Dropdowns**: Radix UI menus with icons

## Core Value Proposition

**🎯 THE KILLER FEATURE**: Real-time visual process mapping through conversation

Users describe their workflows in plain English, and the application **instantly visualizes** them as interactive flowcharts. This is the primary differentiator and the "aha moment" that makes Better Than Interns unique.

**Critical Architecture Requirement**: The session workspace MUST display:
1. **Chat interface** - where users describe processes
2. **Live process graph** - React Flow visualization that updates in real-time
3. **Artifact sidebar** - list of all created artifacts

The graph is NOT optional - it's the core product experience.

## Key Features

### 1. Conversational Process Mapping ⭐ CORE FEATURE
- Users describe processes in natural language
- AI assistant (GPT-4) extracts structured information
- **Real-time workflow graph generation** - graph builds as user types
- Context-aware conversation flow
- Users can see their messy processes visualized clearly

### 2. Visual Workflow Editor ⭐ CORE FEATURE
- Interactive React Flow graph in center of workspace
- Click steps to view/edit details
- Automatic layout using dagre algorithm
- Real-time updates as AI processes messages
- Zoom, pan, and fit-to-view controls
- Visual representation is the primary UI element

### 3. Session Management
- Create, read, update, delete sessions
- Vibrant gradient card design
- Artifact counts (processes, opportunities)
- Metrics dashboard

### 4. Opportunity Detection
- AI scans processes for automation opportunities
- Multi-process analysis
- Impact and effort scoring
- Category classification

### 5. Workspace Multi-tenancy
- Team collaboration
- Role-based access (owner/admin/member)
- Plan-based features (starter/pro/enterprise)

### 6. Authentication & Account Management
- Email/password authentication
- User profile management
- Account deletion
- Workspace switching

## Recent Major Changes

### Milestone Progress

#### M22 - Executive Process Visualization (December 13, 2025)

**M22 Executive Process Visualization** - Graph semantic elevation from technical diagram to executive summary
- **Status**: ✅ Completed
- **Goal**: Elevate process graph from technical flow diagram to executive summary visualization
- **Target Aesthetic**: Calm, document-like, executive-readable - insights in under 5 seconds
- **Design Principles**:
  - No new interactions, modals, editing controls, tooltips, or hover explanations
  - Outcome-focused language over procedural framing
  - Visual emphasis through weight and hierarchy (not color)
  - Restraint over cleverness
- **Key Changes**:
  - **Outcome-First Node Language**:
    - Added `deriveExecutiveLabel()` transformation function
    - Converts procedural labels to outcome-focused language
    - Examples: "Validate invoice" → "Invoice verified for payment", "Process invoice" → "Invoice processed"
    - Uses explicit transformations map + regex patterns for verb-based conversions
    - Sentence case fallback for unmatched labels
  - **Bottleneck & Leverage Visual Emphasis**:
    - Bottleneck detection: Steps with duration >60 min get heavier 2px border in darker gray (#6b7280)
    - Darker text (#111827) and medium font-weight (500) for high-friction steps
    - Leverage emphasis: Steps with opportunities get thin 3px left accent line (#374151)
    - No colored backgrounds, no heatmap legend - visual weight only
  - **Opportunity Presence Annotations**:
    - Subtle text annotation below node owner: "Automation potential identified"
    - text-[10px] text-slate-400 mt-1 leading-tight
    - One line max, no icons, no color emphasis
  - **Executive Readability Defaults**:
    - Increased vertical spacing: index * 150 → index * 180
    - Softer shadows: 0 1px 2px rgba(0,0,0,0.05)
    - Lighter edge prominence: stroke #d1d5db (was #9ca3af)
    - Removed edge animation (animated: false) for calm feel
    - Slightly darker base border for clarity (#d1d5db)
    - Increased padding: 14px 18px (was 12px 16px)
    - Removed heatmap legend completely
- **Technical Details**:
  - Frontend-only, no backend changes
  - Modified graph node rendering to use executive labels
  - Removed colored impact-level styling (red/amber/blue heatmap)
  - Updated React Flow edges to be lighter and non-animated
  - Added bottleneck detection based on step.duration metadata
  - Bundle size increase: ~0.8kb (minimal)
- **Files Modified**:
  - `src/components/session/SessionGraphPane.tsx` (all M22 changes)
- **Before vs After**:
  - Before: Technical flow diagram with procedural steps, colored heatmap, animated edges
  - After: Executive summary with outcome-focused steps, subtle emphasis on friction/leverage, calm document feel
- **UX Risk**: Bottleneck detection (duration >60 min) may not match all organizational contexts - heuristic may need refinement
- **Commit**: `6a4389a`

#### M21 - Decision Continuity (December 13, 2025)

**M21 Decision Continuity** - System memory and resume flow for executive artifacts
- **Status**: ✅ Completed
- **Goal**: Transform sessions from static working files into continuity-aware executive artifacts
- **Target Aesthetic**: Calm, documentary tone - implicit guidance not calls to action
- **Design Principles**:
  - No new buttons, tooltips, or instructional copy
  - Single-source-of-truth brief
  - Implicit guidance, not calls to action
  - Executive memory, not assistant chatter
- **Key Changes**:
  - **Authoritative Session Brief**:
    - Added subtle left border (border-l-2 border-slate-300) to establish visual authority
    - No typography or layout changes from M19/M20
    - No background color or icons
  - **Implicit Next-Step Line**:
    - Editorial guidance below Session Brief (text-sm text-slate-600 mt-2)
    - Heuristic priority: "Identify process" → "Review opportunities" → "Decide what to move forward" → "Review decisions"
    - Never clickable, reads like editorial note
    - No bold, no icon, minimal punctuation
  - **Smart Continue Work Behavior**:
    - Context-aware scroll targets based on session state
    - No messages → scroll to Working Notes input
    - Has messages but no processes → scroll to latest assistant note
    - Has processes → scroll to Outputs pane
    - Has governance/blueprints → scroll to governance section
    - Smooth scroll, no visual feedback, feels inevitable
  - **Last Substantive Update Indicator**:
    - Added to metadata row: "Last update: [event]"
    - Detects: "Process identified" | "Opportunity scan completed" | "Governance decision recorded"
    - Only shows when meaningful event detected (no fallback)
    - Same styling as existing metadata
- **Technical Details**:
  - Frontend-only, no backend changes
  - Reused existing data (metadata, artifact counts, timestamps)
  - Added helper functions: `getNextStepGuidance()`, `getLastSubstantiveUpdate()`, `getScrollTarget()`
  - Added scroll target refs: inputRef, messagesEndRef, outputsPaneRef, governanceRef
  - Modified SessionChatPane and SessionArtifactPane to accept external refs
  - Bundle size increase: ~1.2kb (under 2kb limit)
- **Files Modified**:
  - `src/components/session/UnifiedSessionWorkspace.tsx` (helper functions, refs, smart scroll)
  - `src/components/session/SessionChatPane.tsx` (accept external refs)
  - `src/components/session/SessionArtifactPane.tsx` (accept external refs)
- **UX Philosophy**: Sessions remember context and guide next steps through calm editorial notes, not UI prompts
- **Commit**: `cf07e1c`

#### M20 - First-Run Experience (December 13, 2025)

**M20 First-Run Experience** - Executive-appropriate onboarding for first session
- **Status**: ✅ Completed
- **Goal**: Make the first session feel intentional, guided, and calm without breaking the executive document metaphor
- **Target Aesthetic**: Declarative, calm, neutral - no excitement, no promises
- **Design Principles**:
  - No global onboarding (no tours, no overlays, no tooltips)
  - First-run copy feels unfinished but intentional
  - Uses existing production styles (no special "demo mode" appearance)
  - Dismissible guidance that never reappears
- **Key Changes**:
  - **First-run detection**: Added `isFirstRunSession()` utility to `sessionUtils.ts`
    - Detects when session has no messages, no artifacts, and no contextSummary
  - **Session Brief first-run copy**:
    - "Use this working session to describe a process or decision. As work progresses, this brief will summarize what was decided."
    - Unchanged styling from production (same text-slate-700, leading-relaxed)
  - **Dismissible starter example** (Working Notes):
    - Single example block showing how to describe a process
    - "Example" label (uppercase, small, muted)
    - Dismissible with × button in top-right
    - Never reappears once dismissed (component-local state)
  - **Outputs empty state first-run copy**:
    - "Outputs will appear here as processes are identified and decisions are made."
    - More descriptive than returning user empty state
- **Technical Details**:
  - Modified `src/lib/sessionUtils.ts` - added `isFirstRunSession()` function
  - Modified `UnifiedSessionWorkspace.tsx` - detects first-run, passes to child components
  - Modified `SessionChatPane.tsx` - dismissible starter example with useState
  - Modified `SessionArtifactPane.tsx` - first-run-specific empty state copy
- **Files Modified**:
  - `src/lib/sessionUtils.ts` (added isFirstRunSession)
  - `src/components/session/UnifiedSessionWorkspace.tsx` (first-run detection)
  - `src/components/session/SessionChatPane.tsx` (starter example)
  - `src/components/session/SessionArtifactPane.tsx` (first-run empty state)
- **UX Philosophy**: Invisible onboarding - guidance that feels like documentation, not tutorial
- **Commit**: `fa6b578`

#### M19 - Session as Executive Working File (December 13, 2025)

**M19 Session Detail Transformation** - Reframe session from "chat + artifacts" into executive working file
- **Status**: ✅ Completed
- **Goal**: Transform session detail page into a living executive working document
- **Target Aesthetic**: CEO-grade, serious working document (not chat interface)
- **Design Principles**:
  - File cover metaphor (not chat header)
  - Document-style entries (not chat bubbles)
  - Decision gravity through visual weight (borders, typography)
  - Assistant presence subordinate to document
  - No exclamation points, no emojis, declarative sentences
- **Key Changes**:
  - **File Cover Header** (UnifiedSessionWorkspace):
    - Document-style header with FileText icon
    - 3xl title with tight tracking
    - Metadata line: "Active working session · Last updated X ago · Workspace name"
    - AssistantPresence moved next to "Continue Work" button (subordinate position)
  - **Session Brief Section**:
    - Positioned between header and workspace panels
    - "SESSION BRIEF" uppercase label
    - Empty state: "This session will summarize itself as decisions are made."
    - Calm, declarative tone
  - **Working Notes** (SessionChatPane):
    - Changed from "Chat" to "Working Notes"
    - Document-style message entries with timestamps
    - "You · HH:MM" and "Assistant · HH:MM" labels
    - Border-separated entries (not bubbles)
    - Input placeholder: "Add context, clarify a process, or ask for analysis..."
    - Button text: "Add Note" (not "Send")
  - **Outputs Section** (SessionArtifactPane):
    - Changed from "Artifacts" to "Outputs from this session"
    - Grouped sections with collapsible headers:
      - "Processes Identified" (font-semibold, text-slate-500)
      - "Opportunities Discovered" (font-semibold, text-slate-500)
      - "Blueprints" (font-bold, text-slate-700, border-b-2) - decision gravity
      - "Governance & Decisions" (font-bold, text-slate-700, border-b-2) - decision gravity
    - Empty state: "Outputs will appear as work progresses."
  - **Decision Gravity**:
    - Blueprints and Governance sections use heavier borders (2px vs 1px)
    - Bolder typography (font-bold vs font-semibold)
    - Visual weight without color changes
- **Technical Details**:
  - Modified `UnifiedSessionWorkspace.tsx` - document-style header, session brief section
  - Modified `SessionChatPane.tsx` - working notes styling, document entries
  - Modified `SessionArtifactPane.tsx` - outputs section, decision gravity
  - Modified `src/app/(dashboard)/sessions/[sessionId]/page.tsx` - pass sessionData
- **Files Modified**:
  - `src/components/session/UnifiedSessionWorkspace.tsx`
  - `src/components/session/SessionChatPane.tsx`
  - `src/components/session/SessionArtifactPane.tsx`
  - `src/app/(dashboard)/sessions/[sessionId]/page.tsx`
- **UX Philosophy**: Session workspace feels like a living document file, not a chat interface
- **Commit**: `6a44139`

#### M18 - Sessions Page Executive Elevation Pass (December 13, 2025)

**M18 Sessions Page Redesign** - Transform `/sessions` page to CEO-grade quality
- **Status**: ✅ Completed
- **Goal**: Elevate sessions list page from "mid-market" to executive/CEO-level aesthetic
- **Target Audience**: CEOs, Founders, Heads of Ops/AI, Enterprise decision-makers
- **Design Principles**:
  - Executive Calm (no visual noise, generous whitespace)
  - Strategic Weight (states over statuses, trends over numbers)
  - Confidence Over Cleverness (no playful copy, declarative statements)
  - Restraint (minimal brand color usage, subtle accents)
- **Key Changes**:
  - **Session States** (Frontend-only heuristics):
    - Created `src/lib/sessionUtils.ts` with state derivation logic
    - 4 states: Active (updated <48h), In Progress (has artifacts), Decided (has governance/blueprints), Archived (30+ days old)
    - States derived from `updatedAt` timestamps and `metadata` artifact counts
    - No backend changes required
    - Subtle color coding: Active (brand), In Progress (blue), Decided (emerald), Archived (slate)
  - **Featured Session** ("Where to go next"):
    - Created `FeaturedSession.tsx` component
    - Displays most recently updated session above grid
    - Larger card with 4px left accent border
    - State badge, title, contextSummary, "Continue →" button
    - Empty state: "Summary will appear as decisions are made."
  - **Directional Metrics**:
    - Updated `MetricCard.tsx` to support trend indicators
    - Added `direction?: 'up' | 'down' | 'neutral'` prop
    - Added `directionLabel` for context (e.g., "vs last week")
    - TrendingUp/TrendingDown/Minus icons
    - Week-over-week session comparison
  - **De-emphasized Grid**:
    - Softer shadows (shadow-sm → shadow-md on hover)
    - More whitespace (gap-8 instead of gap-6)
    - 3px left accent border (state color)
    - Smaller typography throughout
  - **Executive Copy Tone**:
    - Removed all exclamation points
    - Changed to declarative statements
    - "Summary pending" instead of "No summary yet"
    - "Sessions" instead of "All Sessions"
    - Calm, professional language throughout
- **Technical Details**:
  - Created `src/lib/sessionUtils.ts` - state derivation utilities
  - Created `src/components/sessions/FeaturedSession.tsx` - featured session card
  - Modified `src/components/sessions/SessionCard.tsx` - state indicators, de-emphasized styling
  - Modified `src/components/design-system/MetricCard.tsx` - directional trends
  - Modified `src/app/(dashboard)/sessions/page.tsx` - integrated all changes
- **Files Modified**:
  - `src/lib/sessionUtils.ts` (NEW)
  - `src/components/sessions/FeaturedSession.tsx` (NEW)
  - `src/components/sessions/SessionCard.tsx`
  - `src/components/design-system/MetricCard.tsx`
  - `src/app/(dashboard)/sessions/page.tsx`
- **UX Philosophy**: Sessions page feels like an executive dashboard, not a task list
- **Commit**: `d43259c`

#### M17 - Assistant Presence Layer (December 12, 2025)

**M17 Assistant Presence** - Visible AI presence indicator in session workspace
- **Status**: ✅ Completed
- **Goal**: Make the assistant feel like a visible, intelligent presence - not just chat messages
- **Target Aesthetic**: CEO-grade, premium, restrained (Apple/Linear/Superhuman quality)
- **New Component**:
  - `AssistantPresence.tsx` - Abstract orb-based presence indicator with 5 states
  - No avatars, no faces - minimal 10px gradient orb with state-specific animations
- **State Design**:
  - **idle**: Slow breathing pulse, slate gradient, 60% opacity
  - **listening**: Reactive pulse when input focused, brand gradient, 90% opacity
  - **thinking**: Gentle glow with outer ring, triggered when orchestration in flight
  - **updating**: Ripple effect with expanding rings, shown when artifacts reload
  - **error**: Brief red flash, auto-clears to idle after 1.5s
- **Integration**:
  - Placed in session header between title and "Scan" button
  - Event-driven state transitions (no arbitrary timeouts)
  - Input focus/blur triggers listening state
  - API lifecycle (send → response → artifact reload) drives thinking → updating → idle
  - Error state self-manages recovery
- **Technical Details**:
  - Modified SessionChatPane to expose onInputFocus/onInputBlur callbacks
  - UnifiedSessionWorkspace tracks presenceState and isInputFocused
  - Framer Motion for all animations (breathing, pulsing, ripples)
  - 800ms pause on "updating" before returning to idle for visual feedback
- **UX Philosophy**: Transform assistant from "chatbot" to "AI consultant sitting next to you"
- **Known Limitations**:
  - No progress indication during long API calls (thinking state is static)
  - Fixed 800ms timeout for updating→idle (not tied to actual render completion)
  - Doesn't reflect background operations like opportunity scanning
- **Recommended Next Steps**:
  - Add time-based progress hints during "thinking" (e.g., "Still thinking..." after 3s)
  - Integrate presence with artifact creation flow (visual connection orb → artifact)
  - Unify all AI operations under presence (include scanning, blueprint generation)

#### M16 - Sessions UI & Onboarding (December 12, 2025)

**M16 Sessions UI Redesign** - Complete visual redesign of `/sessions` page
- **Status**: ✅ Completed
- **Goal**: CEO-level, premium visual style for sessions list page
- **Key Changes**:
  - Replaced loud rainbow gradients with clean slate-50 background
  - Added subtle 3D animated gradient blobs (2-4% opacity) for depth
  - Changed from playful Sparkles to professional Briefcase/GitBranch/Target icons
  - Implemented premium white cards with minimal borders and hover effects
  - Added client-side filtering (All, Recent, With Processes, With Opportunities)
  - Added client-side sorting (Recently Updated, Recently Created, Name A-Z)
  - Grid/List view toggle
  - Workspace name and plan badge display
- **New Components**:
  - `AnimatedBackground.tsx` - Floating gradient blobs
  - `SessionsHeader.tsx` - Premium hero with workspace context
  - `SessionsFilterBar.tsx` - Filter pills, sort dropdown, view toggle
  - `SessionCard.tsx` - Clean cards with professional styling
  - `tooltip.tsx` - Radix UI tooltip wrapper (was missing)
- **Technical**: Uses useMemo for optimal filter/sort performance, Framer Motion animations
- **Dependencies**: Added @radix-ui/react-tooltip
- **Files**: See M16_SESSIONS_UI_PROGRESS.md for complete documentation

**M16B - Blueprint & Governance Backfill** - Session-scoped blueprints and AI use cases
- **Status**: ✅ Completed
- **Goal**: Re-introduce minimal Blueprint and AI Use Case features scoped to sessions
- **Schema Changes**:
  - Blueprint: Added `sessionId`, `summary`, improved `contentMarkdown`
  - AiUseCase: Added `sessionId`, `riskSummary`, changed default status to "idea"
- **New API Endpoints**:
  - `GET/POST /api/sessions/[sessionId]/blueprints` - Session-scoped blueprints
  - `GET/POST /api/sessions/[sessionId]/ai-use-cases` - Session-scoped AI use cases
- **Features**:
  - AI-powered blueprint generation with 7 sections (Executive Summary, Implementation Roadmap, etc.)
  - AI-powered use case creation with title, description, and riskSummary
  - Dual-source loading: Merges metadata-based and session-scoped artifacts
  - Updated BlueprintCard to show summary preview
  - Updated GovernanceCard with new status values (idea/approved/shipped) and riskSummary
- **OpenAI Integration**: GPT-4o generates structured markdown blueprints and JSON use cases
- **Files**: See M16B_PROGRESS.md for implementation details

**M16 - First-Time Onboarding** - Welcome states and in-session guidance
- **Status**: ✅ Completed
- **Goal**: Improve UX for new and early-stage sessions
- **Features**:
  - **First-Time Welcome State** (SessionChatPane):
    - Centered welcome UI with gradient icon
    - 3 clickable starter prompts that auto-send messages
    - Appears when `messages.length === 0` AND `hasProcesses === false`
  - **In-Session Helper** (SessionChatPane):
    - Shows 2 example prompts after first message
    - Appears when `messages.length > 0` AND `messages.length <= 2` AND `!hasProcesses`
  - **Empty Graph State** (SessionGraphPane):
    - Updated copy: "Your process map will appear here"
    - Helpful guidance on how to describe workflows
  - **Scan Suggestion Pill** (SessionArtifactPane):
    - Gradient pill suggesting opportunity scan
    - Appears when process has >= 2 steps but no opportunities
    - Dismissible with X button
- **Design**: Progressive disclosure, witty tone, smooth animations
- **Files**: See M16_PROGRESS.md for state logic details

### Latest Commits (Most Recent First)

1. **feat: M22 Executive Process Visualization - Graph semantic elevation** (commit 6a4389a)
   - Outcome-first node language transformation (deriveExecutiveLabel function)
   - Bottleneck & leverage visual emphasis (duration-based weight, opportunity accent)
   - Opportunity presence annotations (subtle text below nodes)
   - Executive readability defaults (increased spacing, lighter edges, no animation)
   - Removed colored heatmap styling and legend
   - Frontend-only, no backend changes

2. **feat: M21 Decision Continuity - System memory and resume flow** (commit cf07e1c)
   - Authoritative Session Brief with subtle left border
   - Implicit next-step line below Session Brief
   - Smart Continue Work scroll behavior (context-aware targets)
   - Last substantive update indicator in metadata
   - Frontend-only, no backend changes

2. **feat: M20 First-Run Experience - Executive-appropriate onboarding** (commit fa6b578)
   - Added `isFirstRunSession()` utility to sessionUtils.ts
   - Dismissible starter example in Working Notes
   - First-run specific empty states and copy
   - No global onboarding (invisible, calm guidance)

2. **feat: M19 Session as Executive Working File** (commit 6a44139)
   - Transformed session detail page into executive working document
   - File cover header, Session Brief section
   - Working Notes (not Chat), Outputs (not Artifacts)
   - Decision gravity through visual weight (borders, typography)

3. **feat: M18 Sessions Page Executive Elevation Pass** (commit d43259c)
   - Created session state derivation system (Active/In Progress/Decided/Archived)
   - Added Featured Session component ("Where to go next")
   - Directional metrics with trend indicators
   - De-emphasized grid with executive copy tone
   - Created FeaturedSession.tsx and sessionUtils.ts

4. **feat: M16 Sessions UI Redesign - CEO-level premium visual style** (commit 10b1988)
   - Complete visual redesign with extracted components
   - Added @radix-ui/react-tooltip dependency
   - See M16_SESSIONS_UI_PROGRESS.md

2. **redesign: Complete artifacts pane redesign with card grid layout**
   - **SessionArtifactPane**: Added collapsible sections with chevron icons for each artifact type
   - Slate color scheme (`bg-slate-50`, `text-slate-700`, `border-slate-200`)
   - Compact header with smaller typography
   - Grid layout with `gap-2` spacing (currently 1-column, ready for multi-column)
   - Interactive section toggle functionality (Processes, Opportunities, Blueprints, AI Use Cases)
   - **ProcessCard** (medium detail): Compact `p-3` card with icon + title + 1-line description + 2 key metrics (step count, opportunity count)
   - **OpportunityCard** (medium detail): Compact `p-3` card with icon + title + 1-line description + 2 badges (impact, effort)
   - Removed mini-map preview, timestamps, and expand buttons from cards
   - Full details still available via click → dialog
   - Much better vertical density - fits more artifacts in view
   - Faster animations (0.2s vs 0.3s)

2. **security: Update Next.js from 14.2.5 to 14.2.35**
   - Fixes CVE-2025-55184 (high): DoS via malicious HTTP request
   - Fixes CVE-2025-67779 (high): Incomplete fix for CVE-2025-55184 DoS via malicious RSC payload
   - Applied via `fix-react2shell-next` scanner

3. **fix: Sticky header improvements in artifacts pane**
   - Changed from translucent to solid white background (`bg-white`)
   - Added negative margins (`-mx-4 -mt-4`) to extend background edge-to-edge
   - Added matching padding (`px-4 pt-4`) to maintain spacing
   - Content now scrolls cleanly behind header without being visible

4. **design: Simplify React Flow nodes and OpportunityCard to subtle, clean design**
   - **React Flow nodes**: Changed from bold gradients to clean white backgrounds with subtle borders
   - Node styling: `background: #ffffff`, `border: 1px solid #e5e7eb`, minimal shadows
   - Subtle impact-based colors: high (red border/bg), medium (amber), low (blue)
   - **Edges**: Changed from purple to gray (`stroke: #9ca3af, strokeWidth: 1.5`)
   - Removed MiniMap and process info overlay from graph
   - Simplified heatmap legend
   - Clean, professional look with better readability

5. **feat: M15.3.3 - Restore 'Scan for Opportunities' button with dual approach**
   - Added `scanForOpportunities` function to UnifiedSessionWorkspace
   - Added "Scan for Opportunities" button to page header (right side)
   - Button enables **dual approach** for opportunity discovery:
     * **Explicit scan**: User clicks button to scan current process
     * **Implicit scan**: AI discovers opportunities during conversation
   - Button state management (enabled/disabled/loading)
   - Success toast showing opportunity count after scan
   - Auto-reloads artifacts to display new opportunities
   - API: `POST /api/processes/[id]/scan-opportunities?sessionId=[id]`

6. **feat: M15.3.2 - Update graph to use vertical layout**
   - Switch from horizontal to vertical layout (y = index * 150, x = 100)
   - Vertical flowchart format for process steps (top-to-bottom)
   - ~~Initially used vibrant gradients~~ (later simplified to subtle design in subsequent update)

3. **feat: M15.3.1 - Restore React Flow process graph visualization**
   - **CRITICAL**: Restored the core value proposition removed in M15.2
   - Created SessionGraphPane component with React Flow integration
   - Updated UnifiedSessionWorkspace to three-panel layout: Chat (30%) | Graph (45%) | Artifacts (25%)
   - Restored step editing functionality via StepDetailsDialog
   - Integrated opportunity heatmap coloring (high/medium/low impact) on graph nodes
   - Added process tabs for multi-process sessions
   - Restored click-to-edit step functionality
   - Graph updates in real-time as conversation progresses
   - Result: Core product experience restored while keeping M15.2 improvements

4. **feat: M15.2 - Rebuild unified session workspace UI**
   - Replaced graph-first session page with artifact-stream workspace
   - Created 8 new components (artifact cards + session components)
   - Reduced session page from 1,154 lines to 81 lines (-93%)
   - Implemented 60/40 split layout (chat + artifacts)
   - Added Framer Motion animations for new artifacts
   - Auto-scroll and highlight for newly created artifacts
   - ~~Removed ReactFlow graph editor and step editing modals~~ (MISTAKE - restored in M15.3)
   - Added date-fns for relative timestamps
   - All artifacts now load via single `/api/sessions/[sessionId]/artifacts` call
   - M10 design system compliant with consistent spacing and colors

3. **docs: Consolidate documentation and remove outdated files**
   - Removed 25 outdated markdown files
   - Created comprehensive AGENT_CONTEXT.md (32KB)
   - Updated README.md to be concise and user-facing
   - Net documentation cleanup: -8,000 lines outdated, +1,500 lines current

3. **refactor: Major codebase cleanup and architecture consolidation**
   - Removed 9 dashboard pages
   - Removed 3 API route groups
   - Removed 2 component directories
   - Created new `/sessions` page as main landing
   - Updated navigation to single "Sessions" link
   - Updated auth redirects from `/dashboard` to `/sessions`
   - Net removal: ~5,100 lines of code

4. **fix: Pass sessionId when scanning for opportunities**
   - Fixed multi-process opportunity scanning
   - Ensured sessionId is included in scan requests

5. **fix: Update session metadata when scanning opportunities via direct API**
   - Updated artifact counts after scanning
   - Improved session metadata consistency

### Pages Removed
- `/dashboard` (old sessions list)
- `/library/processes`
- `/library/opportunities`
- `/library/blueprints`
- `/library/governance`
- `/governance`
- `/processes/[processId]`
- `/ai-use-cases/[aiUseCaseId]`
- `/demo`

### Components Removed
- `blueprint/**` directory
- `governance/**` directory
- `UnifiedWorkspaceView.tsx`

### API Routes Removed
- `/api/ai-use-cases/**`
- `/api/blueprints/**`
- `/api/demo-project/**`

## File Locations

### Critical Files

**Main Entry Point**
- `/src/app/(dashboard)/sessions/page.tsx` (542 lines) - Sessions list with CRUD

**Session Detail**
- `/src/app/(dashboard)/sessions/[sessionId]/page.tsx` (1,154 lines) - Chat + graph interface

**Layout**
- `/src/components/layout/AppShell.tsx` - Navigation shell

**Authentication**
- `/src/app/(auth)/login/page.tsx` - Login form
- `/src/app/(auth)/signup/page.tsx` - Registration form
- `/src/lib/auth.ts` - NextAuth configuration

**API Core**
- `/src/app/api/auth/**` - Authentication endpoints
- `/src/app/api/sessions/**` - Session CRUD
- `/src/app/api/processes/**` - Process management
- `/src/app/api/opportunities/**` - Opportunity scanning

**Database**
- `/prisma/schema.prisma` - Schema definition
- `/src/lib/prisma.ts` - Prisma client singleton

**AI Integration**
- `/src/lib/openai.ts` - OpenAI client
- `/src/app/api/sessions/[sessionId]/chat/route.ts` - Chat endpoint with orchestration

---

## APPENDIX A: Complete Page Structure

### 1. Landing Page (`/`)
**File**: `/src/app/(marketing)/page.tsx` (466 lines)

**Purpose**: Marketing homepage for unauthenticated visitors

**Features**:
- Hero section with gradient heading
- Feature highlights (3 sections)
- CTA buttons linking to signup with plan selection
- Responsive design
- Brand-appropriate copy ("Where workflows actually make sense")

**Layout**: Uses marketing layout (no AppShell)

---

### 2. Pricing Page (`/pricing`)
**File**: `/src/app/(marketing)/pricing/page.tsx`

**Purpose**: Display pricing tiers and plan comparison

**Features**:
- Three pricing tiers: Starter, Pro, Enterprise
- Feature comparison
- CTA buttons linking to signup with pre-selected plan
- Brand-appropriate descriptions:
  - Starter: "Perfect for solo experiments"
  - Pro: "For teams actually shipping automations"
  - Enterprise: "Bring your lawyers"

**Layout**: Uses marketing layout

---

### 3. Login Page (`/login`)
**File**: `/src/app/(auth)/login/page.tsx` (140 lines)

**Purpose**: User authentication

**Features**:
- Email/password form
- NextAuth credentials provider
- Success banner when redirected after account deletion
- Error handling with toast notifications
- Link to signup page
- Suspense boundary for useSearchParams
- Redirects to `/sessions` on successful login

**Layout**: Centered card on plain background

---

### 4. Signup Page (`/signup`)
**File**: `/src/app/(auth)/signup/page.tsx` (251 lines)

**Purpose**: New user registration

**Features**:
- Plan selection (starter/pro/enterprise)
- Name, email, password form
- URL parameter support for pre-selected plan (`?plan=pro`)
- Auto sign-in after successful registration
- Creates default workspace with selected plan
- Links to login page
- Suspense boundary for useSearchParams
- Redirects to `/sessions` after signup

**Layout**: Centered card with plan selection UI

**API Integration**:
- POST `/api/auth/signup` (creates user + workspace)
- Calls `signIn()` after successful registration

---

### 5. Sessions List Page (`/sessions`) ⭐ Main Dashboard (M16 Redesigned)
**File**: `/src/app/(dashboard)/sessions/page.tsx` (483 lines after M16 redesign)

**Purpose**: Primary landing page after authentication, displays all sessions with premium CEO-level visual style

**Features** (Post-M16 Redesign):
- **Premium Hero Header** (SessionsHeader component):
  - 4xl heading with tight tracking
  - Workspace name and plan badge
  - Help tooltip explaining sessions
  - "New Session" CTA with hover effects
- **Animated Background**: Subtle 3D gradient blobs (2-4% opacity)
- **Metrics Dashboard**: Total sessions, processes, active this week (using MetricCard component)
- **Filter & Sort Bar** (SessionsFilterBar component):
  - **Filters**: All Sessions, Recent (7 days), With Processes, With Opportunities
  - **Sorting**: Recently Updated, Recently Created, Name A-Z
  - **View Toggle**: Grid/List (both use responsive grid currently)
  - Client-side filtering and sorting using `useMemo` for performance
- **Session Grid**: 1-3 column responsive grid with staggered animations
- **Premium Session Cards** (SessionCard component):
  - Clean white background with slate-200 border
  - Hover effects: subtle lift (-1px), shadow increase, brand accent top line
  - Title with hover color shift to brand-700
  - Context summary or placeholder
  - Artifact counts with professional icons (GitBranch for processes, Target for opportunities)
  - "Last updated" timestamp using date-fns
  - Three-dot menu (visible on hover) with rename/delete
  - Demo badge if applicable
- **CRUD Operations**:
  - **Create**: Dialog modal with title input
  - **Read**: Click card to navigate to session detail
  - **Update**: Rename via dialog
  - **Delete**: Confirmation dialog with cascade warning
- **Empty State**: Professional Briefcase icon with clear CTA
- **Loading States**: Skeleton UI during operations

**Layout**: Uses AppShell with navigation, clean slate-50 background

**API Integration**:
- GET `/api/sessions?workspaceId=` (fetch all sessions for workspace)
- POST `/api/sessions` (create new session)
- PATCH `/api/sessions/[id]` (update session title)
- DELETE `/api/sessions/[id]` (delete session + cascade)

**Navigation**: Clicking a session card navigates to `/sessions/[sessionId]`

**Components Used**:
- `AnimatedBackground` - Floating gradient blobs
- `SessionsHeader` - Premium hero section
- `SessionsFilterBar` - Filters, sorting, view toggle
- `SessionCard` - Individual session cards
- `MetricCard` - Dashboard metrics (from design-system)
- `EmptyState` - No sessions state (from design-system)

---

### 6. Session Detail Page (`/sessions/[sessionId]`) ⭐ Core Feature (M15.3 - Graph Restored)
**File**: `/src/app/(dashboard)/sessions/[sessionId]/page.tsx` (81 lines)

**Purpose**: Unified workspace with conversational AI, live process graph, and artifact stream

**Architecture**: Simple loading/error wrapper that renders `UnifiedSessionWorkspace`

**Header**:
- Back button (left) - returns to `/sessions`
- Session title (center)
- **"Scan for Opportunities" button (right)** - explicit scan for current process
  - Disabled when no processes exist or while scanning
  - Shows loading spinner during scan
  - Success toast displays opportunity count
  - Calls `POST /api/processes/[id]/scan-opportunities?sessionId=[id]`

**Features**:

**Three-Panel Layout (Chat | Graph | Artifacts)**:
- Left (30%): Chat pane with conversation history
- Center (45%): **React Flow process graph** - THE CORE FEATURE
- Right (25%): Artifact stream with categorized cards
- All panes scroll independently
- No resizing - fixed proportions for optimal UX

**Components Used**:
- `UnifiedSessionWorkspace` - Main orchestrator component (273 lines)
- `SessionChatPane` - Left panel (chat messages + input, 148 lines)
- `SessionGraphPane` - **Center panel (React Flow graph, 220 lines)**
- `SessionArtifactPane` - Right panel (artifact cards, 150 lines)
- `StepDetailsDialog` - Edit step details on click
- `ProcessCard` - Process artifacts with mini-map preview
- `OpportunityCard` - Opportunity artifacts with impact/effort scores
- `BlueprintCard` - Blueprint artifacts (placeholder for future markdown)
- `GovernanceCard` - AI use case artifacts

**Chat Pane Features**:
- Message bubbles with user/assistant/system styling
- Typing indicator with animated dots
- Auto-scroll to bottom on new messages
- Auto-resizing textarea (80px-200px)
- Enter to send, Shift+Enter for new line
- Loading states during AI processing

**Graph Pane Features** (THE CORE VALUE PROPOSITION):
- Real-time React Flow visualization of process steps
- Nodes display step title and owner
- Edges show workflow connections (animated)
- **Opportunity heatmap**: Steps colored by impact level (high=red, medium=amber, low=blue)
- Click steps to open StepDetailsDialog for editing
- Process tabs for multi-process sessions
- Process info overlay (name, step count)
- Heatmap legend (when opportunities exist)
- Empty state with guidance when no processes exist
- Auto-layout with fitView
- Zoom/pan controls via React Flow Controls
- MiniMap for navigation
- Graph updates automatically when artifacts reload

**Artifact Pane Features**:
- Vertical stream organized by category:
  - Processes (with step count, opportunities badge)
  - Opportunities (with impact/effort scores, feasibility bar)
  - Blueprints (with version badge)
  - AI Use Cases (with status, linked counts)
- Empty state when no artifacts exist
- Auto-scroll to highlighted artifacts
- 3-second ring highlight for new artifacts
- Framer Motion enter animations
- Click cards to open detail modals

**Opportunity Discovery - Dual Approach**:
1. **Explicit Scan**: Click "Scan for Opportunities" button in header
   - Scans currently selected process
   - Shows loading state and success toast
   - Auto-reloads artifacts
2. **Implicit Discovery**: AI identifies opportunities during conversation
   - Happens automatically via orchestration endpoint
   - Opportunities appear in artifact stream
   - No user action required

**State Management**:
- Single artifacts API call on mount
- Reload after orchestration completes
- Optimistic updates for user messages
- Highlight state with auto-clear timeout

**Layout**: Uses AppShell with navigation

**API Integration**:
- GET `/api/sessions/[sessionId]` (load session metadata)
- GET `/api/sessions/[sessionId]/messages` (load conversation history)
- GET `/api/sessions/[sessionId]/artifacts` (bulk load all artifacts)
- POST `/api/sessions/[sessionId]/orchestrate` (send message, get AI response + artifacts)

**Key Files**:
- `/src/components/session/UnifiedSessionWorkspace.tsx` (273 lines) - orchestrates all three panels
- `/src/components/session/SessionChatPane.tsx` (148 lines) - chat interface
- `/src/components/session/SessionGraphPane.tsx` (220 lines) - **React Flow graph visualization**
- `/src/components/session/SessionArtifactPane.tsx` (150 lines) - artifact stream
- `/src/components/process/step-details-dialog.tsx` - edit step on click
- `/src/components/artifacts/ProcessCard.tsx` (220 lines)
- `/src/components/artifacts/OpportunityCard.tsx` (232 lines)
- `/src/components/artifacts/BlueprintCard.tsx` (124 lines)
- `/src/components/artifacts/GovernanceCard.tsx` (155 lines)
- `/src/types/artifacts.ts` (86 lines)

---

### 7. Account Page (`/account`)
**File**: `/src/app/(dashboard)/account/page.tsx` (903 lines)

**Purpose**: User profile and account management

**Features**:

**Tabs**:
1. **Profile**: Edit name, email
2. **Security**: Change password
3. **Workspaces**: Manage workspace memberships
4. **Danger Zone**: Delete account

**Profile Tab**:
- Edit user name
- Display email (read-only)
- Save button with loading state

**Security Tab**:
- Current password verification
- New password (with confirmation)
- Password strength indicator

**Workspaces Tab**:
- List all workspace memberships
- Display role badges (owner/admin/member)
- Plan badges with tooltips
- Switch between workspaces
- Create new workspace
- Leave workspace (if not owner)
- Delete workspace (if owner)

**Danger Zone**:
- Account deletion with confirmation
- Warning about data loss
- Requires password verification
- Redirects to `/login?deleted=1` on success

**Layout**: Uses AppShell with navigation

**API Integration**:
- PATCH `/api/account/profile` (update name)
- PATCH `/api/account/password` (change password)
- GET `/api/workspaces` (fetch all memberships)
- POST `/api/workspaces` (create workspace)
- POST `/api/workspaces/[id]/switch` (switch active workspace)
- DELETE `/api/workspaces/[id]/members/[userId]` (leave workspace)
- DELETE `/api/workspaces/[id]` (delete workspace if owner)
- DELETE `/api/account` (delete account)

**Workspace Context**:
- Uses `WorkspaceProvider` to track current workspace
- Updates context on workspace switch
- Displays current workspace in AppShell sidebar

---

## APPENDIX B: Complete API Structure

### Authentication (2 routes)

#### 1. POST `/api/auth/signup`
**File**: `/src/app/api/auth/signup/route.ts`

**Purpose**: Create new user account and default workspace

**Request Body**:
```typescript
{
  name: string;
  email: string;
  password: string; // min 6 chars
}
```

**Response**:
```typescript
{ message: "User created successfully" } // 201
{ error: "User already exists" } // 400
```

**Flow**:
1. Validate input with Zod
2. Check if email already exists
3. Hash password with bcrypt
4. Create user in database
5. Create default workspace with plan from query param
6. Add user as workspace owner
7. Return success

---

#### 2. POST `/api/auth/[...nextauth]`
**File**: `/src/lib/auth.ts` (NextAuth configuration)

**Purpose**: Handle authentication via NextAuth

**Provider**: Credentials (email/password)

**Flow**:
1. User submits email/password
2. Find user by email
3. Compare password hash
4. Return user object or null
5. Create session with JWT

**Session Callback**: Adds `userId` and `workspaceId` to session

---

### Account Management (4 routes)

#### 3. PATCH `/api/account/profile`
**File**: `/src/app/api/account/profile/route.ts`

**Purpose**: Update user profile (name)

**Request Body**:
```typescript
{ name: string }
```

**Response**:
```typescript
{ user: { id, name, email } } // 200
```

**Auth**: Requires authenticated session

---

#### 4. PATCH `/api/account/password`
**File**: `/src/app/api/account/password/route.ts`

**Purpose**: Change user password

**Request Body**:
```typescript
{
  currentPassword: string;
  newPassword: string;
}
```

**Response**:
```typescript
{ message: "Password updated successfully" } // 200
{ error: "Current password is incorrect" } // 400
```

**Flow**:
1. Verify current password
2. Hash new password
3. Update in database

---

#### 5. GET `/api/account/workspaces`
**File**: `/src/app/api/account/workspaces/route.ts`

**Purpose**: Fetch all workspaces user belongs to

**Response**:
```typescript
{
  workspaces: Array<{
    id: string;
    name: string;
    plan: 'starter' | 'pro' | 'enterprise';
    role: 'owner' | 'admin' | 'member';
  }>
}
```

---

#### 6. DELETE `/api/account`
**File**: `/src/app/api/account/route.ts`

**Purpose**: Delete user account (cascade deletes workspaces owned)

**Request Body**:
```typescript
{ password: string }
```

**Response**:
```typescript
{ message: "Account deleted successfully" } // 200
```

**Flow**:
1. Verify password
2. Delete owned workspaces (cascade)
3. Remove from other workspaces
4. Delete user
5. Sign out

---

### Workspaces (7 routes)

#### 7. GET `/api/workspaces`
**File**: `/src/app/api/workspaces/route.ts`

**Purpose**: Fetch all workspaces for current user

**Response**:
```typescript
{
  workspaces: Array<{
    id: string;
    name: string;
    plan: string;
    role: string;
    createdAt: string;
  }>
}
```

---

#### 8. POST `/api/workspaces`
**File**: `/src/app/api/workspaces/route.ts`

**Purpose**: Create new workspace

**Request Body**:
```typescript
{
  name: string;
  plan?: 'starter' | 'pro' | 'enterprise';
}
```

**Response**:
```typescript
{ workspace: { id, name, plan } } // 201
```

**Flow**:
1. Create workspace
2. Add creator as owner
3. Return workspace

---

#### 9. GET `/api/workspaces/[workspaceId]`
**File**: `/src/app/api/workspaces/[workspaceId]/route.ts`

**Purpose**: Fetch single workspace details

**Response**:
```typescript
{
  workspace: {
    id: string;
    name: string;
    plan: string;
    members: Array<{ userId, role, user: { name, email } }>;
  }
}
```

---

#### 10. PATCH `/api/workspaces/[workspaceId]`
**File**: `/src/app/api/workspaces/[workspaceId]/route.ts`

**Purpose**: Update workspace (name, plan)

**Request Body**:
```typescript
{
  name?: string;
  plan?: 'starter' | 'pro' | 'enterprise';
}
```

**Auth**: Requires owner or admin role

---

#### 11. DELETE `/api/workspaces/[workspaceId]`
**File**: `/src/app/api/workspaces/[workspaceId]/route.ts`

**Purpose**: Delete workspace (cascade deletes sessions, processes)

**Auth**: Requires owner role

---

#### 12. POST `/api/workspaces/[workspaceId]/switch`
**File**: `/src/app/api/workspaces/[workspaceId]/switch/route.ts`

**Purpose**: Switch user's active workspace

**Response**:
```typescript
{ message: "Switched to workspace successfully" }
```

**Flow**: Updates session cookie with new workspaceId

---

#### 13. DELETE `/api/workspaces/[workspaceId]/members/[userId]`
**File**: `/src/app/api/workspaces/[workspaceId]/members/[userId]/route.ts`

**Purpose**: Remove member from workspace (or leave if self)

**Auth**: Owner can remove anyone, users can remove themselves

---

### Sessions (5 routes)

#### 14. GET `/api/sessions`
**File**: `/src/app/api/sessions/route.ts`

**Purpose**: Fetch all sessions for current workspace

**Response**:
```typescript
{
  sessions: Array<{
    id: string;
    title: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    _count: {
      processes: number;
      opportunities: number;
    };
  }>
}
```

**Query Params**: None (uses workspaceId from session)

---

#### 15. POST `/api/sessions`
**File**: `/src/app/api/sessions/route.ts`

**Purpose**: Create new session

**Request Body**:
```typescript
{
  title: string;
  description?: string;
}
```

**Response**:
```typescript
{ session: { id, title, description, createdAt } } // 201
```

---

#### 16. GET `/api/sessions/[sessionId]`
**File**: `/src/app/api/sessions/[sessionId]/route.ts`

**Purpose**: Fetch single session with messages

**Response**:
```typescript
{
  session: {
    id: string;
    title: string;
    description: string;
    messages: Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      createdAt: string;
    }>;
  }
}
```

---

#### 17. PATCH `/api/sessions/[sessionId]`
**File**: `/src/app/api/sessions/[sessionId]/route.ts`

**Purpose**: Update session title or description

**Request Body**:
```typescript
{
  title?: string;
  description?: string;
}
```

---

#### 18. DELETE `/api/sessions/[sessionId]`
**File**: `/src/app/api/sessions/[sessionId]/route.ts`

**Purpose**: Delete session (cascade deletes messages, processes, opportunities)

**Response**:
```typescript
{ message: "Session deleted successfully" }
```

---

### Chat & AI Orchestration (1 route)

#### 19. POST `/api/sessions/[sessionId]/chat`
**File**: `/src/app/api/sessions/[sessionId]/chat/route.ts`

**Purpose**: Send user message, get AI response, update process graph

**Request Body**:
```typescript
{
  message: string;
  processId?: string; // optional: continue existing process
}
```

**Response**: Server-Sent Events (SSE) stream
```typescript
data: {"type": "token", "content": "partial response"}
data: {"type": "workflowDelta", "delta": {...}}
data: {"type": "done"}
```

**Flow**:
1. Save user message to database
2. Build conversation context (recent messages + existing process)
3. Call OpenAI GPT-4 with system prompt
4. Stream assistant response token by token
5. Parse for workflow deltas in JSON blocks
6. Apply deltas to process graph:
   - Create/update process
   - Add/update/delete steps
   - Add/update/delete links
7. Save assistant message
8. Return process updates

**System Prompt**: Instructs AI to:
- Extract steps with: label, type, owner, inputs, outputs, frequency, duration
- Output JSON deltas for graph updates
- Maintain conversation context
- Be helpful and ask clarifying questions

**Delta Format**:
```typescript
{
  processName: string;
  processDescription: string;
  steps: Array<{
    id: string;
    label: string;
    stepType: string;
    owner: string;
    inputs: string[];
    outputs: string[];
    frequency: string;
    duration: string;
  }>;
  links: Array<{
    source: string; // step id
    target: string; // step id
  }>;
  removedStepIds: string[];
  removedLinkIds: string[];
}
```

---

### Processes (9 routes)

#### 20. GET `/api/processes`
**File**: `/src/app/api/processes/route.ts`

**Purpose**: Fetch all processes for workspace or session

**Query Params**:
- `workspaceId`: Filter by workspace
- `sessionId`: Filter by session

**Response**:
```typescript
{
  processes: Array<{
    id: string;
    name: string;
    description: string;
    steps: Array<ProcessStep>;
    links: Array<ProcessLink>;
  }>
}
```

---

#### 21. POST `/api/processes`
**File**: `/src/app/api/processes/route.ts`

**Purpose**: Create new process

**Request Body**:
```typescript
{
  name: string;
  description?: string;
  sessionId?: string;
}
```

---

#### 22. GET `/api/processes/[processId]`
**File**: `/src/app/api/processes/[processId]/route.ts`

**Purpose**: Fetch single process with steps and links

**Response**:
```typescript
{
  process: {
    id: string;
    name: string;
    description: string;
    steps: Array<{
      id: string;
      label: string;
      stepType: string;
      owner: string;
      inputs: string[];
      outputs: string[];
      frequency: string;
      duration: string;
      position: { x: number; y: number };
    }>;
    links: Array<{
      id: string;
      sourceStepId: string;
      targetStepId: string;
    }>;
  }
}
```

---

#### 23. PATCH `/api/processes/[processId]`
**File**: `/src/app/api/processes/[processId]/route.ts`

**Purpose**: Update process metadata

**Request Body**:
```typescript
{
  name?: string;
  description?: string;
}
```

---

#### 24. DELETE `/api/processes/[processId]`
**File**: `/src/app/api/processes/[processId]/route.ts`

**Purpose**: Delete process (cascade deletes steps, links, opportunities)

---

#### 25. POST `/api/processes/[processId]/steps`
**File**: `/src/app/api/processes/[processId]/steps/route.ts`

**Purpose**: Create new step in process

**Request Body**:
```typescript
{
  label: string;
  stepType: string;
  owner?: string;
  inputs?: string[];
  outputs?: string[];
  frequency?: string;
  duration?: string;
  position: { x: number; y: number };
}
```

---

#### 26. PATCH `/api/processes/[processId]/steps/[stepId]`
**File**: `/src/app/api/processes/[processId]/steps/[stepId]/route.ts`

**Purpose**: Update step details or position

**Request Body**:
```typescript
{
  label?: string;
  stepType?: string;
  owner?: string;
  inputs?: string[];
  outputs?: string[];
  frequency?: string;
  duration?: string;
  position?: { x: number; y: number };
}
```

---

#### 27. DELETE `/api/processes/[processId]/steps/[stepId]`
**File**: `/src/app/api/processes/[processId]/steps/[stepId]/route.ts`

**Purpose**: Delete step (cascade deletes connected links)

---

#### 28. POST `/api/processes/[processId]/links`
**File**: `/src/app/api/processes/[processId]/links/route.ts`

**Purpose**: Create link between steps

**Request Body**:
```typescript
{
  sourceStepId: string;
  targetStepId: string;
}
```

---

### Opportunities (3 routes)

#### 29. GET `/api/opportunities`
**File**: `/src/app/api/opportunities/route.ts`

**Purpose**: Fetch all opportunities for session or process

**Query Params**:
- `sessionId`: Filter by session
- `processId`: Filter by process

**Response**:
```typescript
{
  opportunities: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    impact: 'low' | 'medium' | 'high';
    effort: 'low' | 'medium' | 'high';
    processId: string;
    sessionId: string;
  }>
}
```

---

#### 30. POST `/api/opportunities/scan`
**File**: `/src/app/api/opportunities/scan/route.ts`

**Purpose**: AI-powered opportunity detection across processes

**Request Body**:
```typescript
{
  processIds: string[]; // 1 or more processes to analyze
  sessionId: string;
}
```

**Response**:
```typescript
{
  opportunities: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    impact: string;
    effort: string;
  }>
}
```

**Flow**:
1. Fetch all specified processes with steps
2. Build context string with process details
3. Call OpenAI GPT-4 with analysis prompt
4. Parse JSON response for opportunities
5. Save opportunities to database
6. Update session metadata (opportunity count)
7. Return opportunities

**AI Prompt**: Instructs GPT-4 to:
- Identify repetitive manual tasks
- Find data entry opportunities
- Spot integration gaps
- Suggest workflow optimizations
- Score impact and effort
- Categorize by type (RPA, Integration, Analytics, etc.)

---

#### 31. DELETE `/api/opportunities/[opportunityId]`
**File**: `/src/app/api/opportunities/[opportunityId]/route.ts`

**Purpose**: Delete single opportunity

---

### Tools (1 route)

#### 32. POST `/api/tools/test-llm`
**File**: `/src/app/api/tools/test-llm/route.ts`

**Purpose**: Test OpenAI connection (debugging endpoint)

**Request Body**:
```typescript
{ prompt: string }
```

**Response**:
```typescript
{ response: string } // GPT-4 response
```

---

### Webhooks (1 route - Optional)

#### 33. POST `/api/webhooks/clerk` (if using Clerk)
**File**: Not currently implemented (uses NextAuth instead)

**Purpose**: Handle Clerk webhook events

---

## Summary

**Total Pages**: 7 (3 public, 4 authenticated)
**Total API Routes**: 32 (across 8 categories)
**Authentication**: NextAuth with credentials provider
**Database**: PostgreSQL via Prisma with 11 models
**AI Integration**: OpenAI GPT-4 for chat orchestration and opportunity scanning
**Core UX Flow**: Login → Sessions List → Session Detail (Chat + Graph) → Edit Steps → Scan Opportunities

---

## Brand Voice & Copy Guidelines

### Tone
- Smart, witty, and slightly irreverent
- Confident without being arrogant
- Helpful and clear, not corporate-speak
- Playful where appropriate, professional where needed

### Examples From Codebase
- Landing page: "Where workflows actually make sense"
- Plan descriptions:
  - Starter: "Perfect for solo experiments"
  - Pro: "For teams actually shipping automations"
  - Enterprise: "Bring your lawyers"
- Empty states: Encouraging but not patronizing
- Error messages: Clear and actionable without being apologetic

### Writing Style
- Use contractions (you'll, we'll, don't)
- Active voice over passive
- Short, punchy sentences
- Avoid buzzwords and jargon
- Be specific, not vague

---

## Development Notes

### Running Locally
```bash
npm install
npm run dev
```

### Database Operations
```bash
npx prisma migrate dev  # Create migration
npx prisma db push      # Sync schema (no migration)
npx prisma generate     # Generate Prisma client
npx prisma studio       # Open database GUI
```

### Environment Variables Required
```
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."  # For Supabase connection pooling
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="sk-..."
```

### TypeScript Checking
```bash
npx tsc --noEmit
```

### Build
```bash
npm run build
```

---

## Known Issues & Technical Debt

### Current Issues
- None currently blocking development

### Technical Debt
- Consider implementing React Query for server state management
- Add more comprehensive error boundaries
- Implement rate limiting for API routes
- Add E2E tests with Playwright
- Consider adding Redis for session caching (enterprise feature)
- Implement webhook system for external integrations

### Future Enhancements
- Real-time collaboration (multiple users in same session)
- Export processes to various formats (PDF, PNG, Mermaid)
- Import processes from existing documentation
- Version control for processes
- Comments and annotations on workflow steps
- Approval workflows for governance
- Advanced analytics dashboard
- Integration marketplace

---

## Git Workflow

### Branch Strategy
- `main` - Production branch
- Feature branches: `feature/description`
- Bug fixes: `fix/description`

### Commit Message Format
```
type: Brief description

Longer explanation if needed

- Bullet points for details
- Multiple changes listed
```

**Types**: feat, fix, refactor, docs, style, test, chore

### Recent Commit History
```
7f86013 refactor: Major codebase cleanup and architecture consolidation
87bf8c9 fix: Pass sessionId when scanning for opportunities
9933d5b fix: Update session metadata when scanning opportunities via direct API
2418d63 debug: Add server-side logging to trace opportunity metadata flow
2589d1f debug: Add console logging to trace opportunity loading flow
```

---

## Deployment

### Platform
- Vercel (automatic deployments from `main` branch)
- Preview deployments for all PRs

### Database
- Supabase PostgreSQL (production)
- Connection pooling via PgBouncer

### Environment
- Production: https://betterthaninterns.vercel.app (example)
- Preview: Auto-generated URLs for each PR

---

## Support & Resources

### Documentation
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- React Flow: https://reactflow.dev/
- Shadcn/ui: https://ui.shadcn.com/
- NextAuth: https://next-auth.js.org/

### API Keys & Credentials
- Stored in Vercel environment variables
- Local development uses `.env.local`

---

**Last Updated**: December 13, 2025
**Document Version**: 1.4
**Current App Version**: Based on commit `6a4389a` (M22 Executive Process Visualization)
**Recent Milestones**: M18 (Sessions Page Executive Elevation), M19 (Session as Executive Working File), M20 (First-Run Experience), M21 (Decision Continuity), M22 (Executive Process Visualization)
