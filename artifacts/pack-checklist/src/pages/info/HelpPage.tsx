/**
 * HelpPage.tsx — TrailWeigh Help & How-To
 * Prompt 022C: Reorganized into 6 workflow-order sections.
 *
 * Structure:
 *   1. Building Your Gear List
 *   2. Understanding Your Pack Weight
 *   3. Editing Your Gear List
 *   4. Save / Locker
 *   5. Preview / Print / Share
 *   6. Backgrounds & Display
 *
 * Each main section is independently collapsible (collapsed by default).
 * Multiple sections may be open simultaneously.
 * Full title row is the click/keyboard target.
 */
import React, { useState, useCallback } from 'react';
import { Link } from 'wouter';
import { Tent, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import Footer from '@/components/Footer';

// ── Accordion ────────────────────────────────────────────────────────────────

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

// ── Main section accordion item ───────────────────────────────────────────────

interface MainSectionProps {
  id: string;
  title: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}

function MainSection({ id, title, isOpen, onToggle, children }: MainSectionProps) {
  return (
    <div className="border border-card-border rounded-xl overflow-hidden shadow-sm bg-card">
      {/*
       * The ENTIRE title row is the button — meeting the requirement that the
       * full row is clickable, not just the chevron.
       * Standard <button> handles both Enter and Space natively.
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
          className="px-5 pb-7 border-t border-border"
        >
          <div className="pt-5 space-y-7 text-sm text-muted-foreground leading-relaxed">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-section heading ───────────────────────────────────────────────────────

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-semibold text-foreground text-sm mb-3 border-b border-border pb-1.5">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// ── Inline helpers ────────────────────────────────────────────────────────────

function H4({ children }: { children: React.ReactNode }) {
  return <p className="font-semibold text-foreground mt-3 mb-1">{children}</p>;
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/50 border border-border rounded-lg px-4 py-3 text-xs leading-relaxed">
      <strong className="text-foreground">Note: </strong>{children}
    </div>
  );
}

function OL({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal list-inside space-y-2 ml-1">{children}</ol>;
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc list-inside space-y-1.5 ml-1">{children}</ul>;
}

// ── Shared content component ─────────────────────────────────────────────────

export interface HelpContentProps {
  navigate: (path: string) => void;
}

export function HelpContent({ navigate }: HelpContentProps) {
  const { toggle, isOpen } = useAccordion();

  return (
    <>
        <h1 className="text-3xl font-black text-foreground mb-2">Help &amp; How-To</h1>
        <p className="text-muted-foreground mb-8">
          Select any topic to expand it. All sections start collapsed.
          You can have more than one open at a time.
        </p>

        <div className="space-y-3">

          {/* ════════════════════════════════════════════════════════════════
              1. BUILDING YOUR GEAR LIST
              ════════════════════════════════════════════════════════════════ */}
          <MainSection id="building" title="1. Building Your Gear List" isOpen={isOpen('building')} onToggle={toggle}>

            <Sub title="A. Create / Upload">
              <H4>Starting a new gear list</H4>
              <p>
                When you sign in, TrailWeigh opens your current working gear list.
                To start completely fresh, click <strong>New</strong> in the toolbar.
                If your current list has unsaved changes you want to keep, click <strong>Cancel</strong>
                and save first. Otherwise click <strong>Create New List</strong> to clear the working
                list and begin again with the default categories in place.
              </p>

              <H4>Importing an existing gear list — Scan Gear List</H4>
              <p>
                If you already have a gear list saved as a file, you can import it directly
                instead of re-entering everything by hand.
              </p>
              <p>
                <strong>Supported file types:</strong> PDF (.pdf), Word (.docx, .doc),
                Excel (.xlsx, .xls), and Numbers (.numbers).
              </p>
              <OL>
                <li>Open the <strong>Scan Gear List</strong> panel on the right side of the screen by clicking its heading.</li>
                <li>Drag your file onto the drop zone in the panel, or click the drop zone to browse and select a file.</li>
                <li>TrailWeigh reads the file and displays a list of the gear items it detects, along with their names and weights.</li>
                <li>Review the detected items. Use the checkboxes to select only the items you want to import — you don't have to take everything.</li>
                <li>Click <strong>Import Selected</strong>. The selected items are added to your current gear list.</li>
              </OL>
              <Note>
                Detection accuracy depends on how the source file is formatted. Files with
                clearly labelled item names and weight values in a consistent layout work best.
                If nothing is found, try a different file or add items manually.
              </Note>
            </Sub>

            <Sub title="B. Add / Organize">
              <H4>Adding gear items</H4>
              <p>
                Gear is organized into <strong>categories</strong> — groups such as Shelter,
                Clothing, or Navigation. To add a piece of gear:
              </p>
              <OL>
                <li>Expand the category you want to add to by clicking the category name or the disclosure chevron on its left side.</li>
                <li>Click <strong>Add Item</strong> at the bottom of that category.</li>
                <li>Fill in the fields for the new item:</li>
              </OL>
              <div className="ml-6 mt-2 space-y-1.5">
                <p><strong>Type</strong> — a short label for the item (for example, "Tent" or "Rain jacket").</p>
                <p><strong>Description</strong> — additional detail such as brand, model, or color. This field is optional.</p>
                <p><strong>Weight</strong> — the item's weight in the currently selected unit (oz or g). Click the weight field and type the value.</p>
                <p><strong>Qty</strong> — how many of this item you are carrying. Select a quantity from 1 to 20. TrailWeigh multiplies weight × quantity to show the total weight for that row in the <strong>Total</strong> column.</p>
              </div>

              <H4>Selecting the gear you are carrying</H4>
              <p>
                Each gear item has a <strong>checkbox</strong> on its left side. Check the
                items you are bringing on this particular trip. Only checked items
                are included in your Pack Summary weight totals.
              </p>
              <p>
                Unchecked items remain in your gear list — they are not deleted. This lets
                you maintain a master list of everything you own and simply check off what
                you're taking for each trip. Items you leave unchecked are excluded from the
                weight calculation but stay ready for next time.
              </p>

              <H4>Moving gear between categories</H4>
              <p>
                Each gear row has a <strong>Move</strong> control. If an item belongs in a
                different category:
              </p>
              <OL>
                <li>Find the item you want to move.</li>
                <li>Click the <strong>Move to…</strong> selector in that item's row.</li>
                <li>Select the destination category. The item moves immediately and all its details are preserved.</li>
              </OL>

              <H4>Working with categories</H4>
              <UL>
                <li><strong>Expand / collapse</strong> — click the category name or the disclosure chevron to show or hide its items.</li>
                <li><strong>Rename</strong> — double-click the category name, type the new name, and press Enter or click elsewhere.</li>
                <li><strong>Reorder</strong> — drag a category by its drag handle (the grip icon on the left side of its header) to a new position.</li>
                <li><strong>Base Weight setting</strong> — each category shows either <strong>+ Base</strong> or <strong>— Base</strong> in its header. Categories set to <strong>+ Base</strong> count toward your Base Weight. Categories set to <strong>— Base</strong> are shown separately in the Pack Summary and do not affect Base Weight — use this for worn clothing, food, water, or a dog pack.</li>
                <li><strong>Add Category</strong> — scroll to the bottom of the gear list and click <strong>Add Category</strong>. Type a name and confirm.</li>
                <li><strong>Delete a category</strong> — click the delete icon on the category header, then click <strong>Yes</strong> to confirm. All items in the category are removed. Click <strong>No</strong> to cancel.</li>
              </UL>
              <Note>
                Deleting a category removes all the items inside it. You can undo this
                immediately using the Undo button if you did not intend to delete it.
              </Note>
            </Sub>

            <Sub title="Trip-, Trail-, and Season-Specific Lists">
              <p>
                One gear setup does not fit every hike. A desert section of the Pacific
                Crest Trail calls for different gear than the Sierra Nevada. A warm-summer
                trip through the Appalachian Trail lowlands requires different clothing and
                shelter than a cold-spring or high-elevation outing. TrailWeigh lets you
                maintain separate named gear lists for each situation.
              </p>
              <p>
                Some examples of how hikers organize their lists:
              </p>
              <div className="bg-muted/40 rounded-lg px-4 py-3 space-y-1">
                {[
                  'PCT — Desert',
                  'PCT — Sierra',
                  'AT — Summer',
                  'AT — Cold Weather',
                  'CDT — Colorado',
                  'Weekend — Summer',
                  'Weekend — Winter',
                ].map(ex => (
                  <p key={ex} className="text-xs font-medium text-foreground/70">{ex}</p>
                ))}
              </div>
              <p>
                Gear that changes between conditions can include clothing layers, insulation,
                shelter type, rain protection, water-carrying capacity, traction devices,
                and other condition-specific equipment. TrailWeigh does not tell you what to
                carry — it simply keeps all your configurations organized and easy to revisit.
              </p>
              <p>
                <strong>Making a version of an existing list without replacing the original:</strong> use
                <strong> Save As</strong> to save a copy of the current gear list under a new name.
                The original list is not affected. See the <em>Save / Locker</em> section below
                for full Save As instructions.
              </p>
            </Sub>

          </MainSection>


          {/* ════════════════════════════════════════════════════════════════
              2. UNDERSTANDING YOUR PACK WEIGHT
              ════════════════════════════════════════════════════════════════ */}
          <MainSection id="weight" title="2. Understanding Your Pack Weight" isOpen={isOpen('weight')} onToggle={toggle}>

            <Sub title="A. Weight Totals">
              <H4>Base Weight</H4>
              <p>
                <strong>Base Weight</strong> is the total weight of the gear you physically
                carry in your pack — typically everything except consumables (food, water,
                fuel) and worn clothing. In TrailWeigh, Base Weight is calculated from all
                checked items in categories set to <strong>+ Base</strong>.
              </p>
              <p>
                Backpackers track Base Weight because it is the part of total carry weight
                that doesn't decrease as the trip progresses. Reducing Base Weight —
                choosing lighter gear — has a lasting effect on how much you carry every day.
              </p>

              <H4>Consumables and worn items — non-base categories</H4>
              <p>
                Categories set to <strong>— Base</strong> are excluded from Base Weight.
                These typically include:
              </p>
              <UL>
                <li><strong>Food and water</strong> — consumables that are used up during the trip.</li>
                <li><strong>Worn clothing</strong> — items on your body, not in the pack.</li>
                <li><strong>Dog pack or other carried loads</strong> — weight carried by someone else or in a separate system.</li>
              </UL>
              <p>
                TrailWeigh shows non-base categories individually in the Pack Summary so
                you always know where that weight is coming from, even though it doesn't
                factor into your Base Weight.
              </p>

              <H4>Grand Total</H4>
              <p>
                <strong>Grand Total</strong> is the combined weight of all checked items
                across every category — base and non-base. It represents your full carry
                weight at the start of a trip.
              </p>

              <H4>Weight and quantity</H4>
              <p>
                Each item has a <strong>weight</strong> and a <strong>Qty</strong> (quantity).
                TrailWeigh multiplies them to produce the <strong>Total</strong> for that row.
                The Pack Summary adds up all the row totals for checked items to produce your
                Base Weight, any non-base category subtotals, and Grand Total.
              </p>
              <p>
                Only checked items are included in any weight calculation. Unchecked items
                are present in your list but contribute zero weight to all totals.
              </p>
            </Sub>

            <Sub title="B. Weight Distribution">
              <p>
                The <strong>Weight Distribution</strong> display, located below Pack Summary,
                shows how your total checked pack weight is divided across your categories.
                Each category appears as a proportional segment in a distinct color.
              </p>
              <p>
                This gives you a quick visual sense of which categories dominate your
                carry weight. If Shelter is taking up half the chart, for example, that's
                a clear signal about where to focus if you want to cut pack weight.
              </p>
              <p>
                The chart updates in real time as you check, uncheck, add, or remove items.
                Categories with no checked items do not appear in the chart.
              </p>
            </Sub>

            <Sub title="C. Pack Summary">
              <p>
                The <strong>Pack Summary</strong> panel appears on the right side of the
                screen and updates in real time as you work on your gear list. It shows:
              </p>
              <UL>
                <li><strong>Base Weight</strong> — total weight of checked items in all categories set to + Base.</li>
                <li><strong>Non-base category weights</strong> — each category set to — Base appears below Base Weight as a separate labeled line (for example, "Worn Clothing" or "Dog Pack").</li>
                <li><strong>Grand Total</strong> — the sum of all checked items across every category.</li>
              </UL>
              <p>
                Items that are unchecked do not contribute to any of these totals. The
                summary reflects only the gear you have selected for the current trip.
              </p>
            </Sub>

          </MainSection>


          {/* ════════════════════════════════════════════════════════════════
              3. EDITING YOUR GEAR LIST
              ════════════════════════════════════════════════════════════════ */}
          <MainSection id="editing" title="3. Editing Your Gear List" isOpen={isOpen('editing')} onToggle={toggle}>

            <Sub title="A. Undo / Redo">
              <H4>Undo</H4>
              <p>
                <strong>Undo</strong> reverses the most recent change to your gear list —
                for example, restoring a deleted item, reversing a renamed category, or
                undoing a quantity change.
              </p>
              <UL>
                <li>Click the <strong>Undo</strong> button in the toolbar, or press <strong>Ctrl+Z</strong> (Windows/Linux) or <strong>⌘Z</strong> (Mac).</li>
                <li>Each click steps back one change. The Undo button is greyed out when there is no further history.</li>
              </UL>

              <H4>Redo</H4>
              <p>
                <strong>Redo</strong> re-applies a change that was reversed by Undo. It is
                only available after you have used Undo.
              </p>
              <UL>
                <li>Click the <strong>Redo</strong> button in the toolbar, or press <strong>Ctrl+Y</strong> (Windows/Linux) or <strong>⌘Y</strong> (Mac).</li>
                <li>Making a new edit after using Undo clears the redo history.</li>
              </UL>
              <Note>
                Undo and redo history is kept for the current session. Closing the browser
                tab clears the history. Your saved data in the Locker is not affected.
              </Note>
            </Sub>

            <Sub title="B. Open / Close Categories">
              <p>
                When your gear list grows, collapsing categories you're not actively editing
                keeps the screen easy to read.
              </p>
              <UL>
                <li>Click the <strong>Open</strong> button in the toolbar to expand all categories at once.</li>
                <li>Click the <strong>Close</strong> button to collapse all categories at once.</li>
                <li>To expand or collapse a single category, click its name or the disclosure chevron on the left side of its header.</li>
              </UL>
              <p>
                Collapsing a category does not remove or hide its items from the weight
                calculations — it only changes what you see on screen.
              </p>
            </Sub>

            <Sub title="C. Imperial / Metric">
              <p>
                Use the <strong>Imperial</strong> / <strong>Metric</strong> toggle in the
                toolbar to change the weight unit displayed throughout TrailWeigh.
              </p>
              <UL>
                <li><strong>Imperial</strong> — displays weights in ounces (oz) and pounds (lb).</li>
                <li><strong>Metric</strong> — displays weights in grams (g) and kilograms (kg).</li>
              </UL>
              <p>
                Switching units is display-only. Your underlying item weight data is
                preserved precisely and converted for display — switching back shows the
                same values accurately. No data is lost by switching between Imperial
                and Metric.
              </p>
            </Sub>

            <Sub title="D. Reset">
              <p>
                <strong>Reset</strong> removes all gear items from every category in your
                current working list. The categories themselves remain with their names
                and settings intact — only the items inside them are cleared.
              </p>
              <OL>
                <li>Click the <strong>Reset</strong> button in the toolbar.</li>
                <li>A confirmation prompt appears. Click <strong>Confirm</strong> to clear all items, or <strong>Cancel</strong> to go back without changing anything.</li>
              </OL>
              <Note>
                Reset only affects the current working list. Nothing in the Locker is
                changed. If you reset by mistake, use Undo immediately to restore the items.
              </Note>
            </Sub>

          </MainSection>


          {/* ════════════════════════════════════════════════════════════════
              4. SAVE / LOCKER
              ════════════════════════════════════════════════════════════════ */}
          <MainSection id="save" title="4. Save / Locker" isOpen={isOpen('save')} onToggle={toggle}>

            <Sub title="A. Save / Save As">
              <H4>Save</H4>
              <p>
                <strong>Save</strong> stores your current gear list — all items, weights,
                checked states, categories, background, and unit preference — to the Locker
                under a name you choose.
              </p>
              <OL>
                <li>Click the <strong>Save</strong> button in the toolbar.</li>
                <li>If this is a new list with no name yet, type a name in the field that appears, then click <strong>Save</strong>.</li>
                <li>If the list is already named, it saves immediately. A brief confirmation — <em>Saved [List Name]</em> — appears at the bottom of the screen.</li>
                <li>If the name already exists in your Locker, you are offered the choice to <strong>Replace</strong> the existing list, <strong>Save as New</strong> (keep the original and create a new copy), or go back.</li>
              </OL>

              <H4>Save As</H4>
              <p>
                <strong>Save As</strong> saves a copy of the current gear list under a new
                name without modifying the original saved list. This is useful when you want
                to make a version of an existing list for a different trip, trail section,
                or season.
              </p>
              <p>
                For example: you have <em>PCT — Desert</em> saved in your Locker. You want
                to create <em>PCT — Sierra</em> with different shelter and insulation.
                Open <em>PCT — Desert</em>, adjust the items, then use <strong>Save As</strong>
                to name and save it as <em>PCT — Sierra</em>. Your original
                <em> PCT — Desert</em> list is unchanged.
              </p>
              <OL>
                <li>Click the dropdown arrow on the <strong>Save</strong> button.</li>
                <li>Select <strong>Save As</strong>.</li>
                <li>Enter a new name for the copy and click <strong>Save</strong>.</li>
              </OL>
            </Sub>

            <Sub title="B. Locker">
              <p>
                The <strong>Locker</strong> stores all your named gear lists and is private
                to your signed-in account. Open the Locker panel by clicking the
                <strong> Locker</strong> heading on the right side of the screen.
              </p>

              <H4>Loading a saved list</H4>
              <OL>
                <li>Open the Locker panel.</li>
                <li>Click the load icon (folder icon) next to the list you want to open.</li>
                <li>The list opens in a new browser tab. Your current working list remains open in the original tab.</li>
              </OL>

              <H4>Renaming a saved list</H4>
              <OL>
                <li>Click the rename icon (pencil icon) next to the list.</li>
                <li>Edit the name in the field that appears.</li>
                <li>Click confirm to save the new name, or cancel to discard the change.</li>
              </OL>

              <H4>Deleting a saved list</H4>
              <OL>
                <li>Click the delete icon (trash icon) next to the list.</li>
                <li>A confirmation prompt appears. Click <strong>Yes</strong> to permanently delete the list, or <strong>No</strong> to cancel.</li>
              </OL>
              <Note>
                Deleting a list from the Locker is permanent. It cannot be recovered after
                you confirm. There is no password required to delete — just the Yes/No
                confirmation.
              </Note>
            </Sub>

          </MainSection>


          {/* ════════════════════════════════════════════════════════════════
              5. PREVIEW / PRINT / SHARE
              ════════════════════════════════════════════════════════════════ */}
          <MainSection id="share" title="5. Preview / Print / Share" isOpen={isOpen('share')} onToggle={toggle}>

            <Sub title="A. Preview">
              <p>
                <strong>Preview</strong> opens a clean, formatted view of your current gear
                list — organized by category with weights and totals clearly displayed.
                It gives you a chance to review the full list before printing or sharing.
              </p>
              <OL>
                <li>Click the <strong>Preview</strong> button in the toolbar.</li>
                <li>The preview opens over the gear list. Review your gear list as it will appear when printed.</li>
                <li>To close Preview, click the close button (✕) or click outside the preview panel.</li>
              </OL>
            </Sub>

            <Sub title="B. Print">
              <H4>Using your gear list as a packing checklist</H4>
              <p>
                A printed TrailWeigh gear list makes a practical physical packing checklist.
                Once you've built and selected your gear in TrailWeigh, printing gives you
                a reference you can use while gathering and packing your equipment.
              </p>
              <UL>
                <li>Work through the printed list while you physically pull gear from storage.</li>
                <li>Check items off on paper as you pack them.</li>
                <li>Use it for a final equipment check before leaving home or at the trailhead.</li>
              </UL>

              <H4>How to print</H4>
              <p>Print is accessed from inside Preview:</p>
              <OL>
                <li>Click <strong>Preview</strong> in the toolbar to open the preview.</li>
                <li>Click the <strong>Print</strong> button inside the preview.</li>
                <li>Your browser's standard print dialog opens. Select your printer settings and print.</li>
              </OL>
            </Sub>

            <Sub title="C. Share">
              <p>
                Click the <strong>Share</strong> button in the toolbar to open the Share
                menu. Three options are available:
              </p>

              <H4>Share Link — share all your saved lists</H4>
              <p>
                <strong>Share Link</strong> creates a link that gives the recipient access
                to a view-only version of all your saved Locker files at the time the
                link was created. The recipient sees a <strong>Shared Files</strong> panel
                listing your saved lists and can browse between them.
              </p>
              <UL>
                <li>Recipients can view and browse all the gear lists included in the share.</li>
                <li>Recipients can switch between Imperial and Metric in their view.</li>
                <li>Recipients can check items off temporarily while viewing — useful for working through a list while packing. These temporary check changes are never saved anywhere and reset if the page is refreshed.</li>
                <li>Recipients cannot edit, rename, or delete anything in your Locker.</li>
              </UL>
              <p>
                The share menu will remind you to save your current list first so the
                latest version is included in the shared snapshot.
              </p>

              <H4>Share Pack List — share a single checkable packing list</H4>
              <p>
                <strong>Share Pack List</strong> creates a link to the current list only —
                no Locker panel, just the single gear list in a clean, read-only view.
                The link is copied to your clipboard immediately.
              </p>
              <p>
                This is useful when you want to send someone a simple packing checklist
                to work from:
              </p>
              <UL>
                <li>A hiking partner can open the link and check items off as they pack their gear.</li>
                <li>Their checking is temporary — it only affects their own view and is never written back to your original list.</li>
                <li>Refreshing the page resets all temporary changes to the original state.</li>
                <li>The recipient can switch between Imperial and Metric in their view.</li>
                <li>The recipient can print the list directly from the shared view.</li>
              </UL>
              <p>
                The shared pack list captures your gear list at the moment the link is
                created. Changes you make to your list after that point are not reflected
                in the link — create a new link to share an updated version.
              </p>

              <H4>Download PDF</H4>
              <p>
                <strong>Download PDF</strong> generates a PDF file of the current gear
                list and downloads it to your device. This is useful for keeping an
                offline copy or sending a gear list as an attachment.
              </p>

              <Note>
                Share links do not require the recipient to have a TrailWeigh account.
                Anyone with the link can view the shared list. Keep that in mind before
                sharing a link that contains information you want to keep private.
              </Note>
            </Sub>

          </MainSection>


          {/* ════════════════════════════════════════════════════════════════
              6. BACKGROUNDS & DISPLAY
              ════════════════════════════════════════════════════════════════ */}
          <MainSection id="backgrounds" title="6. Backgrounds &amp; Display" isOpen={isOpen('backgrounds')} onToggle={toggle}>

            <Sub title="A. Background Themes">
              <p>
                Click <strong>Background Edit</strong> in the toolbar to open the Background
                panel. Use the theme selector dropdown to choose which collection of photos
                to browse.
              </p>
              <p>
                <strong>Landscapes</strong> is the built-in collection of TrailWeigh photos
                — ten outdoor scenes including Rocky Mountains, Swiss Alps, Pine Forest,
                Desert Dunes, Snowy Peaks, and more. Click any photo thumbnail to set it
                as your background.
              </p>
              <p>
                <strong>Custom themes</strong> are collections you create yourself. Open
                the theme dropdown and select <strong>Add Theme</strong> to create a new
                named collection. Switch between themes using the same dropdown.
              </p>
            </Sub>

            <Sub title="B. Add Your Own Photos">
              <p>
                Within any custom theme you have created, you can add your own photos:
              </p>
              <OL>
                <li>Open Background Edit and switch to your custom theme using the theme dropdown.</li>
                <li>Click <strong>Add Photo</strong> in the theme grid, or drag an image file directly onto the slot.</li>
                <li>TrailWeigh saves the photo locally to your browser. It is not uploaded to any server.</li>
                <li>Click the photo thumbnail to use it as your background.</li>
              </OL>
              <p>
                To remove a photo from a custom theme, hover over its thumbnail and click
                the delete control that appears. To remove an entire custom theme, open the
                theme dropdown and use the delete option for that theme.
              </p>
              <Note>
                Custom photos are stored in your browser's local storage on this device.
                They are not synced to other devices or browsers. If you clear your
                browser's site data, custom photos will be removed.
              </Note>
            </Sub>

            <Sub title="C. Fit / Fill">
              <p>
                Once a background photo is selected, choose how it is sized:
              </p>
              <UL>
                <li><strong>Fill Screen</strong> — the photo expands to cover the entire background area. If the photo's proportions don't match your screen, the edges are cropped. No empty space is left.</li>
                <li><strong>Fit Image</strong> — the entire photo is shown within the available area. If the photo's proportions don't match your screen, there may be unused space around the image.</li>
              </UL>
            </Sub>

            <Sub title="D. Showcase (Hide)">
              <p>
                <strong>Showcase</strong> mode hides the gear-list interface and shows your
                current background image in a full-screen view. This is useful when the
                screen will be visible but idle, or when you want to see the background
                without the application controls in the way.
              </p>
              <UL>
                <li>Click the <strong>Hide</strong> button in the toolbar to enter Showcase mode.</li>
                <li>To return to the gear list, click anywhere on the screen, press any key, or move the mouse.</li>
              </UL>
              <Note>
                Showcase does not close or save your list. Your gear list remains open
                in the background and returns exactly as you left it.
              </Note>
            </Sub>

            <Sub title="E. Light / Dark Tone and Fade">
              <p>
                Control how much the background photo shows through beneath the gear list:
              </p>
              <UL>
                <li>
                  <strong>Light / Dark tone</strong> — choose whether a light (white) or dark
                  overlay is applied on top of the photo. Use Light for photos where you want
                  the interface to stay on a bright background; use Dark for a moody or
                  low-light feel that helps text stand out.
                </li>
                <li>
                  <strong>Lighten / Darken slider</strong> — adjusts how strongly the overlay
                  is applied. Sliding toward 0% makes the overlay nearly invisible so the full
                  photo shows through. Sliding toward 100% makes the photo invisible and the
                  background becomes solid light or dark.
                </li>
              </UL>
              <p>
                These settings apply to the currently selected background and are saved
                with your gear list when you save to the Locker.
              </p>
            </Sub>

          </MainSection>

        </div>{/* end space-y-3 */}

        <div className="mt-10 bg-card border border-card-border rounded-xl p-5 shadow-sm text-sm text-muted-foreground leading-relaxed">
          <p>
            <strong className="text-foreground">Still stuck?</strong>{' '}
            If something isn't working the way you expect, visit{' '}
            <button
              onClick={() => navigate('/report-problem')}
              className="underline underline-offset-2 hover:text-foreground font-medium"
            >
              Report a Problem
            </button>{' '}
            for guidance on what to include when you get in touch.
          </p>
        </div>
    </>
  );
}

// ── Desktop page shell ────────────────────────────────────────────────────────

export default function HelpPage() {
  const basePath = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
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

        <HelpContent navigate={(path) => window.location.assign(basePath + path)} />
      </main>

      <Footer />
    </div>
  );
}
