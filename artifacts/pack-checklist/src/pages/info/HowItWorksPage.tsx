import React from 'react';
import { Link } from 'wouter';
import { Tent, ArrowLeft, FolderOpen, PlusCircle, CheckSquare, Scale, FolderArchive, Eye } from 'lucide-react';
import Footer from '@/components/Footer';

const steps = [
  {
    icon: FolderOpen,
    title: '1. Create or open a gear list',
    body: (
      <>
        <p>When you sign in, TrailWeigh opens your current working list. If you are starting fresh, click <strong>New</strong> in the toolbar to clear the working list and begin again.</p>
        <p>To continue work on a list you have already saved, open the <strong>Locker</strong> panel on the right side of the screen and select a saved list to load it.</p>
      </>
    ),
  },
  {
    icon: PlusCircle,
    title: '2. Add and organize gear',
    body: (
      <>
        <p>Your gear is organized into <strong>categories</strong> — groups such as Shelter, Clothing, or Navigation. Click <strong>Add Item</strong> within any category to add a gear item.</p>
        <p>For each item, enter a <strong>type or short label</strong>, a <strong>description</strong>, a <strong>weight</strong>, and a <strong>quantity</strong> (1–20). The item's total weight is calculated from weight × quantity.</p>
        <p>You can also add new categories using <strong>Add Category</strong> at the bottom of the gear list, rename any category by double-clicking its name, and reorder categories by dragging their drag handle.</p>
        <p>Each category can be set to count toward <strong>Base Weight</strong> or excluded from it using the <strong>+ Base</strong> / <strong>— Base</strong> control. Categories excluded from Base Weight — such as worn clothing — appear separately in the Pack Summary.</p>
      </>
    ),
  },
  {
    icon: CheckSquare,
    title: '3. Select the gear you are using',
    body: (
      <>
        <p>Each gear item has a <strong>checkbox</strong>. Check the items you are actually bringing on this trip. Only checked items contribute to the Pack Summary weight totals.</p>
        <p>Unchecked items stay in your gear list and remain available. They are simply excluded from the current weight calculation — useful for items you own but are not taking on this particular trip.</p>
      </>
    ),
  },
  {
    icon: Scale,
    title: '4. Review pack weight',
    body: (
      <>
        <p>The <strong>Pack Summary</strong> on the right side of the screen shows your weight totals in real time:</p>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground my-2 ml-1">
          <li><strong>Base Weight</strong> — the combined weight of all checked items in categories that count toward base weight.</li>
          <li><strong>Non-base categories</strong> — any categories excluded from base weight (for example, worn clothing or a dog pack) are shown individually below Base Weight.</li>
          <li><strong>Grand Total</strong> — the sum of all checked items across every category.</li>
        </ul>
        <p>The <strong>Weight Distribution</strong> display below Pack Summary shows how your checked weight is distributed across categories as a chart, giving you a quick visual sense of where the weight is concentrated.</p>
        <p>Use the <strong>Imperial</strong> / <strong>Metric</strong> toggle in the toolbar to switch the displayed units. Your underlying weight data is preserved in both views.</p>
      </>
    ),
  },
  {
    icon: FolderArchive,
    title: '5. Save, preview, or share',
    body: (
      <>
        <p><strong>Save / Locker</strong> — Click the <strong>Save</strong> button to save your current gear list to the Locker under a name you choose. The Locker stores multiple named lists and is private to your account. Use <strong>Save As</strong> from the Save dropdown to save the current list under a new name without overwriting the original.</p>
        <p><strong>Preview</strong> — Click <strong>Preview</strong> to open a formatted, print-ready view of your gear list. From Preview you can print directly.</p>
        <p><strong>Share</strong> — Click <strong>Share</strong> to generate a shareable link. Anyone with the link can view and print your gear list. They cannot modify your saved copy.</p>
      </>
    ),
  },
  {
    icon: Eye,
    title: '6. Scan Gear List (optional)',
    body: (
      <>
        <p>If you have an existing gear list in a PDF, Word document, Excel spreadsheet, or Numbers file, use the <strong>Scan Gear List</strong> panel to import items. TrailWeigh reads the file and presents detected items for you to review before adding them.</p>
      </>
    ),
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
          A brief overview of the TrailWeigh workflow. For detailed step-by-step instructions on any feature, visit{' '}
          <Link to="/help" className="underline underline-offset-2 hover:text-foreground">Help &amp; How-To</Link>.
        </p>

        <div className="space-y-5">
          {steps.map(({ icon: Icon, title, body }) => (
            <div key={title} className="bg-card border border-card-border rounded-xl p-5 shadow-sm">
              <div className="flex items-start gap-4 mb-3">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <h2 className="font-bold text-foreground text-base pt-1.5">{title}</h2>
              </div>
              <div className="text-sm text-muted-foreground leading-relaxed space-y-2 pl-[52px]">
                {body}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            to="/help"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            View Help &amp; How-To
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
