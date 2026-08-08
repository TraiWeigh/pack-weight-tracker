import React from 'react';
import { Link } from 'wouter';
import { Tent, ArrowLeft, Mail } from 'lucide-react';
import Footer from '@/components/Footer';

export default function ContactPage() {
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
            <Mail className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-black text-foreground">Contact Us</h1>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
          <p className="text-foreground/80 leading-relaxed">
            TrailWeigh support contact information will be available here.
          </p>
          <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
            In the meantime, if you've found a bug or have a feature suggestion,
            please use the{' '}
            <Link to="/report-problem" className="underline underline-offset-2 hover:text-foreground">
              Report a Problem
            </Link>{' '}
            page for technical issues.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
