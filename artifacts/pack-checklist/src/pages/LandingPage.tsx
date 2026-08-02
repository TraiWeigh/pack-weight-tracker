import React from 'react';
import { useLocation } from 'wouter';
import { Tent, CheckSquare, Scale, Share2, ArrowRight } from 'lucide-react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      {/* Nav */}
      <header className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="bg-primary/10 p-2 rounded-lg text-primary">
            <Tent className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-foreground text-lg leading-none block">TrailWeigh</span>
            <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-widest">Ultralight Gear Tracker</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocation('/sign-in')}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
          >
            Sign In
          </button>
          <button
            onClick={() => setLocation('/sign-up')}
            className="flex items-center gap-1.5 text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Get Started <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16 max-w-3xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6 uppercase tracking-wider">
          <Scale className="w-3.5 h-3.5" /> Ultralight Backpacking
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-foreground leading-tight mb-4">
          Know your pack weight <br className="hidden sm:block" />
          <span className="text-primary">before you hit the trail</span>
        </h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-xl">
          Build your gear list, track weights, compare loadouts, and share your checklist — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-14">
          <button
            onClick={() => setLocation('/sign-up')}
            className="flex items-center justify-center gap-2 bg-primary text-primary-foreground font-bold px-8 py-3 rounded-xl text-base hover:bg-primary/90 transition-colors shadow-sm"
          >
            Create Free Account <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setLocation('/sign-in')}
            className="flex items-center justify-center gap-2 bg-card border border-border text-foreground font-semibold px-8 py-3 rounded-xl text-base hover:bg-muted/50 transition-colors"
          >
            Sign In
          </button>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
          {[
            { icon: CheckSquare, title: 'Gear Checklist', desc: 'Check off items as you pack — never forget essential gear again.' },
            { icon: Scale, title: 'Live Weight Totals', desc: 'Base weight, dog pack, clothing worn, and expendables — tracked separately.' },
            { icon: Share2, title: 'Print & Share', desc: 'Export a clean PDF or print your checklist for any trip.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-card border border-card-border rounded-xl p-4 shadow-sm">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary mb-3">
                <Icon className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-foreground text-sm mb-1">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center py-4 text-xs text-muted-foreground/60">
        © {new Date().getFullYear()} TrailWeigh
      </footer>
    </div>
  );
}
