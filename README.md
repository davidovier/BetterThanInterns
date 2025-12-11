# Better Than Interns

**We automate your workflow chaos so you don't have to babysit an intern.**

A Next.js 14+ web application that helps teams map, analyze, and optimize business processes through conversational AI. Users describe their workflows in natural language, and the AI assistant extracts structured process information while generating real-time visual workflow graphs.

---

## Features

- **Conversational Process Mapping** - Describe workflows in plain English, get structured diagrams
- **Real-time Graph Visualization** - Interactive React Flow graphs that update as you chat
- **AI-Powered Opportunity Detection** - Automatically identify automation opportunities
- **Manual Editing** - Click any step to edit details (owner, inputs, outputs, frequency, etc.)
- **Workspace Multi-tenancy** - Team collaboration with role-based access
- **Session Management** - Organize your process mapping conversations

---

## Tech Stack

**Frontend:**
- Next.js 14+ with App Router
- React 18 with TypeScript
- React Flow for graph visualization
- Shadcn/ui + Radix UI components
- Tailwind CSS

**Backend:**
- Next.js API Routes
- Prisma ORM with PostgreSQL
- OpenAI GPT-4 for AI assistant
- NextAuth for authentication

**Infrastructure:**
- Vercel (deployment)
- Supabase (PostgreSQL database)

---

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- OpenAI API key
- Vercel account (for deployment)

### Installation

1. **Clone and install dependencies:**

```bash
git clone <repository-url>
cd BetterThanInterns
npm install
```

2. **Set up environment variables:**

Create a `.env` file with the following:

```bash
# Database (Supabase)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-your-key-here"
```

3. **Set up the database:**

```bash
npx prisma generate
npx prisma db push
```

4. **Start development server:**

```bash
npm run dev
```

5. **Open your browser:**

Navigate to [http://localhost:3000](http://localhost:3000)

---

## Usage

### Getting Started

1. **Create an account** at `/signup`
   - Choose a plan (Starter, Pro, or Enterprise)
   - Enter your name, email, and password
   - You'll be automatically signed in

2. **Create your first session** at `/sessions`
   - Click "Create New Session"
   - Give it a title and description
   - Click "Create Session"

3. **Start mapping a process:**
   - Click on your session to open the chat interface
   - Describe your workflow in natural language:
     ```
     "We receive purchase orders by email. The AP clerk downloads them
     and enters data into a spreadsheet. Then the manager reviews and
     approves them in QuickBooks."
     ```

4. **Watch the graph build in real-time:**
   - The AI extracts steps, owners, and connections
   - The graph on the right updates automatically
   - Steps appear as connected boxes

5. **Edit step details:**
   - Click any step in the graph
   - Update owner, inputs, outputs, frequency, duration
   - Save changes

6. **Scan for opportunities:**
   - Click "Scan for Opportunities" in the artifacts panel
   - AI analyzes your process for automation potential
   - View opportunities with impact and effort scores

---

## Project Structure

```
/src
├── app/
│   ├── (auth)/              # Login, signup pages
│   ├── (dashboard)/         # Sessions, account pages
│   ├── (marketing)/         # Landing, pricing pages
│   └── api/                 # API routes
├── components/
│   ├── ui/                  # Shadcn/ui components
│   ├── layout/              # AppShell, navigation
│   ├── session/             # Chat interface, graph view
│   └── process/             # Process components
├── lib/
│   ├── auth.ts             # NextAuth configuration
│   ├── prisma.ts           # Prisma client
│   └── openai.ts           # OpenAI client
└── prisma/
    └── schema.prisma       # Database schema
```

---

## Database Schema

```prisma
User              # User accounts
Workspace         # Multi-tenant workspaces
WorkspaceMember   # User-workspace relationships
AssistantSession  # Chat sessions
ChatMessage       # Conversation history
Process           # Business processes
ProcessStep       # Individual workflow steps
ProcessLink       # Connections between steps
Opportunity       # AI-identified automation opportunities
```

---

## Development Commands

```bash
# Development
npm run dev              # Start dev server

# Database
npx prisma generate      # Generate Prisma client
npx prisma db push       # Sync schema to database
npx prisma migrate dev   # Create migration
npx prisma studio        # Open database GUI

# Build
npm run build           # Build for production
npm start               # Start production server

# Code Quality
npm run lint            # Run ESLint
npx tsc --noEmit        # Type check
```

---

## Deployment

### Vercel + Supabase

1. **Push to GitHub:**
   ```bash
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to vercel.com
   - Import your repository
   - Add environment variables

3. **Set environment variables in Vercel:**
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` (your production URL)
   - `OPENAI_API_KEY`

4. **Deploy!**
   - Vercel will automatically build and deploy

---

## Documentation

For comprehensive documentation including all pages, API routes, and architecture details, see:

**[AGENT_CONTEXT.md](./AGENT_CONTEXT.md)** - Complete application documentation

---

## Troubleshooting

### Database connection issues

Make sure your `DATABASE_URL` and `DIRECT_URL` are correct and Supabase is accessible.

### OpenAI API errors

Verify your `OPENAI_API_KEY` is valid and has available credits.

### Build errors

Try clearing cache and reinstalling:

```bash
rm -rf node_modules .next
npm install
```

### Type errors

Regenerate Prisma client:

```bash
npx prisma generate
```

---

## Brand Voice

**Tone:** Smart, witty, slightly irreverent, helpful without being patronizing

**Examples:**
- Landing: "Where workflows actually make sense"
- Starter plan: "Perfect for solo experiments"
- Pro plan: "For teams actually shipping automations"
- Enterprise plan: "Bring your lawyers"

---

## License

Private project - Better Than Interns

---

## Support

For issues or questions, check the comprehensive documentation in `AGENT_CONTEXT.md` or review the codebase structure above.
