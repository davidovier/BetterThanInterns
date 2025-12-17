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
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Workflow,
  BarChart3,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

const fadeIn = {
  hidden: { opacity: 0.3, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
};

const staggerContainer = {
  hidden: { opacity: 0.3 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      duration: 0.2
    }
  }
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-radial from-background via-background to-muted/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-xl shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2 transition-transform hover:scale-105">
              <Image src="/logo.png" alt="BTI" width={24} height={24} className="rounded" />
              <span className="font-bold text-xl">Better Than Interns</span>
            </Link>
            <div className="flex items-center space-x-3">
              <Link href="/pricing">
                <Button variant="ghost" className="hover:-translate-y-[1px] transition-all">
                  Pricing
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="ghost" className="hover:-translate-y-[1px] transition-all">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-brand-500 hover:bg-brand-600 hover:-translate-y-[1px] hover:shadow-medium transition-all">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-8"
          >

            <motion.h1
              variants={fadeIn}
              className="text-[52px] md:text-6xl font-bold tracking-tight leading-[1.1]"
            >
              Turn messy processes into{' '}
              <span className="text-brand-500">AI projects</span> in under an hour
            </motion.h1>

            <motion.p
              variants={fadeIn}
              className="text-lg text-muted-foreground max-w-xl"
            >
              Better Than Interns interviews your team, maps workflows, finds automation opportunities,
              and spits out an AI implementation plan your boss and lawyer can both live with.
            </motion.p>

            <motion.div
              variants={fadeIn}
              className="flex flex-col sm:flex-row gap-4 pt-4"
            >
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8 bg-brand-500 hover:bg-brand-600 hover:-translate-y-[2px] hover:shadow-strong transition-all">
                  Get started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8 hover:-translate-y-[1px] hover:shadow-medium transition-all">
                  See how it works
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: Product Preview Card */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative"
          >
            <Card className="rounded-3xl border-border/60 bg-gradient-to-br from-card via-card to-muted/40 shadow-strong overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Invoice Processing Workflow
                  </CardTitle>
                  <Badge className="bg-brand-100 text-brand-700 border-0">4 steps</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Workflow preview */}
                <div className="space-y-3">
                  {['Receive Email', 'Manual Entry', 'Approval', 'Payment'].map((step, i) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-center space-x-3 p-3 rounded-xl bg-background/50 border border-border/40"
                    >
                      <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center">
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
                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground italic">
                        "I found an automation opportunity: replace manual data entry with OCR..."
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.3 }}
              className="absolute -bottom-4 -right-4 bg-warm-500 text-white px-4 py-2 rounded-full shadow-strong text-sm font-semibold"
            >
              85% Impact Score
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* How It Works */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="space-y-16"
        >
          <motion.div variants={fadeIn} className="text-center max-w-3xl mx-auto">
            <h2 className="text-[40px] font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground">
              From chaos to implementation plan in four simple steps
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', icon: MessageSquare, title: 'Chat to map your process', desc: 'Describe your workflow in natural language. The assistant builds a visual process map as you explain.' },
              { step: '02', icon: Search, title: 'Scan for AI opportunities', desc: 'Each step is analyzed for automation potential. Honest assessments of impact vs. effort, without the hype.' },
              { step: '03', icon: Wrench, title: 'Find effective tools', desc: 'Get matched with AI tools and platforms that solve your problem. Recommendations based on your requirements, not vendor hype.' },
              { step: '04', icon: FileText, title: 'Export a real blueprint', desc: 'Download a professional implementation document with ROI estimates, tool recommendations, and risk assessments.' }
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.title} variants={fadeIn}>
                  <Card className="h-full rounded-2xl border-border/60 bg-gradient-to-br from-card to-muted/30 shadow-soft hover:shadow-medium hover:border-brand-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-4 right-4 text-6xl font-bold text-muted/20">
                      {item.step}
                    </div>
                    <CardHeader>
                      <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center mb-4 relative z-10">
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
      <section className="bg-muted/20 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <Card className="rounded-3xl border-2 border-border/60 bg-gradient-to-br from-card to-muted/30 shadow-strong overflow-hidden">
            <CardHeader className="text-center pb-8">
              <div className="w-20 h-20 rounded-2xl bg-brand-100 flex items-center justify-center mx-auto mb-6">
                <Shield className="h-10 w-10 text-brand-600" />
              </div>
              <CardTitle className="text-[32px] font-semibold">
                When you're ready, flip on Governance Mode
              </CardTitle>
              <CardDescription className="text-lg pt-3">
                Governance built in from the start
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { title: 'AI Use Case Registry', desc: 'Track every AI system from pilot to production' },
                  { title: 'Risk Assessment', desc: 'AI-drafted risk analysis that your lawyer can sleep on' },
                  { title: 'Policies & Controls', desc: 'Map GDPR, SOC2, and custom policies to AI projects' }
                ].map((item) => (
                  <div key={item.title} className="flex items-start space-x-3 p-4 rounded-xl bg-background/50">
                    <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold mb-1">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Use Cases / Personas */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="space-y-16"
        >
          <motion.div variants={fadeIn} className="text-center max-w-3xl mx-auto">
            <h2 className="text-[40px] font-bold mb-4">Built for people who ship AI</h2>
            <p className="text-xl text-muted-foreground">
              Whether you're solo or scaling
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Solo consultant',
                subtitle: 'Sell on speed and polish',
                desc: 'Turn client interviews into polished AI implementation plans in hours, not weeks. Win more proposals with professional blueprints that show you know your stuff.',
                features: ['Interview → Blueprint in one session', 'Professional exports for client decks', 'Reusable process templates']
              },
              {
                title: 'Ops / AI lead',
                subtitle: 'Sell on visibility and ROI',
                desc: 'Get exec buy-in with clear before/after process maps and ROI calculations. Track all AI initiatives in one place so nothing falls through the cracks.',
                features: ['Portfolio view of all AI projects', 'Impact vs. effort scoring', 'Team collaboration on blueprints'],
                highlighted: true
              },
              {
                title: 'Legal / Risk / Compliance',
                subtitle: 'Sell on governance',
                desc: 'Finally, a system that tracks AI use cases, risk profiles, and policy compliance without making you build yet another spreadsheet.',
                features: ['AI use case registry from day one', 'Risk assessments with audit trails', 'Policy mapping (GDPR, SOC2, custom)']
              }
            ].map((persona) => (
              <motion.div key={persona.title} variants={fadeIn}>
                <Card className={`h-full rounded-2xl border-border/60 bg-gradient-to-br from-card to-muted/30 shadow-soft hover:shadow-medium hover:-translate-y-1 transition-all duration-300 ${persona.highlighted ? 'ring-2 ring-brand-400 border-brand-300' : ''}`}>
                  <CardHeader>
                    {persona.highlighted && (
                      <Badge className="w-fit mb-3 bg-brand-500 text-white border-0">Most Popular</Badge>
                    )}
                    <CardTitle className="text-xl">{persona.title}</CardTitle>
                    <CardDescription className="text-sm">{persona.subtitle}</CardDescription>
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
      <section className="bg-gradient-to-br from-brand-500 to-brand-600 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeIn}
          className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white"
        >
          <h2 className="text-[40px] font-bold mb-6">
            Ready to be better than interns?
          </h2>
          <p className="text-xl text-brand-50 mb-8 max-w-2xl mx-auto">
            Start with a free trial. Upgrade when spreadsheets and sticky notes stop working.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 bg-white text-brand-600 hover:bg-brand-50 hover:-translate-y-[2px] hover:shadow-strong transition-all">
                Get started free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8 border-white/30 text-white hover:bg-white/10 hover:-translate-y-[1px] transition-all">
                View pricing
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Image src="/logo.png" alt="BTI" width={20} height={20} className="rounded" />
                <span className="font-bold">Better Than Interns</span>
              </div>
              <p className="text-sm text-muted-foreground">
                AI implementation planning without the hype
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">Product</h4>
              <ul className="space-y-2 text-sm">
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
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">Account</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/signup" className="text-muted-foreground hover:text-foreground transition-colors">
                    Sign Up
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wide">Legal & Contact</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Privacy Policy (coming soon)
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hello@betterthaninterns.com?subject=Contact%20Better%20Than%20Interns"
                    className="text-muted-foreground hover:text-foreground transition-colors"
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
