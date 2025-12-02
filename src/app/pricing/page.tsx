'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  ArrowRight,
  Sparkles,
  HelpCircle
} from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-radial from-background via-background to-muted/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 group">
              <Sparkles className="h-6 w-6 text-brand-500" />
              <span className="font-bold text-xl">Better Than Interns</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" className="hover:-translate-y-[1px] transition-all">
                  Home
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" className="hover:-translate-y-[1px] transition-all">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-brand-500 hover:bg-brand-600 hover:-translate-y-[1px] transition-all">
                  Get Started
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
          className="max-w-3xl mx-auto space-y-6"
        >
          <motion.h1 variants={fadeIn} className="text-5xl md:text-6xl font-bold tracking-tight">
            Pricing that's better than hiring an intern
          </motion.h1>
          <motion.p variants={fadeIn} className="text-xl text-muted-foreground">
            Start small, scale when spreadsheets and sticky notes stop working
          </motion.p>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
        >
          {/* Starter */}
          <motion.div variants={fadeIn}>
            <Card className="h-full rounded-2xl border-border/60 bg-gradient-to-br from-card to-muted/40 shadow-soft transition-all hover:shadow-medium hover:border-brand-200 hover:-translate-y-[2px]">
              <CardHeader className="space-y-3">
                <CardTitle className="text-2xl font-semibold">Starter</CardTitle>
                <CardDescription className="text-base">
                  For solo consultants & small teams
                </CardDescription>
                <Badge variant="outline" className="w-fit border-muted-foreground/30 text-muted-foreground text-xs">
                  Best for: Testing the waters
                </Badge>
                <div className="pt-2">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold">€39</span>
                    <span className="text-muted-foreground ml-2 text-lg">/ month</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3.5">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm">1 workspace</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm">Up to 3 projects</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm">Process mapping + AI opportunities</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm">Tool recommendations</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm">Basic blueprint exports</span>
                  </li>
                </ul>

                <Link href="/signup?plan=starter" className="block">
                  <Button variant="outline" className="w-full hover:-translate-y-[1px] transition-all">
                    Start with Starter
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Pro (Highlighted) */}
          <motion.div variants={fadeIn}>
            <Card className="h-full rounded-2xl ring-2 ring-brand-400/60 bg-gradient-to-br from-brand-50/80 to-card shadow-strong transition-all hover:shadow-strong hover:ring-brand-500 hover:-translate-y-[2px] relative">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-1">
                Most Popular
              </Badge>
              <CardHeader className="space-y-3 pt-8">
                <CardTitle className="text-2xl font-semibold">Pro</CardTitle>
                <CardDescription className="text-base">
                  For teams who actually ship AI projects
                </CardDescription>
                <Badge variant="outline" className="w-fit border-brand-300 text-brand-700 bg-brand-50 text-xs">
                  Best for: Ops/AI leads & compliance
                </Badge>
                <div className="pt-2">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-brand-600">€99</span>
                    <span className="text-muted-foreground ml-2 text-lg">/ month</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3.5">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm font-medium">Unlimited projects</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm font-medium">Unlimited team members</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm font-medium">Advanced blueprints + exports</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm font-medium">AI Use Case Registry</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm font-medium">Risk & Policy Management (G1-G3)</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm font-medium">Priority support</span>
                  </li>
                </ul>

                <Link href="/signup?plan=pro" className="block">
                  <Button className="w-full bg-brand-500 hover:bg-brand-600 hover:-translate-y-[1px] transition-all shadow-md">
                    Start 14-day trial
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </motion.div>

          {/* Enterprise */}
          <motion.div variants={fadeIn}>
            <Card className="h-full rounded-2xl border-border/60 bg-gradient-to-br from-card to-muted/40 shadow-soft transition-all hover:shadow-medium hover:border-brand-200 hover:-translate-y-[2px]">
              <CardHeader className="space-y-3">
                <CardTitle className="text-2xl font-semibold">Enterprise</CardTitle>
                <CardDescription className="text-base">
                  For companies who want AI and sleep
                </CardDescription>
                <Badge variant="outline" className="w-fit border-muted-foreground/30 text-muted-foreground text-xs">
                  Best for: Large orgs with custom needs
                </Badge>
                <div className="pt-2">
                  <div className="flex items-baseline">
                    <span className="text-3xl font-bold">Let's talk</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3.5">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm">Everything in Pro</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm">Custom governance workflows</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm">SSO & advanced security controls</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm">Dedicated onboarding & training</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm">Custom integrations & API access</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-brand-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-sm">Dedicated account manager</span>
                  </li>
                </ul>

                <a
                  href="mailto:hello@betterthaninterns.com?subject=Enterprise%20Better%20Than%20Interns&body=Hi,%20I'm%20interested%20in%20the%20Enterprise%20plan.%20Here's%20some%20context%20about%20our%20team:"
                  className="block"
                >
                  <Button variant="outline" className="w-full hover:-translate-y-[1px] transition-all">
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
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="space-y-8"
        >
          <motion.div variants={fadeIn} className="text-center space-y-3">
            <h2 className="text-3xl font-bold">Compare Plans</h2>
            <p className="text-lg text-muted-foreground">
              See what's included in each tier
            </p>
          </motion.div>

          <motion.div variants={fadeIn}>
            <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-muted/30 shadow-soft overflow-hidden">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/20">
                        <th className="text-left py-4 px-6 font-semibold text-sm">Feature</th>
                        <th className="text-center py-4 px-4 font-semibold text-sm">Starter</th>
                        <th className="text-center py-4 px-4 font-semibold text-sm bg-brand-50/50">Pro</th>
                        <th className="text-center py-4 px-4 font-semibold text-sm">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/20">
                        <td className="py-4 px-6 text-sm">Projects</td>
                        <td className="py-4 px-4 text-center text-sm text-muted-foreground">Up to 3</td>
                        <td className="py-4 px-4 text-center text-sm bg-brand-50/30">Unlimited</td>
                        <td className="py-4 px-4 text-center text-sm text-muted-foreground">Unlimited</td>
                      </tr>
                      <tr className="border-b border-border/20">
                        <td className="py-4 px-6 text-sm">Team members</td>
                        <td className="py-4 px-4 text-center text-sm text-muted-foreground">1</td>
                        <td className="py-4 px-4 text-center text-sm bg-brand-50/30">Unlimited</td>
                        <td className="py-4 px-4 text-center text-sm text-muted-foreground">Unlimited</td>
                      </tr>
                      <tr className="border-b border-border/20">
                        <td className="py-4 px-6 text-sm">AI Use Case Registry</td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-muted-foreground text-xl">-</span>
                        </td>
                        <td className="py-4 px-4 text-center bg-brand-50/30">
                          <Check className="h-5 w-5 text-brand-500 mx-auto" />
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Check className="h-5 w-5 text-brand-500 mx-auto" />
                        </td>
                      </tr>
                      <tr className="border-b border-border/20">
                        <td className="py-4 px-6 text-sm">Risk & Policy Management</td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-muted-foreground text-xl">-</span>
                        </td>
                        <td className="py-4 px-4 text-center bg-brand-50/30">
                          <Check className="h-5 w-5 text-brand-500 mx-auto" />
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Check className="h-5 w-5 text-brand-500 mx-auto" />
                        </td>
                      </tr>
                      <tr className="border-b border-border/20">
                        <td className="py-4 px-6 text-sm">Custom integrations & API</td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-muted-foreground text-xl">-</span>
                        </td>
                        <td className="py-4 px-4 text-center bg-brand-50/30">
                          <span className="text-muted-foreground text-xl">-</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Check className="h-5 w-5 text-brand-500 mx-auto" />
                        </td>
                      </tr>
                      <tr className="border-b border-border/20">
                        <td className="py-4 px-6 text-sm">SSO & advanced security</td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-muted-foreground text-xl">-</span>
                        </td>
                        <td className="py-4 px-4 text-center bg-brand-50/30">
                          <span className="text-muted-foreground text-xl">-</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Check className="h-5 w-5 text-brand-500 mx-auto" />
                        </td>
                      </tr>
                      <tr>
                        <td className="py-4 px-6 text-sm">Support</td>
                        <td className="py-4 px-4 text-center text-sm text-muted-foreground">Email</td>
                        <td className="py-4 px-4 text-center text-sm bg-brand-50/30">Priority</td>
                        <td className="py-4 px-4 text-center text-sm text-muted-foreground">Dedicated</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="space-y-12"
        >
          <motion.div variants={fadeIn} className="text-center space-y-4">
            <h2 className="text-4xl font-bold">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">
              Honest answers to the questions you're actually wondering about
            </p>
          </motion.div>

          <motion.div variants={staggerContainer} className="space-y-4">
            <motion.div variants={fadeIn}>
              <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-muted/40 shadow-soft transition-all hover:shadow-medium hover:border-brand-200">
                <CardHeader className="space-y-3">
                  <div className="flex items-start space-x-4">
                    <div className="rounded-full bg-brand-50 p-2">
                      <HelpCircle className="h-5 w-5 text-brand-500 flex-shrink-0" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <CardTitle className="text-lg font-semibold">Can I cancel anytime?</CardTitle>
                      <CardDescription className="text-base leading-relaxed">
                        Yes. No long-term contracts, no cancellation fees. If you cancel, you keep access
                        until the end of your billing period. Your data stays in your workspace so you can
                        export or pick up where you left off if you come back.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div variants={fadeIn}>
              <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-muted/40 shadow-soft transition-all hover:shadow-medium hover:border-brand-200">
                <CardHeader className="space-y-3">
                  <div className="flex items-start space-x-4">
                    <div className="rounded-full bg-brand-50 p-2">
                      <HelpCircle className="h-5 w-5 text-brand-500 flex-shrink-0" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <CardTitle className="text-lg font-semibold">Do you store my client data?</CardTitle>
                      <CardDescription className="text-base leading-relaxed">
                        We store process maps, blueprints, and governance data you create in the app.
                        We use OpenAI's API for AI features with zero retention (they don't train on your data).
                        All data is encrypted at rest and in transit. We never sell or share your data with third parties.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div variants={fadeIn}>
              <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-muted/40 shadow-soft transition-all hover:shadow-medium hover:border-brand-200">
                <CardHeader className="space-y-3">
                  <div className="flex items-start space-x-4">
                    <div className="rounded-full bg-brand-50 p-2">
                      <HelpCircle className="h-5 w-5 text-brand-500 flex-shrink-0" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <CardTitle className="text-lg font-semibold">Can I use this just for internal processes?</CardTitle>
                      <CardDescription className="text-base leading-relaxed">
                        Absolutely. Many teams use Better Than Interns to map and automate their own operations,
                        not just client work. Whether you're a consultant, internal ops team, or compliance department,
                        the tool works the same way.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div variants={fadeIn}>
              <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-muted/40 shadow-soft transition-all hover:shadow-medium hover:border-brand-200">
                <CardHeader className="space-y-3">
                  <div className="flex items-start space-x-4">
                    <div className="rounded-full bg-brand-50 p-2">
                      <HelpCircle className="h-5 w-5 text-brand-500 flex-shrink-0" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <CardTitle className="text-lg font-semibold">What happens after the 14-day trial?</CardTitle>
                      <CardDescription className="text-base leading-relaxed">
                        Your trial includes full Pro access. After 14 days, you can choose to subscribe to Pro,
                        downgrade to Starter (limited projects), or cancel. We'll send friendly reminders before
                        your trial ends—no surprise charges.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div variants={fadeIn}>
              <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-muted/40 shadow-soft transition-all hover:shadow-medium hover:border-brand-200">
                <CardHeader className="space-y-3">
                  <div className="flex items-start space-x-4">
                    <div className="rounded-full bg-brand-50 p-2">
                      <HelpCircle className="h-5 w-5 text-brand-500 flex-shrink-0" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <CardTitle className="text-lg font-semibold">Do you offer discounts for nonprofits or educators?</CardTitle>
                      <CardDescription className="text-base leading-relaxed">
                        Yes! We offer 50% off Pro plans for registered nonprofits and educational institutions.
                        Email us at{' '}
                        <a
                          href="mailto:hello@betterthaninterns.com?subject=Nonprofit/Education%20Discount"
                          className="text-brand-500 hover:text-brand-600 underline underline-offset-2"
                        >
                          hello@betterthaninterns.com
                        </a>{' '}
                        with proof of status and we'll set you up.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>

            <motion.div variants={fadeIn}>
              <Card className="rounded-2xl border-border/60 bg-gradient-to-br from-card to-muted/40 shadow-soft transition-all hover:shadow-medium hover:border-brand-200">
                <CardHeader className="space-y-3">
                  <div className="flex items-start space-x-4">
                    <div className="rounded-full bg-brand-50 p-2">
                      <HelpCircle className="h-5 w-5 text-brand-500 flex-shrink-0" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <CardTitle className="text-lg font-semibold">Can I upgrade or downgrade my plan?</CardTitle>
                      <CardDescription className="text-base leading-relaxed">
                        Yes, anytime. Upgrades take effect immediately and we'll prorate the charge. Downgrades
                        take effect at the end of your current billing cycle. If downgrading to Starter would exceed
                        the 3-project limit, we'll let you archive or delete projects first.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-brand-500 to-brand-600 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8"
        >
          <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-bold text-white">
            Ready to get started?
          </motion.h2>
          <motion.p variants={fadeIn} className="text-xl text-brand-50">
            Start your 14-day free trial. No credit card required.
          </motion.p>
          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/signup?plan=pro">
              <Button size="lg" className="text-lg px-8 bg-white text-brand-600 hover:bg-brand-50 hover:-translate-y-[2px] transition-all shadow-strong">
                Start free trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="text-lg px-8 border-white text-white hover:bg-white/10 hover:-translate-y-[2px] transition-all">
                Learn more
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-brand-500" />
                <span className="font-bold">Better Than Interns</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI implementation planning without the hype
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-xs uppercase tracking-wide text-muted-foreground">Product</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/pricing" className="text-foreground/80 hover:text-brand-500 transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="text-foreground/80 hover:text-brand-500 transition-colors">
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-xs uppercase tracking-wide text-muted-foreground">Account</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link href="/login" className="text-foreground/80 hover:text-brand-500 transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="text-foreground/80 hover:text-brand-500 transition-colors">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-xs uppercase tracking-wide text-muted-foreground">Legal & Contact</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="text-foreground/80 hover:text-brand-500 transition-colors">
                    Privacy Policy (coming soon)
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hello@betterthaninterns.com?subject=Contact%20Better%20Than%20Interns"
                    className="text-foreground/80 hover:text-brand-500 transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Better Than Interns. Built with AI, governed by humans.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
