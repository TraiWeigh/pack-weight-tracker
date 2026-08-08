import React from 'react';
import { Link } from 'wouter';
import { Tent, ArrowLeft, Tag } from 'lucide-react';
import Footer from '@/components/Footer';

export default function AffiliatePage() {
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
            <Tag className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-black text-foreground">Affiliate Disclosure</h1>
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-4 text-foreground/80 leading-relaxed">
          <p>
            TrailWeigh may earn a commission from qualifying purchases made through
            retailer links at no additional cost to you.
          </p>
          <p className="text-sm text-muted-foreground">
            This disclosure will be updated to reflect the specific affiliate programmes
            and retailer agreements that TrailWeigh joins. No specific retailer names or
            programme terms are confirmed at this time.
          </p>
          <p className="text-sm text-muted-foreground">
            Affiliate relationships do not influence TrailWeigh's gear recommendations,
            weight data, or application features. TrailWeigh's goal is always to provide
            accurate, useful gear-tracking tools for backpackers.
          </p>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Questions?{' '}
          <Link to="/contact" className="underline underline-offset-2 hover:text-foreground">
            Contact Us
          </Link>
        </p>
      </main>

      <Footer />
    </div>
  );
}
