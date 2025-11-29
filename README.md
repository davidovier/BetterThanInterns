# Better Than Interns

**We automate your workflow chaos so you don't have to babysit an intern.**

---

## Current Status: Milestone 1 - Process Mapping MVP ✅

This implementation includes:

### Milestone 0 - Walking Skeleton ✅
- ✅ Next.js 14+ with App Router and TypeScript
- ✅ Authentication with NextAuth (email/password)
- ✅ PostgreSQL database with Prisma ORM
- ✅ Workspace and Project management
- ✅ Demo process graph with React Flow
- ✅ OpenAI LLM integration test
- ✅ Shadcn/ui components with Tailwind CSS

### Milestone 1 - Process Mapping MVP ✅
- ✅ Process, ProcessStep, ProcessLink, ChatSession, ChatMessage models
- ✅ Conversational AI process mapping assistant
- ✅ Real-time workflow graph generation from chat
- ✅ Two-panel UI (chat + graph) per wireframes.md
- ✅ Manual step editing with details dialog
- ✅ LLM-powered workflow extraction with structured output
- ✅ Process and step CRUD APIs
- ✅ Automatic graph layout and updates

---

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or hosted)
- OpenAI API key

### Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` and add:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/betterthaninterns?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
OPENAI_API_KEY="sk-your-openai-key-here"
```

To generate a `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

3. **Set up the database:**

```bash
npm run db:push
```

This will create all the necessary tables in your PostgreSQL database.

4. **Start the development server:**

```bash
npm run dev
```

5. **Open your browser:**

Navigate to [http://localhost:3000](http://localhost:3000)

---

## Usage

### First-Time Setup

1. Click **"Create account"** on the login page
2. Enter your name, email, and password
3. You'll be automatically signed in and see the dashboard
4. A default workspace is created for you automatically

### Testing the Walking Skeleton

1. **Create a project:**
   - Click "New Project" on the dashboard
   - Enter a project name (e.g., "Invoice Processing")
   - Click "Create Project"

2. **View the demo:**
   - Click on any project or navigate to `/demo`
   - See a hardcoded process graph showing an invoice workflow
   - This demonstrates React Flow is working

3. **Test LLM integration:**
   - On the demo page, scroll to "Test LLM Integration"
   - Enter a test prompt (e.g., "What is Better Than Interns?")
   - Click "Test LLM Call"
   - Verify you get a response from OpenAI

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/         # Protected dashboard pages
│   │   ├── dashboard/
│   │   └── demo/
│   ├── api/                 # API routes (backend)
│   │   ├── auth/
│   │   ├── workspaces/
│   │   ├── projects/
│   │   └── test-llm/
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                  # Shadcn UI components
│   ├── dashboard-nav.tsx
│   └── providers/
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   ├── db.ts               # Prisma client
│   ├── llm.ts              # OpenAI client
│   └── utils.ts
├── types/
│   └── next-auth.d.ts
└── prisma/
    └── schema.prisma       # Database schema
```

---

## Database Schema (Through Milestone 1)

```prisma
- User              # User accounts
- Account           # OAuth accounts (NextAuth)
- Session           # User sessions (NextAuth)
- Workspace         # Multi-tenant workspaces
- WorkspaceMember   # User-workspace relationships
- Project           # Projects within workspaces
- Process           # Business processes
- ProcessStep       # Individual process steps
- ProcessLink       # Connections between steps
- ChatSession       # Conversation sessions
- ChatMessage       # Chat messages with workflow deltas
```

---

## API Endpoints (Milestone 0)

### Authentication
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/[...nextauth]` - NextAuth handlers

### Workspaces
- `GET /api/workspaces` - List user's workspaces

### Projects
- `GET /api/workspaces/[workspaceId]/projects` - List projects
- `POST /api/workspaces/[workspaceId]/projects` - Create project
- `GET /api/projects/[projectId]` - Get project details

### Testing
- `POST /api/test-llm` - Test OpenAI integration

---

## How to Use (Milestone 1)

### Mapping Your First Process

1. **Create a Project:**
   - Sign in and click "New Project"
   - Give it a name like "Invoice Processing"

2. **Create a Process:**
   - Click on your project
   - Click "New Process"
   - Name it (e.g., "Approve Purchase Orders")
   - Click "Start Mapping"

3. **Chat with the Assistant:**
   - You'll see a two-panel interface
   - Left: Chat panel
   - Right: Process graph
   - Start describing your process:
     ```
     "We receive purchase orders by email every morning.
     The AP clerk downloads them and enters them into a spreadsheet.
     Then the manager reviews and approves them."
     ```

4. **Watch the Graph Build:**
   - As you chat, the assistant extracts steps
   - The graph updates in real-time
   - Steps appear as boxes with connections

5. **Edit Steps Manually:**
   - Click any step in the graph
   - A dialog opens with all step details
   - Update owner, frequency, duration, inputs/outputs
   - Click "Save Changes"

6. **Continue the Conversation:**
   - The assistant asks clarifying questions
   - Add more details about decision points, data flows
   - The graph expands automatically

## Next Steps: Milestone 2

The next phase (Milestone 2 - Opportunity Scanner) will implement:

- AI-powered scanning of workflows for automation opportunities
- Impact and feasibility scoring
- ROI calculations
- Heatmap overlay on process graphs
- Opportunity list view with filtering

See `dev-plan.md` for the full roadmap.

---

## Development Commands

```bash
# Start development server
npm run dev

# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push

# Run database migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

---

## Troubleshooting

### Database connection issues

Make sure PostgreSQL is running and the `DATABASE_URL` in `.env` is correct.

### LLM test failing

Verify your `OPENAI_API_KEY` is set correctly in `.env` and has available credits.

### Build errors

Try deleting `node_modules` and `.next`, then reinstall:

```bash
rm -rf node_modules .next
npm install
```

---

## Brand & Design

This project follows the **Better Than Interns** brand guidelines:

- **Tone:** Smart, playful, slightly sarcastic, extremely competent
- **UI:** Clean, friendly edges, pill-shaped buttons
- **Colors:** Primary blue accent, neutral backgrounds
- **Typography:** Inter font

See `brand.md` and `design-system.md` for more details.

---

## License

Private project - Better Than Interns
