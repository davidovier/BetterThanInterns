'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, Loader2, ArrowRight, MessageSquare, Shield, FileText } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const showDeletedBanner = searchParams.get('deleted') === '1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: 'Sign in failed.',
          description: 'Invalid email or password.',
          variant: 'destructive',
        });
      } else {
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
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <Image src="/logo.png" alt="BTI" width={32} height={32} className="rounded" />
            <span className="font-semibold text-lg">Better Than Interns</span>
          </Link>

          {/* Deleted banner */}
          {showDeletedBanner && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3 mb-6">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-900">
                  Account deleted.
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Your account has been deleted. Thank you for trying Better Than Interns.
                </p>
              </div>
            </div>
          )}

          {/* Form Card */}
          <Card variant="flat" className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pt-0 space-y-1">
              <CardTitle className="text-2xl font-bold tracking-tight">
                Sign in
              </CardTitle>
              <CardDescription className="text-base">
                Enter your credentials to continue.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="px-0 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email
                  </Label>
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
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col px-0 pt-2 space-y-4">
                <Button
                  type="submit"
                  variant="cta"
                  className="w-full h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                <p className="text-sm text-muted-foreground text-center">
                  No account?{' '}
                  <Link href="/signup" className="text-brand-600 hover:text-brand-700 font-medium">
                    Create one
                  </Link>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 bg-brand-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
        <div className="relative flex flex-col justify-center px-12 xl:px-20 text-white">
          <div className="max-w-md space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">
                Turn messy processes into AI projects.
              </h2>
              <p className="text-brand-200 text-lg leading-relaxed">
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
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
