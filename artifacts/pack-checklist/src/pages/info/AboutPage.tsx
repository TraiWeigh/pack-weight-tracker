import React from 'react';
import { Link } from 'wouter';
import { Tent, ArrowLeft } from 'lucide-react';
import Footer from '@/components/Footer';

export default function AboutPage() {
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

        <h1 className="text-3xl font-black text-foreground mb-6">About TrailWeigh</h1>

        <div className="prose-sm text-foreground/80 space-y-4 leading-relaxed">
          <p>
            TrailWeigh is a gear-weight tracking tool built for backpackers and hikers
            who want to know exactly what they're carrying before they hit the trail.
          </p>
          <p>
            Whether you're optimising for ultralight travel or just making sure you
            haven't forgotten your rain jacket, TrailWeigh gives you a clear, organised
            view of every item in your pack — and how much it weighs.
          </p>
          <p>
            Build multiple gear lists, track base weight and worn weight separately,
            scan items with AI, and share your checklist with trip partners — all from
            one place.
          </p>
          <p className="text-sm text-muted-foreground">
            TrailWeigh is actively developed and improved. Have a suggestion or spotted
            a bug? Use the <Link to="/report-problem" className="underline underline-offset-2 hover:text-foreground">Report a Problem</Link> link
            or <Link to="/contact" className="underline underline-offset-2 hover:text-foreground">Contact Us</Link>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
