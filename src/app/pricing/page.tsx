'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion, type Variants } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  ArrowRight,
  HelpCircle
} from 'lucide-react';

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-radial from-background via-background to-surface-subtle">
      {/* Navigation - matches landing page */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-card/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            <Link href="/" className="flex items-center space-x-2.5 transition-opacity hover:opacity-80">
              <Image src="/logo.png" alt="BTI" width={28} height={28} className="rounded" />
              <span className="font-semibold text-lg tracking-tight">Better Than Interns</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Home
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="cta" size="default">
                  Start free trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-2xl mx-auto space-y-4"
        >
          <motion.h1 variants={fadeIn} className="text-4xl lg:text-5xl font-bold tracking-tight">
            Pricing
          </motion.h1>
          <motion.p variants={fadeIn} className="text-lg text-text-secondary">
            Choose a plan that fits your organization.
          </motion.p>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {/* Starter */}
          <motion.div variants={fadeIn}>
            <Card variant="default" interactive className="h-full rounded-2xl">
              <CardHeader className="space-y-3">
                <CardTitle className="text-xl font-semibold">Starter</CardTitle>
                <CardDescription className="text-sm">
                  For solo consultants and small teams.
                </CardDescription>
                <Badge variant="outline" className="w-fit text-xs">
                  Testing the waters
                </Badge>
                <div className="pt-2">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold">€29</span>
                    <span className="text-muted-foreground ml-2">/ month</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {[
                    '1 workspace',
                    'Up to 3 projects',
                    'Process mapping + AI opportunities',
                    'Tool recommendations',
                    'Basic blueprint exports'
                  ].map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-4 w-4 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/signup?plan=starter" className="block">
                  <Button variant="outline" className="w-full">
                    Start with Starter
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pro (Highlighted) */}
          <motion.div variants={fadeIn}>
            <Card variant="elevated" className="h-full rounded-2xl ring-2 ring-brand-200 border-brand-200 relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 text-white px-3 py-1 text-xs">
                Popular
              </Badge>
              <CardHeader className="space-y-3 pt-8">
                <CardTitle className="text-xl font-semibold">Pro</CardTitle>
                <CardDescription className="text-sm">
                  For operations leads and teams scaling AI.
                </CardDescription>
                <Badge variant="outline" className="w-fit border-brand-200 text-brand-700 bg-brand-50 text-xs">
                  Ops/AI leads & compliance
                </Badge>
                <div className="pt-2">
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-brand-600">€99</span>
                    <span className="text-muted-foreground ml-2">/ month</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {[
                    'Unlimited projects',
                    'Unlimited team members',
                    'Advanced blueprints + exports',
                    'AI Use Case Registry',
                    'Risk & Policy Management (G1-G3)',
                    'Priority support'
                  ].map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-4 w-4 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-sm font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href="/signup?plan=pro" className="block">
                  <Button variant="cta" className="w-full">
                    Start 14-day trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enterprise */}
          <motion.div variants={fadeIn}>
            <Card variant="default" interactive className="h-full rounded-2xl">
              <CardHeader className="space-y-3">
                <CardTitle className="text-xl font-semibold">Enterprise</CardTitle>
                <CardDescription className="text-sm">
                  For organizations with advanced requirements.
                </CardDescription>
                <Badge variant="outline" className="w-fit text-xs">
                  Large orgs with custom needs
                </Badge>
                <div className="pt-2">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold">Custom</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {[
                    'Everything in Pro',
                    'Custom governance workflows',
                    'SSO & advanced security controls',
                    'Dedicated onboarding & training',
                    'Custom integrations & API access',
                    'Dedicated account manager'
                  ].map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-4 w-4 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href="mailto:hello@betterthaninterns.com?subject=Enterprise%20Better%20Than%20Interns&body=Hi,%20I'm%20interested%20in%20the%20Enterprise%20plan."
                  className="block"
                >
                  <Button variant="outline" className="w-full">
                    Contact Sales
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* Comparison Table */}
      <section className="bg-surface-subtle/50 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12"
        >
          <motion.div variants={fadeIn} className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Compare Plans</h2>
            <p className="text-text-secondary">
              See what is included in each tier.
            </p>
          </motion.div>

          <motion.div variants={fadeIn}>
            <Card variant="elevated" className="rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/40 bg-surface-subtle">
                        <th className="text-left py-4 px-6 font-medium text-sm">Feature</th>
                        <th className="text-center py-4 px-4 font-medium text-sm">Starter</th>
                        <th className="text-center py-4 px-4 font-medium text-sm bg-brand-50/50">Pro</th>
                        <th className="text-center py-4 px-4 font-medium text-sm">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {[
                        { feature: 'Projects', starter: 'Up to 3', pro: 'Unlimited', enterprise: 'Unlimited' },
                        { feature: 'Team members', starter: '1', pro: 'Unlimited', enterprise: 'Unlimited' },
                        { feature: 'AI Use Case Registry', starter: false, pro: true, enterprise: true },
                        { feature: 'Risk & Policy Management', starter: false, pro: true, enterprise: true },
                        { feature: 'Custom integrations & API', starter: false, pro: false, enterprise: true },
                        { feature: 'SSO & advanced security', starter: false, pro: false, enterprise: true },
                        { feature: 'Support', starter: 'Email', pro: 'Priority', enterprise: 'Dedicated' },
                      ].map((row, i) => (
                        <tr key={row.feature} className={i < 6 ? 'border-b border-border/20' : ''}>
                          <td className="py-4 px-6">{row.feature}</td>
                          <td className="py-4 px-4 text-center text-muted-foreground">
                            {typeof row.starter === 'boolean' ? (
                              row.starter ? <Check className="h-4 w-4 text-brand-500 mx-auto" /> : <span className="text-lg">-</span>
                            ) : row.starter}
                          </td>
                          <td className="py-4 px-4 text-center bg-brand-50/30">
                            {typeof row.pro === 'boolean' ? (
                              row.pro ? <Check className="h-4 w-4 text-brand-500 mx-auto" /> : <span className="text-lg">-</span>
                            ) : row.pro}
                          </td>
                          <td className="py-4 px-4 text-center text-muted-foreground">
                            {typeof row.enterprise === 'boolean' ? (
                              row.enterprise ? <Check className="h-4 w-4 text-brand-500 mx-auto" /> : <span className="text-lg">-</span>
                            ) : row.enterprise}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12"
        >
          <motion.div variants={fadeIn} className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
            <p className="text-text-secondary">
              Honest answers to the questions you are actually wondering about.
            </p>
          </motion.div>

          <motion.div variants={staggerContainer} className="space-y-4">
            {[
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. No long-term contracts, no cancellation fees. If you cancel, you keep access until the end of your billing period. Your data stays in your workspace so you can export or pick up where you left off if you come back.'
              },
              {
                q: 'Do you store my client data?',
                a: "We store process maps, blueprints, and governance data you create in the app. We use OpenAI's API for AI features with zero retention (they do not train on your data). All data is encrypted at rest and in transit. We never sell or share your data with third parties."
              },
              {
                q: 'Can I use this just for internal processes?',
                a: "Absolutely. Many teams use Better Than Interns to map and automate their own operations, not just client work. Whether you are a consultant, internal ops team, or compliance department, the tool works the same way."
              },
              {
                q: 'What happens after the 14-day trial?',
                a: "Your trial includes full Pro access. After 14 days, you can choose to subscribe to Pro, downgrade to Starter (limited projects), or cancel. We will send reminders before your trial ends."
              },
              {
                q: 'Do you offer discounts for nonprofits or educators?',
                a: 'Yes. We offer 50% off Pro plans for registered nonprofits and educational institutions. Email us with proof of status and we will set you up.'
              },
              {
                q: 'Can I upgrade or downgrade my plan?',
                a: "Yes, anytime. Upgrades take effect immediately and we will prorate the charge. Downgrades take effect at the end of your current billing cycle."
              }
            ].map((faq) => (
              <motion.div key={faq.q} variants={fadeIn}>
                <Card variant="default" interactive className="rounded-xl">
                  <CardHeader className="space-y-2">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-brand-50 p-2 flex-shrink-0">
                        <HelpCircle className="h-4 w-4 text-brand-500" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <CardTitle className="text-base font-medium">{faq.q}</CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                          {faq.a}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-800 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white"
        >
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to begin.
          </h2>
          <p className="text-lg text-brand-200 mb-10">
            Start your 14-day free trial. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup?plan=pro">
              <Button size="xl" variant="cta" className="shadow-medium">
                Start free trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/">
              <Button size="xl" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white/50">
                Learn more
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer - matches landing page */}
      <footer className="border-t border-border/40 bg-surface-subtle/30 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Image src="/logo.png" alt="BTI" width={24} height={24} className="rounded" />
                <span className="font-semibold">Better Than Interns</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                AI implementation planning without the hype.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-4">Product</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-4">Account</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="text-muted-foreground hover:text-foreground transition-colors">
                    Create account
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-4">Legal & Contact</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hello@betterthaninterns.com?subject=Contact%20Better%20Than%20Interns"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/40 mt-12 pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Better Than Interns. Built with AI, governed by humans.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
