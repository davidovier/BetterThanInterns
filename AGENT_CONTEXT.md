# Better Than Interns - Complete Application Documentation

## Executive Summary

**Better Than Interns** is a Next.js 14+ web application that helps teams map, analyze, and optimize business processes through conversational AI. Users describe their workflows in natural language, and the AI assistant extracts structured process information while generating real-time visual workflow graphs.

**Current State**: The application has recently been simplified to focus on a sessions-first experience, removing unnecessary complexity and consolidating around core functionality. The session workspace has been rebuilt (M15.2) with an artifact-stream architecture, replacing the graph-first UI with a clean 60/40 split layout.

## Architecture & Tech Stack

### Frontend
- **Next.js 14+** with App Router and TypeScript
- **React 18** with Server and Client Components
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
│   ├── ui/                  # Shadcn/ui primitives
│   ├── layout/              # AppShell, navigation
│   ├── workspace/           # Workspace context
│   ├── session/             # SessionChatPane, SessionArtifactPane, UnifiedSessionWorkspace
│   ├── artifacts/           # ProcessCard, OpportunityCard, BlueprintCard, GovernanceCard
│   └── process/             # Legacy process components
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   ├── prisma.ts           # Prisma client
│   └── openai.ts           # OpenAI client
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

### Gradient Schemes (Sessions Page)
6 vibrant gradient combinations rotate across session cards:
- Violet → Purple → Fuchsia
- Blue → Cyan → Teal
- Emerald → Green → Lime
- Orange → Amber → Yellow
- Rose → Pink → Fuchsia
- Indigo → Blue → Cyan

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

## Key Features

### 1. Conversational Process Mapping
- Users describe processes in natural language
- AI assistant (GPT-4) extracts structured information
- Real-time workflow graph generation
- Context-aware conversation flow

### 2. Visual Workflow Editor
- Interactive React Flow graph
- Drag-and-drop step reordering
- Manual step editing with details dialog
- Automatic layout and positioning
- Zoom, pan, and fit-to-view controls

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

### Latest Commits (Most Recent First)

1. **feat: M15.2 - Rebuild unified session workspace UI**
   - Replaced graph-first session page with artifact-stream workspace
   - Created 8 new components (artifact cards + session components)
   - Reduced session page from 1,154 lines to 81 lines (-93%)
   - Implemented 60/40 split layout (chat + artifacts)
   - Added Framer Motion animations for new artifacts
   - Auto-scroll and highlight for newly created artifacts
   - Removed ReactFlow graph editor and step editing modals
   - Added date-fns for relative timestamps
   - All artifacts now load via single `/api/sessions/[sessionId]/artifacts` call
   - M10 design system compliant with consistent spacing and colors

2. **docs: Consolidate documentation and remove outdated files**
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

### 5. Sessions List Page (`/sessions`) ⭐ Main Dashboard
**File**: `/src/app/(dashboard)/sessions/page.tsx` (542 lines)

**Purpose**: Primary landing page after authentication, displays all sessions

**Features**:
- **Metrics Dashboard**: Total sessions, processes, opportunities
- **Session Grid**: 1-3 column responsive grid
- **Vibrant Design**: 6 rotating gradient color schemes
- **Session Cards**:
  - Gradient accent bar at top
  - Title, description, timestamp
  - Artifact badges (process count, opportunity count)
  - Dropdown menu (edit/delete)
  - Click to open session
- **CRUD Operations**:
  - **Create**: Inline form with title/description
  - **Read**: Click card to navigate to session detail
  - **Update**: Rename via dialog
  - **Delete**: Confirmation dialog with cascade warning
- **Empty State**: When no sessions exist
- **Loading States**: Skeleton UI during operations

**Layout**: Uses AppShell with navigation

**API Integration**:
- GET `/api/sessions` (fetch all sessions)
- POST `/api/sessions` (create new session)
- PATCH `/api/sessions/[id]` (update session title)
- DELETE `/api/sessions/[id]` (delete session + cascade)

**Navigation**: Clicking a session card navigates to `/sessions/[sessionId]`

**Gradient Schemes**:
```typescript
const gradients = [
  'from-violet-500/10 via-purple-500/10 to-fuchsia-500/10',
  'from-blue-500/10 via-cyan-500/10 to-teal-500/10',
  'from-emerald-500/10 via-green-500/10 to-lime-500/10',
  'from-orange-500/10 via-amber-500/10 to-yellow-500/10',
  'from-rose-500/10 via-pink-500/10 to-fuchsia-500/10',
  'from-indigo-500/10 via-blue-500/10 to-cyan-500/10',
];
```

---

### 6. Session Detail Page (`/sessions/[sessionId]`) ⭐ Core Feature (M15.2 - Rebuilt)
**File**: `/src/app/(dashboard)/sessions/[sessionId]/page.tsx` (81 lines)

**Purpose**: Unified artifact-stream workspace with conversational AI

**Architecture**: Simple loading/error wrapper that renders `UnifiedSessionWorkspace`

**Features**:

**60/40 Split Layout**:
- Left (60%): Chat pane with conversation history
- Right (40%): Artifact stream with categorized cards
- Both panes scroll independently
- No resizing - fixed proportions for optimal UX

**Components Used**:
- `UnifiedSessionWorkspace` - Main orchestrator component
- `SessionChatPane` - Left panel (chat messages + input)
- `SessionArtifactPane` - Right panel (artifact cards)
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
- `/src/components/session/UnifiedSessionWorkspace.tsx` (194 lines)
- `/src/components/session/SessionChatPane.tsx` (148 lines)
- `/src/components/session/SessionArtifactPane.tsx` (150 lines)
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

**Last Updated**: December 11, 2025
**Document Version**: 1.0
**Current App Version**: Based on commit `7f86013`
