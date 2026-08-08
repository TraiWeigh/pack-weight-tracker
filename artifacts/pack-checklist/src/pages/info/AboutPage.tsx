import React from 'react';
import { Link } from 'wouter';
import { Tent, ArrowLeft, CheckSquare, Scale, Share2, FolderOpen, Eye, Cpu } from 'lucide-react';
import Footer from '@/components/Footer';

const features = [
  { icon: CheckSquare, label: 'Organize gear by category', desc: 'Group your items into logical categories such as Shelter, Clothing, Navigation, or any custom grouping that suits your trip.' },
  { icon: Scale,       label: 'Enter quantities and weights', desc: 'Set a weight and quantity for each item. TrailWeigh calculates the total weight automatically.' },
  { icon: Scale,       label: 'Track Base Weight and more', desc: 'See your Base Weight (carried items), along with any non-base categories such as worn clothing or a dog pack, and your Grand Total.' },
  { icon: FolderOpen,  label: 'Save and open gear lists', desc: 'Save multiple named gear lists to your Locker and open them at any time. Your lists are private to your account.' },
  { icon: Cpu,         label: 'Scan Gear List', desc: 'Import a gear list from a PDF, Word document, Excel spreadsheet, or Numbers file. TrailWeigh reads the items and lets you select which ones to add.' },
  { icon: Eye,         label: 'Preview your list', desc: 'Open a formatted preview of your gear list at any time, suitable for printing.' },
  { icon: Share2,      label: 'Share your list', desc: 'Generate a shareable link to send your gear list to trip partners. Recipients can view and print the list — your original is not affected.' },
];

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

        <h1 className="text-3xl font-black text-foreground mb-4">About TrailWeigh</h1>

        <p className="text-foreground/80 leading-relaxed mb-3">
          TrailWeigh is a gear-list and pack-weight planning application for hikers and backpackers.
          It gives you a clear, organized view of every item in your pack — along with how much
          each contributes to your total carry weight — before you ever step onto the trail.
        </p>
        <p className="text-foreground/80 leading-relaxed mb-10">
          Whether you're working toward an ultralight base weight or simply making sure you
          haven't forgotten anything, TrailWeigh helps you make informed decisions about what
          goes into your pack.
        </p>

        <h2 className="text-lg font-bold text-foreground mb-5">What TrailWeigh lets you do</h2>
        <div className="space-y-4 mb-10">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="flex gap-4 bg-card border border-card-border rounded-xl p-4 shadow-sm">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0 mt-0.5">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm mb-0.5">{label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
          <p className="text-sm text-muted-foreground leading-relaxed">
            TrailWeigh is actively developed and improved.
            For step-by-step instructions on using any feature, visit{' '}
            <Link to="/help" className="underline underline-offset-2 hover:text-foreground">Help &amp; How-To</Link>.
            To report a problem or get in touch, see{' '}
            <Link to="/contact" className="underline underline-offset-2 hover:text-foreground">Contact Us</Link>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
