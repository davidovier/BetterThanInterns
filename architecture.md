# Better Than Interns – Architecture

## 1. Overview

Better Than Interns is a SaaS platform that:
- Collects process information via a conversational UI.
- Builds structured workflow models.
- Analyzes them for AI/automation opportunities.
- Recommends tools.
- Generates implementation blueprints.

The system is designed as:
- A **web frontend** (SPA/SSR) for users.
- A **backend API** for business logic.
- An **LLM orchestration layer**.
- A **relational database** for core entities.
- Optionally a **vector store** for semantic search (tool matching, prior cases).

This file focuses on **Phase 1** (consulting automation suite) and is extendable to an AI Governance OS later.

---

## 2. High-Level Components

### 2.1 Frontend
- Technology: React or Next.js (TypeScript).
- Responsibilities:
  - Authentication & user sessions.
  - Chat-based process mapping interface.
  - Workflow graph visualization.
  - Opportunities & heatmap views.
  - Tool recommendation screens.
  - Blueprint view & export triggers.
  - Basic settings / workspace management.

### 2.2 Backend API
- Technology: Node.js (Express/Nest) or Python (FastAPI/Django REST).
- Responsibilities:
  - User & workspace management.
  - Projects / processes / steps CRUD.
  - Orchestration of LLM calls.
  - ROI and opportunity scoring.
  - Tool matching logic.
  - Blueprint generation coordination.
  - Export preparation (PDF/Doc/JSON).
- Style: REST API (future-ready for GraphQL if needed).

### 2.3 LLM Orchestration Layer
- Purpose:
  - Drive the conversational assistant.
  - Convert unstructured text to structured workflow JSON.
  - Generate narrative sections for blueprints.
  - Summarize tools, explain recommendations.
- Features:
  - Prompt templates for each task.
  - Safety and truncation handling.
  - Deterministic wrappers for structured output (JSON schema).

### 2.4 Database
- Technology: PostgreSQL (recommended).
- Core tables (Phase 1):
  - `users`
  - `workspaces`
  - `projects`
  - `processes`
  - `process_steps`
  - `process_links` (edges between steps)
  - `opportunities`
  - `tools`
  - `opportunity_tools` (link table)
  - `blueprints`
  - `chat_sessions`
  - `chat_messages`
- Ensure multi-tenant separation at the workspace level.

### 2.5 Vector Store (Optional, Recommended)
- Used for:
  - Tool matching (semantic similarity).
  - Future: reuse of previous workflows and patterns.
- Entities indexed:
  - Tool descriptions.
  - Process step descriptions.
  - Opportunity descriptions.

---

## 3. Data Flow Overview

### 3.1 Process Mapping Flow
1. User opens a **project**.
2. User opens **Process Mapping** view.
3. User chats with **Process Assistant**.
4. Frontend sends messages to `/chat/{sessionId}`.
5. Backend:
   - Includes context (project, prior steps).
   - Calls LLM with system + user prompts.
   - Receives both:
     - Natural language reply.
     - Structured workflow delta (JSON).
6. Backend stores:
   - Chat message.
   - New/updated `process_steps` and `process_links`.
7. Frontend updates:
   - Chat UI.
   - Graph visualization.

### 3.2 Opportunity Scanning Flow
1. User clicks **“Scan for AI Opportunities”** on a process.
2. Backend loads:
   - All steps, links, meta (frequency, duration, owner).
3. Backend runs:
   - Rule-based filters (repetitive, decision-heavy, data-heavy).
   - LLM scoring (narrative + classification).
4. Backend writes:
   - `opportunities` records (with score, rationale, ROI estimate).
5. Frontend:
   - Renders list of opportunities.
   - Adds heatmap coloring to steps in graph.

### 3.3 Tool Matching Flow
1. User selects one or more opportunities.
2. Backend:
   - Builds a query from:
     - Opportunity type.
     - Industry.
     - Data sensitivity.
     - Rough budget.
   - Performs:
     - Structured filter in `tools` table.
     - Optional vector similarity search.
3. Backend returns:
   - Ranked list of tools per opportunity.
4. User can:
   - Accept/reject recommendations.
   - Lock chosen tools for blueprint.

### 3.4 Blueprint Generation Flow
1. User clicks **“Generate Blueprint”** for a project.
2. Backend:
   - Assembles:
     - Current workflows.
     - Selected opportunities.
     - Selected tools.
     - ROI estimates.
   - Calls LLM with a blueprint template.
   - Produces:
     - Narrative plan sections.
     - A structured timeline (phases, tasks).
3. Backend stores:
   - `blueprints` record with JSON + rendered artifacts.
4. Frontend:
   - Displays blueprint view.
   - Offers export to PDF/Markdown/etc.

---

## 4. Module-to-Component Mapping

### Conversational Process-Mapping Assistant
- Frontend:
  - Chat UI, process graph canvas.
- Backend:
  - `/chat-sessions`, `/chat-messages`.
  - `process` and `process_step` CRUD.
- LLM:
  - Prompt templates for extracting steps, roles, data flows.

### AI Opportunity Scanner
- Backend:
  - `scanner` service (rule + LLM hybrid).
  - `/processes/{id}/scan-opportunities`.
- Data:
  - `opportunities` table.
- Frontend:
  - Opportunity list view.
  - Graph heatmap overlay.

### AI Tool Matching Engine
- Backend:
  - `tools` catalog management.
  - `/opportunities/{id}/tools`.
- Vector store:
  - For semantic matching (if used).
- Frontend:
  - Tool recommendation cards and comparison table.

### Blueprint Generator
- Backend:
  - `/projects/{id}/blueprint`.
  - LLM blueprint templates.
- Frontend:
  - Blueprint reading UI + export action.

---

## 5. Extensibility Toward AI Governance OS

Future components:
- **Policy Engine:**
  - New tables: `policies`, `policy_rules`.
  - LLM for drafts, rule editor UI.
- **AI Inventory & Monitoring:**
  - Integration with logs, browser extensions, SSO.
  - `ai_systems` table.
- **Compliance & Risk:**
  - `risk_assessments`, `compliance_requirements`.
- **Incident Management:**
  - `incidents`, `incident_actions`.

The existing architecture (projects → processes → steps → opportunities → tools → blueprints) forms the base data model for mapping these governance features later.
