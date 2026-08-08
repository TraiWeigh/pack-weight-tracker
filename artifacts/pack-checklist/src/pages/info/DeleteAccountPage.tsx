import React from 'react';
import { Link } from 'wouter';
import { Tent, ArrowLeft, Trash2 } from 'lucide-react';
import Footer from '@/components/Footer';

export default function DeleteAccountPage() {
  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="px-6 py-4 border-b border-border">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <Tent className="w-5 h-5" />
          </div>
          <span className="font-bold text-foreground text-lg">TrailWeigh</span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-destructive/10 rounded-xl flex items-center justify-center text-destructive flex-shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-black text-foreground">Delete Account / Data</h1>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-5 mb-6">

          <div>
            <h2 className="font-semibold text-foreground mb-2">What deletion removes</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              Deleting your TrailWeigh account permanently removes:
            </p>
            <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1.5 ml-1">
              <li>Your TrailWeigh account credentials and sign-in access</li>
              <li>All saved gear lists stored in your Locker</li>
              <li>Any shared links you have created</li>
              <li>All other data associated with your account on TrailWeigh's servers</li>
            </ul>
          </div>

          <div className="border-t border-border pt-5">
            <h2 className="font-semibold text-foreground mb-2">Local browser data</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              TrailWeigh stores your current working gear list and background photo selections
              locally in your browser. This browser-local data is separate from your account
              and is not automatically removed when you delete your account. To remove it,
              you can clear your browser's site data for TrailWeigh after your account has
              been deleted.
            </p>
          </div>

          <div className="border-t border-border pt-5">
            <h2 className="font-semibold text-foreground mb-2">Deletion is permanent</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Account deletion cannot be undone. Gear lists removed during deletion are
              not recoverable.
            </p>
          </div>

        </div>

        <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-5 py-4 text-sm text-amber-700/80 leading-relaxed mb-6">
          <strong className="font-semibold">How to request deletion:</strong> A self-service
          account deletion option will be available in a future TrailWeigh update. In the
          meantime, please{' '}
          <Link to="/contact" className="underline underline-offset-2 hover:text-amber-900">
            Contact Us
          </Link>{' '}
          to request account and data deletion.
        </div>

        <p className="text-sm text-muted-foreground">
          See also:{' '}
          <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
            Privacy Policy
          </Link>
        </p>
      </main>

      <Footer />
    </div>
  );
}
