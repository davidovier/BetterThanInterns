You are working inside a production-grade SaaS codebase with an established
architecture, design philosophy, and milestone-driven roadmap.

You MUST follow these rules at all times:

---

## 1. PRODUCT PHILOSOPHY (NON-NEGOTIABLE)

This product is:
- Executive-grade
- Calm, restrained, document-like
- Optimized for clarity, not engagement
- Anti-gimmick, anti-dashboard-noise, anti-chatbot aesthetics

DEFAULT BEHAVIOR:
- Remove UI before adding UI
- Prefer typography, spacing, and structure over color or animation
- Never introduce playful language, emojis, or casual copy
- Never add onboarding unless explicitly requested

If unsure: choose the more minimal, quieter option.

---

## 2. ARCHITECTURE & SCOPE DISCIPLINE

- Do NOT refactor unrelated code.
- Do NOT “clean up” unless explicitly asked.
- Do NOT introduce new abstractions without justification.
- Do NOT change behavior outside the specified milestone.

Every change must map clearly to:
- The current milestone (e.g. M21, M22, M24.1)
- Or an explicitly requested next milestone

If a request risks scope creep:
→ Stop and explain the risk before coding.

---

## 3. BILLING, USAGE & COST SAFETY (CRITICAL)

Billing and usage enforcement are production-critical.

You MUST:
- Never auto-enable PAYG
- Never bypass ICU checks
- Never trigger OpenAI calls without billing wrappers
- Never hide or soften billing limits
- Always respect feature flags (especially BILLING_ENFORCEMENT_ENABLED)

Billing limits are constraints, not errors.
Treat them calmly and transparently.

If touching billing-related code:
→ Assume legal, financial, and trust implications.

---

## 4. UX & COPY RULES

Copy must be:
- Neutral
- Declarative
- Period-terminated
- Free of hype, exclamation points, or marketing language

Avoid:
- “Get started”
- “Welcome”
- “Let’s”
- “Awesome”
- Any emoji

Prefer:
- “Continue work.”
- “This session summarizes decisions as they are made.”
- “Usage limit reached.”

---

## 5. SESSION-FIRST MENTAL MODEL

Sessions are:
- Executive working files
- Persistent records of reasoning
- The primary unit of value

Chat is:
- Working notes
- Not a conversation UI
- Not a chatbot interface

Artifacts are:
- Outputs
- Deliverables
- Consequences of reasoning

Never revert to chat-first or tool-first UX patterns.

---

## 6. ERROR HANDLING & STATES

Errors must be:
- Explicit
- Calm
- Actionable
- Never alarming

If an error occurs:
- Explain what happened
- Explain what can be done
- Never blame the user
- Never hide the system state

---

## 7. PERFORMANCE & RISK AWARENESS

Before implementing:
- Identify the riskiest part of the change
- Prefer deterministic logic over heuristics
- Avoid magic numbers unless explicitly justified

If something is a hack:
→ Call it out explicitly.

---

## 8. OUTPUT FORMAT EXPECTATIONS

When delivering work:
- Use structured summaries
- List files changed
- Explain intent per change
- Include honest self-critique when requested
- Never oversell success

If work is incomplete:
→ Say so clearly.

---

## 9. TOON & PROMPT DISCIPLINE

When asked to write prompts or specs:
- Prefer structured, TOON-friendly formats
- Avoid prose where structure is sufficient
- Treat prompts as executable specifications

---

## 10. DEFAULT QUESTION TO ASK YOURSELF

Before writing code, ask:
“Does this make the product calmer, clearer, and more trustworthy?”

If the answer is not clearly yes:
→ Pause and reconsider.
