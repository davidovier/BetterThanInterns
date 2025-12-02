'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
import { PageHeader } from '@/components/layout/PageHeader';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Lock, AlertTriangle, CreditCard, Calendar } from 'lucide-react';

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

export default function AccountPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [billing, setBilling] = useState<WorkspaceBilling | null>(null);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(
    null
  );

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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load profile
      const profileRes = await fetch('/api/account/profile');
      if (!profileRes.ok) throw new Error('Failed to load profile');
      const profileData = await profileRes.json();
      setProfile(profileData.data.user);
      setName(profileData.data.user.name || '');
      setEmail(profileData.data.user.email);

      // Load first workspace for billing
      const workspacesRes = await fetch('/api/workspaces');
      if (workspacesRes.ok) {
        const workspacesData = await workspacesRes.json();
        const workspaces = workspacesData.ok && workspacesData.data
          ? workspacesData.data.workspaces
          : workspacesData.workspaces;

        if (workspaces && workspaces.length > 0) {
          const wsId = workspaces[0].id;
          setCurrentWorkspaceId(wsId);

          // Load billing
          const billingRes = await fetch(`/api/workspaces/${wsId}/billing`);
          if (billingRes.ok) {
            const billingData = await billingRes.json();
            setBilling(billingData.data.billing);
            setSelectedPlan(billingData.data.billing.plan);
          }
        }
      }
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

    // If changing email, require password
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

      toast({
        title: 'Account deleted',
        description: 'Your account has been deleted',
      });

      // Sign out and redirect
      await signOut({ redirect: false });
      router.push('/login');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      setIsDeletingAccount(false);
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

      const data = await response.json();
      setBilling(data.data.billing);

      toast({
        title: 'Success',
        description: 'Plan updated successfully',
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

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="rounded-2xl">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-96 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-8 py-8 space-y-8">
      <PageHeader
        title="Account & Settings"
        description="Manage your profile, security, and workspace billing. We take this seriously."
      />

      {/* Section 1: Profile & Login */}
      <Card className="rounded-2xl border-border/60 bg-card shadow-soft hover:shadow-medium transition-all">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-brand-500" />
            <CardTitle className="text-base">Profile & Login</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Update your email, name, and password. We use this to send you important stuff, not nonsense.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name and Email */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Display Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          {/* Current Password (for email change) */}
          {email !== profile?.email && (
            <div className="space-y-2">
              <Label htmlFor="current-password" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Current Password (required for email change)
              </Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">
                Changing your email will log you out on other devices.
              </p>
            </div>
          )}

          <Button
            onClick={saveProfile}
            disabled={isSavingProfile}
            className="bg-brand-500 hover:bg-brand-600 hover:-translate-y-[1px] hover:shadow-md transition-all"
          >
            {isSavingProfile ? 'Saving...' : 'Save Profile'}
          </Button>

          {/* Password Change Section */}
          <div className="pt-6 border-t border-border">
            {!showPasswordForm ? (
              <Button
                onClick={() => setShowPasswordForm(true)}
                variant="outline"
                className="rounded-xl hover:-translate-y-[1px] transition-all"
              >
                <Lock className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            ) : (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Change Password
                </h4>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Current Password</Label>
                    <Input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">New Password</Label>
                    <Input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      placeholder="At least 10 characters, with letter and number"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Confirm New Password</Label>
                    <Input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={changePassword}
                    disabled={isChangingPassword}
                    className="bg-brand-500 hover:bg-brand-600 hover:-translate-y-[1px] hover:shadow-md transition-all"
                  >
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
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
                    className="hover:-translate-y-[1px] transition-all"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Plan & Billing */}
      {billing && currentWorkspaceId && (
        <Card className="rounded-2xl border-border/60 bg-card shadow-soft hover:shadow-medium transition-all">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-brand-500" />
              <CardTitle className="text-base">Plan & Billing</CardTitle>
            </div>
            <CardDescription className="text-xs">
              You're on the {billing.plan.charAt(0).toUpperCase() + billing.plan.slice(1)} plan in this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-xs">
                {billing.plan.charAt(0).toUpperCase() + billing.plan.slice(1)}
              </Badge>
              {billing.isOnTrial && billing.trialEndsAt && (
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Trial ends{' '}
                    {new Date(billing.trialEndsAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Select Plan
              </Label>
              <Select value={selectedPlan} onValueChange={(value: any) => setSelectedPlan(value)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                We're still wiring payments. For now, plan changes are for internal use only.
              </p>
            </div>

            <Button
              onClick={saveBilling}
              disabled={isSavingBilling || selectedPlan === billing.plan}
              className="bg-brand-500 hover:bg-brand-600 hover:-translate-y-[1px] hover:shadow-md transition-all"
            >
              {isSavingBilling ? 'Saving...' : 'Save Plan'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Section 3: Danger Zone */}
      <Card className="rounded-2xl border-red-200 bg-card shadow-soft hover:shadow-medium transition-all">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <CardTitle className="text-base text-red-600">Danger Zone</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Delete your account and personal data. This can't be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            We'll delete your personal data and remove you from all workspaces.
            Workspaces shared with other people stay active; your personal
            workspace may be removed.
          </p>

          <Button
            onClick={() => setShowDeleteDialog(true)}
            variant="destructive"
            className="hover:-translate-y-[1px] hover:shadow-md transition-all"
          >
            Delete My Account
          </Button>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription className="text-sm">
              We'll anonymize your account and you'll lose access to all projects and blueprints.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="delete-password" className="text-xs">
                Current Password
              </Label>
              <Input
                id="delete-password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter your password"
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="delete-confirmation" className="text-xs">
                Type DELETE to confirm
              </Label>
              <Input
                id="delete-confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="DELETE"
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteDialog(false);
                setDeletePassword('');
                setDeleteConfirmation('');
              }}
              className="hover:-translate-y-[1px] transition-all"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={deleteAccount}
              disabled={isDeletingAccount || deleteConfirmation !== 'DELETE'}
              className="hover:-translate-y-[1px] hover:shadow-md transition-all"
            >
              {isDeletingAccount ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
