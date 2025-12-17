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

---

13. Commercial Model Summary

Hybrid model combining base subscription with optional usage-based continuation.

Tiers:
- Starter (€29/month): 900 units included, no PAYG
- Pro (€99/month): 3,500 units included, PAYG opt-in available
- Enterprise (custom): Volume pricing, invoicing, SLA

PAYG:
- Available only on Pro+
- Explicit opt-in with monthly cap required
- €0.04 per unit (4× cost markup)
- Never auto-enabled

14. Unit Economics

Cost Structure:
- 1 unit = €0.01 real OpenAI cost
- Base plans: 3.3× markup (€0.033 per unit)
- PAYG: 4.0× markup (€0.04 per unit)
- Target margin: 65-75%

Why Units (not tokens):
- Abstraction layer for model-agnostic pricing
- Future-proof against model changes
- Simpler user communication
- Enables action-based rather than token-based billing

Estimated Cost per Action (indicative):
- Light clarification: €0.10-0.30
- Process extraction: €0.40-0.80
- Opportunity scan: €0.80-1.50
- Blueprint generation: €1.20-2.00

15. EU Compliance Checklist

VAT/Invoicing:
- [ ] B2B: Reverse charge for EU business customers
- [ ] B2C EU: VAT OSS registration or Stripe Tax
- [ ] Invoices: Required for all transactions
- [ ] Receipt emails: Automatic via Stripe

Consumer Rights:
- [ ] Digital services exemption: No withdrawal right after service delivery begins
- [ ] Clear terms: Service starts immediately upon subscription
- [ ] Explicit consent: Required for PAYG activation

Transparency (AI-assisted analysis):
- [ ] Clear indication that analysis is AI-assisted
- [ ] Users understand outputs are recommendations, not decisions
- [ ] No claim of "automated decision-making" under GDPR Article 22
- [ ] Framing: "AI-assisted analysis" not "automated decisions"

Data Processing:
- [ ] DPA: Available for enterprise customers
- [ ] Sub-processors: OpenAI, Stripe, hosting provider documented
- [ ] Data location: EU hosting preferred, documented in privacy policy

16. Stripe Enablement Checklist

Environment Variables:
- STRIPE_SECRET_KEY (required)
- STRIPE_WEBHOOK_SECRET (required)
- STRIPE_PRICE_ID_PRO (required for checkout)
- STRIPE_PRICE_ID_ENTERPRISE (required for checkout)
- NEXTAUTH_URL (for redirect URLs)

Webhook Setup:
- Endpoint: /api/webhooks/stripe
- Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
- Signing: Verify with STRIPE_WEBHOOK_SECRET

Customer Portal:
- Enable for subscription management
- Configure cancellation flow
- Set up payment method updates

Tax Configuration:
- Enable Stripe Tax for automatic VAT calculation
- Configure EU tax registration numbers
- Set pricing to exclude VAT (added at checkout)

Test Mode:
- Use sk_test_* keys for development
- Create test prices in Stripe Dashboard
- Verify webhook delivery in test mode first

17. KYC/KYB Clarifications

Stripe Requirements (for us as merchant):
- Business verification required for payouts
- Identity verification for account owners
- Bank account verification
- Standard Stripe onboarding process

Customer Requirements:
- No KYC required for standard customers
- No identity verification needed
- Credit card fraud detection handled by Stripe
- Enterprise invoicing may require business address

What We Do NOT Do:
- No customer identity verification
- No document collection from users
- No manual approval processes
- No credit checks

18. Open Questions

For future iteration:
- Exact OpenAI model mix and cost breakdown by action type
- Enterprise invoicing workflow (manual vs Stripe Invoicing)
- Multi-workspace billing consolidation
- Usage forecasting accuracy requirements
- Potential per-seat pricing for team features