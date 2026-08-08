/**
 * HelpPage.tsx — TrailWeigh Help & How-To
 *
 * Progressive-disclosure accordion. Each help topic is independently
 * expandable/collapsible. Opening one topic does not affect others.
 *
 * Topics are based on the verified current TrailWeigh UI as of Prompt 022B.
 * No video or animation placeholders are included.
 */
import React, { useState, useCallback } from 'react';
import { Link } from 'wouter';
import { Tent, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import Footer from '@/components/Footer';

// ── Accordion state ──────────────────────────────────────────────────────────

function useAccordion() {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = useCallback((id: string) => {
    setOpen(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);
  const isOpen = (id: string) => open.has(id);
  return { toggle, isOpen };
}

// ── Components ───────────────────────────────────────────────────────────────

interface TopicProps {
  id: string;
  title: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}

function Topic({ id, title, isOpen, onToggle, children }: TopicProps) {
  return (
    <div className="border border-card-border rounded-xl overflow-hidden shadow-sm bg-card">
      <button
        id={`topic-btn-${id}`}
        aria-expanded={isOpen}
        aria-controls={`topic-panel-${id}`}
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
      >
        <span className="font-semibold text-foreground text-sm">{title}</span>
        {isOpen
          ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        }
      </button>
      {isOpen && (
        <div
          id={`topic-panel-${id}`}
          role="region"
          aria-labelledby={`topic-btn-${id}`}
          className="px-5 pb-5 border-t border-border"
        >
          <div className="pt-4 text-sm text-muted-foreground leading-relaxed space-y-4">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-bold text-foreground mb-3 pb-2 border-b border-border">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <p className="font-semibold text-foreground mt-3 mb-1">{children}</p>;
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 text-xs text-muted-foreground leading-relaxed">
      <strong className="text-foreground">Note: </strong>{children}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function HelpPage() {
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

        <h1 className="text-3xl font-black text-foreground mb-2">Help &amp; How-To</h1>
        <p className="text-muted-foreground mb-10">
          Detailed written instructions for every TrailWeigh feature.
          Select any topic below to expand it.
        </p>

        {/* ── GETTING STARTED ─────────────────────────────────────────────── */}
        <Section title="Getting Started">
          <Topic id="gs-first-use" title="Getting Started with TrailWeigh" isOpen={isOpen('gs-first-use')} onToggle={toggle}>
            <H3>What it does</H3>
            <p>TrailWeigh lets you build, weigh, save, and share hiking and backpacking gear lists. Your gear is organized into categories and weighted at the item level so you can see exactly how each piece contributes to your total carry weight.</p>

            <H3>Starting out</H3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Sign in to your TrailWeigh account. If you don't have one, select <strong>Get Started</strong> on the home screen and create one.</li>
              <li>When you first sign in, TrailWeigh opens a working gear list with default categories already in place. You can rename, add to, or remove these categories.</li>
              <li>Select a category, click <strong>Add Item</strong>, and enter your first piece of gear — its type, description, weight, and quantity.</li>
              <li>Check the items you are bringing on this trip. Only checked items count toward your Pack Summary weight totals.</li>
              <li>When you're ready to save, click the <strong>Save</strong> button in the toolbar, give the list a name, and it will be stored in your <strong>Locker</strong>.</li>
            </ol>

            <H3>What to expect</H3>
            <p>Your gear list and Pack Summary update in real time as you add items and check them. Data is saved to your account — your list will be there the next time you sign in on any device (your working list is stored in your browser, so the same browser is required for unsaved changes; save to the Locker to access across devices).</p>

            <Note>Unsaved changes to the working list are stored in your browser. To access your gear list from another device or browser, save it to the Locker first.</Note>
          </Topic>
        </Section>

        {/* ── BUILDING YOUR GEAR LIST ─────────────────────────────────────── */}
        <Section title="Building Your Gear List">
          <Topic id="bgl-adding" title="Adding Gear" isOpen={isOpen('bgl-adding')} onToggle={toggle}>
            <H3>What it does</H3>
            <p>Each category in your gear list has an <strong>Add Item</strong> button. Clicking it creates a new row in that category where you can enter the item's details.</p>

            <H3>How to use it</H3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Expand the category you want to add to (click its name or the disclosure chevron on the left side of the category header).</li>
              <li>Click <strong>Add Item</strong> at the bottom of the category.</li>
              <li>In the <strong>Type</strong> field (or the custom label your category uses), enter a short label for the item — for example "Tent" or "Rain jacket."</li>
              <li>In the <strong>Description</strong> field, add any additional detail — for example the brand, model, or color.</li>
              <li>Enter the item's <strong>weight</strong> in the current unit (oz or g). Click directly in the weight field to type the value.</li>
              <li>Select a <strong>Qty</strong> (quantity) from 1 to 20. The total weight is calculated from weight × quantity.</li>
              <li>To include this item in your Pack Summary, make sure its checkbox is checked.</li>
            </ol>

            <H3>What to expect</H3>
            <p>The item appears in the category immediately. The <strong>Pack Summary</strong> and <strong>Weight Distribution</strong> update in real time. The <strong>Total</strong> column shows the item's weight multiplied by its quantity in both the category's unit and a summary unit.</p>

            <Note>The Type and Description column headings can be renamed at the category level. If a category uses different labels, the fields work the same way.</Note>
          </Topic>

          <Topic id="bgl-checkbox" title="Item Checkboxes — Selecting Gear" isOpen={isOpen('bgl-checkbox')} onToggle={toggle}>
            <H3>What it does</H3>
            <p>Each gear item has a checkbox on its left side. Checking an item marks it as part of your current load for this trip. Only checked items are included in the <strong>Pack Summary</strong> weight totals.</p>

            <H3>How to use it</H3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the checkbox on the left side of any gear row to check or uncheck it.</li>
              <li>Checked items contribute their weight to the Pack Summary. Unchecked items do not.</li>
            </ol>

            <H3>What to expect</H3>
            <p>The Pack Summary and Weight Distribution update immediately when you check or uncheck an item. The category header shows a running count of how many items are checked out of how many are in the category (for example, "3 / 5 packed").</p>

            <Note>Unchecked items remain in your gear list. They are not deleted — they simply aren't counted in the current weight calculation. This is useful for gear you own but are not taking on a particular trip.</Note>
          </Topic>

          <Topic id="bgl-qty" title="Quantity (Qty)" isOpen={isOpen('bgl-qty')} onToggle={toggle}>
            <H3>What it does</H3>
            <p>The <strong>Qty</strong> field sets how many of a given item you are carrying. TrailWeigh multiplies the item's weight by its quantity to calculate the total weight for that row.</p>

            <H3>How to use it</H3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the <strong>Qty</strong> selector on any gear row.</li>
              <li>Select a value from 1 to 20.</li>
            </ol>

            <H3>What to expect</H3>
            <p>The <strong>Total</strong> column updates immediately to reflect weight × quantity. The Pack Summary also updates in real time.</p>
          </Topic>
        </Section>

        {/* ── ORGANIZING GEAR ─────────────────────────────────────────────── */}
        <Section title="Organizing Gear">
          <Topic id="og-categories" title="Categories" isOpen={isOpen('og-categories')} onToggle={toggle}>
            <H3>What they do</H3>
            <p>Categories are the top-level groups in your gear list — for example, Shelter, Clothing, or Navigation. Each category contains gear items and can be set to count toward your Base Weight or not.</p>

            <H3>Expanding and collapsing</H3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the disclosure chevron (the arrow on the left side of the category header) or click the category name to expand or collapse it.</li>
              <li>An expanded category shows its gear items. A collapsed category shows only the header and its packed count.</li>
              <li>To expand all categories at once, click the <strong>Open</strong> button in the toolbar. To collapse all, click <strong>Close</strong>.</li>
            </ol>

            <H3>Renaming a category</H3>
            <p>Double-click the category name to rename it. Type the new name and press Enter, or click elsewhere to confirm.</p>

            <H3>Reordering categories</H3>
            <p>Drag a category by its drag handle (the grip icon on the left side of the header) to change its position in the list.</p>

            <H3>Base Weight setting</H3>
            <p>Each category has a <strong>+ Base</strong> or <strong>— Base</strong> control in its header. Categories set to <strong>+ Base</strong> count toward your Base Weight. Categories set to <strong>— Base</strong> are excluded from Base Weight and appear as a separate line in the Pack Summary. Use <strong>— Base</strong> for categories such as worn clothing, a dog pack, or food and water.</p>

            <H3>Adding a new category</H3>
            <p>Scroll to the bottom of the gear list and click <strong>Add Category</strong>. Enter a name in the text field and press Enter or click the confirm button.</p>

            <H3>Deleting a category</H3>
            <p>Click the delete icon on the right side of the category header. A confirmation prompt appears — click <strong>Yes</strong> to delete the category and all its items, or <strong>No</strong> to cancel.</p>

            <Note>Deleting a category removes all items within it. This action can be undone using the Undo button if you have not made further changes.</Note>
          </Topic>

          <Topic id="og-move" title="Moving Gear Between Categories" isOpen={isOpen('og-move')} onToggle={toggle}>
            <H3>What it does</H3>
            <p>The <strong>Move</strong> control on each gear row lets you move that item from its current category to any other category in your list.</p>

            <H3>How to use it</H3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Expand the category containing the item you want to move.</li>
              <li>In the <strong>Move</strong> column of that item's row, click the <strong>Move to…</strong> selector.</li>
              <li>Select the destination category from the list. Only other categories are shown — the item's current category does not appear.</li>
            </ol>

            <H3>What to expect</H3>
            <p>The item is removed from its original category and added to the end of the destination category immediately. All item details — type, description, weight, quantity, and checked state — are preserved.</p>

            <Note>If your gear list contains only one category, the Move selector will be disabled because there is nowhere to move the item to.</Note>
          </Topic>
        </Section>

        {/* ── EDITING HISTORY ─────────────────────────────────────────────── */}
        <Section title="Editing History">
          <Topic id="eh-undo" title="Undo" isOpen={isOpen('eh-undo')} onToggle={toggle}>
            <H3>What it does</H3>
            <p>Undo reverses the most recent change you made to your gear list — for example, removing an item you just deleted or restoring text you just cleared.</p>

            <H3>How to use it</H3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the <strong>Undo</strong> button in the toolbar, or press <strong>Ctrl+Z</strong> (Windows/Linux) or <strong>⌘Z</strong> (Mac).</li>
              <li>Each click steps back one change.</li>
            </ol>

            <H3>What to expect</H3>
            <p>The previous state of your gear list is restored. The Undo button is disabled (greyed out) when there is no further history to step back through.</p>

            <Note>Undo history is for the current session. Closing the browser tab clears the undo history, though your saved data in the Locker is not affected.</Note>
          </Topic>

          <Topic id="eh-redo" title="Redo" isOpen={isOpen('eh-redo')} onToggle={toggle}>
            <H3>What it does</H3>
            <p>Redo re-applies a change that was reversed by Undo. It is only available after you have used Undo.</p>

            <H3>How to use it</H3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the <strong>Redo</strong> button in the toolbar, or press <strong>Ctrl+Y</strong> (Windows/Linux) or <strong>⌘Y</strong> (Mac).</li>
            </ol>

            <H3>What to expect</H3>
            <p>The change that was undone is restored. Making a new edit after an Undo clears the redo history.</p>
          </Topic>
        </Section>

        {/* ── SAVING & LOCKER ─────────────────────────────────────────────── */}
        <Section title="Saving & Locker">
          <Topic id="sl-new" title="New — Starting a New List" isOpen={isOpen('sl-new')} onToggle={toggle}>
            <H3>What it does</H3>
            <p><strong>New</strong> clears the current working list and starts fresh with the default categories and no items. Your existing saved lists in the Locker are not affected.</p>

            <H3>How to use it</H3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the <strong>New</strong> button in the toolbar.</li>
              <li>A confirmation prompt appears. If you have unsaved changes you want to keep, click <strong>Cancel</strong> and save first. If you are ready to clear the working list, click <strong>Create New List</strong>.</li>
            </ol>

            <H3>What to expect</H3>
            <p>The working list is cleared. All categories are emptied and any active file name is removed. Your Locker contents are not changed.</p>

            <Note>Save your current list to the Locker before clicking New if you want to access it later. New does not save the working list first.</Note>
          </Topic>

          <Topic id="sl-save" title="Save" isOpen={isOpen('sl-save')} onToggle={toggle}>
            <H3>What it does</H3>
            <p><strong>Save</strong> stores the current state of your gear list — including all items, checked states, weights, categories, background settings, and unit preference — to the Locker under the current file name.</p>

            <H3>How to use it</H3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the <strong>Save</strong> button in the toolbar (the button with a dropdown arrow).</li>
              <li>If this is a new list with no name, a text field appears. Type a name and click <strong>Save</strong>.</li>
              <li>If you are saving an already-named list, it saves immediately. A brief confirmation — <em>Saved [File Name]</em> — appears at the bottom of the screen.</li>
              <li>If the name already exists in the Locker, you are offered options: <strong>Replace</strong> (overwrite the existing list), <strong>Save as New</strong> (keep the original and create a new copy), or go back.</li>
            </ol>

            <H3>What to expect</H3>
            <p>The list is saved to the Locker under your account and is available from any browser where you are signed in. A confirmation message appears briefly at the bottom of the screen.</p>
          </Topic>

          <Topic id="sl-saveas" title="Save As" isOpen={isOpen('sl-saveas')} onToggle={toggle}>
            <H3>What it does</H3>
            <p><strong>Save As</strong> saves a copy of the current gear list under a new name, leaving the original saved list unchanged. Use this to create a variant of an existing list — for example, a summer versus winter version of the same trip.</p>

            <H3>How to use it</H3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the arrow on the <strong>Save</strong> button to open the dropdown.</li>
              <li>Select <strong>Save As</strong>.</li>
              <li>Enter a new name for the copy and click <strong>Save</strong>.</li>
            </ol>

            <H3>What to expect</H3>
            <p>A new list with the name you entered is created in the Locker. The original saved list is not modified. You are now working on the newly named copy.</p>
          </Topic>

          <Topic id="sl-reset" title="Reset" isOpen={isOpen('sl-reset')} onToggle={toggle}>
            <H3>What it does</H3>
            <p><strong>Reset</strong> clears all gear items from every category in your current working list. The categories themselves remain — only the items inside them are removed.</p>

            <H3>How to use it</H3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the <strong>Reset</strong> button in the toolbar.</li>
              <li>A confirmation prompt appears with <strong>Confirm</strong> and <strong>Cancel</strong> options.</li>
              <li>Click <strong>Confirm</strong> to clear all items. Click <strong>Cancel</strong> to return to the list unchanged.</li>
            </ol>

            <H3>What to expect</H3>
            <p>All items in every category are removed. Your categories remain intact with their names, Base Weight settings, and custom column labels. The Pack Summary resets to zero.</p>

            <Note>Reset clears only the current working list's items. It does not delete anything from the Locker. You can use Undo immediately after a Reset to restore the items if you did not intend to clear them.</Note>
          </Topic>

          <Topic id="sl-locker" title="Locker" isOpen={isOpen('sl-locker')} onToggle={toggle}>
            <H3>What it does</H3>
            <p>The <strong>Locker</strong> is where your saved gear lists are stored. It appears as a collapsible panel on the right side of the screen. Only you can see your Locker — it is private to your signed-in account.</p>

            <H3>Opening the Locker panel</H3>
            <p>Click the <strong>Locker</strong> heading on the right side of the screen. The panel expands to show your saved lists. Click the heading again to collapse it.</p>

            <H3>Loading a saved list</H3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Open the Locker panel.</li>
              <li>Click the load icon (folder icon) next to the list you want to open.</li>
              <li>The list opens in a new browser tab, leaving your current working list in the original tab.</li>
            </ol>

            <H3>Renaming a saved list</H3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the rename icon (pencil icon) next to the list you want to rename.</li>
              <li>Edit the name in the text field that appears.</li>
              <li>Click the confirm icon to save the new name, or the cancel icon to discard the change.</li>
            </ol>

            <H3>Deleting a saved list</H3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the delete icon (trash icon) next to the list you want to remove.</li>
              <li>A confirmation prompt asks you to confirm. Click <strong>Yes</strong> to permanently delete the list, or <strong>No</strong> to cancel.</li>
            </ol>

            <Note>Deleting a list from the Locker is permanent. The list cannot be recovered after deletion is confirmed. Existing shared links created from a deleted list will no longer load correctly.</Note>
          </Topic>
        </Section>

        {/* ── PREVIEW & DISPLAY ───────────────────────────────────────────── */}
        <Section title="Preview &amp; Display">
          <Topic id="pd-preview" title="Preview" isOpen={isOpen('pd-preview')} onToggle={toggle}>
            <H3>What it does</H3>
            <p><strong>Preview</strong> opens a formatted, print-ready view of your current gear list. It shows all your gear organized by category, along with weights and totals, in a clean layout.</p>

            <H3>How to use it</H3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the <strong>Preview</strong> button in the toolbar.</li>
              <li>The Preview panel opens over the gear list.</li>
              <li>To print, click the <strong>Print</strong> button inside Preview. Your browser's print dialog opens.</li>
              <li>To close Preview, click the close button (✕) or click outside the Preview panel.</li>
            </ol>

            <H3>What to expect</H3>
            <p>Preview shows a snapshot of your current gear list. It reflects the items and categories as they are at the moment you open it. Changes made after opening Preview are not reflected until you close and reopen it.</p>
          </Topic>

          <Topic id="pd-hide" title="Hide" isOpen={isOpen('pd-hide')} onToggle={toggle}>
            <H3>What it does</H3>
            <p><strong>Hide</strong> hides the gear-list interface and shows your current background image in a full-screen view. This is useful when you want to see the background without the application controls over it, or when the screen will be visible but idle.</p>

            <H3>How to use it</H3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the <strong>Hide</strong> button in the toolbar.</li>
              <li>The interface fades out and the background image fills the screen.</li>
              <li>Click anywhere on the screen, press any key, or move the mouse to return to the gear-list interface.</li>
            </ol>

            <Note>Hide does not close or save your list. Your gear list remains open in the background and returns unchanged when you wake the screen.</Note>
          </Topic>
        </Section>

        {/* ── BACKGROUND ──────────────────────────────────────────────────── */}
        <Section title="Background">
          <Topic id="bg-edit" title="Background Edit" isOpen={isOpen('bg-edit')} onToggle={toggle}>
            <H3>What it does</H3>
            <p><strong>Background Edit</strong> lets you choose and customize the background image displayed behind your gear list. TrailWeigh provides a curated collection of landscape photos to choose from.</p>

            <H3>How to use it</H3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the <strong>Background Edit</strong> button in the toolbar. The Background panel opens on the right side of the screen.</li>
              <li>Browse the available background collections. <strong>Landscapes</strong> contains TrailWeigh's built-in outdoor photos. Additional themed collections may also be available.</li>
              <li>Click a photo thumbnail to set it as your background.</li>
              <li>Use <strong>Fill Screen</strong> or <strong>Fit Image</strong> to control how the photo is sized. <em>Fill Screen</em> crops the photo to cover the entire background. <em>Fit Image</em> shows the complete photo within the screen.</li>
              <li>Use the <strong>☀ Light</strong> / <strong>🌙 Dark</strong> tone setting to choose whether a light or dark overlay is applied on top of the photo, helping text remain readable.</li>
              <li>Use the <strong>Lighten</strong> or <strong>Darken</strong> slider to adjust how strongly the overlay is applied. Setting it to 100% makes the photo invisible; setting it to 0% shows the photo without any overlay.</li>
            </ol>

            <H3>What to expect</H3>
            <p>The background updates in real time as you make selections. Your background choice is saved with your gear list when you save to the Locker.</p>

            <Note>Background photos are provided by TrailWeigh and are hosted externally. An internet connection is required to display them. The background choice is saved with each individual Locker list.</Note>
          </Topic>
        </Section>

        {/* ── SHARING ─────────────────────────────────────────────────────── */}
        <Section title="Sharing">
          <Topic id="sh-share" title="Share" isOpen={isOpen('sh-share')} onToggle={toggle}>
            <H3>What it does</H3>
            <p><strong>Share</strong> generates a link that you can send to anyone. The recipient can view and print your gear list without needing a TrailWeigh account. Your original saved list is not affected by sharing.</p>

            <H3>How to use it</H3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Click the <strong>Share</strong> button in the toolbar.</li>
              <li>The Share menu opens. Select the sharing option appropriate for what you want to send.</li>
              <li>Copy the generated link and send it however you prefer — email, message, or another method.</li>
            </ol>

            <H3>What recipients see</H3>
            <p>Anyone with the link can view a read-only version of your gear list at the time the link was created. They can see:</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Your gear list with categories, items, and weights</li>
              <li>Pack Summary totals</li>
              <li>The list name (if set)</li>
            </ul>
            <p>Recipients can temporarily switch the unit display between Imperial and Metric in their view. This does not affect your original list.</p>

            <H3>What recipients cannot do</H3>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li>Edit your gear list</li>
              <li>Access your Locker</li>
              <li>Delete anything from your account</li>
              <li>See other lists in your Locker</li>
            </ul>

            <Note>The share link contains a snapshot of your list at the time it was created. Changes you make to your list after creating the link are not reflected in the shared view unless you create a new link.</Note>
          </Topic>
        </Section>

        {/* ── IMPORTING / SCAN GEAR LIST ──────────────────────────────────── */}
        <Section title="Importing / Scan Gear List">
          <Topic id="imp-scan" title="Scan Gear List" isOpen={isOpen('imp-scan')} onToggle={toggle}>
            <H3>What it does</H3>
            <p><strong>Scan Gear List</strong> reads a gear-list document you already have and extracts items from it, letting you select which ones to import into TrailWeigh. Supported file formats are: <strong>PDF, Word (.docx, .doc), Excel (.xlsx, .xls), and Numbers (.numbers)</strong>.</p>

            <H3>How to use it</H3>
            <ol className="list-decimal list-inside space-y-2">
              <li>Open the <strong>Scan Gear List</strong> panel on the right side of the screen (click its heading to expand it).</li>
              <li>Drag and drop your file onto the drop zone, or click the drop zone to browse and select a file.</li>
              <li>TrailWeigh reads the file and presents a list of detected gear items with their names and weights.</li>
              <li>Review the detected items. Select the ones you want to add using the checkboxes.</li>
              <li>Click <strong>Import Selected</strong> to add the selected items to your current gear list.</li>
            </ol>

            <H3>What to expect</H3>
            <p>Imported items are added to the appropriate categories in your working list. The Pack Summary updates to reflect the new items.</p>

            <Note>The accuracy of item detection depends on the format and structure of your source file. Files with clear item names and weight values in standard formats produce the best results. If no items with weight values are found, an error message is shown and you can try a different file.</Note>
          </Topic>
        </Section>

        {/* ── PACK WEIGHT & SUMMARIES ─────────────────────────────────────── */}
        <Section title="Pack Weight &amp; Summaries">
          <Topic id="pw-summary" title="Pack Summary" isOpen={isOpen('pw-summary')} onToggle={toggle}>
            <H3>What it does</H3>
            <p>The <strong>Pack Summary</strong> panel on the right side of the screen shows your total pack weight, broken down by weight classification, based on currently checked items.</p>

            <H3>What it shows</H3>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li><strong>Base Weight</strong> — the total weight of all checked items in categories set to count toward Base Weight (those showing <em>+ Base</em> in their header).</li>
              <li><strong>Non-base categories</strong> — categories excluded from Base Weight (those showing <em>— Base</em>) appear as separate lines below Base Weight, labeled with the category name.</li>
              <li><strong>Grand Total</strong> — the combined weight of all checked items across every category.</li>
            </ul>

            <H3>What to expect</H3>
            <p>Pack Summary updates in real time as you check or uncheck items, add or remove gear, or change weights and quantities. Only checked items are counted.</p>
          </Topic>

          <Topic id="pw-distribution" title="Weight Distribution" isOpen={isOpen('pw-distribution')} onToggle={toggle}>
            <H3>What it does</H3>
            <p>The <strong>Weight Distribution</strong> display, located below Pack Summary, shows how your checked pack weight is distributed across categories as a chart. Each category is represented by a segment in a distinct color.</p>

            <H3>What it shows</H3>
            <p>Each colored segment represents one category and shows what proportion of the total checked weight comes from that category. Categories with no checked items do not appear.</p>

            <H3>What to expect</H3>
            <p>The chart updates in real time as you check, uncheck, add, or remove items. It gives you a quick visual sense of where the weight in your pack is concentrated.</p>
          </Topic>

          <Topic id="pw-units" title="Imperial / Metric" isOpen={isOpen('pw-units')} onToggle={toggle}>
            <H3>What it does</H3>
            <p>The <strong>Imperial</strong> / <strong>Metric</strong> toggle in the toolbar switches the displayed weight units throughout TrailWeigh.</p>
            <ul className="list-disc list-inside space-y-1 ml-1">
              <li><strong>Imperial</strong>: weights are displayed in ounces (oz) and pounds (lb).</li>
              <li><strong>Metric</strong>: weights are displayed in grams (g) and kilograms (kg).</li>
            </ul>

            <H3>How to use it</H3>
            <p>Click <strong>Imperial</strong> or <strong>Metric</strong> in the toolbar to switch between the two. The change takes effect immediately across the entire gear list, Pack Summary, and Weight Distribution.</p>

            <H3>What to expect</H3>
            <p>All displayed weight values update to the selected unit. Your underlying item weight data is preserved — switching back to the other unit shows the same data accurately converted.</p>

            <Note>Weights entered in one unit system are stored precisely and converted for display when you switch units. There is no data loss from switching.</Note>
          </Topic>

          <Topic id="pw-filename" title="File Name" isOpen={isOpen('pw-filename')} onToggle={toggle}>
            <H3>What it does</H3>
            <p>The <strong>file name</strong> is the name of the gear list you are currently working on. It is displayed as a small pill label in the toolbar area above the gear-list column.</p>

            <H3>What to expect</H3>
            <p>The file name appears when you have a saved list open. If you are working on an unsaved list, no name is shown. After you save the list (via <strong>Save</strong> or <strong>Save As</strong>), the name you entered is displayed as the current file name.</p>

            <Note>Renaming a list is done through the Locker panel (rename icon). The file name display updates to reflect the current name.</Note>
          </Topic>
        </Section>

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <Section title="Frequently Asked Questions">
          <Topic id="faq-unchecked" title="Do unchecked items stay in my gear list?" isOpen={isOpen('faq-unchecked')} onToggle={toggle}>
            <p>Yes. Unchecked items remain in your gear list and are not deleted. They are simply excluded from the Pack Summary weight calculation. This lets you maintain a master list of everything you own and check off only what you're bringing on a specific trip.</p>
          </Topic>

          <Topic id="faq-baseweight" title="What is Base Weight?" isOpen={isOpen('faq-baseweight')} onToggle={toggle}>
            <p>Base Weight is the total weight of your gear excluding consumables (food, water, fuel) and items you wear rather than carry. In TrailWeigh, Base Weight is calculated from checked items in any category set to <strong>+ Base</strong>. Categories set to <strong>— Base</strong> are excluded from the Base Weight total and appear separately in the Pack Summary.</p>
          </Topic>

          <Topic id="faq-savevssaveas" title="What is the difference between Save and Save As?" isOpen={isOpen('faq-savevssaveas')} onToggle={toggle}>
            <p><strong>Save</strong> overwrites the existing saved list with the current state. If the list has no name yet, you are prompted to give it one.</p>
            <p><strong>Save As</strong> saves a copy of the current list under a new name, leaving the original saved list unchanged. Use Save As to create variants — for example, a summer and a winter version of the same trip.</p>
          </Topic>

          <Topic id="faq-where-lists" title="Where are my saved lists?" isOpen={isOpen('faq-where-lists')} onToggle={toggle}>
            <p>Your saved gear lists are stored in your <strong>Locker</strong>, which is the collapsible panel on the right side of the screen. Click the Locker heading to expand it and see all your saved lists. Lists in the Locker are tied to your TrailWeigh account.</p>
          </Topic>

          <Topic id="faq-share-edit" title="Can another person change my original gear list through a Share Link?" isOpen={isOpen('faq-share-edit')} onToggle={toggle}>
            <p>No. Share links give recipients a read-only view of your gear list at the time the link was created. They can view and print the list, and temporarily switch the unit display. They cannot edit your list, access your Locker, or affect your saved data in any way.</p>
          </Topic>

          <Topic id="faq-units" title="Can I switch between Imperial and Metric?" isOpen={isOpen('faq-units')} onToggle={toggle}>
            <p>Yes. Click the <strong>Imperial</strong> or <strong>Metric</strong> button in the toolbar to switch at any time. Your item weight data is preserved in both views — switching units is display-only and does not change or lose your data.</p>
          </Topic>

          <Topic id="faq-undo" title="Can I undo a change?" isOpen={isOpen('faq-undo')} onToggle={toggle}>
            <p>Yes. Click the <strong>Undo</strong> button in the toolbar (or press <strong>Ctrl+Z</strong> / <strong>⌘Z</strong>) to step back through recent changes. Undo works for item edits, additions, deletions, category changes, and moves. Undo history is maintained for the current session and does not persist after you close the browser tab.</p>
          </Topic>

          <Topic id="faq-import-types" title="What file types can I import?" isOpen={isOpen('faq-import-types')} onToggle={toggle}>
            <p>Scan Gear List supports: <strong>PDF (.pdf)</strong>, <strong>Word (.docx, .doc)</strong>, <strong>Excel (.xlsx, .xls)</strong>, and <strong>Numbers (.numbers)</strong>. Files in other formats are not currently supported.</p>
          </Topic>
        </Section>

        {/* ── TROUBLESHOOTING ─────────────────────────────────────────────── */}
        <Section title="Troubleshooting">
          <Topic id="ts-general" title="General troubleshooting steps" isOpen={isOpen('ts-general')} onToggle={toggle}>
            <p>If something in TrailWeigh is not behaving as expected, work through the following steps:</p>

            <H3>1. Confirm you are signed in to the correct account</H3>
            <p>Your gear lists are tied to your TrailWeigh account. If the wrong account is signed in, your lists will not be visible. Check the account name shown in the toolbar.</p>

            <H3>2. Refresh the page</H3>
            <p>A simple page refresh resolves many display or loading issues. Use your browser's refresh button or press <strong>F5</strong> (Windows/Linux) or <strong>⌘R</strong> (Mac).</p>

            <H3>3. Confirm the correct file is open</H3>
            <p>Check the file name shown above the gear-list column. If a different list is open than expected, use the Locker to load the correct one.</p>

            <H3>4. Verify the file type before importing</H3>
            <p>Scan Gear List accepts PDF, Word, Excel, and Numbers files only. If your import fails, confirm the file is in a supported format and that it contains items with weight values.</p>

            <H3>5. Check browser permissions</H3>
            <p>Some TrailWeigh features require a working internet connection (for example, loading background images or using the AI scan feature). If a feature isn't responding, check that you have an active connection.</p>

            <H3>6. Report the problem</H3>
            <p>If the above steps don't resolve the issue, use the{' '}
              <Link to="/report-problem" className="underline underline-offset-2 hover:text-foreground">Report a Problem</Link>{' '}
              page to describe what happened. Including your device, browser, and the steps you took helps us identify the issue quickly.
            </p>
          </Topic>
        </Section>

      </main>

      <Footer />
    </div>
  );
}
