billing.md

Better Than Interns — Billing & Usage Model

1. Purpose

This document defines the commercial model, usage limits, cost controls, and enforcement logic for Better Than Interns.

Goals:

Align pricing with real OpenAI costs

Maintain ~70% gross margin

Enable transparent, EU-compliant usage limits

Support hybrid pricing: subscription + pay-as-you-go

Avoid surprise bills or dark patterns

This document is authoritative for all billing-related engineering decisions.

2. Core Principle: Intelligence Is the Product

Users do not pay for:

Sessions

Notes

Storage

Reading outputs

Users do pay for:

AI reasoning

Analysis

Opportunity discovery

Tool evaluation

Blueprint generation

Governance reasoning

Billing is therefore tied to intelligence usage, not time or features.

3. Internal Unit: ICU (Intelligence Cost Unit)

To abstract tokens and models:

1 ICU = €0.01 real OpenAI cost

All AI actions consume ICUs internally

Users never see token counts

Pricing Multiplier

Base plans: 3.3× markup

PAYG: 4.0× markup

This yields ~65–75% gross margin.

4. Plan Definitions
Starter — €29 / month

Target: Solo users, early exploration

Included:

900 ICUs / month

Real cost ≈ €9

Margin ≈ 69%

Behavior:

Soft warnings at 75%, 90%

At 100%: advanced AI actions pause

No PAYG unless explicitly enabled

Pro — €99 / month

Target: Ops leads, consultants, AI teams

Included:

3,500 ICUs / month

Real cost ≈ €35

Margin ≈ 65%

Includes:

Governance insights

Cross-session intelligence

Exports & blueprints

PAYG (opt-in)

Enterprise — Custom

Volume ICU pricing (2.0–2.5×)

Custom models

Data residency

SLA & invoicing

Optional usage pooling

5. Pay-As-You-Go (PAYG)

Available only on Pro+.

Pricing

€0.04 per ICU

Real cost: €0.01

Margin: 75%

Rules

Explicit opt-in required

Monthly PAYG cap required (default €50)

Never auto-enabled

Can be disabled at any time

6. ICU Consumption (Indicative)
Action	Typical ICUs
Light clarification	10–30
Process extraction	40–80
Opportunity scan	80–150
Tool matching	40–80
Blueprint generation	120–200
Governance reasoning	60–120

Exact costs may vary by model and prompt length.

7. Enforcement Rules
Always Free

Viewing sessions

Reading outputs

Editing notes

Navigating artifacts

Metered

New AI reasoning actions

Scans

Blueprint generation

Governance creation

Blocking Behavior

Let current AI response finish

Block new heavy actions when limit reached

Provide explanation + options:

Wait for reset

Enable PAYG

Upgrade plan

No abrupt interruptions.

8. UX Guidelines (Executive-Grade)
Workspace Usage Indicator

Progress bar (no numbers by default)

Tooltip explains usage qualitatively

Example:

“Used for analysis, opportunity discovery, and recommendations.”

Session-Level Feedback

Subtle copy only:

“This session used more analysis than usual.”

No cost shown inline unless user clicks “Details”.

9. Legal & Compliance (EU / NL / Global)
EU / Netherlands

PAYG requires explicit consent (GDPR + consumer law)

Monthly caps required

No dark patterns

Clear billing explanation required

VAT

Stripe handles VAT collection

Prices shown excluding VAT where required

KYC

Not required

Stripe handles fraud detection

Enterprise invoicing may require business verification

10. Engineering Constraints

Billing must be deterministic

ICU deduction happens after successful AI call

Failed calls do not consume ICUs

All usage tracked per workspace per month

Reset on calendar month boundary (UTC)

11. Non-Goals (Explicit)

No per-seat pricing (yet)

No hidden throttling

No model-specific upcharges exposed to users

No surprise overages

12. Future Extensions

Session cost breakdown (optional)

Cost anomaly detection

Budget alerts

Usage forecasting

Enterprise usage pooling

This document is the source of truth for billing behavior.