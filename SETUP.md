# Setup Guide - Better Than Interns

## Quick Start for Milestone 1

If you've already completed Milestone 0, follow these steps to add Milestone 1 features:

### 1. Update Database Schema

The Prisma schema has been extended with new models. Push the changes to your database:

```bash
npm run db:push
```

This will add the following tables:
- `processes`
- `process_steps`
- `process_links`
- `chat_sessions`
- `chat_messages`

### 2. Verify Environment Variables

Make sure your `.env` file has:

```env
DATABASE_URL="your-postgres-url"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
OPENAI_API_KEY="sk-your-key"
```

The OpenAI API key is critical for the process mapping assistant.

### 3. Install Dependencies (if needed)

```bash
npm install
```

### 4. Generate Prisma Client

```bash
npm run db:generate
```

### 5. Start Development Server

```bash
npm run dev
```

### 6. Test the Process Mapping Feature

1. Go to http://localhost:3000
2. Sign in (or create an account)
3. Create a new project
4. Click on the project
5. Click "New Process"
6. Start chatting with the assistant!

Try this sample conversation:

**You:**
```
We have an invoice approval process. First, invoices come in by email to our AP inbox.
```

**Assistant:** (will ask clarifying questions and start building the graph)

**You:**
```
The AP clerk downloads the PDF and enters the data into our Excel spreadsheet.
This happens about 20 times per day and takes 5 minutes per invoice.
```

**Assistant:** (will extract steps with owner, frequency, duration)

**You:**
```
Then the manager reviews the spreadsheet and approves or rejects each invoice.
After approval, we send it to our accounting system.
```

**Assistant:** (will add more steps and connect them with links)

### Troubleshooting

#### Database connection issues

If `npm run db:push` fails:
- Check your DATABASE_URL is correct
- Make sure PostgreSQL is running
- Try creating the database manually: `createdb betterthaninterns`

#### LLM not working

If chat messages fail:
- Verify OPENAI_API_KEY in `.env`
- Check you have API credits
- Look for errors in browser console and terminal

#### Graph not updating

If the graph doesn't update after chat:
- Check browser console for errors
- Verify the API response includes `updatedGraph`
- Try refreshing the page

#### Build errors

If you get TypeScript errors:
```bash
npm run db:generate
rm -rf .next
npm run dev
```

---

## Fresh Installation

If starting from scratch:

1. **Clone and install:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Initialize database:**
   ```bash
   npm run db:push
   ```

4. **Start server:**
   ```bash
   npm run dev
   ```

---

## What's New in Milestone 1

### New API Endpoints

**Processes:**
- `GET/POST /api/projects/[projectId]/processes`
- `GET/PATCH /api/processes/[processId]`

**Steps & Links:**
- `POST /api/processes/[processId]/steps`
- `PATCH/DELETE /api/processes/[processId]/steps/[stepId]`
- `POST /api/processes/[processId]/links`

**Chat:**
- `POST /api/processes/[processId]/chat-sessions`
- `POST /api/chat-sessions/[sessionId]/messages`

### New UI Pages

- `/projects/[projectId]` - Process list
- `/projects/[projectId]/processes/[processId]` - Process mapping (chat + graph)

### New Components

- `StepDetailsDialog` - Edit step details
- Process graph with React Flow
- Chat interface with message history

---

## Next Steps

After successfully running Milestone 1, you're ready for Milestone 2: Opportunity Scanner.

See `dev-plan.md` for details on what's next.
