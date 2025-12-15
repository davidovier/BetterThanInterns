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
  ChevronRight
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b bg-card/80 backdrop-blur-lg px-4 flex items-center justify-between">
        <Link href="/sessions" className="flex items-center space-x-2">
          <Image src="/logo.png" alt="BTI Logo" width={24} height={24} className="flex-shrink-0" />
          <span className="text-lg font-semibold tracking-tight">Better Than Interns</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-40 h-screen border-r bg-card/80 backdrop-blur-lg
          transition-all duration-300 ease-in-out
          ${sidebarCollapsed ? 'w-20' : 'w-64'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center border-b px-4 justify-between">
            <Link
              href="/sessions"
              className={`flex items-center transition-all ${sidebarCollapsed ? 'justify-center w-full' : 'space-x-2'}`}
            >
              <Image src="/logo.png" alt="BTI Logo" width={24} height={24} className="flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="text-lg font-semibold tracking-tight truncate">
                  Better Than Interns
                </span>
              )}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-6 px-3 py-4 overflow-y-auto">
            {navSections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                {section.label && !sidebarCollapsed && (
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
                        className={`group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                          sidebarCollapsed ? 'justify-center' : 'space-x-3'
                        } ${
                          isActive
                            ? 'bg-gradient-to-r from-brand-50 to-brand-50/50 text-brand-700 shadow-soft border border-brand-100'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground hover:-translate-y-[1px] hover:shadow-soft'
                        }`}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <Icon className={`h-5 w-5 flex-shrink-0 transition-colors ${isActive ? 'text-brand-600' : 'group-hover:text-foreground'}`} />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* User section */}
          <div className="border-t p-4 space-y-3">
            {currentWorkspaceName && !sidebarCollapsed && (
              <div className="rounded-xl bg-gradient-to-br from-muted/40 to-muted/20 border border-border/40 p-3 shadow-soft space-y-3">
                <div>
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
                <UsageBar />
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`w-full hover:bg-muted/50 ${sidebarCollapsed ? 'justify-center px-0' : 'justify-start space-x-3'}`}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="bg-brand-100 text-brand-700 text-xs">
                      {getInitials(session?.user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  {!sidebarCollapsed && (
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium truncate">
                        {session?.user?.name || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {session?.user?.email}
                      </p>
                    </div>
                  )}
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

        {/* Desktop Collapse Toggle - Only visible on desktop */}
        <button
          onClick={toggleSidebar}
          className="hidden lg:flex absolute -right-3 top-20 z-50 h-6 w-6 items-center justify-center rounded-full border bg-card shadow-md hover:bg-muted transition-colors"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'} pt-16 lg:pt-0`}>
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}
