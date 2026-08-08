import React from 'react';
import { Link } from 'wouter';
import { Tent, ArrowLeft, CheckSquare, Scale, Share2, Cpu } from 'lucide-react';
import Footer from '@/components/Footer';

const steps = [
  {
    icon: CheckSquare,
    title: '1. Build your gear list',
    desc: 'Add gear categories and individual items. Enter the weight of each piece of kit — in grams, ounces, or pounds.',
  },
  {
    icon: Scale,
    title: '2. Track your pack weight',
    desc: 'TrailWeigh automatically totals your base weight, worn weight, dog-pack weight, and expendables (food, water, fuel) in real time.',
  },
  {
    icon: Cpu,
    title: '3. Scan gear with AI (optional)',
    desc: 'Photograph a gear label or product page. The AI scanner reads the weight and pre-fills the item for you.',
  },
  {
    icon: Share2,
    title: '4. Share or print',
    desc: 'Generate a shareable link so trip partners can view your list, or export a clean PDF to print and take on the trail.',
  },
];

export default function HowItWorksPage() {
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

        <h1 className="text-3xl font-black text-foreground mb-3">How It Works</h1>
        <p className="text-muted-foreground mb-10">
          TrailWeigh is designed to be simple and fast. Here's the overall workflow.
        </p>

        <div className="space-y-6">
          {steps.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 bg-card border border-card-border rounded-xl p-5 shadow-sm">
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                <Icon className="w-4.5 h-4.5" />
              </div>
              <div>
                <h2 className="font-bold text-foreground mb-1">{title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-muted-foreground">
          Looking for step-by-step instructions on a specific task?{' '}
          <Link to="/help" className="underline underline-offset-2 hover:text-foreground">
            Visit Help &amp; How-To
          </Link>.
        </p>
      </main>

      <Footer />
    </div>
  );
}
