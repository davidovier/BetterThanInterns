# Better Than Interns - Manual Testing Checklist

This checklist covers critical user flows and error scenarios to verify before deploying to production.

## Environment Setup

- [ ] DATABASE_URL is set to Supabase connection string
- [ ] OPENAI_API_KEY is valid and has sufficient quota
- [ ] NEXTAUTH_SECRET is set
- [ ] NEXTAUTH_URL matches deployment URL
- [ ] Database schema is up to date (`npm run db:push`)

## Build & Compilation

- [ ] `npm run build` completes without errors
- [ ] `npx tsc --noEmit` passes (no TypeScript errors)
- [ ] No console warnings during build
- [ ] All environment variables are properly typed

## Authentication Flow

### Sign Up
- [ ] User can sign up with email and password
- [ ] Confirmation email is sent (check Supabase logs)
- [ ] Email confirmation link works
- [ ] User is redirected to dashboard after confirmation

### Sign In
- [ ] User can sign in with valid credentials
- [ ] Invalid credentials show appropriate error message
- [ ] "Remember me" persists session
- [ ] Sign out works correctly

### Password Reset
- [ ] User can request password reset
- [ ] Reset email is sent
- [ ] Reset link works and allows password change
- [ ] Can sign in with new password

## Milestone 1 – Process Mapping

### Create Project
- [ ] User can create a new project from dashboard
- [ ] Project name and description are saved
- [ ] Project appears in project list
- [ ] User can navigate to project page

### Create Process
- [ ] "New Process" button is visible
- [ ] Can create process with name and description
- [ ] User is redirected to process mapping page
- [ ] Chat interface loads correctly

### Process Mapping Chat
- [ ] User can send messages in chat
- [ ] AI assistant responds with helpful suggestions
- [ ] Graph updates in real-time as conversation progresses
- [ ] Steps appear on graph with correct titles
- [ ] Links connect steps appropriately
- [ ] Can manually edit step details
- [ ] Step details dialog saves changes

### Error Scenarios
- [ ] Empty message is rejected
- [ ] LLM failure shows user-friendly error (test by temporarily breaking OPENAI_API_KEY)
- [ ] Chat continues to work after error recovery
- [ ] Network error shows appropriate message

## Milestone 2 – AI Opportunity Scanner

### Scan for Opportunities
- [ ] "Scan for AI Opportunities" button appears after mapping steps
- [ ] Button is disabled during scan
- [ ] Loading indicator shows during scan
- [ ] Scan completes and shows opportunity count
- [ ] Opportunities appear in panel with correct data

### Opportunity Display
- [ ] Each opportunity shows: title, description, impact level, effort level
- [ ] Impact score (0-100) is displayed
- [ ] Opportunities are sorted by impact score (highest first)
- [ ] Opportunity heatmap/list renders correctly
- [ ] Can click opportunity to view details

### Error Scenarios
- [ ] LLM failure during scan shows user-friendly error
- [ ] Process with no steps shows appropriate message
- [ ] Process with 0 opportunities shows empty state
- [ ] Can retry scan after failure

## Milestone 3 – Tool Matching

### View Tool Recommendations
- [ ] "View Tools" button appears for each opportunity
- [ ] Tool recommendations dialog opens
- [ ] Tools are listed with name, category, description
- [ ] Match scores are displayed
- [ ] Rationale text explains why each tool is recommended

### Select Tools
- [ ] Can select/deselect tools with checkboxes
- [ ] "Save Selection" button updates state
- [ ] Selected tools are persisted to database
- [ ] Can re-open dialog and see previous selections

### Error Scenarios
- [ ] LLM failure during tool matching shows error
- [ ] Opportunity with no matching tools shows empty state
- [ ] Can retry tool matching after failure

## Milestone 4 – Blueprint Generator

### Generate Blueprint
- [ ] "Generate Blueprint" button appears on project page
- [ ] Button is disabled when no processes exist
- [ ] Button is disabled during generation
- [ ] Loading indicator shows during generation
- [ ] Generation completes and redirects to blueprint view

### Blueprint View
- [ ] All sections render: Executive Summary, Current/Target State, Opportunities, Phases, Risks, KPIs
- [ ] Phases (3-5) display with objectives, activities, tools, dependencies, deliverables
- [ ] Selected tools appear in opportunities section
- [ ] KPI table renders correctly
- [ ] "Export Markdown" button works

### Export Markdown
- [ ] Click "Export Markdown" triggers download
- [ ] Downloaded file has correct filename
- [ ] Markdown file is properly formatted
- [ ] All blueprint content is included

### Error Scenarios
- [ ] LLM failure shows user-friendly error
- [ ] Project with no opportunities still generates basic blueprint
- [ ] Can retry blueprint generation after failure
- [ ] Invalid project ID shows 404 error

## Milestone 5 – Error Handling & Polish

### API Error Handling
- [ ] All API errors return standard `{ ok, data/error }` shape
- [ ] 401 errors show "Unauthorized" message
- [ ] 403 errors show "Forbidden" message
- [ ] 404 errors show "Not found" message
- [ ] 500 errors show "Internal error" message with retry suggestion

### Loading States
- [ ] Dashboard shows loading skeleton before projects load
- [ ] Process list shows loading before data arrives
- [ ] Chat shows loading during AI response
- [ ] Opportunity scan shows loading with disabled button
- [ ] Tool recommendations show loading state
- [ ] Blueprint generation shows loading state

### Empty States
- [ ] Dashboard with no projects shows helpful empty state
- [ ] Project with no processes shows call-to-action
- [ ] Process with no steps shows initial state
- [ ] Process with no opportunities (before scan) shows prompt to scan
- [ ] Process with 0 opportunities (after scan) shows appropriate message
- [ ] Opportunity with no tools shows empty state
- [ ] Project with no blueprints shows empty state

### Button States
- [ ] All action buttons disable during API calls
- [ ] Disabled buttons show loading spinner or updated text
- [ ] "Scan for Opportunities" → "Scanning..."
- [ ] "Generate Blueprint" → "Generating..."
- [ ] "Save Selection" disables during save

## Cross-Browser Testing

- [ ] Chrome (latest): All flows work
- [ ] Firefox (latest): All flows work
- [ ] Safari (latest): All flows work
- [ ] Edge (latest): All flows work

## Mobile Responsiveness

- [ ] Dashboard renders correctly on mobile
- [ ] Process mapping chat is usable on mobile
- [ ] Graph pan/zoom works on touch devices
- [ ] Opportunity cards are readable on small screens
- [ ] Tool dialog is usable on mobile
- [ ] Blueprint view is readable on mobile

## Performance

- [ ] Dashboard loads in < 2 seconds
- [ ] Process mapping page loads in < 2 seconds
- [ ] Chat messages appear within 500ms of sending
- [ ] Graph updates smoothly without lag
- [ ] Opportunity scan completes in < 30 seconds (for ~10 steps)
- [ ] Tool matching completes in < 10 seconds
- [ ] Blueprint generation completes in < 60 seconds

## Security

- [ ] Cannot access other users' projects
- [ ] Cannot access other workspaces' data
- [ ] API endpoints verify workspace membership
- [ ] Direct URL access to unauthorized resources returns 403/404
- [ ] Session timeout works correctly
- [ ] CSRF protection is active

## Data Integrity

- [ ] Process steps are saved correctly
- [ ] Process links persist across page reloads
- [ ] Opportunity scores match LLM output
- [ ] Tool selections persist after page reload
- [ ] Blueprint content matches project state
- [ ] Markdown export matches blueprint view

## LLM Error Recovery

### Simulate LLM Failures
1. **Invalid API Key**
   - [ ] Temporarily set `OPENAI_API_KEY=invalid`
   - [ ] Try process mapping → Shows user-friendly error
   - [ ] Try opportunity scan → Shows user-friendly error
   - [ ] Try tool matching → Shows user-friendly error
   - [ ] Try blueprint generation → Shows user-friendly error

2. **API Rate Limit**
   - [ ] Exhaust OpenAI quota
   - [ ] Verify error messages mention "AI service error"
   - [ ] Verify users can retry after fixing quota

3. **Malformed LLM Response**
   - Check Supabase logs for any LLM errors
   - Verify errors are logged with context (processId, etc.)
   - Verify users see friendly error, not technical stack trace

## Edge Cases

- [ ] Very long process names (>100 chars) display correctly
- [ ] Process with 50+ steps renders without performance issues
- [ ] Opportunity with very long description wraps properly
- [ ] Blueprint with 0 opportunities generates valid output
- [ ] Project with 20+ processes shows paginated or scrollable list
- [ ] User can create multiple blueprints for same project
- [ ] Concurrent users don't interfere with each other's processes

## Regression Testing

After any code changes, verify:
- [ ] Existing projects still load
- [ ] Existing processes still display
- [ ] Previously created opportunities still appear
- [ ] Tool selections are preserved
- [ ] Existing blueprints still render correctly

## Pre-Production Checklist

Before deploying to production:
- [ ] All tests in this checklist pass
- [ ] No console errors in browser
- [ ] No warnings in build output
- [ ] Database migrations are applied
- [ ] Environment variables are set in Vercel
- [ ] Supabase production database is configured
- [ ] OpenAI API key has sufficient quota
- [ ] Email templates are updated in Supabase
- [ ] Monitoring/logging is configured (if applicable)

## Post-Deployment Smoke Test

After deploying:
- [ ] Can sign up new user
- [ ] Can sign in as existing user
- [ ] Can create project
- [ ] Can map process
- [ ] Can scan for opportunities
- [ ] Can view tool recommendations
- [ ] Can generate blueprint
- [ ] Can export blueprint markdown

---

## How to Use This Checklist

1. **Before each deployment**: Go through all items and check them off
2. **Found an issue?**: Note it down, fix it, then re-test
3. **Keep this updated**: Add new items as features are added
4. **Automate what you can**: Convert manual tests to automated tests over time

Last updated: 2025-01-29 (Milestone 5 completion)
