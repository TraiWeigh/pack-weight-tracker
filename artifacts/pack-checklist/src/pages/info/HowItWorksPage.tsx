/**
 * HowItWorksPage.tsx — TrailWeigh How It Works
 * Prompt 022E: Reorganized into 3 workflow-order accordion sections.
 *
 * Structure:
 *   Short intro (always visible)
 *   1. Create / Upload
 *   2. Add / Organize
 *   3. Save / Preview / Print / Share
 *
 * All sections collapsed by default.
 * Multiple sections may be open simultaneously.
 * Full title row is the click/keyboard target.
 */
import React, { useState, useCallback } from 'react';
import { Link } from 'wouter';
import { Tent, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import Footer from '@/components/Footer';

// ── Accordion hook ────────────────────────────────────────────────────────────

function useAccordion() {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = useCallback((id: string) => {
    setOpen(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);
  return {
    toggle,
    isOpen: (id: string) => open.has(id),
  };
}

// ── Accordion section ─────────────────────────────────────────────────────────

interface SectionProps {
  id: string;
  title: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}

function Section({ id, title, isOpen, onToggle, children }: SectionProps) {
  return (
    <div className="border border-card-border rounded-xl overflow-hidden shadow-sm bg-card">
      {/*
       * Entire title row is the button — full-row clickable requirement.
       * Standard <button> handles Enter and Space natively.
       */}
      <button
        id={`sec-btn-${id}`}
        aria-expanded={isOpen}
        aria-controls={`sec-panel-${id}`}
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left
                   hover:bg-muted/40 transition-colors
                   focus-visible:outline-none focus-visible:ring-2
                   focus-visible:ring-primary focus-visible:ring-inset"
      >
        <span className="font-bold text-foreground text-base">{title}</span>
        {isOpen
          ? <ChevronUp   className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        }
      </button>

      {isOpen && (
        <div
          id={`sec-panel-${id}`}
          role="region"
          aria-labelledby={`sec-btn-${id}`}
          className="px-5 pb-6 border-t border-border"
        >
          <div className="pt-5 space-y-4 text-sm text-muted-foreground leading-relaxed">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HowItWorksPage() {
  const { toggle, isOpen } = useAccordion();

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

        {/* ── Always-visible intro ───────────────────────────────────────── */}
        <h1 className="text-3xl font-black text-foreground mb-3">How It Works</h1>
        <p className="text-muted-foreground leading-relaxed mb-8">
          TrailWeigh follows a simple workflow: build your gear list or checklist,
          organize and refine it, then save, print, or share it. Open a topic below
          to see how each part works.
        </p>

        {/* ── Accordion ─────────────────────────────────────────────────── */}
        <div className="space-y-3">

          {/* 1. Create / Upload */}
          <Section
            id="create"
            title="1. Create / Upload"
            isOpen={isOpen('create')}
            onToggle={toggle}
          >
            <p>
              There are two ways to get gear into TrailWeigh. Choose whichever fits
              your situation.
            </p>

            <div>
              <p className="font-semibold text-foreground mb-1">Start from scratch</p>
              <p>
                Click <strong>New</strong> to open a fresh list and start adding gear
                manually. You'll build the list item by item as you go.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1">Upload an existing list — Scan Gear List</p>
              <p>
                If you already have a gear list in a <strong>PDF</strong>,{' '}
                <strong>Word document</strong>, <strong>Excel spreadsheet</strong>, or{' '}
                <strong>Numbers file</strong>, use <strong>Scan Gear List</strong> to
                import it. TrailWeigh reads the file and detects the items it finds.
                You review the detected items and choose which ones to add—nothing is
                imported automatically.
              </p>
            </div>

            <p>
              After the initial import you can add, edit, or remove items at any time.
            </p>
          </Section>

          {/* 2. Add / Organize */}
          <Section
            id="organize"
            title="2. Add / Organize"
            isOpen={isOpen('organize')}
            onToggle={toggle}
          >
            <p>
              Once gear is in TrailWeigh, you can build and refine your list however
              you like.
            </p>

            <div>
              <p className="font-semibold text-foreground mb-1">Adding and editing items</p>
              <p>
                Use <strong>Add Item</strong> inside any category to add gear manually.
                For each item you can enter a type, description, weight (optional), and
                quantity (1–20). The item's total weight updates automatically.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1">Organizing into categories</p>
              <p>
                Gear is grouped into <strong>categories</strong> — Shelter, Clothing,
                Navigation, or any grouping that makes sense for your trip. You can add
                categories, rename them, reorder them, and move items between them
                using the <strong>Move</strong> control on each item row.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1">Selecting the gear you're taking</p>
              <p>
                Each item has a <strong>checkbox</strong>. Check the items you're
                actually bringing on this trip. Only checked items count toward your
                pack weight totals. Unchecked items stay in your list and can be
                checked for future trips—they're simply excluded from the current
                calculation.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1">Different lists for different trips</p>
              <p>
                A gear list that works well for one trail or season often isn't right
                for another. The gear required for a PCT desert section, a winter trip,
                or a cold-weather AT stretch may differ from your standard setup—
                clothing, insulation, shelter, rain protection, water capacity, or
                traction can all change with route, elevation, and season.
              </p>
              <p>
                TrailWeigh supports separate named lists for each situation. You might
                keep lists for a summer trip, a CDT section, a cold-weather weekend, or
                any other configuration you return to. Use <strong>Save As</strong> to
                create a new version of an existing list as a starting point.
              </p>
            </div>
          </Section>

          {/* 3. Save / Preview / Print / Share */}
          <Section
            id="save-share"
            title="3. Save / Preview / Print / Share"
            isOpen={isOpen('save-share')}
            onToggle={toggle}
          >
            <div>
              <p className="font-semibold text-foreground mb-1">Save</p>
              <p>
                Click <strong>Save</strong> to store your current list in the{' '}
                <strong>Locker</strong> under a name you choose. You can save as many
                lists as you like—separate lists for different trails, seasons, gear
                configurations, or trips. They're private to your account and available
                any time you sign in.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1">Preview</p>
              <p>
                Click <strong>Preview</strong> to open a clean, formatted view of your
                current gear list. Preview is useful for reviewing the list before
                printing or sharing it.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1">Print</p>
              <p>
                TrailWeigh isn't only for calculating weight—your completed gear list
                can also serve as a physical packing checklist. Print it and use it
                while gathering equipment at home, packing with another hiker, or
                performing a final gear check before leaving for the trailhead.
              </p>
              <p>
                A checklist can help prevent arriving at the trailhead only to discover
                an important piece of gear was left at home.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground mb-1">Share</p>
              <p>
                Click <strong>Share</strong> to share your gear list. You can share a
                link to your full set of saved lists, or share just the current list as
                a checkable packing list.
              </p>
              <p>
                When you share the current list as a{' '}
                <strong>checkable packing list</strong>, the recipient can view the
                list, check items off as they gather or pack gear, and print it. Their
                checkbox activity is temporary—it doesn't affect your saved original.
                This can be useful for hiking partners, trip planning, or giving someone
                a packing checklist to work from.
              </p>
            </div>
          </Section>

        </div>{/* end accordion */}

        {/* ── Help link ──────────────────────────────────────────────────── */}
        <div className="mt-10 bg-card border border-card-border rounded-xl p-5 shadow-sm text-sm text-muted-foreground leading-relaxed">
          <p>
            Need detailed step-by-step instructions? Visit{' '}
            <Link to="/help" className="underline underline-offset-2 hover:text-foreground font-medium">
              Help &amp; How-To
            </Link>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
