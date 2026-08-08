/**
 * AboutPage.tsx — TrailWeigh About Page
 * Prompt 022D: Full accordion rewrite with philosophy/ultralight content.
 *
 * Structure:
 *   Visible introduction (always shown)
 *   Philosophy callout (always shown)
 *   12 accordion sections:
 *     1. What Is Ultralight?
 *     2. Ray-Way
 *     3. The Minimalist Mindset
 *     4. One Tool, Many Uses
 *     5. Think in Systems
 *     6. Knowledge Weighs Nothing
 *     7. Do You Hike for the Trail or the Camp?
 *     8. Hike Your Own Hike — HYOH
 *     9. Ultralight Is a Tool, Not a Contest
 *    10. Remember Why We're Here
 *    11. Respect the Trail—and Each Other
 *    12. Where TrailWeigh Fits In
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
       * Entire title row is the button — meeting the full-row clickable requirement.
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
          className="px-5 pb-7 border-t border-border"
        >
          <div className="pt-5 space-y-5 text-sm text-muted-foreground leading-relaxed">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pull quote ────────────────────────────────────────────────────────────────

function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <blockquote className="border-l-2 border-primary/40 pl-4 italic text-foreground/70 leading-relaxed">
      {children}
    </blockquote>
  );
}

// ── Philosophy callout (reusable) ─────────────────────────────────────────────

function PhilosophyCallout() {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 text-sm text-foreground/80 leading-relaxed font-medium">
      "Carry what you need.<br />
      Understand why you carry it.<br />
      Make each item earn its place."
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
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

        {/* ── Always-visible introduction ────────────────────────────────── */}
        <h1 className="text-3xl font-black text-foreground mb-5">About TrailWeigh</h1>

        <div className="space-y-4 text-foreground/80 leading-relaxed mb-6">
          <p>
            TrailWeigh helps you plan, organize, and understand what you're carrying.
          </p>
          <p>
            Build your gear list, organize equipment by category, track individual and
            total weights, and see where your pack weight comes from. TrailWeigh gives
            you the information to decide what belongs in your pack—and what might not.
          </p>
          <p>
            But a gear list isn't useful only for calculating weight.
          </p>
          <p className="font-semibold text-foreground">
            Your TrailWeigh list is also a checklist.
          </p>
          <p>
            Before a trip, use it to make sure everything you planned to bring actually
            makes it into your pack. Check items off as you gather and pack your gear,
            or print your completed checklist and use a paper copy while preparing at
            home or performing a final equipment check before leaving for the trail.
          </p>
          <p>
            A checklist can help prevent something far more frustrating than carrying an
            extra ounce: arriving at the trailhead and realizing an important piece of
            gear is still at home.
          </p>
          <p>
            TrailWeigh isn't here to tell you what to carry.
          </p>
          <p>
            We help you see what you're carrying, understand why you're carrying it, and
            make informed decisions for yourself.
          </p>
        </div>

        <PhilosophyCallout />

        {/* ── Accordion sections ─────────────────────────────────────────── */}
        <div className="mt-10 space-y-3">

          {/* 1. What Is Ultralight? */}
          <Section
            id="ultralight"
            title="What Is Ultralight?"
            isOpen={isOpen('ultralight')}
            onToggle={toggle}
          >
            <p>
              Ultralight backpacking is an approach to thoughtfully reducing carried
              weight so that hiking can be more comfortable, efficient, and enjoyable.
            </p>
            <p>
              You'll find commonly used base-weight categories referenced in the
              backpacking community—numbers that loosely distinguish "lightweight" from
              "ultralight." But those numbers are starting points, not official
              definitions. Ultralight is also a mindset: a way of evaluating gear before
              it goes into your pack.
            </p>
            <p>A few questions at the center of that mindset:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>Do I need this?</li>
              <li>Will I actually use it on this trip?</li>
              <li>Does something I already carry do the same job?</li>
              <li>Is there a simpler way to accomplish the same thing?</li>
            </ul>
            <p>
              Ultralight is not merely about buying lighter gear. Replacing every item
              with the lightest commercially available version is one path—but it can be
              expensive and isn't the only path.
            </p>
            <p>
              The goal is a thoughtful, efficient backpacking system suited to the
              individual hiker and the specific trip. For some trips and some hikers,
              that means a very light pack. For others, it means examining each item
              deliberately and deciding what's worth carrying. Both are useful habits.
            </p>
          </Section>

          {/* 2. Ray-Way */}
          <Section
            id="ray-way"
            title="Ray-Way"
            isOpen={isOpen('ray-way')}
            onToggle={toggle}
          >
            <p>
              Traveling light is not a new idea. Hikers, hunters, mountaineers, and
              scouts have been thinking about carried weight for as long as people have
              carried things on their backs.
            </p>
            <p>
              But in the modern backpacking world, few people have had more influence on
              how lightweight and ultralight hiking is understood than Ray Jardine.
            </p>

            <p className="font-semibold text-foreground">A background in climbing and engineering</p>
            <p>
              Before becoming widely known for lightweight backpacking, Ray Jardine was
              an engineer, inventor, and accomplished rock climber. In the 1970s he
              developed the Friend—a practical spring-loaded camming device that became
              highly influential in crack-climbing protection and is an important
              predecessor to the modern climbing cams in use today.
            </p>

            <p className="font-semibold text-foreground">Thousands of miles on the trail</p>
            <p>
              Ray and Jenny Jardine completed thousands of miles of long-distance hiking
              while experimenting with lighter homemade gear and simpler systems. From
              1987 through 1994 they logged more than 15,000 miles of long-distance
              hiking. By their 1993 Appalachian Trail thru-hike, they were using base
              packs below 10 pounds, excluding food and water.
            </p>
            <p>
              Jardine documented his developing ideas in{' '}
              <em>The PCT Hiker's Handbook</em>, whose early publication history began
              in 1991 and 1992. His writing developed further through{' '}
              <em>The Pacific Crest Trail Hiker's Handbook</em>,{' '}
              <em>Beyond Backpacking</em>, and{' '}
              <em>Trail Life</em>. His approach became widely known as the Ray-Way.
            </p>

            <p className="font-semibold text-foreground">A way of thinking</p>
            <p>
              Jardine encouraged hikers to question the conventional backpacking system
              rather than simply accept the standard gear list as given:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>Why am I carrying this?</li>
              <li>What job does it perform?</li>
              <li>Do I actually need it?</li>
              <li>Can something else perform the same job?</li>
              <li>Can several pieces work together as a system?</li>
              <li>Is there a simpler, effective solution?</li>
            </ul>
            <p>
              Ideas associated with modern ultralight backpacking—lightweight shelters,
              quilts, frameless or minimal-frame packs, homemade and cottage-made gear,
              multi-use equipment, simpler systems, and viewing the pack as an
              interconnected whole—were all discussed and demonstrated through his hiking
              and writing.
            </p>
            <p>
              Jardine did not invent traveling light, and the ultralight movement has
              many contributors. But his experimentation, his thousands of miles on
              long-distance trails, his gear design, and his writing played a major role
              in shaping how modern lightweight and ultralight backpacking is understood
              and practiced.
            </p>
          </Section>

          {/* 3. The Minimalist Mindset */}
          <Section
            id="minimalist"
            title="The Minimalist Mindset"
            isOpen={isOpen('minimalist')}
            onToggle={toggle}
          >
            <p>
              Minimalism, in the context of backpacking, is about intentionality—not
              deprivation.
            </p>
            <p>
              Gear lists tend to grow. Something goes in because you might need it.
              Something else because it adds a bit of comfort. Another item because it's
              always been in your pack. A backup for something you're not sure about. On
              their own, each addition can seem reasonable. Together, they can add
              substantial weight.
            </p>
            <p>A different approach:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>Start with what you actually need for this trip and expected conditions.</li>
              <li>Choose equipment deliberately.</li>
              <li>Look for unnecessary duplication.</li>
              <li>Question anything carried only from habit.</li>
              <li>Favor simple solutions when they work.</li>
              <li>Keep equipment that genuinely contributes to safety, comfort, or enjoyment.</li>
            </ul>
            <p>
              The goal isn't to go without. It's to make intentional choices rather
              than accumulating by default.
            </p>
            <PullQuote>
              "The goal isn't deprivation. The goal is simplicity with purpose."
            </PullQuote>
            <PullQuote>
              "Carry what you need. Understand why you carry it. Make each item earn its place."
            </PullQuote>
          </Section>

          {/* 4. One Tool, Many Uses */}
          <Section
            id="multi-use"
            title="One Tool, Many Uses"
            isOpen={isOpen('multi-use')}
            onToggle={toggle}
          >
            <p>
              One of the practical ideas at the center of ultralight thinking is
              multi-use equipment: asking, before adding something to your pack,
            </p>
            <PullQuote>
              "Can something I already carry do this job too?"
            </PullQuote>
            <p>A few familiar examples:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>A trekking pole used for hiking and for supporting certain shelters, eliminating the need for separate tent poles.</li>
              <li>A stuff sack filled with clothing that serves as a pillow at camp.</li>
              <li>A bandana that serves several functions—sun protection, trail marker, pot holder, filter, or first-aid backup.</li>
              <li>Clothing layers that work together across a temperature range instead of carrying a separate garment for every condition.</li>
              <li>A smartphone that replaces several separate electronics—navigation, camera, communication—for some hikers on some trips.</li>
            </ul>
            <p>
              Not every piece of equipment needs multiple uses. Some safety-critical
              gear should perform one important job very well, and that job alone is
              sufficient justification for carrying it. The principle is to think of
              your gear as a system and to avoid unnecessary duplication—not to force
              every item to justify itself through versatility.
            </p>
            <PullQuote>
              "Carry less by asking more of the things you choose to carry—not by giving up what you truly need."
            </PullQuote>
          </Section>

          {/* 5. Think in Systems */}
          <Section
            id="systems"
            title="Think in Systems"
            isOpen={isOpen('systems')}
            onToggle={toggle}
          >
            <p>
              Ultralight backpacking works best when equipment is evaluated as a system
              rather than one item at a time.
            </p>
            <p>
              Your shelter affects what stakes or poles you carry. Your sleeping gear
              interacts with your shelter and your clothing. Your clothing layers work
              together across conditions rather than each one operating independently.
              Your water capacity depends on the route, season, and the distances between
              reliable sources. A lighter, more compact gear system may allow you to use
              a smaller, lighter backpack—which creates further savings.
            </p>
            <p>
              Reducing weight isn't always about replacing an item with a lighter version
              of the same thing. Sometimes the better question is:
            </p>
            <PullQuote>
              "Do I need this item at all, or can the rest of my system already perform its job?"
            </PullQuote>
            <p>
              Seeing your gear organized by category—and its weight laid out clearly—can
              make it easier to ask that question with real information in front of you.
            </p>
          </Section>

          {/* 6. Knowledge Weighs Nothing */}
          <Section
            id="knowledge"
            title="Knowledge Weighs Nothing"
            isOpen={isOpen('knowledge')}
            onToggle={toggle}
          >
            <p>
              Experience and skills can meaningfully influence what equipment a hiker
              needs to carry—and what can safely be left behind.
            </p>
            <p>
              Knowledge of weather patterns can help you plan for conditions rather than
              carry redundant gear for every possible scenario. Skill at campsite
              selection can reduce reliance on certain shelter features. Understanding
              layering means you can do more with fewer garments. Water management
              knowledge affects how much you need to carry between sources. Navigation
              confidence can reduce the backup tools you feel you need. Experience with
              food and resupply affects how much you're carrying on any given day.
              Familiarity with terrain, equipment, and your own physical needs all
              contribute to more accurate decisions about what belongs in your pack.
            </p>
            <p>
              This doesn't mean experience eliminates the need for reasonable safety
              equipment. Weather changes. Equipment fails. Water sources can dry up or
              become inaccessible. Trips differ, seasons differ, and hikers have
              different physical needs, fitness levels, and experience with specific
              conditions. The goal is better judgment, not a lower number regardless
              of circumstances.
            </p>
            <p>
              Sometimes the right choice is to leave something behind. Sometimes the
              right choice is to carry more. Good information—about the route,
              conditions, your equipment, and your own abilities—is the foundation for
              making that call well.
            </p>
            <PullQuote>
              "Good judgment matters more than a number on a scale."
            </PullQuote>
          </Section>

          {/* 7. Do You Hike for the Trail or the Camp? */}
          <Section
            id="trail-or-camp"
            title="Do You Hike for the Trail or the Camp?"
            isOpen={isOpen('trail-or-camp')}
            onToggle={toggle}
          >
            <p>
              Among backpackers, you'll sometimes hear a distinction between those who
              hike for the trail and those who hike for the camp. Neither is wrong.
            </p>
            <p>
              Some hikers spend most of their day moving—covering miles, climbing passes,
              descending into valleys, exploring new country. For them, the walking is a
              central part of the experience, and a lighter pack makes that walking more
              enjoyable. Every ounce saved is felt over the course of a long day or a
              long trail.
            </p>
            <p>
              Other hikers place more importance on what happens after they stop. They
              arrive earlier, cook a real meal, bring a chair to sit in, fish, read,
              photograph the light at dusk, or simply relax somewhere beautiful. For
              them, camp comfort is a meaningful part of why they're out there—and they
              may willingly carry more equipment because it contributes directly to what
              they came for.
            </p>
            <p>
              Many hikers fall somewhere between the two, and the same hiker may
              approach different trips differently—a long thru-hike is different from a
              weekend at a lakeside camp.
            </p>
            <PullQuote>"Neither approach is wrong."</PullQuote>
            <p>
              The important question isn't: <em>What should a backpacker carry?</em>
            </p>
            <p>
              It is: <em>What makes this trip enjoyable for me?</em>
            </p>
          </Section>

          {/* 8. Hike Your Own Hike — HYOH */}
          <Section
            id="hyoh"
            title="Hike Your Own Hike — HYOH"
            isOpen={isOpen('hyoh')}
            onToggle={toggle}
          >
            <p>
              HYOH—Hike Your Own Hike—is a familiar idea in long-distance hiking
              communities. At its core it means: there is no single correct way to
              experience a trail.
            </p>
            <p>
              Gear should reflect the particular trip, your experience, your abilities,
              the expected conditions, your personal needs, and what makes the trip
              genuinely enjoyable for you.
            </p>
            <p>
              One person sleeps on a foam pad and carries no-cook meals, keeps a high
              daily mileage, and finishes their season with an intact budget. Another
              person carries a heavier inflatable mattress, makes hot meals, spends an
              extra afternoon beside a lake, and comes home just as satisfied with their
              trip. Neither person is automatically doing it wrong. There is no single
              perfect gear list.
            </p>
            <PullQuote>
              "There is the gear that works for you, on this trip, under these conditions."
            </PullQuote>
            <p>
              HYOH does not mean ignoring safety, regulations, wildlife, environmental
              impact, or other trail users. Choosing your own approach to hiking is
              separate from your responsibilities to the land and to everyone else who
              uses it.
            </p>
            <PullQuote>
              "Your hike is your own. The trail is shared."
            </PullQuote>
          </Section>

          {/* 9. Ultralight Is a Tool, Not a Contest */}
          <Section
            id="tool-not-contest"
            title="Ultralight Is a Tool, Not a Contest"
            isOpen={isOpen('tool-not-contest')}
            onToggle={toggle}
          >
            <p>
              Reducing pack weight can reduce physical burden, improve comfort, make
              movement easier and more efficient, allow some hikers to travel farther or
              faster, and simply make hiking more enjoyable. These are real benefits, and
              they're worth pursuing when they align with your goals.
            </p>
            <p>
              But weight should not become the purpose of backpacking—and a lower number
              on a scale is not inherently more virtuous than a higher one.
            </p>
            <PullQuote>"Ultralight is a tool, not a contest."</PullQuote>
            <p>
              Another person's base weight doesn't determine whether your gear list is
              right or wrong for your trip. Carrying less should not become an excuse to
              criticize others for carrying more. Lighter doesn't automatically mean
              better. The best choice is the equipment that safely and reliably performs
              the job the hiker needs it to perform—on this trail, in these conditions,
              for this person.
            </p>
            <p>
              Sometimes lighter is the appropriate answer. Sometimes carrying more is the
              appropriate answer. The decision belongs to the person carrying the pack.
            </p>
          </Section>

          {/* 10. Remember Why We're Here */}
          <Section
            id="why-here"
            title="Remember Why We're Here"
            isOpen={isOpen('why-here')}
            onToggle={toggle}
          >
            <p>
              Ounces and grams, spreadsheets and gear lists, base weights and pack
              weights, forums and gear comparisons—all of these can be interesting and
              useful. But they are not the reason people go outside.
            </p>
            <p>
              The reason is harder to put on a scale:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>Sunrise over a ridge, light changing by the second.</li>
              <li>Water moving through a canyon you've never seen before.</li>
              <li>Walking beneath trees that were old before anyone thought to measure them.</li>
              <li>Crossing a mountain pass and seeing what's on the other side.</li>
              <li>Sleeping beneath the stars without a ceiling in the way.</li>
              <li>The particular kind of quiet that comes with real solitude.</li>
              <li>Sharing a trail with friends, family, strangers who become friends, or a four-legged hiking partner who has no idea how many miles they've done.</li>
              <li>Not knowing what's around the next bend, and finding out.</li>
            </ul>
            <PullQuote>"We go outside to be outside."</PullQuote>
            <p>
              Gear should help make those experiences possible. The moment it starts
              feeling more important than the experiences themselves—more time spent
              optimizing than actually hiking—it may be worth stepping back and
              remembering what all of it is for.
            </p>
          </Section>

          {/* 11. Respect the Trail—and Each Other */}
          <Section
            id="respect"
            title="Respect the Trail—and Each Other"
            isOpen={isOpen('respect')}
            onToggle={toggle}
          >
            <p>
              Outdoor spaces are shared by people with different backgrounds, abilities,
              equipment, experience levels, hiking speeds, goals, and reasons for being
              there. The trail doesn't belong to any one type of hiker.
            </p>
            <p>
              Taking care of it—and of each other—looks like:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>Respect for the land and for wildlife.</li>
              <li>Following rules and regulations that protect access for everyone.</li>
              <li>Proper waste disposal and leaving what you find.</li>
              <li>Minimizing your impact on terrain, water sources, and vegetation.</li>
              <li>Consideration for other visitors—on the trail and in camp.</li>
            </ul>
            <PullQuote>
              "We don't all need to hike the same way to appreciate the same trail."
            </PullQuote>
            <PullQuote>
              "Hike your own hike—and respect everyone else's opportunity to hike theirs."
            </PullQuote>
          </Section>

          {/* 12. Where TrailWeigh Fits In */}
          <Section
            id="trailweigh-fits"
            title="Where TrailWeigh Fits In"
            isOpen={isOpen('trailweigh-fits')}
            onToggle={toggle}
          >
            <p>
              TrailWeigh is not here to decide what belongs in your backpack. It's here
              to give you the information to make that decision yourself.
            </p>
            <p>
              Organizing your gear and seeing weights by category can reveal things that
              might otherwise stay invisible:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>An item you no longer need for this particular trip.</li>
              <li>Unnecessary duplication—two things doing one job.</li>
              <li>Two items that could potentially be replaced by one piece that does both jobs.</li>
              <li>A change in one part of your system that allows something else to be simplified.</li>
              <li>A heavier item that, after seeing exactly what it weighs, you deliberately decide is worth carrying.</li>
            </ul>
            <p>That last one matters:</p>
            <PullQuote>
              "Maybe a heavier piece of equipment is important enough that, after seeing exactly what it weighs, you decide: It's worth it."
            </PullQuote>
            <p>
              That's a real and valid outcome. The point of having good information is
              not to force a particular answer—it's to make the answer yours.
            </p>
            <div className="pt-2 space-y-3">
              <PullQuote>
                "Because the goal isn't the lightest possible pack.{' '}
                The goal is a pack that works for you and helps you enjoy whatever brought you to the trail."
              </PullQuote>
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 text-sm text-foreground/80 leading-relaxed font-medium">
                "Carry what you need.<br />
                Understand why you carry it.<br />
                Make each item earn its place."
              </div>
              <p className="text-base font-bold text-foreground text-center pt-2">
                Then go outside.
              </p>
            </div>
          </Section>

        </div>{/* end accordion */}

        {/* ── Footer nav ─────────────────────────────────────────────────── */}
        <div className="mt-10 bg-card border border-card-border rounded-xl p-5 shadow-sm text-sm text-muted-foreground leading-relaxed">
          <p>
            For step-by-step instructions on using any feature, visit{' '}
            <Link to="/help" className="underline underline-offset-2 hover:text-foreground font-medium">
              Help &amp; How-To
            </Link>.
            To report a problem or get in touch, see{' '}
            <Link to="/contact" className="underline underline-offset-2 hover:text-foreground font-medium">
              Contact Us
            </Link>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
