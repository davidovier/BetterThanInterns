# Better Than Interns – Wireframes (Text Spec)

This file describes the key screens and layouts in words, so a design or code agent can implement UI without visual mockups.

---

## 1. Global Layout

- **Top Navigation Bar**
  - Left: Logo (“Better Than Interns” wordmark).
  - Center: Current workspace / project name.
  - Right: User avatar menu (Profile, Settings, Logout).

- **Main Layout**
  - Left side: Optional sidebar with navigation (Projects, Processes, Opportunities, Blueprints, Settings).
  - Right side: Main content area (primary views).

---

## 2. Screen: Authentication

### 2.1 Sign In
- Simple centered card.
- Fields:
  - Email
  - Password
- Buttons:
  - “Sign In”
  - Link: “Create account”
- Optional:
  - “Continue with Google” (if SSO is implemented).

### 2.2 Sign Up
- Similar layout.
- Fields:
  - Name
  - Company name (optional)
  - Email
  - Password
- Button: “Create Account”

---

## 3. Screen: Project List (Dashboard)

**Purpose:** Let user view and manage projects.

- Title: “Projects”
- Primary CTA: “New Project” button (top-right).
- Content:
  - Grid or list of project cards:
    - Project name
    - Last updated
    - Number of processes
    - Status (Draft / In Progress / Blueprint Ready)
  - Click on a card → goes to Project Overview.

---

## 4. Screen: Project Overview

**Purpose:** Birds-eye view of that client/project.

Layout:
- Header: Project name + edit icon.
- Subheader: Client/company name, optional notes.
- Two-column layout:

**Left Column:**
- Section: “Processes”
  - List of processes with:
    - Name
    - Owner
    - Number of steps
  - Button: “New Process (Start Mapping)” per project.

**Right Column:**
- Section: “Blueprints”
  - List of generated blueprints (if any) with:
    - Title
    - Date
    - Status
    - “View” button
- Section: “Highlights”
  - Summary stats:
    - Total processes mapped
    - Opportunities found
    - Estimated total ROI (if available)

---

## 5. Screen: Process Mapping (Core Screen)

Two main zones: **Chat Panel** and **Graph Panel**.

### 5.1 Layout
- **Left Side (approx 40% width): Chat Panel**
  - Header: “Process Assistant”
  - Scrollable chat area
  - Messages:
    - AI messages (neutral background)
    - User messages (accent background)
  - Input:
    - Textbox: “Describe the process you want to map…”
    - Send button

- **Right Side (approx 60% width): Graph Panel**
  - Header: Process name with inline edit.
  - Canvas area:
    - Nodes (steps) as boxes with:
      - Title
      - Owner label
      - Icons indicating AI potential (if scanned).
    - Edges (arrows) indicating flow.
  - Controls:
    - Zoom in / out
    - Fit to screen
    - Toggle: “Show data flows” vs “Hide data flows”
  - Bottom bar (optional):
    - “Scan for AI Opportunities” button.

### 5.2 Interactions
- Clicking a node:
  - Opens a side drawer/modal with:
    - Step title
    - Description
    - Owner
    - Inputs / outputs
    - Frequency, duration (if captured)

---

## 6. Screen: Opportunities List & Heatmap

- Accessed from:
  - Button on Process Mapping: “View Opportunities”
- Layout:
  - Left: List of opportunity cards:
    - Title
    - Related steps
    - Impact score
    - Tags
  - Right: Graph with colored nodes:
    - High: bold color
    - Medium: softer color
    - Low: neutral

---

## 7. Screen: Tool Recommendations

- Header: “Tools for: [Opportunity Name]”
- List of cards with:
  - Tool name
  - Category
  - Summary
  - Pros & cons
  - Match score
  - Select checkbox/button

- Filter bar:
  - Category dropdown
  - Pricing tier filter
  - Vendor type

- Footer:
  - Button: “Add Selected to Blueprint”

---

## 8. Screen: Blueprint View

- Header:
  - Title: “Implementation Blueprint – [Project Name]”
  - Buttons: “Export PDF”, “Export Markdown”

- Body sections:
  1. Overview
  2. Current State
  3. Target State
  4. Opportunities & Tools
  5. Phases & Timeline
  6. Risks & Mitigations
  7. KPIs

- Optional fixed sidebar:
  - Summary metrics:
    - Estimated hours saved
    - Estimated cost range
    - Recommended start phase

---

## 9. Screen: Settings / Workspace

- Fields:
  - Workspace name
  - Default industry
  - Typical company size
  - Default currency

This wireframes spec gives enough detail to implement UI structure for V1.
