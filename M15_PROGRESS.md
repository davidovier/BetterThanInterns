# M15 - Session UI 2.0 (Unified Workspace View)

**Started:** 2025-12-05
**Status:** IN PROGRESS (Foundation Complete) 🏗️

## Objective

Transform the Session page into a single integrated workspace where all artifacts and visual UIs live, making it the primary working surface for users.

## Completed Components ✅

### 1. Process Components
- ✅ **ProcessMiniMap** (`src/components/process/ProcessMiniMap.tsx`)
  - Reusable React Flow mini-map component
  - Supports readonly mode
  - Shows opportunity heatmap overlay
  - Configurable height (default 300px)
  - Pan and zoom enabled

- ✅ **ProcessCard** (`src/components/process/ProcessCard.tsx`)
  - Displays process with embedded mini-map
  - Shows step count and last updated badges
  - "Open Full Editor" button opens modal
  - Link to full page editor
  - M10 design system compliant

### 2. Opportunity Components
- ✅ **OpportunityCard** (`src/components/opportunity/OpportunityCard.tsx`)
  - Impact/effort level badges with color coding
  - Rationale text preview (line-clamp-3)
  - "Explain this opportunity" button (inserts text into chat)
  - "Use in blueprint" button
  - M10 design system compliant

### 3. Blueprint Components
- ✅ **BlueprintPreview** (`src/components/blueprint/BlueprintPreview.tsx`)
  - Shows first 10 lines of markdown preview
  - Displays metadata badges (process count, opportunity count)
  - "Open Full Blueprint" button
  - "Regenerate" button

- ✅ **BlueprintModal** (`src/components/blueprint/BlueprintModal.tsx`)
  - Full markdown viewer with custom styling
  - Download markdown button
  - Link to full page view
  - Scrollable content area

### 4. Governance Components
- ✅ **GovernanceCard** (`src/components/governance/GovernanceCard.tsx`)
  - Risk level badge with color coding
  - Shows first 3 applied policies
  - "Open Governance Panel" button

- ✅ **GovernanceModal** (`src/components/governance/GovernanceModal.tsx`)
  - Tabbed interface (Overview / Risk / Policies)
  - Risk assessment display
  - Policy mapping details
  - Link to full page view

## Remaining Work 🚧

### 5. UnifiedWorkspaceView Component (HIGH PRIORITY)
**File:** `src/components/UnifiedWorkspaceView.tsx`

This is the main component that ties everything together.

**Required Props:**
```typescript
type UnifiedWorkspaceViewProps = {
  processes: Process[];
  opportunities: Opportunity[];
  blueprints: Blueprint[];
  aiUseCases: AiUseCase[];
  nextStepSuggestion: NextStepSuggestion | null;
  sessionSummary: string | null;
  highlightId?: string | null;
  onExplainOpportunity: (opportunity: Opportunity) => void;
  onUseOpportunityInBlueprint: (opportunity: Opportunity) => void;
  onRegenerateBlueprint: () => void;
};
```

**Implementation Structure:**
```tsx
export function UnifiedWorkspaceView(props) {
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Scroll to section when highlightId changes
  useEffect(() => {
    if (props.highlightId) {
      sectionRefs.current[props.highlightId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [props.highlightId]);

  return (
    <div className="space-y-8 p-6">
      {/* Section 1: Next Step Suggestion */}
      {props.nextStepSuggestion && (
        <div ref={(el) => (sectionRefs.current['next-step'] = el)}>
          {/* Existing next-step pill UI */}
        </div>
      )}

      {/* Section 2: Processes */}
      {props.processes.length > 0 && (
        <div ref={(el) => (sectionRefs.current['processes'] = el)}>
          <h2 className="text-2xl font-semibold mb-4">Mapped Processes</h2>
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {props.processes.map((process) => (
              <ProcessCard
                key={process.id}
                process={process}
                opportunities={props.opportunities.filter(o => o.processId === process.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section 3: Opportunities */}
      {props.opportunities.length > 0 && (
        <div ref={(el) => (sectionRefs.current['opportunities'] = el)}>
          <h2 className="text-2xl font-semibold mb-4">AI Opportunities</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {props.opportunities.map((opp) => (
              <OpportunityCard
                key={opp.id}
                opportunity={opp}
                onExplain={props.onExplainOpportunity}
                onUseInBlueprint={props.onUseOpportunityInBlueprint}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section 4: Blueprints */}
      {props.blueprints.length > 0 && (
        <div ref={(el) => (sectionRefs.current['blueprints'] = el)}>
          <h2 className="text-2xl font-semibold mb-4">Transformation Blueprint</h2>
          <div className="grid gap-6">
            {props.blueprints.map((blueprint) => (
              <BlueprintPreview
                key={blueprint.id}
                blueprint={blueprint}
                onRegenerate={props.onRegenerateBlueprint}
              />
            ))}
          </div>
        </div>
      )}

      {/* Section 5: Governance */}
      {props.aiUseCases.length > 0 && (
        <div ref={(el) => (sectionRefs.current['governance'] = el)}>
          <h2 className="text-2xl font-semibold mb-4">AI Governance</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {props.aiUseCases.map((useCase) => (
              <GovernanceCard key={useCase.id} aiUseCase={useCase} />
            ))}
          </div>
        </div>
      )}

      {/* Section 6: Session Summary */}
      {props.sessionSummary && (
        <div ref={(el) => (sectionRefs.current['summary'] = el)}>
          <h2 className="text-2xl font-semibold mb-4">Session Summary</h2>
          <Card>
            <CardContent className="prose prose-sm max-w-none py-6">
              <ReactMarkdown>{props.sessionSummary}</ReactMarkdown>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
```

### 6. Update Orchestration Types
**File:** `src/lib/orchestration/types.ts`

Add UI hint fields to OrchestrationResult:

```typescript
export type OrchestrationResult = {
  success: boolean;
  assistantMessage: string;
  artifacts: { ... };
  updatedMetadata: { ... };
  clarification?: ClarificationRequest;
  nextStepSuggestion?: NextStepSuggestion;
  ui?: {  // M15: NEW
    scrollTo?: 'processes' | 'opportunities' | 'blueprints' | 'governance' | 'summary';
    highlightId?: string;
  };
  error?: string;
};
```

### 7. Modify Session Page
**File:** `src/app/(dashboard)/sessions/[sessionId]/page.tsx`

**Major changes needed:**

1. **Import UnifiedWorkspaceView**
2. **Add state for scroll/highlight:**
   ```typescript
   const [highlightId, setHighlightId] = useState<string | null>(null);
   ```

3. **Replace right panel content with:**
   ```tsx
   <div className="flex-1 overflow-auto">
     <UnifiedWorkspaceView
       processes={processes}
       opportunities={opportunities}
       blueprints={blueprints}
       aiUseCases={aiUseCases}
       nextStepSuggestion={nextStepSuggestion}
       sessionSummary={session?.contextSummary || null}
       highlightId={highlightId}
       onExplainOpportunity={(opp) => {
         setInputMessage(`Can you explain this opportunity: "${opp.title}"?`);
       }}
       onUseOpportunityInBlueprint={(opp) => {
         setInputMessage(`Use this opportunity in a blueprint: "${opp.title}"`);
       }}
       onRegenerateBlueprint={() => {
         setInputMessage('Regenerate the blueprint');
       }}
     />
   </div>
   ```

4. **Handle UI hints from orchestration:**
   ```typescript
   const result = await response.json();
   const { ui } = result.data;

   if (ui?.highlightId) {
     setHighlightId(ui.highlightId);
     // Clear after 3 seconds
     setTimeout(() => setHighlightId(null), 3000);
   }
   ```

### 8. Add Animations (OPTIONAL)
Use Framer Motion for smooth transitions:

```tsx
import { motion } from 'framer-motion';

// Wrap each section in motion.div
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  {/* Section content */}
</motion.div>
```

## Design System Compliance ✅

All components follow M10 standards:
- ✅ Rounded-2xl cards
- ✅ shadow-soft (default), shadow-medium on hover
- ✅ Brand color accents (brand-50, brand-600, brand-700)
- ✅ Consistent spacing (mt-8, mb-4, space-y-6)
- ✅ Badge variants match existing patterns
- ✅ Button variants consistent

## Files Created (8 files)

1. `src/components/process/ProcessMiniMap.tsx` ✅
2. `src/components/process/ProcessCard.tsx` ✅
3. `src/components/opportunity/OpportunityCard.tsx` ✅
4. `src/components/blueprint/BlueprintPreview.tsx` ✅
5. `src/components/blueprint/BlueprintModal.tsx` ✅
6. `src/components/governance/GovernanceCard.tsx` ✅
7. `src/components/governance/GovernanceModal.tsx` ✅
8. `M15_PROGRESS.md` ✅

## Files to Modify (3 files)

1. `src/components/UnifiedWorkspaceView.tsx` - **TO CREATE**
2. `src/lib/orchestration/types.ts` - **TO MODIFY**
3. `src/app/(dashboard)/sessions/[sessionId]/page.tsx` - **TO MODIFY**

## Testing Checklist 🧪

Once implementation is complete:

- [ ] Start session → Right panel shows empty state with next-step suggestion
- [ ] Describe process → Process section appears with mini-map
- [ ] Ask to scan opportunities → Opportunity section appears with cards
- [ ] Click "Explain opportunity" → Text inserted into chat
- [ ] Ask to generate blueprint → Blueprint section appears
- [ ] Click "Open Full Blueprint" → Modal opens with full markdown
- [ ] Ask to create governance → Governance section appears
- [ ] Click "Open Governance Panel" → Modal with tabs
- [ ] Ask for summary → Summary section appears
- [ ] Refresh page → All sections restored correctly
- [ ] Smooth scroll behavior works
- [ ] All modals open/close correctly

## Dependencies

All required dependencies are already installed:
- ✅ ReactFlow (`reactflow`)
- ✅ React Markdown (`react-markdown`)
- ✅ Framer Motion (`framer-motion`) - from M10
- ✅ Shadcn/ui components

## Next Steps

To complete M15:

1. **Create UnifiedWorkspaceView component** (highest priority)
2. **Update orchestration types** with UI hints
3. **Modify session page** to use new layout
4. **Run build** to check for TypeScript errors
5. **Test manually** using checklist above
6. **Commit and push** when complete

## Estimated Complexity

- Foundation components (DONE): ⭐⭐⭐⭐ (High - COMPLETE)
- UnifiedWorkspaceView: ⭐⭐⭐ (Medium)
- Session page integration: ⭐⭐⭐ (Medium)
- Total remaining: ~2-3 hours of focused work

---

**Status:** Foundation is solid, just need to wire everything together in the session page.
