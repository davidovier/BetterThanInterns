# Better Than Interns – API Specification (Phase 1)

See this as a starting contract between frontend and backend. It covers the minimum endpoints needed for Phase 1.

Base URL: `/v1`

---

## Auth

### POST `/auth/signup`
### POST `/auth/login`

Both return:
- `user` object
- `token` string (JWT)

---

## Workspaces

### GET `/workspaces`
### POST `/workspaces`
### GET `/workspaces/{workspaceId}`

Workspaces group projects and users.

---

## Projects

### GET `/workspaces/{workspaceId}/projects`
### POST `/workspaces/{workspaceId}/projects`
### GET `/projects/{projectId}`
### PATCH `/projects/{projectId}`

---

## Processes

### GET `/projects/{projectId}/processes`
### POST `/projects/{projectId}/processes`
### GET `/processes/{processId}?includeGraph=true`
### PATCH `/processes/{processId}`

Process response includes:
- Basic metadata.
- Steps.
- Links.

---

## Steps & Links

### POST `/processes/{processId}/steps`
### PATCH `/processes/{processId}/steps/{stepId}`
### DELETE `/processes/{processId}/steps/{stepId}`

### POST `/processes/{processId}/links`

---

## Chat Sessions (Process Assistant)

### POST `/processes/{processId}/chat-sessions`

### POST `/chat-sessions/{chatSessionId}/messages`

Response includes:
- Assistant reply text.
- Optional `workflow_delta` with:
  - `new_steps`
  - `updated_steps`
  - `new_links`

Backend applies these to DB.

---

## Opportunities

### POST `/processes/{processId}/scan-opportunities`
Triggers the AI Opportunity Scanner.

### GET `/processes/{processId}/opportunities`
List stored opportunities.

### GET `/opportunities/{opportunityId}`

---

## Tools

### GET `/tools`
List tool catalog.

### POST `/tools` (admin only)
Add tool entry.

### GET `/opportunities/{opportunityId}/tools`
Return ranked recommendations for that opportunity.

---

## Blueprints

### POST `/projects/{projectId}/blueprints`
Generate a blueprint for project.

### GET `/blueprints/{blueprintId}`
Return blueprint content.

### GET `/blueprints/{blueprintId}/export?format=markdown`
Export blueprint.

---

This API surface is intentionally lean and corresponds directly to the Phase 1 feature set described in `prd.md`.
