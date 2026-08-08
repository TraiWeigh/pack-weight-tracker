import React from 'react';
import { Link } from 'wouter';
import { Tent, ArrowLeft, Eye } from 'lucide-react';
import Footer from '@/components/Footer';

const planned = [
  { label: 'Keyboard navigation', desc: 'All features operable without a mouse.' },
  { label: 'Screen-reader support', desc: 'Semantic HTML and ARIA labels for assistive technology.' },
  { label: 'Colour contrast', desc: 'Text and interactive elements meeting readability standards.' },
  { label: 'Text size', desc: 'Support for browser-level font-size preferences.' },
  { label: 'Reporting an accessibility problem', desc: 'A clear route to report barriers you encounter.' },
];

export default function AccessibilityPage() {
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
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-black text-foreground">Accessibility</h1>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-4 text-foreground/80 leading-relaxed">
          <p>
            TrailWeigh is committed to making its application usable by people with
            disabilities. We are actively working to improve accessibility across the
            application.
          </p>
          <p className="text-sm text-muted-foreground">
            We do not claim formal accessibility certification or full compliance with
            a specific standard at this time. Our goal is continual improvement.
          </p>
        </div>

        <h2 className="font-semibold text-foreground mt-8 mb-4">
          Accessibility information coming to this page:
        </h2>
        <div className="space-y-3">
          {planned.map(({ label, desc }) => (
            <div key={label} className="flex gap-4 bg-card border border-card-border rounded-xl p-4 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/50 flex-shrink-0 mt-2" />
              <div>
                <p className="font-medium text-foreground text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-card border border-card-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-1">Encountered an accessibility barrier?</h2>
          <p className="text-sm text-muted-foreground">
            Please{' '}
            <Link to="/contact" className="underline underline-offset-2 hover:text-foreground">
              Contact Us
            </Link>
            {' '}or{' '}
            <Link to="/report-problem" className="underline underline-offset-2 hover:text-foreground">
              Report a Problem
            </Link>
            {' '}and we will prioritise a fix.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
