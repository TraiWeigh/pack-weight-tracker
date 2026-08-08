import React from 'react';
import { Link } from 'wouter';
import { Tent, ArrowLeft, BookOpen, Video, ListChecks, HelpCircle, Wrench } from 'lucide-react';
import Footer from '@/components/Footer';

const sections = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    desc: 'Step-by-step guide to setting up your first gear list and understanding how TrailWeigh works.',
    available: false,
  },
  {
    icon: Video,
    title: 'How-To Videos',
    desc: 'Short video walkthroughs of common TrailWeigh tasks.',
    available: false,
  },
  {
    icon: ListChecks,
    title: 'Step-by-Step Guides',
    desc: 'Detailed written instructions for individual features — adding gear, scanning with AI, sharing lists, and more.',
    available: false,
  },
  {
    icon: HelpCircle,
    title: 'Frequently Asked Questions',
    desc: 'Quick answers to the most common questions about TrailWeigh.',
    available: false,
  },
  {
    icon: Wrench,
    title: 'Troubleshooting',
    desc: 'Solutions for common issues — syncing problems, import errors, and more.',
    available: false,
  },
];

export default function HelpPage() {
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

        <h1 className="text-3xl font-black text-foreground mb-3">Help &amp; How-To</h1>
        <p className="text-muted-foreground mb-2">
          Detailed instructions, videos, and answers to help you get the most out of TrailWeigh.
        </p>
        <p className="text-sm text-amber-600/80 bg-amber-50 border border-amber-200/60 rounded-lg px-4 py-2.5 mb-10">
          Help content is being prepared and will be available here soon.
        </p>

        <div className="space-y-4">
          {sections.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 bg-card border border-card-border rounded-xl p-5 shadow-sm opacity-60">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center text-muted-foreground flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground mb-0.5">{title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                <span className="inline-block mt-2 text-xs text-muted-foreground/70 bg-muted px-2 py-0.5 rounded-full">Coming soon</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 bg-card border border-card-border rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-foreground mb-1">Need help right now?</h2>
          <p className="text-sm text-muted-foreground">
            <Link to="/report-problem" className="underline underline-offset-2 hover:text-foreground">Report a Problem</Link>
            {' '}or{' '}
            <Link to="/contact" className="underline underline-offset-2 hover:text-foreground">Contact Us</Link>
            {' '}directly.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
