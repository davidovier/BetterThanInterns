import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Search,
  Wrench,
  FileText,
  Shield,
  AlertCircle,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-6 w-6" />
              <span className="font-bold text-xl">Better Than Interns</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/pricing">
                <Button variant="ghost">Pricing</Button>
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

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <Badge variant="outline" className="mb-4">
            No interns were harmed in the making of this product
          </Badge>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Turn messy processes into AI projects in under an hour
          </h1>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Better Than Interns interviews your team, maps workflows, finds automation opportunities,
            and spits out an AI implementation plan your boss and lawyer can both live with.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8">
                Get started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="outline" className="text-lg px-8">
                See how it works
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <section className="border-y bg-muted/30 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground mb-6">
            Trusted by teams who are allergic to busy work
          </p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
            <div className="px-6 py-3 bg-background rounded-lg border">
              <span className="font-semibold text-lg">Company A</span>
            </div>
            <div className="px-6 py-3 bg-background rounded-lg border">
              <span className="font-semibold text-lg">Company B</span>
            </div>
            <div className="px-6 py-3 bg-background rounded-lg border">
              <span className="font-semibold text-lg">Company C</span>
            </div>
            <div className="px-6 py-3 bg-background rounded-lg border">
              <span className="font-semibold text-lg">Company D</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground">
            From chaos to implementation plan in four simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Chat to map your process</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Talk to our AI assistant like you're explaining to a smart intern.
                It builds a visual workflow map while you chat.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Scan for AI opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We analyze each step and flag what's ripe for automation.
                No hype, just honest assessments of impact vs. effort.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Wrench className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Pick tools that don't suck</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Get matched with AI tools and platforms that actually solve your problem.
                We'll handle the AI brain, you handle the client lunch.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Export a real blueprint</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Download a professional implementation document with ROI estimates,
                tool recommendations, and risk assessments.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Governance Teaser */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="border-2">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-3xl">When you're ready, flip on Governance Mode</CardTitle>
              <CardDescription className="text-lg pt-2">
                Governance isn't sexy, but fines are worse
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 pt-4">
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">AI Use Case Registry</p>
                      <p className="text-sm text-muted-foreground">
                        Track every AI system from pilot to production
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Risk Assessment</p>
                      <p className="text-sm text-muted-foreground">
                        AI-drafted risk analysis that your lawyer can sleep on
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Policies & Controls</p>
                      <p className="text-sm text-muted-foreground">
                        Map GDPR, SOC2, and custom policies to AI projects
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Use Cases / Personas */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Built for people who ship AI</h2>
          <p className="text-xl text-muted-foreground">
            Whether you're solo or scaling
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Solo consultant</CardTitle>
              <CardDescription>
                Sell on speed and polish
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Turn client interviews into polished AI implementation plans in hours, not weeks.
                Win more proposals with professional blueprints that show you know your stuff.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                  <span>Interview → Blueprint in one session</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                  <span>Professional exports for client decks</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                  <span>Reusable process templates</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-primary">
            <CardHeader>
              <Badge className="w-fit mb-2">Most Popular</Badge>
              <CardTitle>Ops / AI lead</CardTitle>
              <CardDescription>
                Sell on visibility and ROI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Get exec buy-in with clear before/after process maps and ROI calculations.
                Track all AI initiatives in one place so nothing falls through the cracks.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                  <span>Portfolio view of all AI projects</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                  <span>Impact vs. effort scoring</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                  <span>Team collaboration on blueprints</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Legal / Risk / Compliance</CardTitle>
              <CardDescription>
                Sell on governance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Finally, a system that tracks AI use cases, risk profiles, and policy compliance
                without making you build yet another spreadsheet.
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                  <span>AI use case registry from day one</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                  <span>Risk assessments with audit trails</span>
                </li>
                <li className="flex items-start">
                  <ArrowRight className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                  <span>Policy mapping (GDPR, SOC2, custom)</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="bg-muted/30 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Simple pricing</CardTitle>
              <CardDescription className="text-lg">
                No hidden fees. No surprise invoices. Cancel anytime.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-muted-foreground mb-6">
                Start with a free trial. Upgrade when spreadsheets and sticky notes stop working.
              </p>
              <Link href="/pricing">
                <Button size="lg" variant="outline">
                  View pricing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
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
                  <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground">
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
