import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  ArrowRight,
  Sparkles,
  HelpCircle
} from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6" />
              <span className="font-bold text-xl">Better Than Interns</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost">Home</Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/signup">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-4">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Pricing that's better than hiring an intern
          </h1>
          <p className="text-xl text-muted-foreground">
            Start small, scale when spreadsheets and sticky notes stop working
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Starter */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Starter</CardTitle>
              <CardDescription>
                For solo consultants & small teams
              </CardDescription>
              <div className="pt-4">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">€39</span>
                  <span className="text-muted-foreground ml-2">/ month</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">1 workspace</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Up to 3 projects</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Process mapping + AI opportunities</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Tool recommendations</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Basic blueprint exports</span>
                </li>
              </ul>

              <Link href="/signup?plan=starter" className="block">
                <Button variant="outline" className="w-full">
                  Start with Starter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Pro (Highlighted) */}
          <Card className="border-primary shadow-lg relative">
            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
              Most Popular
            </Badge>
            <CardHeader>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <CardDescription>
                For teams who actually ship AI projects
              </CardDescription>
              <div className="pt-4">
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold">€99</span>
                  <span className="text-muted-foreground ml-2">/ month</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Unlimited projects</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Unlimited team members</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Advanced blueprints + exports</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">AI Use Case Registry</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Risk & Policy Management (G1-G3)</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Priority support</span>
                </li>
              </ul>

              <Link href="/signup?plan=pro" className="block">
                <Button className="w-full">
                  Start 14-day trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Enterprise */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Enterprise</CardTitle>
              <CardDescription>
                For companies who want AI and sleep
              </CardDescription>
              <div className="pt-4">
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold">Let's talk</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Everything in Pro</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Custom governance workflows</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">SSO & advanced security controls</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Dedicated onboarding & training</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Custom integrations & API access</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <span className="text-sm">Dedicated account manager</span>
                </li>
              </ul>

              <a
                href="mailto:hello@betterthaninterns.com?subject=Enterprise%20Better%20Than%20Interns&body=Hi,%20I'm%20interested%20in%20the%20Enterprise%20plan.%20Here's%20some%20context%20about%20our%20team:"
                className="block"
              >
                <Button variant="outline" className="w-full">
                  Contact Sales
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">
            Honest answers to the questions you're actually wondering about
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start space-x-3">
                <HelpCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <CardTitle className="text-lg">Can I cancel anytime?</CardTitle>
                  <CardDescription className="pt-2">
                    Yes. No long-term contracts, no cancellation fees. If you cancel, you keep access
                    until the end of your billing period. Your data stays in your workspace so you can
                    export or pick up where you left off if you come back.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start space-x-3">
                <HelpCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <CardTitle className="text-lg">Do you store my client data?</CardTitle>
                  <CardDescription className="pt-2">
                    We store process maps, blueprints, and governance data you create in the app.
                    We use OpenAI's API for AI features with zero retention (they don't train on your data).
                    All data is encrypted at rest and in transit. We never sell or share your data with third parties.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start space-x-3">
                <HelpCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <CardTitle className="text-lg">Can I use this just for internal processes?</CardTitle>
                  <CardDescription className="pt-2">
                    Absolutely. Many teams use Better Than Interns to map and automate their own operations,
                    not just client work. Whether you're a consultant, internal ops team, or compliance department,
                    the tool works the same way.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start space-x-3">
                <HelpCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <CardTitle className="text-lg">What happens after the 14-day trial?</CardTitle>
                  <CardDescription className="pt-2">
                    Your trial includes full Pro access. After 14 days, you can choose to subscribe to Pro,
                    downgrade to Starter (limited projects), or cancel. We'll send friendly reminders before
                    your trial ends—no surprise charges.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start space-x-3">
                <HelpCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <CardTitle className="text-lg">Do you offer discounts for nonprofits or educators?</CardTitle>
                  <CardDescription className="pt-2">
                    Yes! We offer 50% off Pro plans for registered nonprofits and educational institutions.
                    Email us at{' '}
                    <a
                      href="mailto:hello@betterthaninterns.com?subject=Nonprofit/Education%20Discount"
                      className="text-primary hover:underline"
                    >
                      hello@betterthaninterns.com
                    </a>{' '}
                    with proof of status and we'll set you up.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start space-x-3">
                <HelpCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                <div>
                  <CardTitle className="text-lg">Can I upgrade or downgrade my plan?</CardTitle>
                  <CardDescription className="pt-2">
                    Yes, anytime. Upgrades take effect immediately and we'll prorate the charge. Downgrades
                    take effect at the end of your current billing cycle. If downgrading to Starter would exceed
                    the 3-project limit, we'll let you archive or delete projects first.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-4xl font-bold">Ready to get started?</h2>
          <p className="text-xl text-muted-foreground">
            Start your 14-day free trial. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/signup?plan=pro">
              <Button size="lg" className="text-lg px-8">
                Start free trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline" className="text-lg px-8">
                Learn more
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5" />
                <span className="font-bold">Better Than Interns</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI implementation planning without the hype
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/pricing" className="text-muted-foreground hover:text-foreground">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/#how-it-works" className="text-muted-foreground hover:text-foreground">
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Account</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="text-muted-foreground hover:text-foreground">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal & Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground">
                    Privacy Policy (coming soon)
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hello@betterthaninterns.com?subject=Contact%20Better%20Than%20Interns"
                    className="text-muted-foreground hover:text-foreground"
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
