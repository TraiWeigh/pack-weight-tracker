import React from 'react';
import { Link } from 'wouter';
import { Tent, ArrowLeft, Eye } from 'lucide-react';
import Footer from '@/components/Footer';

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

        <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-4 text-foreground/80 leading-relaxed mb-6">
          <p>
            TrailWeigh is committed to making its application usable by as many people as
            possible, including people with disabilities. We are continually working to
            improve the accessibility of the application.
          </p>
          <p className="text-sm text-muted-foreground">
            We do not claim formal accessibility certification or full compliance with
            a specific accessibility standard at this time.
          </p>
        </div>

        <h2 className="font-bold text-foreground mb-4">Current accessibility features</h2>
        <div className="space-y-3 mb-8">
          {[
            { label: 'Keyboard-accessible controls', desc: 'Core application controls — including toolbar buttons, category expand/collapse, gear-item fields, save dialogs, and the Locker panel — are operable using a keyboard.' },
            { label: 'Readable text sizes', desc: 'TrailWeigh uses text sizes intended to be readable at standard screen resolutions. Browser-level text-size adjustments are respected.' },
            { label: 'Colour contrast', desc: 'Text and interactive elements use colour combinations intended to maintain readability. The dark-mode and light-mode options allow users to choose the display that works best for them.' },
            { label: 'Labels and titles', desc: 'Icon-only controls include descriptive title attributes that surface in browser tooltips and are available to assistive technology.' },
            { label: 'Responsive layout', desc: 'The TrailWeigh interface adapts to different screen sizes, including tablet and mobile widths.' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex gap-4 bg-card border border-card-border rounded-xl p-4 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0 mt-2" />
              <div>
                <p className="font-medium text-foreground text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <h2 className="font-bold text-foreground mb-4">Planned improvements</h2>
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">
          TrailWeigh is actively improving keyboard navigation, screen-reader support,
          and contrast across all parts of the application. Specific improvement details
          will be documented here as they are completed.
        </p>

        <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-1">Encountered an accessibility barrier?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If something in TrailWeigh is preventing you from using it effectively, please{' '}
            <Link to="/contact" className="underline underline-offset-2 hover:text-foreground">
              Contact Us
            </Link>{' '}
            or{' '}
            <Link to="/report-problem" className="underline underline-offset-2 hover:text-foreground">
              Report a Problem
            </Link>. Accessibility barriers are treated as bugs and addressed as a priority.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
