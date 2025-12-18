'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { User, Lock, AlertTriangle, CreditCard, Calendar, Shield, Activity } from 'lucide-react';
import { useWorkspaceContext } from '@/components/workspace/workspace-context';

type UserProfile = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  workspaceCount: number;
};

type WorkspaceBilling = {
  plan: 'starter' | 'pro' | 'enterprise';
  trialEndsAt: string | null;
  isOnTrial: boolean;
  isTrialExpired: boolean;
};

function AccountContent() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    currentWorkspaceId,
    currentWorkspaceName,
    currentWorkspacePlan,
    trialEndsAt,
    isOnTrial,
    isTrialExpired,
    userRole,
    usage,
    refetchUsage,
    loading: workspaceLoading
  } = useWorkspaceContext();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Tab state - support URL query param (bidirectional)
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Handle tab changes - update URL
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    router.replace(`/account?tab=${newTab}`, { scroll: false });
  };

  // Profile form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Account deletion state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Billing state
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro' | 'enterprise'>('starter');
  const [isSavingBilling, setIsSavingBilling] = useState(false);
  const [billingStatus, setBillingStatus] = useState<any>(null);
  const [isLoadingBilling, setIsLoadingBilling] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  // M25: PAYG state
  const [paygEnabled, setPaygEnabled] = useState(false);
  const [paygCapEur, setPaygCapEur] = useState(50); // Default €50
  const [isSavingPayg, setIsSavingPayg] = useState(false);
  const [showPaygConfirmModal, setShowPaygConfirmModal] = useState(false);
  const [pendingPaygEnabled, setPendingPaygEnabled] = useState(false);
  const [pendingPaygCapEur, setPendingPaygCapEur] = useState(50);

  useEffect(() => {
    loadData();
  }, []);

  // Load billing status when billing tab is active
  useEffect(() => {
    if (activeTab === 'billing' && currentWorkspaceId && !billingStatus) {
      loadBillingStatus();
    }
  }, [activeTab, currentWorkspaceId]);

  // M25: Sync PAYG state with usage data
  useEffect(() => {
    if (usage) {
      setPaygEnabled(usage.paygEnabled);
      // Convert ICU cap to EUR (€0.04 per ICU)
      const capEur = Math.round(usage.paygCap * 0.04);
      setPaygCapEur(capEur > 0 ? capEur : 50);
    }
  }, [usage]);

  const loadData = async () => {
    try {
      // Load profile
      const profileRes = await fetch('/api/account/profile');
      if (!profileRes.ok) throw new Error('Failed to load profile');
      const profileData = await profileRes.json();
      setProfile(profileData.data.user);
      setName(profileData.data.user.name || '');
      setEmail(profileData.data.user.email);
      setSelectedPlan(currentWorkspacePlan);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load account data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!email) {
      toast({
        title: 'Error',
        description: 'Email is required',
        variant: 'destructive',
      });
      return;
    }

    if (email !== profile?.email && !currentPassword) {
      toast({
        title: 'Error',
        description: 'Current password required when changing email',
        variant: 'destructive',
      });
      return;
    }

    setIsSavingProfile(true);
    try {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          ...(currentPassword && { currentPassword }),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update profile');
      }

      const data = await response.json();
      setProfile(data.data.user);
      setCurrentPassword('');

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast({
        title: 'Error',
        description: 'All password fields are required',
        variant: 'destructive',
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'New passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to change password');
      }

      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      toast({
        title: 'Success',
        description: 'Password changed successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const deleteAccount = async () => {
    if (!deletePassword) {
      toast({
        title: 'Error',
        description: 'Password is required',
        variant: 'destructive',
      });
      return;
    }

    if (deleteConfirmation !== 'DELETE') {
      toast({
        title: 'Error',
        description: 'Please type DELETE to confirm',
        variant: 'destructive',
      });
      return;
    }

    setIsDeletingAccount(true);
    try {
      const response = await fetch('/api/account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: deletePassword }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete account');
      }

      await signOut({ redirect: false });
      router.push('/login?deleted=1');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsDeletingAccount(false);
    }
  };

  const loadBillingStatus = async () => {
    if (!currentWorkspaceId) return;

    setIsLoadingBilling(true);
    try {
      const response = await fetch(
        `/api/workspaces/${currentWorkspaceId}/billing/stripe-status`
      );
      if (!response.ok) throw new Error('Failed to load billing status');

      const result = await response.json();
      setBillingStatus(result.data);
    } catch (error: any) {
      console.error('Failed to load billing status:', error);
    } finally {
      setIsLoadingBilling(false);
    }
  };

  const createCheckoutSession = async (plan: 'pro' | 'enterprise') => {
    if (!currentWorkspaceId) return;

    setIsCreatingCheckout(true);
    try {
      const response = await fetch(
        `/api/workspaces/${currentWorkspaceId}/billing/checkout`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan }),
        }
      );

      if (!response.ok) {
        const error = await response.json();

        // Handle Stripe not configured gracefully
        if (error.error?.code === 'STRIPE_NOT_CONFIGURED') {
          toast({
            title: 'Billing not available',
            description: 'Stripe billing is not configured yet. Please contact support to upgrade.',
            variant: 'default',
          });
          return;
        }

        throw new Error(error.error?.message || 'Failed to create checkout session');
      }

      const result = await response.json();

      // Redirect to Stripe Checkout
      if (result.data.checkoutUrl) {
        window.location.href = result.data.checkoutUrl;
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsCreatingCheckout(false);
    }
  };

  const saveBilling = async () => {
    if (!currentWorkspaceId) return;

    setIsSavingBilling(true);
    try {
      const response = await fetch(
        `/api/workspaces/${currentWorkspaceId}/billing`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: selectedPlan }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update plan');
      }

      toast({
        title: 'Success',
        description: 'Plan updated successfully. Refresh the page to see changes.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSavingBilling(false);
    }
  };

  // M25: Handle PAYG toggle - shows confirmation modal
  const handlePaygToggle = (enabled: boolean) => {
    if (enabled) {
      // Enabling requires confirmation
      setPendingPaygEnabled(true);
      setPendingPaygCapEur(paygCapEur);
      setShowPaygConfirmModal(true);
    } else {
      // Disabling can be done directly
      savePaygSettings(false, paygCapEur);
    }
  };

  // M25: Helper for EUR cap comparison (ICU * 0.04 = EUR)
  const previousCapEur = Math.round((usage?.paygCap || 0) * 0.04);

  // M25: Handle PAYG cap change - shows confirmation if increasing
  const handlePaygCapSave = () => {
    if (paygCapEur > previousCapEur) {
      // Increasing cap requires confirmation
      setPendingPaygEnabled(paygEnabled);
      setPendingPaygCapEur(paygCapEur);
      setShowPaygConfirmModal(true);
    } else {
      // Decreasing cap can be done directly
      savePaygSettings(paygEnabled, paygCapEur);
    }
  };

  // M25: Save PAYG settings to API
  const savePaygSettings = async (enabled: boolean, capEur: number) => {
    if (!currentWorkspaceId) return;

    setIsSavingPayg(true);
    setShowPaygConfirmModal(false);

    try {
      const response = await fetch(
        `/api/workspaces/${currentWorkspaceId}/usage-settings`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paygEnabled: enabled,
            paygMonthlyCapEur: capEur,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to update settings');
      }

      // Refresh usage data
      await refetchUsage();

      toast({
        title: 'Settings updated',
        description: enabled
          ? `Pay-as-you-go enabled with €${capEur} monthly cap.`
          : 'Pay-as-you-go disabled.',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSavingPayg(false);
    }
  };

  // M25: Confirm PAYG settings from modal
  const confirmPaygSettings = () => {
    savePaygSettings(pendingPaygEnabled, pendingPaygCapEur);
  };

  // M25: Helper to get usage bar color
  const getUsageBarColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-brand-500';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface-subtle to-background">
        <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-10 py-10 space-y-8">
          <div>
            <Skeleton className="h-9 w-48 mb-3 rounded-lg" />
            <Skeleton className="h-5 w-72 rounded-lg" />
          </div>
          <Skeleton className="h-12 w-full max-w-md rounded-xl" />
          <Card variant="flat" className="rounded-xl">
            <CardHeader>
              <Skeleton className="h-6 w-1/3 rounded-lg" />
              <Skeleton className="h-4 w-2/3 mt-2 rounded-lg" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-subtle to-background">
      <div className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-10 py-10 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Account</h1>
          <p className="text-muted-foreground mt-1">
            Profile, security, and billing settings.
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full max-w-md grid-cols-3 rounded-xl bg-muted/40 p-1.5 shadow-soft">
            <TabsTrigger
              value="profile"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-soft transition-all text-sm font-medium"
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-soft transition-all text-sm font-medium"
            >
              <Lock className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger
              value="billing"
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-soft transition-all text-sm font-medium"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Billing
            </TabsTrigger>
          </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6 mt-6">
          <Card className="shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="rounded-lg bg-brand-50 p-2">
                  <User className="h-4 w-4 text-brand-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Profile</CardTitle>
                  <CardDescription>Your account information.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>

              {email !== profile?.email && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <Label htmlFor="current-password" className="text-sm font-medium">
                    Current password
                  </Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Required for email change"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Changing your email requires your current password.
                  </p>
                </div>
              )}

              <Button
                onClick={saveProfile}
                disabled={isSavingProfile}
                variant="brand"
              >
                {isSavingProfile ? 'Saving...' : 'Save changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6 mt-6">
          <Card className="shadow-soft">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="rounded-lg bg-brand-50 p-2">
                  <Lock className="h-4 w-4 text-brand-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Password</CardTitle>
                  <CardDescription>Manage your account security.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {!showPasswordForm ? (
                <Button
                  onClick={() => setShowPasswordForm(true)}
                  variant="outline"
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change password
                </Button>
              ) : (
                <div className="space-y-5">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Current password</Label>
                      <Input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            currentPassword: e.target.value,
                          })
                        }
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">New password</Label>
                      <Input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            newPassword: e.target.value,
                          })
                        }
                        placeholder="At least 10 characters"
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground">
                        At least 10 characters, with a letter and a number.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Confirm new password</Label>
                      <Input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({
                            ...passwordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        className="h-11"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={changePassword}
                      disabled={isChangingPassword}
                      variant="brand"
                    >
                      {isChangingPassword ? 'Changing...' : 'Update password'}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: '',
                        });
                      }}
                      variant="ghost"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <div className="pt-5 border-t border-border/50 space-y-2">
                <h4 className="text-sm font-medium text-foreground">
                  Sessions
                </h4>
                <p className="text-sm text-muted-foreground">
                  Active sessions will be shown here.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Account Deletion - less alarming per CLAUDE.md */}
          <Card className="shadow-soft border-border/60">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="rounded-lg bg-muted p-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">Delete account</CardTitle>
                  <CardDescription>Permanently remove your account and data.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                This will delete your personal data and remove you from all workspaces.
                Workspaces shared with other people stay active. This action cannot be undone.
              </p>

              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(true)}
                className="text-muted-foreground hover:text-destructive hover:border-destructive"
              >
                Delete account
              </Button>

              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-[440px]">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Delete account</DialogTitle>
                    <DialogDescription className="text-base">
                      This will permanently delete your account and all associated data. This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                      <Label htmlFor="delete-password" className="text-sm font-medium">Current password</Label>
                      <Input
                        id="delete-password"
                        type="password"
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Enter your password"
                        className="h-11"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="delete-confirmation" className="text-sm font-medium">
                        Type DELETE to confirm
                      </Label>
                      <Input
                        id="delete-confirmation"
                        type="text"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="DELETE"
                        className="h-11"
                      />
                    </div>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0 pt-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowDeleteDialog(false);
                        setDeletePassword('');
                        setDeleteConfirmation('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={deleteAccount}
                      disabled={
                        isDeletingAccount ||
                        !deletePassword ||
                        deleteConfirmation !== 'DELETE'
                      }
                    >
                      {isDeletingAccount ? 'Deleting...' : 'Delete account'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6 mt-6">
          {currentWorkspaceId && (
            <>
              {/* Usage Section */}
              <Card className="shadow-soft">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="rounded-lg bg-brand-50 p-2">
                      <Activity className="h-4 w-4 text-brand-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Usage</CardTitle>
                      <CardDescription>Intelligence usage for the current billing period.</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {usage ? (
                    <>
                      {/* Base Allowance */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Base allowance</span>
                          <span className="font-medium">{Math.round(usage.basePercentage)}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${getUsageBarColor(usage.basePercentage)}`}
                            style={{ width: `${Math.min(100, usage.basePercentage)}%` }}
                          />
                        </div>
                      </div>

                      {/* PAYG Usage (only if enabled) */}
                      {usage.paygEnabled && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Pay-as-you-go</span>
                            <span className="font-medium">{Math.round(usage.paygPercentage)}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getUsageBarColor(usage.paygPercentage)}`}
                              style={{ width: `${Math.min(100, usage.paygPercentage)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Reset countdown */}
                      <p className="text-xs text-muted-foreground pt-2">
                        Resets in {usage.daysUntilReset} {usage.daysUntilReset === 1 ? 'day' : 'days'}.
                      </p>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-2 w-full" />
                      <Skeleton className="h-4 w-24 mt-2" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pay-As-You-Go Section */}
              <Card className="shadow-soft">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="rounded-lg bg-brand-50 p-2">
                      <CreditCard className="h-4 w-4 text-brand-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Pay-as-you-go</CardTitle>
                      <CardDescription>
                        {currentWorkspacePlan === 'starter'
                          ? 'Available on Pro.'
                          : 'Continue using intelligence after base allowance is exhausted.'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {currentWorkspacePlan === 'starter' ? (
                    <p className="text-sm text-muted-foreground">
                      Pay-as-you-go is available on Pro and Enterprise plans.
                    </p>
                  ) : userRole === 'owner' ? (
                    // Owner view - can modify
                    <>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label htmlFor="payg-toggle" className="text-sm font-medium">
                            Enable pay-as-you-go
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {paygEnabled ? 'Active. You will be charged for usage beyond base allowance.' : 'Disabled. AI features stop when base allowance is exhausted.'}
                          </p>
                        </div>
                        <Switch
                          id="payg-toggle"
                          checked={paygEnabled}
                          onCheckedChange={handlePaygToggle}
                          disabled={isSavingPayg}
                        />
                      </div>

                      {paygEnabled && (
                        <div className="space-y-3 pt-2 border-t border-border/60">
                          <div className="space-y-2">
                            <Label htmlFor="payg-cap" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              Monthly cap (EUR)
                            </Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                id="payg-cap"
                                type="number"
                                min={10}
                                max={500}
                                step={10}
                                value={paygCapEur}
                                onChange={(e) => setPaygCapEur(Math.max(10, Math.min(500, parseInt(e.target.value) || 10)))}
                                className="rounded-xl w-32"
                                disabled={isSavingPayg}
                              />
                              <span className="text-sm text-muted-foreground">EUR/month</span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Charges never exceed this cap. Current rate: €0.04 per unit.
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Approx. {Math.round(paygCapEur / 0.04).toLocaleString()} units at current rate.
                            </p>
                          </div>

                          <Button
                            onClick={handlePaygCapSave}
                            disabled={isSavingPayg || paygCapEur === previousCapEur}
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                          >
                            {isSavingPayg ? 'Saving...' : 'Update cap'}
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    // Member view - read only
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">Status:</span>
                        <Badge variant="outline" className="text-xs">
                          {usage?.paygEnabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      {usage?.paygEnabled && (
                        <p className="text-sm text-muted-foreground">
                          Monthly cap: €{Math.round((usage?.paygCap || 0) * 0.04)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground pt-2">
                        Contact workspace owner to modify.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Current Plan Card */}
              <Card className="shadow-soft">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-2.5">
                    <div className="rounded-lg bg-brand-50 p-2">
                      <Shield className="h-4 w-4 text-brand-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Current plan</CardTitle>
                      <CardDescription>
                        You are on the {currentWorkspacePlan.charAt(0).toUpperCase() + currentWorkspacePlan.slice(1)} plan{currentWorkspaceName ? ` in ${currentWorkspaceName} workspace` : ''}.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Badge variant="outline" className="text-xs">
                        {currentWorkspacePlan.charAt(0).toUpperCase() + currentWorkspacePlan.slice(1)}
                      </Badge>
                      {isOnTrial && trialEndsAt && (
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Trial ends{' '}
                            {new Date(trialEndsAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      {isTrialExpired && currentWorkspacePlan === 'starter' && (
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            Trial ended on {new Date(trialEndsAt!).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subscription Info (if active) */}
                  {isLoadingBilling ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                  ) : billingStatus?.hasActiveSubscription && billingStatus?.subscription ? (
                    <div className="rounded-xl bg-muted/40 border border-border/60 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Active Subscription</span>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          {billingStatus.subscription.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                          <span className="font-medium">Current period ends:</span>{' '}
                          {new Date(billingStatus.subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        {billingStatus.subscription.cancelAtPeriodEnd && (
                          <p className="text-orange-600">
                            Your subscription will cancel at the end of the billing period.
                          </p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              {/* Upgrade Options (only show if not on highest plan) */}
              {currentWorkspacePlan !== 'enterprise' && (
                <Card className="shadow-soft">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Upgrade plan</CardTitle>
                    <CardDescription>
                      Scale up when ready. Powered by Stripe (EUR, Europe-friendly).
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentWorkspacePlan === 'starter' && (
                      <>
                        <div className="rounded-xl border-2 border-brand-200 bg-brand-50/30 p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-base">Pro</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                For teams actually shipping automations.
                              </p>
                            </div>
                            <Badge className="bg-brand-500 text-white text-xs">Recommended</Badge>
                          </div>
                          <Button
                            onClick={() => createCheckoutSession('pro')}
                            disabled={isCreatingCheckout}
                            variant="brand"
                            className="w-full"
                          >
                            {isCreatingCheckout ? 'Creating...' : 'Upgrade to Pro'}
                          </Button>
                        </div>

                        <div className="rounded-xl border border-border/60 p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-semibold text-base">Enterprise</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Custom terms and invoicing available.
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => createCheckoutSession('enterprise')}
                            disabled={isCreatingCheckout}
                            variant="outline"
                            className="w-full"
                          >
                            {isCreatingCheckout ? 'Creating...' : 'Contact for Enterprise'}
                          </Button>
                        </div>
                      </>
                    )}

                    {currentWorkspacePlan === 'pro' && (
                      <div className="rounded-xl border border-border/60 p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-base">Enterprise</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Custom terms and invoicing available.
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => createCheckoutSession('enterprise')}
                          disabled={isCreatingCheckout}
                          variant="brand"
                          className="w-full"
                        >
                          {isCreatingCheckout ? 'Creating...' : 'Upgrade to Enterprise'}
                        </Button>
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground pt-2">
                      Billing is handled securely through Stripe. Cancel anytime.
                      {!billingStatus?.stripeEnabled && ' Stripe setup required. Contact support for manual upgrades.'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* PAYG Confirmation Modal */}
      <Dialog open={showPaygConfirmModal} onOpenChange={setShowPaygConfirmModal}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Confirm settings</DialogTitle>
            <DialogDescription className="text-base">
              {pendingPaygEnabled
                ? `You are setting a monthly cap of €${pendingPaygCapEur}. Once base usage is exhausted, you will be charged at €0.04 per unit up to this cap.`
                : 'You are disabling pay-as-you-go. AI features will stop when base allowance is exhausted.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              This setting can be changed at any time.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setShowPaygConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmPaygSettings}
              disabled={isSavingPayg}
              variant="brand"
            >
              {isSavingPayg ? 'Saving...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-surface-subtle to-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <AccountContent />
    </Suspense>
  );
}
