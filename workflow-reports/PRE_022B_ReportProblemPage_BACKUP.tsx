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

        <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm space-y-4 text-foreground/80 leading-relaxed">
          <p>
            Found a bug, unexpected behaviour, or something that doesn't look right?
            We want to hear about it.
          </p>
          <p>
            A built-in problem-reporting tool is coming to TrailWeigh. In the meantime,
            please use the <Link to="/contact" className="underline underline-offset-2 hover:text-foreground font-medium">Contact Us</Link> page
            to describe the issue.
          </p>
          <p className="text-sm text-muted-foreground">
            When you get in touch, it helps to include:
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-1">
            <li>What you were trying to do</li>
            <li>What happened instead</li>
            <li>The device and browser you were using</li>
            <li>Any error message you saw</li>
          </ul>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            Contact Us to Report a Problem
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
