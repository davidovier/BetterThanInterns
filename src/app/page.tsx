'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  Search,
  Wrench,
  FileText,
  Shield,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { motion, type Variants } from 'framer-motion';

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 }
  }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.3
    }
  }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-radial from-background via-background to-surface-subtle">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-card/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-18">
            <Link href="/" className="flex items-center space-x-2.5 transition-opacity hover:opacity-80">
              <Image src="/logo.png" alt="BTI" width={28} height={28} className="rounded" />
              <span className="font-semibold text-lg tracking-tight">Better Than Interns</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/pricing">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Pricing
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

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Content */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-8"
          >
            <motion.h1
              variants={fadeIn}
              className="text-display-sm lg:text-display font-bold tracking-tight"
            >
              Turn messy processes into{' '}
              <span className="text-amber-600">AI projects</span> in under an hour.
            </motion.h1>

            <motion.p
              variants={fadeIn}
              className="text-lg lg:text-xl text-text-secondary max-w-xl leading-relaxed"
            >
              Better Than Interns interviews your team, maps workflows, finds automation opportunities,
              and produces an AI implementation plan your boss and lawyer can both accept.
            </motion.p>

            <motion.div
              variants={fadeIn}
              className="flex flex-col sm:flex-row gap-4 pt-2"
            >
              <Link href="/signup">
                <Button variant="cta" size="xl">
                  Start free trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="xl">
                  See how it works
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: Product Preview Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
            className="relative"
          >
            <Card variant="elevated" className="rounded-2xl overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Invoice Processing Workflow
                  </CardTitle>
                  <Badge variant="secondary" className="bg-brand-50 text-brand-700 border-0">
                    4 steps
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Workflow preview */}
                <div className="space-y-2.5">
                  {['Receive Email', 'Manual Entry', 'Approval', 'Payment'].map((step, i) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.08, ease: 'easeOut' }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-surface-subtle border border-border/40"
                    >
                      <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-brand-700">{i + 1}</span>
                      </div>
                      <span className="text-sm font-medium">{step}</span>
                      {i === 1 && (
                        <Badge className="ml-auto bg-warm-100 text-warm-700 border-0 text-xs">
                          AI Opportunity
                        </Badge>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Chat snippet */}
                <div className="pt-4 border-t border-border/40">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="flex-1 pt-0.5">
                      <p className="text-sm text-muted-foreground italic leading-relaxed">
                        "I found an automation opportunity: replace manual data entry with OCR processing."
                      </p>
                    </div>
                  </div>
                </div>

                {/* Impact score - static, no animation */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Impact Score</span>
                  <span className="text-sm font-semibold text-warm-600">85%</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-surface-subtle/50 py-24 lg:py-28">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16"
        >
          <motion.div variants={fadeIn} className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">How It Works</h2>
            <p className="text-lg text-text-secondary">
              From chaos to implementation plan in four steps.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', icon: MessageSquare, title: 'Chat to map your process', desc: 'Describe your workflow in natural language. The assistant builds a visual process map as you explain.' },
              { step: '02', icon: Search, title: 'Scan for AI opportunities', desc: 'Each step is analyzed for automation potential. Honest assessments of impact vs. effort.' },
              { step: '03', icon: Wrench, title: 'Find effective tools', desc: 'Get matched with AI tools and platforms that solve your problem. Recommendations based on requirements.' },
              { step: '04', icon: FileText, title: 'Export a real blueprint', desc: 'Download a professional implementation document with ROI estimates and risk assessments.' }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.title} variants={fadeIn}>
                  <Card variant="default" interactive className="h-full rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-4 right-4 text-6xl font-bold text-muted-foreground/10 group-hover:text-brand-500/10 transition-colors">
                      {item.step}
                    </div>
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center mb-4 relative z-10">
                        <Icon className="h-6 w-6 text-brand-600" />
                      </div>
                      <CardTitle className="text-lg relative z-10">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
                        {item.desc}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Governance Teaser */}
      <section className="py-24 lg:py-28">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <Card variant="elevated" className="rounded-2xl overflow-hidden">
            <CardHeader className="text-center pb-8 pt-10">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-brand-600" />
              </div>
              <CardTitle className="text-2xl lg:text-3xl font-semibold">
                When ready, enable Governance Mode.
              </CardTitle>
              <CardDescription className="text-base pt-2">
                Governance built in from the start.
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-10">
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { title: 'AI Use Case Registry', desc: 'Track every AI system from pilot to production.' },
                  { title: 'Risk Assessment', desc: 'AI-drafted risk analysis that your lawyer can sleep on.' },
                  { title: 'Policies & Controls', desc: 'Map GDPR, SOC2, and custom policies to AI projects.' }
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl bg-surface-subtle">
                    <CheckCircle2 className="h-5 w-5 text-brand-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Use Cases / Personas */}
      <section className="bg-surface-subtle/50 py-24 lg:py-28">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16"
        >
          <motion.div variants={fadeIn} className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">Built for people who ship AI.</h2>
            <p className="text-lg text-text-secondary">
              Whether solo or scaling.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Solo consultant',
                subtitle: 'Sell on speed and polish.',
                desc: 'Turn client interviews into polished AI implementation plans in hours, not weeks. Win more proposals with professional blueprints.',
                features: ['Interview to blueprint in one session.', 'Professional exports for client decks.', 'Reusable process templates.']
              },
              {
                title: 'Ops / AI lead',
                subtitle: 'Sell on visibility and ROI.',
                desc: 'Get exec buy-in with clear before/after process maps and ROI calculations. Track all AI initiatives in one place.',
                features: ['Portfolio view of all AI projects.', 'Impact vs. effort scoring.', 'Team collaboration on blueprints.'],
                highlighted: true
              },
              {
                title: 'Legal / Risk / Compliance',
                subtitle: 'Sell on governance.',
                desc: 'A system that tracks AI use cases, risk profiles, and policy compliance without another spreadsheet.',
                features: ['AI use case registry from day one.', 'Risk assessments with audit trails.', 'Policy mapping (GDPR, SOC2, custom).']
              }
            ].map((persona) => (
              <motion.div key={persona.title} variants={fadeIn}>
                <Card
                  variant={persona.highlighted ? 'elevated' : 'default'}
                  className={`h-full rounded-2xl ${persona.highlighted ? 'ring-2 ring-brand-200 border-brand-200' : ''}`}
                >
                  <CardHeader>
                    {persona.highlighted && (
                      <Badge className="w-fit mb-3 bg-brand-500 text-white border-0 text-xs">Popular</Badge>
                    )}
                    <CardTitle className="text-lg">{persona.title}</CardTitle>
                    <CardDescription className="text-sm font-medium">{persona.subtitle}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {persona.desc}
                    </p>
                    <ul className="space-y-2">
                      {persona.features.map((feature) => (
                        <li key={feature} className="flex items-start text-sm">
                          <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-brand-500 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="bg-brand-800 py-20 lg:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white"
        >
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to be better than interns?
          </h2>
          <p className="text-lg text-brand-200 mb-10 max-w-xl mx-auto">
            Start with a free trial. Upgrade when spreadsheets and sticky notes stop working.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="xl" variant="cta" className="shadow-medium">
                Start free trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="xl" variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white/50">
                View pricing
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
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
                  <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
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
