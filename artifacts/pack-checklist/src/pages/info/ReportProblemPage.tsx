import React from 'react';
import { Link } from 'wouter';
import { Tent, ArrowLeft, AlertTriangle } from 'lucide-react';
import Footer from '@/components/Footer';

export default function ReportProblemPage() {
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
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-black text-foreground">Report a Problem</h1>
        </div>

        <p className="text-foreground/80 leading-relaxed mb-8">
          Use this page when TrailWeigh is not behaving as expected — something isn't
          working, a result looks wrong, or you've encountered an error.
        </p>

        <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-5">
          <div>
            <h2 className="font-semibold text-foreground mb-2">What to include in your report</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              A clear description helps us identify and fix the problem quickly. When you
              contact us, please include:
            </p>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside ml-1">
              <li><strong className="text-foreground">What you were doing</strong> — which part of TrailWeigh you were using and what action you took.</li>
              <li><strong className="text-foreground">What happened</strong> — the exact result, error message, or unexpected behavior you observed.</li>
              <li><strong className="text-foreground">What you expected to happen</strong> — what the correct behavior should have been.</li>
              <li><strong className="text-foreground">Your device and browser</strong> — for example, "iPhone 15, Safari" or "Windows 11, Chrome 125."</li>
              <li><strong className="text-foreground">Whether the problem is repeatable</strong> — does it happen every time or only occasionally?</li>
            </ol>
          </div>

          <div className="border-t border-border pt-5">
            <h2 className="font-semibold text-foreground mb-2">How to report</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Use the <Link to="/contact" className="underline underline-offset-2 hover:text-foreground font-medium">Contact Us</Link> page
              to send your report. A built-in problem-reporting tool will be available in a future
              TrailWeigh update.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            Go to Contact Us
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
