import React from 'react';
import { Link } from 'wouter';
import { Tent, ArrowLeft, Shield } from 'lucide-react';
import Footer from '@/components/Footer';

const topics = [
  'Account information (email address, name)',
  'Saved gear lists and checklist data',
  'Uploaded or imported gear information',
  'Browser local storage and cookies',
  'Analytics and usage data, if collected',
  'Third-party service providers',
  'Data retention and deletion',
  'Account deletion and data removal',
  'Your privacy rights',
  'How your information is protected',
];

export default function PrivacyPolicyPage() {
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
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-black text-foreground">Privacy Policy</h1>
        </div>

        <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-5 py-4 mb-8 text-sm text-amber-700/80 leading-relaxed">
          <strong className="font-semibold">Notice:</strong> The complete TrailWeigh
          Privacy Policy is being prepared and will be published here. The final policy
          will be reviewed before publication and will not contain unverified statements
          about data practices.
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">
          <h2 className="font-semibold text-foreground mb-4">
            The Privacy Policy will address the following topics:
          </h2>
          <ul className="space-y-2">
            {topics.map(t => (
              <li key={t} className="flex items-start gap-2 text-sm text-muted-foreground">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 flex-shrink-0 mt-1.5" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          Questions about your data?{' '}
          <Link to="/contact" className="underline underline-offset-2 hover:text-foreground">
            Contact Us
          </Link>
          {' '}or visit{' '}
          <Link to="/delete-account" className="underline underline-offset-2 hover:text-foreground">
            Delete Account / Data
          </Link>.
        </p>
      </main>

      <Footer />
    </div>
  );
}
