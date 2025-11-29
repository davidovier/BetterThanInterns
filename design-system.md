# Better Than Interns – Design System (Foundations)

See this as a minimal but coherent starting point for UI.

---

## 1. Principles

- **Clear over clever.**
- **Low-friction:** every screen should feel obvious.
- **Friendly edges:** rounded corners, comfortable spacing.

---

## 2. Tokens (Semantic)

Use tokens in CSS or design:

- `color-bg`
- `color-surface`
- `color-border`
- `color-text`
- `color-text-muted`
- `color-accent`
- `color-accent-soft`
- `color-danger`
- `color-warning`
- `color-success`

- Spacing: 4 / 8 / 12 / 16 / 20 / 24 / 32 px.
- Radius:
  - Buttons: 999px (pill).
  - Cards: 12–16px.

---

## 3. Typography

- Primary font: Inter or system UI sans.
- Sizes (example):
  - Display: 32–40px
  - H1: 28px
  - H2: 24px
  - H3: 20px
  - Body: 16px
  - Body small: 14px
  - Label: 12–13px

---

## 4. Core Components

### Button
- Variants: primary, secondary, ghost, destructive.
- Primary: accent background, white text.
- Use clear labels like:
  - “Start Mapping”
  - “Scan for Opportunities”
  - “Generate Blueprint”

### Input
- Label on top.
- Subtle border.
- Focus ring using accent color.

### Card
- Used for:
  - Projects
  - Opportunities
  - Tools
- Surface color with subtle shadow or border.

### Tag / Chip
- For:
  - Status
  - Impact tags (“High impact”)
  - Categories (“Document”, “Decision”)

### Modal / Drawer
- For step editing and detailed info.
- Keep simple: title, content, primary/secondary action.

---

## 5. Layout Patterns

- **Two-panel layout** for mapping:
  - Left: chat
  - Right: graph

- **List + detail** for opportunities and tools:
  - Left: list
  - Right: detail

- **Document-style layout** for blueprint.

---

This is enough for an initial implementation; can be expanded into a full token/component library later.
