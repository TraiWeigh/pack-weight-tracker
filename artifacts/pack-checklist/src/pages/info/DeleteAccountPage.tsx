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

        <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-4 text-foreground/80 leading-relaxed">
          <p>
            You can request deletion of your TrailWeigh account and associated data.
          </p>
          <p className="text-sm text-muted-foreground">
            Account deletion will permanently remove:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-1">
            <li>Your TrailWeigh account</li>
            <li>All saved gear lists and Locker contents</li>
            <li>Any shared links you created</li>
            <li>All other data associated with your account</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            This action is permanent and cannot be undone.
          </p>
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200/60 rounded-xl px-5 py-4 text-sm text-amber-700/80 leading-relaxed">
          <strong className="font-semibold">Account deletion:</strong> To delete your
          account, please{' '}
          <Link to="/contact" className="underline underline-offset-2 hover:text-amber-900">
            Contact Us
          </Link>
          {' '}with your request. A self-service deletion option will be available in a
          future TrailWeigh update.
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
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
