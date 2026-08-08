import React from 'react';
import { Link } from 'wouter';
import { Tent, ArrowLeft, FileText } from 'lucide-react';
import Footer from '@/components/Footer';

export default function TermsPage() {
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
            <FileText className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-black text-foreground">Terms of Use</h1>
        </div>

        <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-5 py-4 mb-8 text-sm text-amber-700/80 leading-relaxed">
          <strong className="font-semibold">Notice:</strong> The complete TrailWeigh
          Terms of Use are being prepared and will be published here. The final terms
          will be reviewed before publication and will not contain unverified legal
          claims.
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm text-foreground/80 leading-relaxed">
          <p>
            By using TrailWeigh you agree to use the application lawfully and in
            accordance with these Terms of Use once they are published.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Full terms covering account responsibilities, acceptable use, intellectual
            property, disclaimers, and governing law will be available here.
          </p>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          See also:{' '}
          <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
            Privacy Policy
          </Link>
          {' '}·{' '}
          <Link to="/contact" className="underline underline-offset-2 hover:text-foreground">
            Contact Us
          </Link>
        </p>
      </main>

      <Footer />
    </div>
  );
}
