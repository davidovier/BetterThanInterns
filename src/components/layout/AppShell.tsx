'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Shield,
  Sparkles,
  LogOut,
  User,
  Settings,
  MessageSquare,
  Library,
  GitBranch,
  Target,
  FileText
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useWorkspaceContext } from '@/components/workspace/workspace-context';

type AppShellProps = {
  children: ReactNode;
};

const navSections = [
  {
    items: [
      { href: '/dashboard', label: 'Sessions', icon: MessageSquare },
    ]
  },
  {
    label: 'Library',
    items: [
      { href: '/library/processes', label: 'Processes', icon: GitBranch },
      { href: '/library/opportunities', label: 'Opportunities', icon: Target },
      { href: '/library/blueprints', label: 'Blueprints', icon: FileText },
      { href: '/library/governance', label: 'Governance', icon: Shield },
    ]
  },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { currentWorkspaceName, currentWorkspacePlan } = useWorkspaceContext();

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPlanBadgeStyles = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'enterprise':
        return 'bg-amber-100/80 text-amber-800 border-amber-200';
      case 'starter':
      default:
        return 'bg-muted/60 text-muted-foreground border-border';
    }
  };

  const getPlanTooltip = (plan: string) => {
    switch (plan) {
      case 'pro':
        return 'Pro – for teams actually shipping automations';
      case 'enterprise':
        return 'Enterprise – bring your lawyers';
      case 'starter':
      default:
        return 'Starter – perfect for solo experiments';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-radial from-background via-background to-muted/20">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-card/50 backdrop-blur-sm">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-6">
            <Link href="/dashboard" className="flex items-center space-x-2 transition-transform hover:scale-105">
              <Sparkles className="h-6 w-6 text-brand-500" />
              <span className="text-lg font-semibold tracking-tight">
                Better Than Interns
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-6 px-3 py-4">
            {navSections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                {section.label && (
                  <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {section.label}
                  </h3>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`group flex items-center space-x-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-brand-50 to-brand-50/50 text-brand-700 shadow-soft border border-brand-100'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:-translate-y-[1px] hover:shadow-soft'
                        }`}
                      >
                        <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-brand-600' : 'group-hover:text-foreground'}`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User section */}
          <div className="border-t p-4 space-y-3">
            {currentWorkspaceName && (
              <div className="rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 border border-border/40 p-3 shadow-soft">
                <p className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wide mb-1.5">
                  Workspace
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold truncate flex-1">
                    {currentWorkspaceName}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-xs rounded-full px-2.5 py-0.5 font-medium ${getPlanBadgeStyles(currentWorkspacePlan)}`}
                    title={getPlanTooltip(currentWorkspacePlan)}
                  >
                    {currentWorkspacePlan.charAt(0).toUpperCase() + currentWorkspacePlan.slice(1)}
                  </Badge>
                </div>
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-start space-x-3 hover:bg-muted/50"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-brand-100 text-brand-700 text-xs">
                      {getInitials(session?.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">
                      {session?.user?.name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/account')}>
                  <Settings className="mr-2 h-4 w-4" />
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="pl-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
