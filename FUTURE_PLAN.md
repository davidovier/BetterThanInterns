# Better Than Interns – FUTURE_PLAN.md  
**Version:** 1.0  
**Last Updated:** 2025-12-12  

> This document describes the **future roadmap** for Better Than Interns, focused on evolving the product from a powerful session-based internal tool into a **premium, CEO-ready, $150k+ ARR product**.  
>  
> It is intended as a **source of truth** for:
> - Product & UX decisions  
> - AI orchestration behavior  
> - Coding agents implementing milestones  
> - Prompt engineering & system prompts  

---

## 0. Guiding Principles

1. **Session-first, assistant-first**
   - The *session* is the primary object. Everything else (processes, opportunities, blueprints, governance) is a byproduct and artifact of conversations with the assistant.
   - The assistant should feel like a **thinking partner**, not a form.

2. **Premium, CEO-ready UX**
   - Visual design must feel **high-end, minimal, and confident**.
   - Animations and motion are purposeful, not noisy.
   - The app should feel like a “control room” for operations, not a generic SaaS grid.

3. **Serious value, playful voice**
   - Voice: smart, witty, slightly irreverent — but never flippant about risk, governance, or money.
   - Copy favors clarity over buzzwords.

4. **Human-in-the-loop by default**
   - AI proposes. Humans approve.  
   - Governance, risk, and decisions are always overrideable by humans.

5. **Additive, non-breaking evolution**
   - Each milestone is incremental and **does not break existing flows**.
   - Stripe, billing, and auth must remain stable.

6. **“Safe defaults, powerful expert mode”**
   - Default flows are opinionated and simple.
   - Power users get deep configurability (later milestones).

---

## Milestone Overview (M17 → M25)

- **M17 – Assistant Presence Layer (APL)**
- **M18 – Workspace Memory Engine**
- **M19 – Tool Evaluator & Marketplace Layer**
- **M20 – Visual Blueprint Engine**
- **M21 – Enterprise Governance Mode**
- **M22 – Executive Sessions Dashboard**
- **M23 – Collaboration & Comments**
- **M24 – Export & Share Suite**
- **M25 – Monetization Framework**

---

## M17 – Assistant Presence Layer (APL)

**Status:** ✅ **COMPLETED** (December 12, 2025)

### Goal

Make the assistant feel like a **visible, animated presence** in the app, not just a stream of text — while keeping everything subtle, premium, and non-gimmicky.

### Rationale

- Today, users see **chat messages and artifacts** but no sense of “an agent at work”.
- We want the experience to feel like working with a **real AI operations consultant**.
- This directly improves perceived value and “magic”.

### User Stories

1. *As a user*, I want to **see when the assistant is thinking / analyzing** so I trust the system is working.
2. *As a user*, I want **small visual cues** when the assistant updates processes, opportunities, or governance.
3. *As a user*, I want the UI to feel **alive but not distracting**.

### Requirements

#### UX / Design

- Add a small **Assistant Avatar/Orb** component:
  - Appears in the session header or near the input area.
  - Has visual states:
    - `idle` – calm breathing animation
    - `listening` – reacts when user is typing
    - `thinking` – pulsing / subtle glow when LLM is active
    - `updating_workspace` – subtle ripple when artifacts are being modified
  - Uses **simple gradients & motion**, not cartoon faces.

- Chat input “state pulse”:
  - While orchestrate endpoint is running:
    - Input border & icon show animated gradient.
  - When errors happen:
    - Brief red pulse + inline message.

- Artifact highlight:
  - When a new process/opportunity/blueprint/governance artifact is created:
    - Card enters with **Framer Motion** animation.
    - 2–3 second ring/highlight pulse.
    - Then settles into static state.

#### Frontend / Implementation

- New component: `AssistantPresence`:
  - Props: `state: 'idle' | 'listening' | 'thinking' | 'updating' | 'error'`
  - Used on `/sessions/[sessionId]`.

- Connect presence state to orchestration:
  - When user sends a message:
    - state: `thinking`
  - When orchestrate returns artifacts:
    - state: `updating`
  - After completion:
    - state: `idle` (after short delay).
  - On error:
    - state: `error` then fall back to `idle`.

- Integrate with existing `SessionChatPane` & `UnifiedSessionWorkspace`:
  - Pass presence state as derived from request lifecycle.

#### Backend / Orchestration

- No major backend changes required.
- Just ensure orchestrate API exposes:
  - `isStreaming` or allow frontend to infer from request lifecycle.
  - Optional: send lightweight “phase” hints (`analyzing`, `calling_actions`, `saving_artifacts`) via response metadata in future.

### Non-Goals

- No voice or audio.
- No avatars with human faces.
- No advanced agent simulation beyond visual states.

### Acceptance Criteria

- ✅ Assistant presence appears consistently on session detail page.
- ✅ Presence state updates when:
  - User sends a message.
  - AI is thinking.
  - Artifacts are created/updated.
- ✅ New artifacts show a brief highlight pulse.
- ✅ All animations feel smooth and **do not hurt readability**.
- ✅ No regressions in session flow or errors in console.

---

## M18 – Workspace Memory Engine

### Goal

Give the assistant **memory across sessions** so users don’t have to repeat themselves. The system should recall previous processes, opportunities, and governance decisions to inform new work.

### Rationale

- Current behavior: each session is largely **isolated**.
- Future product: “This feels like a consultant that knows our business.”
- Memory dramatically increases perceived intelligence and stickiness.

### User Stories

1. *As a user*, I want the assistant to **reuse processes** from previous sessions if I mention them.
2. *As a user*, I want the assistant to **remember key facts** about my business (teams, departments, key flows).
3. *As a user*, I want to ask: “Use the same approval flow we discussed last week” — and it should work.

### Requirements

#### Data Model

- New table: `WorkspaceMemoryChunk`:
  - `id`
  - `workspaceId`
  - `sourceType` (`'session' | 'process' | 'opportunity' | 'governance' | 'manual'`)
  - `sourceId` (nullable; e.g. sessionId, processId)
  - `title` (short label)
  - `summary` (short natural language)
  - `embedding` (vector, or JSON if external vector store)
  - `createdAt`, `updatedAt`

- Minimal memory footprint:
  - Only store **high-value summaries**, not raw chat history.

#### Backend / Orchestration

- On selected events:
  - Session summary created/updated (M12/M14).
  - Process saved/refined.
  - Blueprint generated.
  - Governance entity finalized.

  → Create or update a `WorkspaceMemoryChunk`.

- Retrieval:
  - On orchestrate request:
    - Build a semantic query from:
      - Current user message
      - Session context summary
    - Retrieve top N chunks for the workspace (e.g. N=5).
    - Inject chunks into the LLM system prompt or context:
      - As “known facts about this workspace”.

- Must be **optional**:
  - System behaves correctly even if memory table is empty.

#### UX / Assistant Behavior

- Assistant responses may reference memory explicitly:
  - “Last month you mapped a similar process in Procurement; I’ll reuse that pattern.”
- For now, no separate UI for memory; it is a **behavioral upgrade**.

### Non-Goals

- No full-chat vectorization of every message.
- No user-facing “memory management UI” yet (future feature).

### Acceptance Criteria

- ✅ New memory chunks created when:
  - Session summaries are saved.
  - Processes or blueprints reach a stable state.
- ✅ Orchestration pipeline retrieves memory for each request and includes it in prompt.
- ✅ Assistant can successfully reuse prior knowledge in test scenarios (e.g. second session referencing first).
- ✅ No significant latency regression (> ~500ms) for orchestrate calls.

---

## M19 – Tool Evaluator & Marketplace Layer

### Goal

Turn the app into an **AI-powered evaluator of tools** (RPA, AI APIs, SaaS, etc.) so that users not only find opportunities but can also **select the best tools** to implement them.

### Rationale

- Today: opportunities are conceptual and partially mapped to tools.
- Future: app must answer “What should we actually use?” in a credible way.
- This is a **massive differentiator** vs generic “AI brainstorming” tools.

### User Stories

1. *As an ops/AI lead*, I want the assistant to **recommend tools** for a specific opportunity.
2. *As a user*, I want a **scorecard** comparing candidate tools.
3. *As a decision maker*, I want to see **estimated cost, integration difficulty, and risk.**

### Requirements

#### Data Model

- Extend `Tool` model:
  - `category` (e.g. `rpa`, `nlp`, `workflow`, `integration`, `analytics`)
  - `pricingModel` (`subscription`, `usage_based`, `one_time`, `unknown`)
  - `hasApi` (boolean)
  - `integrationTags` (JSON array: e.g. `["salesforce", "slack"]`)
  - `dataResidency` (e.g. `eu`, `us`, `global`)
  - `securityNotes` (text)

- Add `OpportunityToolEvaluation` (future-proof, can start simple):
  - `id`
  - `opportunityId`
  - `toolId`
  - `fitScore` (0–100)
  - `riskScore` (0–100)
  - `notes` (text)
  - `createdAt`, `updatedAt`

#### Backend / AI

- AI evaluation endpoint:
  - `POST /api/opportunities/[id]/evaluate-tools`
  - Inputs:
    - Opportunity details
    - Available tools list (subset or all)
  - Output:
    - Ranked list of tools with:
      - Fit score
      - Reasons
      - Risk considerations
      - Implementation notes

- Orchestrator action:
  - New intent: `tool_evaluation_request`.
  - Router decides when user asks:
    - “What should we use for this?”
    - “Recommend tools for this flow.”

#### UX

- In Session artifact pane:
  - For opportunities:
    - Add “Evaluate tools” button.
    - Show resulting tool cards with scores.
    - Optionally show “Top Pick” badge.

- In a future dedicated Tools view (M19+):
  - Show global list with filters.

### Non-Goals

- No payments / referral system for tools.
- No public marketplace yet; internal evaluation only.

### Acceptance Criteria

- ✅ For a given opportunity, user can trigger “Evaluate tools”.
- ✅ AI returns a ranked list of at least 3 tools (when available).
- ✅ Each tool shows a fit score and a brief rationale.
- ✅ Evaluations are stored and visible on re-open of the opportunity.
- ✅ No breaking changes to existing opportunities API.

---

## M20 – Visual Blueprint Engine

### Goal

Move from **static Markdown blueprints** to a **visual, timeline-based implementation plan** that executives can actually use to run a project.

### Rationale

- Right now, blueprints = text reports.
- For buyers, **visual planning and timelines** signal real implementation readiness.
- This milestone turns blueprints into a tangible deliverable.

### User Stories

1. *As a user*, I want a **visual roadmap** of implementation phases.
2. *As a PM / exec*, I want to see **who does what, when, and with what risk**.
3. *As a team*, I want to share this blueprint with stakeholders.

### Requirements

#### Data Model

- Add `BlueprintPhase` model:
  - `id`
  - `blueprintId`
  - `name`
  - `startOffsetDays` (relative to project start)
  - `durationDays`
  - `ownerRole` (`IT`, `Ops`, `Finance`, etc.)
  - `riskLevel` (`low`, `medium`, `high`)
  - `status` (`planned`, `in_progress`, `completed`)

- Add `BlueprintMilestone` (optional, can be deferred):
  - `id`
  - `blueprintId`
  - `title`
  - `description`
  - `targetDayOffset`
  - `ownerRole`

#### Backend / AI

- AI action: `generate_visual_blueprint`:
  - Input:
    - One or more opportunities
    - Optional target timeframe (e.g. 90 days)
  - Output:
    - Phases & milestones
    - Risk annotations
    - Dependencies (could be implicit initially)

- Endpoint:
  - `POST /api/blueprints/[id]/visualize` or incorporated into existing blueprint creation.

#### UX

- New `VisualBlueprintView` component:
  - Timeline (horizontal scroll) with phases as bars.
  - Colored by risk and/or status.
  - Hover → see details (owner, description).
  - Optionally swimlanes by ownerRole.

- Session artifact panel:
  - Blueprint card shows:
    - Count of phases
    - Duration (total estimated)
    - Risk summary.

### Non-Goals

- No full project management (resourcing, dependencies engine).
- No integration with Jira/Linear yet.

### Acceptance Criteria

- ✅ Blueprints now have structured phase data saved in DB.
- ✅ Users can open a blueprint and see a visual timeline.
- ✅ AI can generate initial phases for a blueprint from opportunities.
- ✅ Existing textual content is still available (Markdown section).
- ✅ No regressions for existing blueprint usage.

---

## M21 – Enterprise Governance Mode

### Goal

Introduce a **governance mode** suitable for enterprise buyers: approvals, auditability, and policy mapping that go beyond G2–G3.

### Rationale

- Governance is where enterprise buyers **justify paying**.
- Need to move from “we have some governance fields” → “this can pass a risk/compliance review”.

### User Stories

1. *As a compliance officer*, I want to **approve or reject** use cases with comments.
2. *As a risk manager*, I want risk levels to **require specific controls**.
3. *As an exec*, I want a quick view of **governance status** across all AI use cases.

### Requirements

#### Data Model Enhancements

- `AiUseCase`:
  - Add `status`: (`draft`, `in_review`, `approved`, `rejected`, `retired`)
  - Add `owner` (string or FK to user later)
  - Add `reviewer` (string or FK)
  - Add `reviewNotes` (text)

- `AiPolicyMapping`:
  - Extend with:
    - `evidenceLink` (string, optional)
    - `lastEvidenceAt` (DateTime?)

#### Backend / Workflow

- New endpoints:
  - `POST /api/ai-use-cases/[id]/submit-for-review`
  - `POST /api/ai-use-cases/[id]/approve`
  - `POST /api/ai-use-cases/[id]/reject`
  - These enforce basic rules (e.g., only certain roles can approve).

- Role-based checks:
  - Introduce simple `workspaceRole` or `governanceRole` usage in existing `WorkspaceMember`.

#### UX

- Session artifact card for governance:
  - Show status with badge (Draft / In Review / Approved / Rejected).
  - Buttons:
    - “Submit for review” (for owners).
    - “Approve” / “Reject” (for reviewers).

- Governance overview (later; could be small summary first):
  - Shows number of use cases by status.
  - Filter by risk level.

### Non-Goals

- No fully configurable approval workflow designer.
- No SLA reminders or scheduled reviews yet.

### Acceptance Criteria

- ✅ Each AI use case has a status and owner.
- ✅ Users can submit a use case for review, and a reviewer can approve/reject it.
- ✅ Governance status is visible in session UI and in any global view.
- ✅ API enforces basic access rules for approval actions.

---

## M22 – Executive Sessions Dashboard

### Goal

Upgrade `/sessions` from “list of session cards” into an **executive control center**: a place where CEOs/Execs see operational intelligence at a glance.

### Rationale

- First impression post-login for most users.
- High-ARR customers expect **polished analytics and a command center feel**.

### User Stories

1. *As a CEO / exec*, I want to see **what the assistant has been working on** across the company.
2. *As an ops leader*, I want a **quick view of new opportunities and in-progress blueprints**.
3. *As a user*, I still need a simple way to create/join sessions.

### Requirements

#### UX / Visual

- Two main zones:
  1. **Executive overview** (top)
     - Metrics:
       - Sessions this week
       - Opportunities found
       - New blueprints
       - AI use cases in review
     - Small trends (e.g., sparkline for weekly sessions).
  2. **Session list** (bottom)
     - Similar card layout as today, but:
       - Cleaner, more minimal design
       - Less gradient noise
       - Stronger hierarchy (title, summary, last activity)

- High-end aesthetic:
  - Subtle 3D / parallax or gradient background (no cartoonish visuals).
  - Motion used carefully (Framer Motion, maybe R3F for background content if/when appropriate).

#### Backend / Data

- New statistics endpoint:
  - `GET /api/workspaces/[workspaceId]/stats/overview`
  - Returns:
    - `sessionsLast7Days`
    - `opportunitiesLast7Days`
    - `blueprintsLast7Days`
    - `aiUseCasesInReview`
    - Possibly per-day counts for trends.

### Non-Goals

- No real-time analytics streaming.
- No fully interactive charts beyond simple trends.

### Acceptance Criteria

- ✅ `/sessions` shows:
  - Executive metrics row.
  - Session cards with more professional design.
- ✅ Metrics are accurate and update based on actual usage.
- ✅ No loss of functionality for creating/renaming/deleting sessions.

---

## M23 – Collaboration & Comments

### Goal

Support **multi-user collaboration** around processes, opportunities, and governance.

### Rationale

- For team adoption, users must be able to **discuss and annotate** artifacts.
- Collaboration is key to seat expansion and ARR growth.

### User Stories

1. *As a teammate*, I want to **comment on a process step** to ask questions.
2. *As an approver*, I want to leave **feedback on an opportunity before implementation**.
3. *As a team*, I want to @mention colleagues.

### Requirements

#### Data Model

- `Comment` model:
  - `id`
  - `workspaceId`
  - `authorId`
  - `targetType` (`session`, `process`, `process_step`, `opportunity`, `ai_use_case`, etc.)
  - `targetId`
  - `content` (text)
  - `mentions` (JSON array of userIds or emails)
  - `createdAt`, `updatedAt`

#### Backend

- Endpoints:
  - `GET /api/comments?targetType=&targetId=`
  - `POST /api/comments`
  - `PATCH /api/comments/[id]` (maybe)
  - `DELETE /api/comments/[id]`

- Optional: Webhooks / realtime:
  - Later, integrate Supabase Realtime or Pusher for real-time updates.

#### UX

- Comments UI:
  - Inline comment section for:
    - process details
    - opportunity cards
    - governance cards
  - Show avatar, name, timestamp.
  - Simple `@mention` highlighting (no full suggestion dropdown required initially).

### Non-Goals

- No Google Docs-style simultaneous editing.
- No advanced permission settings per artifact yet.

### Acceptance Criteria

- ✅ Users can add comments to key artifacts.
- ✅ Comments are persisted and displayed correctly.
- ✅ @mentions are visually highlighted (even if no notification yet).
- ✅ No major UX regressions in session page.

---

## M24 – Export & Share Suite

### Goal

Allow users to **export and share** their work in formats that executives and stakeholders can consume easily (PDF, read-only links, etc.).

### Rationale

- Decision-makers often live in email, PDFs, slides, or Notion.
- Exporting is essential for selling the product into organizations.

### User Stories

1. *As a user*, I want to export a blueprint as a **PDF** to send to stakeholders.
2. *As a consultant*, I want to **share a read-only link** to a session’s artifacts.
3. *As an exec*, I want to see a **pretty, branded PDF** for board or steering committee.

### Requirements

#### Export

- PDF Export:
  - Server-side generation of:
    - Summary
    - Process diagrams (image or simplified representation)
    - Opportunities list
    - Blueprint phases (if M20 done)
    - Governance overview (if available)

- API:
  - `POST /api/exports/session/[sessionId]/pdf`
  - Returns a file URL or direct file download.

#### Sharing

- Shareable Link:
  - `SharedView` model:
    - `id`
    - `workspaceId`
    - `sessionId`
    - `expiresAt` (nullable)
    - `token` (random string)
  - Public route:
    - `/share/[token]` – read-only view of session artifacts.

- Share Management:
  - In-session UI:
    - “Create share link”
    - “Copy link”
    - Options:
      - Expiry (7 days / 30 days / never)

### Non-Goals

- No deep access controls beyond “anyone with link can view”.
- No online editing for shared views.

### Acceptance Criteria

- ✅ Users can generate a PDF for a session and download it.
- ✅ Shared link loads a read-only view of session artifacts with no auth.
- ✅ Expired links yield an appropriate error page.
- ✅ No sensitive account settings exposed in shared view.

---

## M25 – Monetization Framework

### Goal

Move from “Stripe is wired but optional” to a **real monetization model** with usage awareness, plan-based feature gating, and admin visibility.

### Rationale

- You want to flip the Stripe key on and be instantly ready to charge.
- Need a clear mapping between **usage, limits, and value**.

### User Stories

1. *As an admin*, I want to see how much **AI usage** my workspace is consuming.
2. *As a buyer*, I want a clear reason to upgrade from Starter → Pro → Enterprise.
3. *As the product owner*, I want to **hard/soft gate features** based on plan.

### Requirements

#### Data Model

- `BillingUsage` table:
  - `id`
  - `workspaceId`
  - `periodStart`, `periodEnd`
  - `totalLlmTokens` (approx or actual)
  - `totalSessions`
  - `totalProcesses`
  - `totalOpportunities`
  - `totalBlueprints`
  - `totalAiUseCases`
  - `createdAt`, `updatedAt`

- Plan definitions (code-config):
  - `Starter`:
    - Limits: e.g. max sessions, max monthly LLM tokens
  - `Pro`:
    - Higher limits, governance mode, tool evaluator, visual blueprints
  - `Enterprise`:
    - No limits, custom features, SLAs, SSO (future).

#### Backend

- Consumption tracking:
  - Every orchestrate call increments token usage estimates.
  - Every new artifact increments relevant counters.

- Feature gating:
  - Server-side checks for plan where necessary (e.g., certain endpoints return 402/403 if over plan).

#### UX

- Account/Billing tab:
  - Shows:
    - Current usage vs limits.
    - Plan features comparison.
    - Upgrade buttons (to existing Stripe flow from M11).

- In UX:
  - Soft gates:
    - Show “You’re close to your Starter limit, consider upgrading.”
  - Hard gates (only where appropriate):
    - “You’ve hit your Starter limit for sessions this month. Upgrade to continue.”

### Non-Goals

- No fully dynamic per-seat pricing yet.
- No complex overage billing; start with simple plan gating.

### Acceptance Criteria

- ✅ Usage counters are tracked correctly per workspace.
- ✅ Billing tab surfaces usage and plan details clearly.
- ✅ Stripe integration still works and upgrades plans correctly.
- ✅ At least one feature (e.g., visual blueprint or governance mode) is gated by plan.

---

## Final Notes for Coding Agents & Prompts

- This document is **canonical**. When in doubt about what to build next, check here.
- Each milestone should:
  - Be additive.
  - Preserve existing flows.
  - Keep the app in a deployable state (build passes, no runtime errors).
- If a milestone is partially implemented:
  - Update this file with **what is truly done** and what is scoped to future Mx.y sub-milestones.

> The future version of Better Than Interns is not just a process mapper.  
> It is an **AI operations consultant** — with memory, governance, tools intelligence, and premium UX — that CEOs and teams trust to design and ship real automations.
