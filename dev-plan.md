# Better Than Interns – Development Plan (Trimmed for Devs)

Phase: **1 – Consulting Automation Suite (MVP + V1)**  
Scope: Conversational process mapping → Opportunity scanner → Tool recommendations → Blueprint generator.

This file is the *practical* version of the big development plan: use this for day-to-day implementation.

---

## 1. High-Level Goals

- Let a user:
  1. Create a workspace & project
  2. Map a process via chat + visual graph
  3. Scan that process for AI/automation opportunities
  4. See tool recommendations per opportunity
  5. Generate and export an implementation blueprint

- Keep architecture extendable toward:
  - AI governance
  - Policy, risk, compliance
  - Monitoring/AI inventory

- Optimize for:
  - Fast feedback loops
  - Clear UX
  - Minimal infra complexity

---

## 2. Stack (Practical Defaults)

If you pick something else, keep the same logical boundaries.

### Frontend & Backend
- **Next.js (App Router) + TypeScript**
- Use **Route Handlers** for backend API (`/app/api/...`)
- State:
  - React Query (server state)
  - Simple local state per view (or Zustand if needed)
- Styling:
  - Tailwind CSS
  - Components following `design-system.md`
- Graph:
  - React Flow (for process graph)

### Data & LLM
- **Database:** PostgreSQL
- **ORM:** Prisma
- **LLM:** OpenAI (GPT-4 or GPT-4.1) via API
- **Vector Store (optional later):** pgvector or Pinecone (don’t block v1 on this)

---

## 3. Core Data Model (Conceptual)

These map directly to Prisma models / SQL tables. Keep it simple but add indexes.

- `User`
- `Workspace`
- `WorkspaceMember` (role: owner/admin/member)
- `Project`
- `Process`
- `ProcessStep`
- `ProcessLink`
- `ChatSession`
- `ChatMessage`
- `Opportunity`
- `Tool`
- `OpportunityTool`
- `Blueprint`
- `BlueprintExport` (optional)

See `architecture.md` + the big SQL in the prior plan for detailed fields. Start with the core and add fields as needed:

### Minimum fields by entity

**ProcessStep**
- id
- processId
- title
- description
- owner
- inputs (JSON)
- outputs (JSON)
- frequency (string)
- duration (string)
- positionX, positionY (for graph layout)

**Opportunity**
- id
- processId
- stepId (nullable)
- title
- description
- opportunityType (string)
- impactLevel (low/medium/high) ← simpler than full ROI v1
- effortLevel (low/medium/high)
- impactScore (0–100)
- feasibilityScore (0–100)
- rationaleText

**Tool**
- id
- name
- vendor
- category (e.g. `ocr`, `workflow`, `rpa`)
- description
- useCases (JSON)
- pricingTier (string)
- integrationComplexity (string)
- securityNotes (JSON/text)
- websiteUrl

**Blueprint**
- id
- projectId
- title
- contentJson (full structured blueprint)
- renderedMarkdown
- createdAt / updatedAt

---

## 4. API Surface (Next.js Route Handlers)

Keep the endpoints logically identical to `api-spec.md`. Implement as:

- `/api/auth/signup`
- `/api/auth/login`
- `/api/workspaces`
- `/api/workspaces/[workspaceId]/projects`
- `/api/projects/[projectId]`
- `/api/projects/[projectId]/processes`
- `/api/processes/[processId]`
- `/api/processes/[processId]/steps`
- `/api/processes/[processId]/links`
- `/api/processes/[processId]/chat-sessions`
- `/api/chat-sessions/[chatSessionId]/messages`
- `/api/processes/[processId]/scan-opportunities`
- `/api/processes/[processId]/opportunities`
- `/api/opportunities/[opportunityId]/tools`
- `/api/projects/[projectId]/blueprints`
- `/api/blueprints/[blueprintId]`
- `/api/blueprints/[blueprintId]/export`

Incoming/outgoing shapes should match `api-spec.md` as much as possible.

---

## 5. Feature Breakdown by Module

### 5.1 Conversational Process Mapping (Module 1)

**Goal:**  
User describes their process in chat and sees a workflow graph build/adjust in real time.

**Frontend:**
- `ProcessMappingPage`
  - Left: `ChatPanel`
  - Right: `ProcessGraphCanvas`
- Chat interactions:
  - Send message → POST `/api/chat-sessions/[id]/messages`
  - Display history
- Graph:
  - Uses React Flow
  - Nodes = ProcessSteps
  - Edges = ProcessLinks
  - Clicking node opens `StepDetailsDrawer` (edit form)

**Backend:**
- Start chat:
  - POST `/api/processes/[processId]/chat-sessions`
- Message:
  - POST `/api/chat-sessions/[chatSessionId]/messages`
  - Build LLM prompt:
    - System: “process mapping assistant”
    - Context: process info, last N messages, current steps/links
  - Expect response:
    - `assistant_message` (string)
    - `workflow_delta` (JSON)
  - Apply delta:
    - Create/update steps
    - Create links
- Fetch process with graph:
  - GET `/api/processes/[processId]?includeGraph=true`

**Workflow Delta (MVP schema):**
```jsonc
{
  "new_steps": [
    {
      "temp_id": "str",
      "title": "Receive invoice by email",
      "description": "Inbox receives PDF invoices",
      "owner": "AP",
      "inputs": ["Vendor email"],
      "outputs": ["Stored PDF"],
      "frequency": "Daily",
      "duration": "5 minutes"
    }
  ],
  "updated_steps": [
    {
      "id": "existing-step-id",
      "updates": {
        "title": "Updated title"
      }
    }
  ],
  "new_links": [
    {
      "from_step": "existing-or-temp-id",
      "to_step": "existing-or-temp-id",
      "label": "then"
    }
  ]
}
```

---

### 5.2 AI Opportunity Scanner (Module 2)

**Goal:**  
Given a process (steps), highlight which steps are best candidates for AI/automation.

**Frontend:**
- “Scan for AI Opportunities” button on Process Mapping page
- `OpportunitiesPanel`:
  - List of opportunities (title, step, impact/effort)
  - Clicking one:
    - Highlights step on graph
    - Shows detailed rationale

- Heatmap:
  - Steps color-coded by impact (low/medium/high)

**Backend:**
- Endpoint:
  - POST `/api/processes/[processId]/scan-opportunities`
- Logic:
  1. Load all steps
  2. For each step:
     - Compute simple heuristics:
       - If frequency suggests repetition
       - If duration > threshold
       - If description hints at manual data entry, document processing, etc.
     - Call LLM with a small prompt for scoring + rationale
  3. Store in `Opportunity` table.

**Simplified LLM output:**
```jsonc
{
  "title": "Automate invoice data extraction",
  "opportunity_type": "document_processing",
  "impact_level": "high",
  "effort_level": "medium",
  "impact_score": 85,
  "feasibility_score": 75,
  "rationale": "Step is repetitive, time-consuming, and document-based..."
}
```

Keep ROI numeric fields optional or derived later.

---

### 5.3 Tool Matching Engine (Module 3)

**Goal:**  
For each opportunity, suggest a few tools that make sense.

**Frontend:**
- For an opportunity:
  - “View recommended tools” button
- `ToolList`:
  - Cards: name, summary, category, “why it fits”, match score
  - Filters: category, pricing, complexity
  - Checkbox: “Include in blueprint”

**Backend:**
- Tools are seeded manually at first.
- Endpoint:
  - GET `/api/opportunities/[opportunityId]/tools`
- Matching logic (no vector store needed initially):
  - Map `opportunity_type` → relevant tool categories
  - Filter by:
    - category
    - pricingTier
    - integrationComplexity
  - Rank by:
    - Hard-coded weights per category, plus maybe simple text matching on useCases.

**Optional LLM:**
- Generate the rationale text for why tool X fits opportunity Y.

---

### 5.4 Blueprint Generator (Module 4)

**Goal:**  
Turn everything into a readable, exportable plan.

**Frontend:**
- `BlueprintPage`:
  - Exec summary
  - Current state (text)
  - List of opportunities and selected tools
  - 3-phase roadmap
  - Risks & mitigations
  - KPIs
- Buttons:
  - “Generate blueprint”
  - “Export Markdown”
  - “Export PDF” (if implemented)

**Backend:**
- Endpoint:
  - POST `/api/projects/[projectId]/blueprints`
  - GET `/api/blueprints/[blueprintId]`
  - GET `/api/blueprints/[blueprintId]/export?format=markdown|pdf`

- Generation steps:
  1. Collect:
     - Project info
     - Processes + steps
     - Opportunities
     - Selected tools (OpportunityTool)
  2. Build LLM prompt with all above.
  3. LLM returns structured JSON for sections:
     - `executiveSummary`
     - `currentState`
     - `targetState`
     - `phases[]`
     - `risks[]`
     - `kpis[]`
  4. Render `contentJson` → `renderedMarkdown` via template.
  5. Save blueprint.

PDF can be a second step using Puppeteer or a service later.

---

## 6. Milestones (Compressed View)

### Milestone 0 – Walking Skeleton (3–5 days)
- Next.js app running
- Basic auth (even mock)
- Can create project
- Hardcoded demo process graph
- Test LLM call from UI

### Milestone 1 – Process Mapping MVP (Weeks 1–3)
- Real auth + DB wired (users, workspaces, projects, processes, steps, links)
- Process Mapping page:
  - Chat panel
  - Graph panel
- Chat → LLM → workflow_delta → DB → graph update
- Manual step/link editing

**Done when:** User can go from 0 to a simple mapped process using chat.

---

### Milestone 2 – Opportunity Scanner (Weeks 4–6)
- Scan endpoint implemented
- Simple rule + LLM hybrid scoring
- Opportunities stored and visualized:
  - List with impact/effort + rationale
  - Graph heatmap

**Done when:** User can scan a mapped process and see which steps are good AI candidates.

---

### Milestone 3 – Tool Matching (Weeks 7–9)
- Tool model & admin seeding
- Matching API based on opportunityType + filters
- UI to view & select tools

**Done when:** User can open an opportunity, see 3–5 tools with explanations, and flag selected ones.

---

### Milestone 4 – Blueprint (Weeks 10–12)
- Blueprint generation service (LLM-based)
- Blueprint view page
- Markdown export (PDF optional)

**Done when:** User can click “Generate blueprint” and get a usable, structured implementation plan.

---

### Milestone 5 – Polish & Prep (Weeks 13–16)
- Error handling, loading states
- Prompt tweaks from real usage
- Basic logging, analytics
- Small UX improvements per `wireframes.md`
- Stability for real users

---

## 7. Practical Priorities

When in doubt, prioritize:

1. **Core flows over options**
   - One way to map a process → one way to scan → one way to generate a blueprint

2. **Text + simple visuals over perfection**
   - Don’t over-engineer diagrams or ROI math on v1

3. **Deterministic + editable**
   - Always let the user manually fix what the LLM produces (steps, links, descriptions)

4. **Small prompt payloads**
   - Use summaries and IDs instead of dumping full DB into the prompt

---

## 8. Things to Explicitly Defer (Not for Phase 1)

- Full-blown compliance / governance / risk scoring
- AI inventory auto-discovery
- Per‑process policy generation
- Vector search or embeddings (unless trivial to add)
- SSO integrations
- Multi-region data residency
- Fancy analytics dashboards

You can safely build all of Phase 1 without these.

---

This `dev-plan.md` should be your coding agent’s main execution guide, alongside:

- `prd.md` for *what* it must do
- `architecture.md` for the big-picture structure
- `wireframes.md` for how screens should feel
- `api-spec.md` for exact endpoint shapes
- `brand.md` + `copywriting.md` for tone
