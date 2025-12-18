'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Check, Loader2, ArrowRight, MessageSquare, Shield, FileText } from 'lucide-react';

type PlanType = 'starter' | 'pro' | 'enterprise' | null;

const plans = [
  {
    id: 'starter' as const,
    name: 'Starter',
    description: 'Solo or small team, just getting started.',
    price: '€29',
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    description: 'For operations leads and teams scaling AI.',
    price: '€99',
    recommended: true,
  },
  {
    id: 'enterprise' as const,
    name: 'Enterprise',
    description: 'For organizations with advanced requirements.',
    price: 'Custom',
  },
];

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(null);

  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (planParam === 'starter' || planParam === 'pro' || planParam === 'enterprise') {
      setSelectedPlan(planParam);
    } else {
      setSelectedPlan('pro'); // Default to Pro
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast({
          title: 'Signup failed.',
          description: data.error || 'Something went wrong.',
          variant: 'destructive',
        });
        return;
      }

      // Auto sign in after signup
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: 'Account created.',
          description: 'Please sign in to continue.',
        });
        router.push('/login');
      } else {
        toast({
          title: 'Account created.',
          description: 'Your workspace is ready.',
        });
        router.push('/sessions');
        router.refresh();
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-16 xl:px-20 overflow-y-auto">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <Image src="/logo.png" alt="BTI" width={32} height={32} className="rounded" />
            <span className="font-semibold text-lg">Better Than Interns</span>
          </Link>

          {/* Form Card */}
          <Card variant="flat" className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Create account
              </CardTitle>
              <CardDescription className="text-base">
                Start mapping workflows in minutes.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="px-0 space-y-5">
                {/* Plan Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select a plan</Label>
                  <div className="space-y-2">
                    {plans.map((plan) => (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlan(plan.id)}
                        className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${
                          selectedPlan === plan.id
                            ? 'border-brand-500 bg-brand-50/50 ring-1 ring-brand-500/20'
                            : 'border-border hover:border-brand-300'
                        }`}
                      >
                        {plan.recommended && (
                          <Badge className="absolute -top-2.5 right-3 bg-brand-500 text-white text-xs">
                            Recommended
                          </Badge>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="font-medium">{plan.name}</span>
                              <span className="text-sm text-muted-foreground">{plan.price}/mo</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              {plan.description}
                            </p>
                          </div>
                          {selectedPlan === plan.id && (
                            <Check className="h-5 w-5 text-brand-500 flex-shrink-0 ml-3" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col px-0 pt-2 space-y-4">
                <Button
                  type="submit"
                  variant="brand"
                  className="w-full h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  Already have an account?{' '}
                  <Link href="/login" className="text-brand-600 hover:text-brand-700 font-medium">
                    Sign in
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-brand-600 via-brand-500 to-brand-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative flex flex-col justify-center px-12 xl:px-20 text-white">
          <div className="max-w-md space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">
                Turn messy processes into AI projects.
              </h2>
              <p className="text-brand-100 text-lg leading-relaxed">
                Map workflows, find automation opportunities, and produce implementation plans your team can act on.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              {[
                { icon: MessageSquare, text: 'Chat to map your process.' },
                { icon: Shield, text: 'Built-in governance from day one.' },
                { icon: FileText, text: 'Export professional blueprints.' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-white/20">
              <p className="text-sm text-brand-100">
                14-day free trial on Pro. No credit card required.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <SignUpForm />
    </Suspense>
  );
}
