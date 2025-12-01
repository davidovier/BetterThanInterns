'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import AuthProvider from '@/components/providers/session-provider';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
