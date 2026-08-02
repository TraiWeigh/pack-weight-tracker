import React from 'react';
import { useUser, useClerk } from '@clerk/react';
import { useLocation } from 'wouter';
import { Shield, Users, ArrowLeft, LogOut, Settings, Info } from 'lucide-react';

export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string | undefined;

export function isAdmin(email?: string | null): boolean {
  return !!ADMIN_EMAIL && !!email && email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const admin = isAdmin(userEmail);

  if (!isLoaded) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !admin) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground text-sm mb-6">
            You don't have permission to view this page.
          </p>
          <button
            onClick={() => setLocation('/checklist')}
            className="flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-primary/90 transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Checklist
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation('/checklist')}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted/50"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2 text-primary">
              <Shield className="w-5 h-5" />
              <span className="font-bold text-foreground">Admin Panel</span>
            </div>
          </div>
          <button
            onClick={() => signOut({ redirectUrl: basePath || '/' })}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-destructive transition-colors px-2 py-1.5 rounded-md hover:bg-muted/50"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Admin identity card */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/15 rounded-full flex items-center justify-center text-primary flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-0.5">Administrator</p>
            <p className="font-bold text-foreground">{userEmail}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Full admin access to TrailWeigh</p>
          </div>
        </div>

        {/* User management */}
        <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-3">
            <Users className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">User Management</h2>
          </div>
          <div className="p-5 space-y-3">
            <p className="text-sm text-muted-foreground">
              TrailWeigh uses Replit-managed Clerk authentication. To view registered users,
              reset passwords, or remove accounts, use the <strong className="text-foreground">Auth pane</strong> in
              your Replit workspace toolbar.
            </p>
            <div className="bg-muted/50 border border-border rounded-lg p-4 text-sm space-y-1.5">
              <p className="font-semibold text-foreground text-xs uppercase tracking-wider mb-2">From the Auth pane you can:</p>
              {[
                'View all registered users and their email addresses',
                'Block or delete user accounts',
                'Reset user passwords',
                'Configure login methods (email, Google, etc.)',
                'Customize the sign-in branding',
              ].map(item => (
                <div key={item} className="flex items-start gap-2 text-muted-foreground">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* App info */}
        <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-3">
            <Info className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">App Info</h2>
          </div>
          <div className="p-5">
            <dl className="space-y-3 text-sm">
              {[
                { label: 'App', value: 'TrailWeigh — Ultralight Gear Tracker' },
                { label: 'Auth provider', value: 'Clerk (Replit-managed)' },
                { label: 'Data storage', value: 'Per-user browser localStorage' },
                { label: 'Admin email', value: ADMIN_EMAIL ?? '(not set)' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-start gap-4">
                  <dt className="text-muted-foreground font-medium flex-shrink-0">{label}</dt>
                  <dd className="text-foreground text-right font-mono text-xs">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Settings reminder */}
        <div className="bg-card border border-card-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-3">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold text-foreground">Admin Settings</h2>
          </div>
          <div className="p-5">
            <p className="text-sm text-muted-foreground">
              Your admin email is set via the <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-foreground">VITE_ADMIN_EMAIL</code> environment
              variable in the Replit workspace. To change your admin account, update that variable and
              restart the app.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
