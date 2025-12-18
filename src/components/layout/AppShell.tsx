'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LogOut,
  Settings,
  MessageSquare,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  CreditCard
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
import { UsageBar } from '@/components/workspace/usage-bar';
import { cn } from '@/lib/utils';

type AppShellProps = {
  children: ReactNode;
};

type NavSection = {
  label?: string;
  items: Array<{
    href: string;
    label: string;
    icon: any;
  }>;
};

const navSections: NavSection[] = [
  {
    items: [
      { href: '/sessions', label: 'Sessions', icon: MessageSquare },
    ]
  },
];

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { currentWorkspaceName, currentWorkspacePlan } = useWorkspaceContext();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Persist sidebar state in localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sidebarCollapsed');
    if (stored !== null) {
      setSidebarCollapsed(stored === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

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
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b border-border/60 bg-card/95 backdrop-blur-xl px-4 flex items-center justify-between shadow-soft">
        <Link href="/sessions" className="flex items-center space-x-2.5 group">
          <Image src="/logo.png" alt="BTI Logo" width={28} height={28} className="flex-shrink-0 rounded" />
          <span className="text-lg font-semibold tracking-tight group-hover:text-brand-600 transition-colors">Better Than Interns</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden h-10 w-10 hover:bg-muted/60"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen border-r border-border/60',
          'bg-gradient-to-b from-card via-card to-surface-subtle/50 backdrop-blur-xl',
          'transition-all duration-300 ease-out',
          sidebarCollapsed ? 'w-[72px]' : 'w-72',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-18 items-center border-b border-border/60 px-4 justify-between">
            <Link
              href="/sessions"
              className={cn(
                'flex items-center transition-all group',
                sidebarCollapsed ? 'justify-center w-full' : 'space-x-2.5'
              )}
            >
              <Image src="/logo.png" alt="BTI Logo" width={28} height={28} className="flex-shrink-0 rounded" />
              {!sidebarCollapsed && (
                <span className="text-lg font-semibold tracking-tight truncate group-hover:text-brand-600 transition-colors">
                  Better Than Interns
                </span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-6 px-3 py-5 overflow-y-auto">
            {navSections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                {section.label && !sidebarCollapsed && (
                  <h3 className="mb-2.5 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {section.label}
                  </h3>
                )}
                <div className="space-y-1.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'group flex items-center rounded-xl text-sm font-medium transition-all duration-200',
                          sidebarCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-3 space-x-3',
                          isActive
                            ? 'bg-brand-50 text-brand-700 shadow-soft border border-brand-100/80 ring-1 ring-brand-100'
                            : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:-translate-y-0.5 hover:shadow-soft'
                        )}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <Icon className={cn(
                          'h-5 w-5 flex-shrink-0 transition-colors',
                          isActive ? 'text-brand-600' : 'group-hover:text-foreground'
                        )} />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User section */}
          <div className="border-t border-border/60 p-4 space-y-3">
            {currentWorkspaceName && !sidebarCollapsed && (
              <div className="rounded-xl bg-gradient-to-br from-surface-subtle to-surface-muted/50 border border-border/50 p-4 shadow-soft space-y-3">
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-widest mb-2">
                    Workspace
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold truncate flex-1 text-foreground">
                      {currentWorkspaceName}
                    </p>
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] rounded-full px-2 py-0.5 font-semibold uppercase tracking-wide',
                        getPlanBadgeStyles(currentWorkspacePlan)
                      )}
                      title={getPlanTooltip(currentWorkspacePlan)}
                    >
                      {currentWorkspacePlan}
                    </Badge>
                  </div>
                </div>
                <UsageBar />
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full hover:bg-muted/50 transition-all',
                    sidebarCollapsed ? 'justify-center px-0 py-3' : 'justify-start space-x-3 py-2.5'
                  )}
                >
                  <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-border/50">
                    <AvatarFallback className="bg-brand-100 text-brand-700 text-xs font-semibold">
                      {getInitials(session?.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  {!sidebarCollapsed && (
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold truncate text-foreground">
                        {session?.user?.name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session?.user?.email}
                      </p>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 shadow-medium">
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => router.push('/account')}
                  className="cursor-pointer"
                >
                  <Settings className="mr-2.5 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push('/account?tab=billing')}
                  className="cursor-pointer"
                >
                  <CreditCard className="mr-2.5 h-4 w-4" />
                  Billing
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="mr-2.5 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Desktop Collapse Toggle - Only visible on desktop */}
        <button
          onClick={toggleSidebar}
          className={cn(
            'hidden lg:flex absolute -right-3.5 top-[4.5rem] z-50',
            'h-7 w-7 items-center justify-center rounded-full',
            'border border-border/80 bg-card shadow-soft',
            'hover:bg-muted hover:shadow-medium hover:scale-105',
            'transition-all duration-200'
          )}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={cn(
        'transition-all duration-300 ease-out',
        sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-72',
        'pt-16 lg:pt-0'
      )}>
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
