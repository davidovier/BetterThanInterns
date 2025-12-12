# M16B - Lightweight Blueprint & Governance Backfill

## Overview

Re-introduced minimal Blueprint and AI Use Case entities scoped to sessions, enabling users to generate implementation blueprints and document AI governance use cases directly from session conversations.

## Implementation Summary

### 1. Database Schema Changes (Prisma)

**Modified Models:**
- `Blueprint` - Added session-scoping and lightweight fields
- `AiUseCase` - Added session-scoping and risk summary

**Schema Updates:**

```prisma
model Blueprint {
  // ... existing fields
  sessionId        String? // M16B: Session-scoped blueprints
  summary          String? // M16B: Short description
  contentMarkdown  String   @default("") @db.Text // M16B: Simplified markdown content
  // ... existing fields
}

model AiUseCase {
  // ... existing fields
  sessionId   String? // M16B: Session-scoped AI use cases
  riskSummary String? @db.Text // M16B: Short risk summary
  status      String  @default("idea") // Changed from "planned" to "idea"
  // Status values: "idea" | "approved" | "shipped" | "planned" | "pilot" | "production" | "paused"
  // ... existing fields
}
```

**Database Changes:**
- Added `directUrl = env("DIRECT_URL")` to datasource config for better migration support
- Successfully pushed schema changes with `npx prisma db push`
- Generated updated Prisma client

---

### 2. API Endpoints

#### Blueprint APIs

**File:** `src/app/api/sessions/[sessionId]/blueprints/route.ts`

**GET /api/sessions/[sessionId]/blueprints**
- Returns all blueprints for a session (session-scoped only)
- Includes: id, title, summary, version, timestamps
- Ordered by createdAt desc

**POST /api/sessions/[sessionId]/blueprints**
- Creates a new blueprint using OpenAI GPT-4
- Request body:
  ```json
  {
    "title": "string (optional)",
    "processIds": ["string[]"],
    "opportunityIds": ["string[]"]
  }
  ```
- Response: Full blueprint object
- Features:
  - Loads referenced processes and opportunities
  - Generates comprehensive markdown blueprint with sections:
    1. Executive Summary
    2. Current State Analysis
    3. AI/Automation Opportunities
    4. Implementation Roadmap (Quick Wins, Mid-term, Long-term)
    5. Tool Recommendations
    6. Success Metrics
    7. Next Steps
  - Extracts summary from executive summary section
  - Updates session metadata with new blueprint ID

#### AI Use Case APIs

**File:** `src/app/api/sessions/[sessionId]/ai-use-cases/route.ts`

**GET /api/sessions/[sessionId]/ai-use-cases**
- Returns all AI use cases for a session (session-scoped only)
- Includes: id, title, description, riskSummary, status, owner, linked IDs
- Includes related risk assessment if available
- Ordered by createdAt desc

**POST /api/sessions/[sessionId]/ai-use-cases**
- Creates a new AI use case using OpenAI GPT-4
- Request body:
  ```json
  {
    "title": "string (optional)",
    "description": "string (optional)",
    "processIds": ["string[]"],
    "opportunityIds": ["string[]"]
  }
  ```
- Response: Full AI use case object
- Features:
  - Loads referenced processes and opportunities
  - Generates title, description, and riskSummary using AI if not provided
  - Sets default status to "idea"
  - Sets source to "blueprint"
  - Updates session metadata with new AI use case ID

---

### 3. Artifacts Endpoint Update

**File:** `src/app/api/sessions/[sessionId]/artifacts/route.ts`

**Changes:**
- Extended parallel loading to query both metadata-based and session-scoped blueprints
- Extended parallel loading to query both metadata-based and session-scoped AI use cases
- Merges results and deduplicates by ID using Map
- Returns combined results in response

**Query Strategy:**
```typescript
const [metadataBlueprints, sessionBlueprints] = await Promise.all([
  // Load from metadata.blueprintIds
  metadata.blueprintIds?.length > 0 ? db.blueprint.findMany(...) : [],
  // Load session-scoped
  db.blueprint.findMany({ where: { sessionId: params.sessionId } })
]);

// Merge and deduplicate
const blueprintMap = new Map();
[...metadataBlueprints, ...sessionBlueprints].forEach(b => blueprintMap.set(b.id, b));
const blueprints = Array.from(blueprintMap.values());
```

Same pattern applied for AI use cases.

---

### 4. Type Definitions

**File:** `src/types/artifacts.ts`

**BlueprintArtifact:**
```typescript
export type BlueprintArtifact = {
  id: string;
  title: string;
  summary?: string | null; // M16B
  version: number;
  createdAt: string;
  updatedAt: string;
};
```

**AiUseCaseArtifact:**
```typescript
export type AiUseCaseArtifact = {
  id: string;
  title: string;
  description: string;
  riskSummary?: string | null; // M16B
  status: 'idea' | 'planned' | 'approved' | 'shipped' | 'pilot' | 'production' | 'paused'; // M16B
  owner: string | null;
  linkedProcessIds: any; // JSON
  linkedOpportunityIds: any; // JSON
};
```

---

### 5. UI Component Updates

#### BlueprintCard

**File:** `src/components/artifacts/BlueprintCard.tsx`

**Changes:**
- Added conditional rendering for `summary` field in card preview
- If summary exists, show it in a clean preview box with line-clamp-3
- If no summary, show placeholder with icon and description
- Detail modal already has placeholder for full content (markdown rendering deferred)

#### GovernanceCard

**File:** `src/components/artifacts/GovernanceCard.tsx`

**Changes:**
- Updated `getStatusColor()` to support new status values:
  - `idea` - slate colors
  - `approved` - teal colors
  - `shipped` - emerald colors
- Added `riskSummary` display in detail modal
- Shows risk summary in amber-styled box if available
- Updated placeholder text for governance details

---

## Session Metadata Management

Both APIs update the session's metadata field to track created artifacts:

```typescript
// Blueprint creation
const currentMetadata = (assistantSession.metadata as any) || {};
const blueprintIds = currentMetadata.blueprintIds || [];

await db.assistantSession.update({
  where: { id: params.sessionId },
  data: {
    metadata: {
      ...currentMetadata,
      blueprintIds: [...blueprintIds, blueprint.id],
    },
  },
});
```

Same pattern for AI use cases with `aiUseCaseIds`.

---

## OpenAI Integration

### Blueprint Generation

**Model:** GPT-4o
**Temperature:** 0.7
**System Prompt:** "You are an expert AI implementation consultant. Create clear, actionable implementation blueprints in markdown format."

**User Prompt Structure:**
- Lists all provided processes with steps
- Lists all automation opportunities with details
- Requests 7-section markdown blueprint
- Emphasizes concise but actionable output

### AI Use Case Generation

**Model:** GPT-4o
**Temperature:** 0.7
**System Prompt:** "You are an expert AI governance consultant. Create clear, professional AI use case documentation. Return only valid JSON."

**Response Format:** JSON object with:
- `title` - 5-10 word concise title
- `description` - 2-3 sentence description of what AI will do
- `riskSummary` - 1-2 sentence key risk considerations

---

## Files Modified

### Database & Schema
1. `prisma/schema.prisma` - Added session fields and directUrl

### API Routes (New Files)
2. `src/app/api/sessions/[sessionId]/blueprints/route.ts` - Blueprint CRUD
3. `src/app/api/sessions/[sessionId]/ai-use-cases/route.ts` - AI Use Case CRUD

### API Routes (Modified)
4. `src/app/api/sessions/[sessionId]/artifacts/route.ts` - Extended to load session-scoped artifacts

### Types
5. `src/types/artifacts.ts` - Updated BlueprintArtifact and AiUseCaseArtifact

### UI Components
6. `src/components/artifacts/BlueprintCard.tsx` - Added summary display
7. `src/components/artifacts/GovernanceCard.tsx` - Added new statuses and riskSummary

---

## Design Principles Applied

- **Session-Scoped Architecture**: All new blueprints and AI use cases are linked to sessions via `sessionId`
- **Backward Compatibility**: Existing workspace-scoped blueprints/use cases still work via metadata
- **Lightweight Implementation**: Minimal fields added, focused on essential data
- **AI-Powered Generation**: Leverage OpenAI for content generation with sensible defaults
- **Deduplication**: Merge metadata-based and session-scoped artifacts intelligently
- **Progressive Disclosure**: Show summaries in list view, full details in modals

---

## Not Implemented (Deferred)

The following items were listed in requirements but marked as optional or deferred:

1. **Orchestration Extension**: Intent detection for "generate blueprint" and "create governance use case" in the orchestration layer (can be added in future iteration)
2. **Generate Blueprint Button**: Optional header button to trigger blueprint generation (existing APIs support this, UI button deferred)
3. **Full Markdown Rendering**: Blueprint detail modal shows placeholder instead of rendered markdown content (can use `react-markdown` in future iteration)
4. **Detailed Risk Assessment UI**: Full risk assessment and policy mappings UI deferred, basic riskSummary shown

These can be added incrementally without breaking changes.

---

## Testing Checklist

- [x] Schema changes applied successfully
- [x] TypeScript compilation passes (`npx tsc --noEmit`)
- [x] Blueprint GET endpoint loads session-scoped blueprints
- [x] Blueprint POST endpoint creates blueprints with OpenAI
- [x] AI Use Case GET endpoint loads session-scoped use cases
- [x] AI Use Case POST endpoint creates use cases with OpenAI
- [x] Artifacts endpoint merges metadata and session-scoped items
- [x] BlueprintCard displays summary when available
- [x] GovernanceCard shows new status values and riskSummary
- [ ] Production build passes (`npm run build`)
- [ ] End-to-end test: Create blueprint from session
- [ ] End-to-end test: Create AI use case from session
- [ ] End-to-end test: View artifacts in SessionArtifactPane

---

## Notes

- No breaking changes to existing functionality
- All existing blueprints and AI use cases continue to work
- Session metadata tracks new artifacts for consistency
- OpenAI API calls are made synchronously (consider async/streaming for future iterations)
- Error handling follows existing patterns with `CommonErrors` and `logError`
- All APIs require authentication and workspace membership verification
