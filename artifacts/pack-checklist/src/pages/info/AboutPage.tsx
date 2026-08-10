/**
 * AboutPage.tsx — TrailWeigh About Page
 * Prompt 022L: Complete content rewrite + Sources & References modal.
 *
 * Final structure:
 *   About TrailWeigh — Introduction
 *
 *   MENTAL / PHYSICAL / SPIRITUAL  (section label)
 *   1.  Remember Why We're Here
 *   2.  Mind — Mental & Emotional Benefits
 *   3.  Body — Physical Benefits
 *   4.  Spirit — Awe, Connection & Meaning
 *
 *   HIKING PHILOSOPHY  (section label)
 *   5.  Do You Hike for the Trail or the Camp?
 *   6.  Hike Your Own Hike — HYOH
 *   7.  Respect the Trail—and Each Other
 *
 *   ULTRALIGHT  (section label)
 *   8.  What Is Ultralight?
 *   9.  Ultralight Is a Tool, Not a Contest
 *   10. The Minimalist Mindset
 *   11. Ray-Way
 *   12. Knowledge Weighs Nothing
 *   13. Think in Systems
 *   14. One Tool, Many Uses
 *
 *   TRAILWEIGH  (section label)
 *   15. Where TrailWeigh Fits In
 *   16. About the Creator
 *   17. Credits
 *
 *   Sources & References link → modal
 *   Help & How-To / Contact card
 */
import React, { useState, useCallback } from 'react';
import { Link } from 'wouter';
import { Tent, ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import Footer from '@/components/Footer';
import SourcesModal from '@/components/SourcesModal';

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

// ── Non-collapsible section label ─────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground/60 pt-6 pb-1 px-1 select-none">
      {children}
    </p>
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

// ── Inline sub-heading (non-bold label inside an accordion body) ───────────────

function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-semibold text-foreground text-sm pt-1">{children}</p>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const { toggle, isOpen } = useAccordion();

  // Sources & References modal state (page-level; footer has its own)
  const [sourcesOpen, setSourcesOpen]   = useState(false);
  const [scrollToRef, setScrollToRef]   = useState<string | null>(null);

  /** Open the Sources modal and optionally scroll to a specific reference. */
  function openSources(refId?: string) {
    setScrollToRef(refId ?? null);
    setSourcesOpen(true);
  }

  /** Clickable inline citation marker  e.g. [1] */
  function Cite({ n }: { n: number }) {
    return (
      <sup>
        <button
          onClick={() => openSources(`ref-${n}`)}
          className="text-[11px] text-primary hover:underline ml-0.5 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
          title={`Reference ${n} — click to view sources`}
          aria-label={`Reference ${n}`}
        >
          [{n}]
        </button>
      </sup>
    );
  }

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

        <div className="space-y-4 text-foreground/80 leading-relaxed mb-8">
          <p>
            TrailWeigh is built around a simple idea: what we carry should support why
            we went outside in the first place. It gives you a place to plan your gear,
            organize it into a system, and understand where the weight comes from.
          </p>
          <p>
            A lighter pack can make long miles easier, but the number on a scale is not
            the destination. Gear is a tool. Knowledge is a tool. TrailWeigh is a tool.
          </p>
          <p>
            The real goal might be adventure, solitude, challenge, friendship, discovery,
            healing, a mountaintop sunrise, a quiet camp beside a stream—or simply seeing
            what is around the next bend.
          </p>
          <p className="font-medium text-foreground">
            Carry what you need. Understand why you carry it. Make each item earn its place.
          </p>
        </div>

        {/* ── Accordion sections ─────────────────────────────────────────── */}
        <div className="space-y-3">

          {/* ═══════════════════════════════════════════════════════════════ */}
          <SectionLabel>Mental / Physical / Spiritual</SectionLabel>

          {/* 1. Remember Why We're Here */}
          <Section
            id="why-here"
            title="Remember Why We're Here"
            isOpen={isOpen('why-here')}
            onToggle={toggle}
          >
            <p>
              It is surprisingly easy for backpacking to become about gear.
            </p>
            <p>
              We compare ounces, fabrics, shelters, shoes, quilts, stoves, electronics and
              base weights. We build spreadsheets. We study specifications. We search for
              the next item that might save another few grams.
            </p>
            <p>
              Those things can be useful. They can also become the focus instead of the
              means.
            </p>
            <p>
              The backpack exists to carry what helps us safely experience the trail. The
              trail does not exist to give us somewhere to carry the backpack.
            </p>
            <p>
              For one person, being outside means covering thirty miles in a day. For
              another, it means walking six miles and spending the afternoon beside a lake.
              It can mean solitude or companionship, challenge or peace, exploration or
              returning to a place that feels familiar.
            </p>
            <p>Sometimes the most important thing we can do is remember why we came.</p>
            <p>Look up.</p>
            <p>Listen.</p>
            <p>Notice where you are.</p>
            <p>
              The goal of the pack is to help make those experiences possible—not to
              compete with them.
            </p>
            <p>
              The lightest pack in the world has little value if we become so consumed by
              equipment, mileage or numbers that we forget to experience the place we
              worked so hard to reach.
            </p>
          </Section>

          {/* 2. Mind — Mental & Emotional Benefits */}
          <Section
            id="mind"
            title="Mind — Mental & Emotional Benefits"
            isOpen={isOpen('mind')}
            onToggle={toggle}
          >
            <p>
              There is something many hikers recognize intuitively: our minds can feel
              different outside.
            </p>
            <p>
              Research increasingly supports parts of that experience. Studies of nature
              exposure and exercise in natural settings have found benefits involving
              well-being, positive mood, negative affect and stress, although results vary
              by study, population and type of exposure.<Cite n={1} /><Cite n={2} /> A systematic
              review of cognitive research also found improvements after nature exposure in
              areas including working memory and cognitive flexibility, with less consistent
              effects on attentional control.<Cite n={3} />
            </p>
            <p>
              A trail asks for a different kind of attention than much of modern life.
              Instead of notifications, schedules and constant streams of information,
              attention turns toward terrain, weather, water, navigation, changing light,
              the sound of wind through trees and the rhythm of walking.
            </p>
            <p>
              That does not mean every hike is peaceful. Backpacking can be uncomfortable,
              frustrating, frightening and exhausting. But even those experiences can
              create opportunities for perspective, problem-solving and confidence.
            </p>
            <p>There is also value in mental space.</p>
            <p>
              A long walk can provide time to think without requiring an immediate answer.
              Solitude can create room for reflection. Hiking with someone else can create
              conversations that rarely happen in ordinary surroundings. Completing a
              difficult climb, navigating an unexpected problem or simply continuing when
              the day becomes hard can produce a genuine sense of accomplishment.
            </p>
            <p>
              Nature is not a cure-all, and time outdoors is not a replacement for
              appropriate medical or mental-health care. Research describes tendencies and
              outcomes observed across groups—not guarantees for every individual.
            </p>
            <p>
              But for many people, going outside can be one meaningful part of a healthy
              mental and emotional life.
            </p>
            <p>
              Sometimes we go into the wilderness to see the world more clearly. Sometimes
              we come back seeing ourselves more clearly.
            </p>
          </Section>

          {/* 3. Body — Physical Benefits */}
          <Section
            id="body"
            title="Body — Physical Benefits"
            isOpen={isOpen('body')}
            onToggle={toggle}
          >
            <p>Hiking is movement, and movement matters.</p>
            <p>
              Walking for hours, climbing grades, descending uneven terrain, stepping over
              rocks and roots, balancing, carrying a pack and repeating those movements day
              after day challenge the cardiovascular system, muscles, bones, balance and
              coordination.
            </p>
            <p>
              Regular physical activity is associated with better cardiovascular health,
              stronger bones and muscles, improved sleep, reduced risk of several chronic
              diseases and better functional ability.<Cite n={4} /> The difficulty of an individual
              hike—and therefore the physical demand—depends on terrain, elevation, pace,
              pack weight, weather, altitude and the individual doing it.
            </p>
            <p>
              There may also be benefits associated with the environment in which we move,
              not only the exercise itself.
            </p>
            <p>
              A systematic review and meta-analysis covering more than 100 million people
              found greater green-space exposure associated with modestly lower measures of
              cardiovascular disease risk.<Cite n={5} /> Forest-therapy research has also reported
              short-term changes in blood pressure and the stress hormone cortisol, although
              study quality and results vary and the mechanisms remain under
              investigation.<Cite n={6} /><Cite n={7} /> Research on green-space exposure and sleep
              has similarly found generally favorable associations, while noting substantial
              differences among studies.<Cite n={8} />
            </p>

            <SubHead>We Are Ecosystems, Too</SubHead>
            <p>
              One of the more fascinating areas of newer research concerns the relationship
              between environmental biodiversity, microorganisms and human health.
            </p>
            <p>
              The human body does not exist in biological isolation. We live with vast
              communities of microorganisms on and within us, and those microbial
              communities interact with normal immune and physiological processes.
            </p>
            <p>
              Researchers are studying whether contact with biologically diverse
              environments can influence the human microbiome and immune regulation. A
              2024 systematic review of green-space exposure and human microbiota found
              intriguing but mixed results.<Cite n={9} /> A broader biodiversity-and-health review
              judged evidence for an environmental microbiota–human health pathway to be
              moderate, while emphasizing that important questions about causation and
              mechanisms remain unanswered.<Cite n={10} /> A separate systematic review found
              promising immune-related findings from nature exposure but also highlighted
              weaknesses in study design and uncertainty about effect size and duration.<Cite n={11} />
            </p>
            <p>
              That is a more interesting conclusion than claiming that "being in a forest
              boosts your immune system."
            </p>
            <p>
              The emerging picture is that human health and environmental health may be
              connected through more pathways than we once understood—and science is still
              working out the details.
            </p>
          </Section>

          {/* 4. Spirit — Awe, Connection & Meaning */}
          <Section
            id="spirit"
            title="Spirit — Awe, Connection & Meaning"
            isOpen={isOpen('spirit')}
            onToggle={toggle}
          >
            <p>
              Here, spirit does not mean adherence to any particular religion.
            </p>
            <p>
              It means the part of human experience concerned with wonder, meaning,
              humility, gratitude, belonging, connection and the feeling that we are part
              of something larger than ourselves.
            </p>
            <p>
              One person may understand that feeling through God or faith. Another may call
              it spirituality. Someone else may describe it as awe, consciousness, ecology,
              interconnectedness or simply a deep love of the natural world.
            </p>
            <p>Some may feel it strongly without giving it any name at all.</p>
            <p>TrailWeigh does not choose among those interpretations.</p>

            <SubHead>Awe</SubHead>
            <p>
              There is, however, science behind part of the experience.
            </p>
            <p>
              Psychologists study awe as an emotional response to something perceived as
              vast enough to challenge our ordinary frame of reference.
            </p>
            <p>
              That vastness can be physical—a mountain, an ancient forest, a night sky—or
              conceptual.
            </p>
            <p>
              In a series of experiments, researchers found that awe could produce what
              they called the "small self": a temporary reduction in the prominence of
              one's individual concerns relative to something larger. It was also
              associated in those experiments with greater generosity and prosocial
              behavior. In one study, researchers induced awe simply by placing
              participants among towering trees.<Cite n={12} /> Later experimental work has found
              connections between awe, a sense of global citizenship and greater valuing
              of interconnectedness.<Cite n={13} />
            </p>
            <p>"Small self" does not mean insignificant or worthless.</p>
            <p>It is closer to the experience many hikers know well:</p>
            <p>Standing on a ridge and seeing mountains continue beyond the horizon.</p>
            <p>Looking into a night sky so clear that the Milky Way becomes unmistakable.</p>
            <p>Walking beneath trees that were alive centuries before we were born.</p>
            <p>Watching a storm travel across a landscape too large to comprehend all at once.</p>
            <p>For a moment, our problems may not disappear—but their scale can change.</p>

            <SubHead>Connected to Nature</SubHead>
            <p>
              Psychologists also study nature connectedness: the degree to which people
              experience themselves as related to, or part of, the natural world.
            </p>
            <p>
              A meta-analysis involving more than 8,500 participants found a modest
              positive relationship between nature connectedness and measures including
              positive affect, vitality and life satisfaction.<Cite n={14} /> Another meta-analysis
              involving more than 13,000 participants found a substantial association
              between nature connectedness and pro-environmental behavior.<Cite n={15} /> Global
              research has similarly examined human–nature connectedness as a potential
              pathway toward both human well-being and environmental stewardship.<Cite n={16} />
            </p>
            <p>There is also an important idea emerging within the science itself.</p>
            <p>
              A 2025 review argued that nature-connectedness research benefits from moving
              away from a "humans over here, nature over there" view and toward a
              human-ecological perspective that recognizes humans as part of nature.<Cite n={17} />
            </p>
            <p>Biologically and ecologically, that is not merely poetry.</p>
            <p>
              The oxygen we breathe participates in biological and atmospheric cycles. Our
              food ultimately comes from living systems. Water moves through us and back
              into the world. Elements in our bodies came from the Earth and will return to
              it. Our microbiomes are communities of other organisms. Our biological
              clocks respond to environmental light and darkness.
            </p>
            <p>We are not merely surrounded by nature. We are part of it.</p>
            <p>
              Science can describe many of those physical, ecological and psychological
              connections. It cannot establish that they prove a universal spirit, divine
              consciousness or any other metaphysical belief.
            </p>
            <p>What those connections mean is a personal question.</p>

            <SubHead>Different Ways of Expressing Connection</SubHead>
            <p>Different traditions have expressed that question in different ways:</p>

            <div className="space-y-4 my-3">
              <blockquote className="border-l-2 border-muted pl-4 text-foreground/80 leading-relaxed">
                <p className="italic">
                  "When we try to pick out anything by itself, we find it hitched to everything
                  else in the Universe."
                </p>
                <footer className="mt-1 text-xs text-muted-foreground not-italic">
                  — John Muir, <em>My First Summer in the Sierra</em>, 1911
                  {' '}<Cite n={18} />
                </footer>
              </blockquote>

              <blockquote className="border-l-2 border-muted pl-4 text-foreground/80 leading-relaxed">
                <p className="italic">
                  "Man takes his law from the Earth; the Earth takes its law from Heaven."
                </p>
                <footer className="mt-1 text-xs text-muted-foreground not-italic">
                  — Tao Te Ching, Chapter 25, James Legge translation
                  {' '}<Cite n={19} />
                </footer>
              </blockquote>

              <blockquote className="border-l-2 border-muted pl-4 text-foreground/80 leading-relaxed">
                <p className="italic">
                  "The earth is the LORD's, and the fulness thereof."
                </p>
                <footer className="mt-1 text-xs text-muted-foreground not-italic">
                  — Psalm 24:1, King James Version
                  {' '}<Cite n={20} />
                </footer>
              </blockquote>

              <blockquote className="border-l-2 border-muted pl-4 text-foreground/80 leading-relaxed">
                <p className="italic">
                  "May all beings be happy!"
                </p>
                <footer className="mt-1 text-xs text-muted-foreground not-italic">
                  — Kara&#7751;&#299;ya Mett&#257; Sutta, Sutta Nip&#257;ta 1.8,
                  translation by Acharya Buddharakkhita
                  {' '}<Cite n={21} />
                </footer>
              </blockquote>
            </div>

            <p>
              These traditions are not being presented as saying the same thing, and
              religious quotations are not scientific evidence. They are examples of
              something human beings across cultures and centuries have repeatedly tried to
              describe: our relationship with the world around us and with one another.
            </p>
            <p>The trail gives us room to consider that relationship for ourselves.</p>
          </Section>

          {/* ═══════════════════════════════════════════════════════════════ */}
          <SectionLabel>Hiking Philosophy</SectionLabel>

          {/* 5. Do You Hike for the Trail or the Camp? */}
          <Section
            id="trail-or-camp"
            title="Do You Hike for the Trail or the Camp?"
            isOpen={isOpen('trail-or-camp')}
            onToggle={toggle}
          >
            <p>
              There are hikers who wake before sunrise, start walking and happily remain on
              the trail until evening. Camp is where they eat, recover and sleep before
              doing it again.
            </p>
            <p>
              There are hikers who love the destination as much as the journey. They may
              carry a more comfortable pad, camp shoes, a chair, photography equipment,
              fishing gear, a book or something else that makes camp part of the
              experience.
            </p>
            <p>And there are plenty of us somewhere in between.</p>
            <p>Neither approach is inherently better.</p>
            <p>
              A piece of gear that seems unnecessary to one hiker may be one of the things
              another person enjoys most about the trip.
            </p>
            <p>That leads to a better question than:</p>
            <PullQuote>"Should I carry this?"</PullQuote>
            <p>Ask:</p>
            <PullQuote>
              "What makes this trip enjoyable for me—and is this item worth carrying for
              that experience?"
            </PullQuote>
            <p>
              Ultralight thinking is most useful when it helps you make that choice
              intentionally.
            </p>
          </Section>

          {/* 6. Hike Your Own Hike — HYOH */}
          <Section
            id="hyoh"
            title="Hike Your Own Hike — HYOH"
            isOpen={isOpen('hyoh')}
            onToggle={toggle}
          >
            <p>There is no perfect gear list.</p>
            <p>
              A system that works beautifully for one hiker may be miserable—or unsafe—for
              another.
            </p>
            <p>
              The right equipment can change with the trail, season, altitude, weather,
              water availability, expected temperatures, terrain, trip length, experience,
              physical ability, comfort priorities and personal tolerance for risk.
            </p>
            <p>
              A Pacific Crest Trail desert list may look different from a Sierra list. A
              summer setup may look very different from one intended for shoulder season
              or winter. One hiker may sleep comfortably with equipment another person
              cannot tolerate.
            </p>
            <p>That is the useful part of Hike Your Own Hike—HYOH.</p>
            <p>It gives people permission to think for themselves.</p>
            <p>
              But HYOH does not mean that nothing matters beyond personal preference.
            </p>
            <p>
              Safety still matters. Regulations still matter. Wildlife protection matters.
              Fire restrictions matter. Leave No Trace principles matter. Other hikers
              matter.
            </p>
            <PullQuote>Your hike is your own. The trail is shared.</PullQuote>
          </Section>

          {/* 7. Respect the Trail—and Each Other */}
          <Section
            id="respect"
            title="Respect the Trail—and Each Other"
            isOpen={isOpen('respect')}
            onToggle={toggle}
          >
            <p>The freedom we enjoy outdoors comes with responsibility.</p>
            <p>
              We enter places that existed before us and will remain after we leave.
              Wildlife lives there. Plants grow there. Water flows downstream to someone or
              something else. Other people came for their own experience of the same place.
            </p>
            <p>Respect can be remarkably simple.</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>Leave a campsite better than you found it.</li>
              <li>Protect water sources.</li>
              <li>Store food appropriately.</li>
              <li>Respect wildlife instead of turning animals into entertainment.</li>
              <li>Follow fire restrictions even when they are inconvenient.</li>
              <li>Handle waste disposal properly—pack out what you bring in.</li>
              <li>Minimize your impact on the land and on other visitors.</li>
              <li>Give people room to experience the trail differently than you do.</li>
              <li>Know the rules of the land you are traveling through.</li>
            </ul>
            <p>
              We don't all need to hike the same way to appreciate the same trail.
            </p>
            <p>HYOH works best when it is paired with another idea:</p>
            <PullQuote>
              Hike your own hike—and respect everyone else's opportunity to do the same.
            </PullQuote>
            <PullQuote>
              Enjoy the trail in your own way without unnecessarily diminishing someone
              else's ability to enjoy it—or the ability of the land itself to endure us.
            </PullQuote>
          </Section>

          {/* ═══════════════════════════════════════════════════════════════ */}
          <SectionLabel>Ultralight</SectionLabel>

          {/* 8. What Is Ultralight? */}
          <Section
            id="ultralight"
            title="What Is Ultralight?"
            isOpen={isOpen('ultralight')}
            onToggle={toggle}
          >
            <p>
              At its simplest, ultralight backpacking is an approach to traveling outdoors
              with less unnecessary weight.
            </p>
            <p>Backpackers often discuss several kinds of weight.</p>
            <p>
              Base weight generally means the weight of the equipment carried in the pack
              before variable consumables such as food and water.
            </p>
            <p>
              Consumables are things whose weight changes during the trip—food, water, fuel
              and similar supplies.
            </p>
            <p>
              Worn weight is equipment worn or carried on the body rather than stored in
              the pack.
            </p>
            <p>
              You will sometimes see particular numbers used to define "ultralight." Those
              numbers can be useful reference points, but they are not laws.
            </p>
            <p>
              A safe and appropriate pack for a hot desert trip may be very different from
              one for cold mountains. A person with specialized equipment, medical needs,
              photography gear, dog equipment or other requirements may have entirely
              different priorities.
            </p>
            <p>The more important principle is not:</p>
            <PullQuote>"How do I get below a particular number?"</PullQuote>
            <p>It is:</p>
            <PullQuote>"Why am I carrying each thing?"</PullQuote>
            <p>
              Reducing unnecessary weight can make walking more comfortable, decrease the
              effort required to move the pack and allow equipment to work together more
              efficiently.
            </p>
            <p>
              Ultralight is not merely about buying lighter gear—it is a mindset about
              understanding why each item is carried.
            </p>
            <p>
              Useful questions before adding something to the pack include:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>Do I need this?</li>
              <li>Will I actually use it on this trip?</li>
              <li>Does it earn its place?</li>
            </ul>
            <p>
              But ultralight works best as a method of thinking—not as membership in a
              weight class.
            </p>
          </Section>

          {/* 9. Ultralight Is a Tool, Not a Contest */}
          <Section
            id="tool-not-contest"
            title="Ultralight Is a Tool, Not a Contest"
            isOpen={isOpen('tool-not-contest')}
            onToggle={toggle}
          >
            <p>Pack weight is easy to measure.</p>
            <p>That makes it easy to turn backpacking into a competition.</p>
            <p>
              Someone always has a lighter shelter. A smaller pack. A lower base weight.
              A more extreme system.
            </p>
            <p>
              Another person's base weight does not determine your list. Lighter does not automatically mean better.
            </p>
            <p>But the lightest pack is not automatically the best pack.</p>
            <p>
              A person who removes equipment they genuinely need simply to reach an
              arbitrary number has misunderstood the purpose.
            </p>
            <p>
              A person who carries a few additional ounces because those ounces
              meaningfully improve sleep, safety, health or enjoyment may be making a very
              good decision.
            </p>
            <p>The objective is not to win at ultralight.</p>
            <p>The objective is to use weight as information.</p>
            <p>Ask whether something earns its place.</p>
            <p>Then make your decision and go hiking.</p>
            <PullQuote>Ultralight is a tool, not a contest.</PullQuote>
          </Section>

          {/* 10. The Minimalist Mindset */}
          <Section
            id="minimalist"
            title="The Minimalist Mindset"
            isOpen={isOpen('minimalist')}
            onToggle={toggle}
          >
            <p>Minimalism is sometimes mistaken for deprivation.</p>
            <p>That is not what it needs to mean.</p>
            <p>
              In backpacking, a minimalist mindset is simply intentionality.
            </p>
            <p>
              Instead of beginning with everything you might possibly use and trying to fit
              it into a backpack, begin with the problems the trip actually requires you
              to solve.
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>Shelter.</li>
              <li>Sleep.</li>
              <li>Warmth.</li>
              <li>Weather.</li>
              <li>Water.</li>
              <li>Food.</li>
              <li>Navigation.</li>
              <li>Safety.</li>
            </ul>
            <p>Then ask what equipment solves those problems effectively.</p>
            <p>For every item, useful questions include:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>What job does this perform?</li>
              <li>How likely am I to use it?</li>
              <li>Do I already carry something that performs the same job?</li>
              <li>Would I genuinely miss it if I left it behind?</li>
              <li>Is the value it provides worth the weight I will carry for every mile?</li>
            </ul>
            <p>The answer does not always have to be "leave it home."</p>
            <p>Sometimes the answer is:</p>
            <PullQuote>Yes. It is worth it.</PullQuote>
            <p>That is still minimalism—because the decision was intentional.</p>
            <p>
              Minimalism in this sense is not about simplicity with purpose as an
              aesthetic goal—it is about making room for what genuinely matters.
            </p>
          </Section>

          {/* 11. Ray-Way */}
          <Section
            id="ray-way"
            title="Ray-Way"
            isOpen={isOpen('ray-way')}
            onToggle={toggle}
          >
            <p>
              Long before "ultralight" became a familiar outdoor-industry category, Ray
              Jardine was developing, testing and documenting a systematic approach to
              carrying less while traveling long distances.
            </p>
            <p>
              Jardine brought an inventor's mindset to the outdoors. Before his
              lightweight-backpacking work became widely known, he had worked as an
              aerospace engineer and space-flight simulation specialist and was an
              accomplished rock climber. In the 1970s, his work on expanding camming
              devices led to what became the Friend, later commercially produced by Wild
              Country.<Cite n={22} />
            </p>
            <p>
              Ray and Jenny Jardine also spent years experimenting with long-distance
              hiking systems. Jardine's published chronology records five major
              long-distance hikes between 1987 and 1994 totaling approximately 12,500
              miles, including multiple Pacific Crest Trail journeys and thru-hikes of the
              Continental Divide Trail and Appalachian Trail.<Cite n={23} />
            </p>
            <p>
              In his account of their 1993 Appalachian Trail hike, Jardine describes their
              equipment at below 10 pounds "Baseline Pack Weight," before expendables such
              as food and water. Importantly, his own account also acknowledges that other
              people had backpacked with very light equipment before him.<Cite n={24} />
            </p>
            <p>That distinction matters.</p>
            <p>Ray Jardine did not invent traveling light.</p>
            <p>
              His importance lies in helping develop, test, document and popularize a
              practical, systematic form of lightweight long-distance backpacking that
              became highly influential in what we now call modern ultralight backpacking.
            </p>
            <p>
              He began documenting the approach in the PCT Hiker's Handbook, with a beta
              printing in December 1991 and first commercial printing in April 1992. The
              work evolved through the Pacific Crest Trail Hiker's Handbook, Second Edition
              in 1996, Beyond Backpacking in 1999 and Trail Life in 2008.<Cite n={25} />
            </p>
            <p>The important lesson is bigger than any single piece of gear.</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>Question what you carry.</li>
              <li>Understand the function.</li>
              <li>Look at the whole system.</li>
              <li>Test assumptions.</li>
              <li>Reduce unnecessary duplication.</li>
              <li>Develop skills.</li>
              <li>Use knowledge.</li>
              <li>Make equipment work together.</li>
              <li>And carry what the actual conditions require.</li>
            </ul>
            <p>
              That thinking helped influence modern lightweight backpacking, and it
              connects naturally with TrailWeigh:
            </p>
            <PullQuote>
              Carry what you need. Understand why you carry it. Make each item earn its
              place.
            </PullQuote>
            <p className="text-xs text-muted-foreground/60 pt-2">
              TrailWeigh is an independent project and is not affiliated with, sponsored
              by or endorsed by Ray Jardine or Ray-Way.
            </p>
          </Section>

          {/* 12. Knowledge Weighs Nothing */}
          <Section
            id="knowledge"
            title="Knowledge Weighs Nothing"
            isOpen={isOpen('knowledge')}
            onToggle={toggle}
          >
            <p>Equipment solves problems.</p>
            <p>So does knowledge.</p>
            <p>
              Understanding weather can help you choose appropriate clothing.
            </p>
            <p>
              Understanding campsite selection can affect warmth, wind exposure and
              condensation.
            </p>
            <p>
              Understanding your layering system can help you use the clothing you already
              carry more effectively.
            </p>
            <p>
              Knowing the next reliable water source can change how much water you need to
              carry.
            </p>
            <p>
              Navigation skills can prevent a small mistake from becoming a dangerous one.
            </p>
            <p>
              Experience with your shelter can matter more in a storm than owning a shelter
              with impressive specifications that you do not know how to use.
            </p>
            <p>
              This does not mean that knowledge replaces necessary safety equipment.
            </p>
            <p>It means that equipment and skill work together.</p>
            <p>The goal is not to prove that you can survive with less.</p>
            <p>
              The goal is to understand enough to make informed decisions about what you
              actually need.
            </p>
            <PullQuote>
              Knowledge weighs nothing—but good judgment is priceless.
            </PullQuote>
            <PullQuote>
              And good judgment matters more than a number on a scale.
            </PullQuote>
          </Section>

          {/* 13. Think in Systems */}
          <Section
            id="systems"
            title="Think in Systems"
            isOpen={isOpen('systems')}
            onToggle={toggle}
          >
            <p>A backpack is not really a collection of independent objects.</p>
            <p>It is a system.</p>
            <p>
              Your sleeping bag or quilt works with your sleeping pad, sleep clothing and
              shelter.
            </p>
            <p>Your shelter may work with trekking poles you are already carrying.</p>
            <p>
              Your insulation, wind layer and rain protection overlap in ways that can
              change what each individual garment needs to accomplish.
            </p>
            <p>Your water capacity depends partly on where water is available.</p>
            <p>Your stove—or decision not to carry one—changes your food system.</p>
            <p>Your pack size depends partly on the volume of everything else.</p>
            <p>That means asking only:</p>
            <PullQuote>"How much does this item weigh?"</PullQuote>
            <p>can miss the larger question:</p>
            <PullQuote>"What does this item allow the rest of my system to do?"</PullQuote>
            <p>Sometimes a slightly heavier item makes the total system lighter.</p>
            <p>Sometimes eliminating one item requires adding two others.</p>
            <p>
              Sometimes the smartest weight reduction comes from changing the system rather
              than buying a lighter version of the same thing.
            </p>
            <p>
              Sometimes the right question is: Do I need this item at all, or can the
              rest of my system handle it without it?
            </p>
            <p>TrailWeigh helps make those relationships visible.</p>
          </Section>

          {/* 14. One Tool, Many Uses */}
          <Section
            id="multi-use"
            title="One Tool, Many Uses"
            isOpen={isOpen('multi-use')}
            onToggle={toggle}
          >
            <p>
              A common way to reduce unnecessary weight is to let one item perform more
              than one useful function.
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>A trekking pole may also support a shelter.</li>
              <li>A stuff sack and spare clothing can become a pillow.</li>
              <li>A bandana can serve several simple camp functions.</li>
              <li>
                A smartphone can combine navigation, camera, communication, reading and
                note-taking functions that once required several separate devices.
              </li>
              <li>
                Clothing layers can work together as a system rather than depending on a
                single heavy garment for every condition.
              </li>
            </ul>
            <p>
              A useful question before adding anything new: Can something I already carry
              do this job?
            </p>
            <p>Multi-use equipment can be elegant because one ounce is doing more than one job.</p>
            <p>Carry less by asking more of the things you already bring.</p>
            <p>But multi-use is not a rule.</p>
            <p>Some things should be excellent at one important job.</p>
            <p>
              A piece of safety-critical equipment does not need a clever second purpose
              to justify its weight.
            </p>
            <p>The goal is not to force every object to do three things.</p>
            <p>It is simply to notice unnecessary duplication when it exists.</p>
          </Section>

          {/* ═══════════════════════════════════════════════════════════════ */}
          <SectionLabel>TrailWeigh</SectionLabel>

          {/* 15. Where TrailWeigh Fits In */}
          <Section
            id="trailweigh-fits"
            title="Where TrailWeigh Fits In"
            isOpen={isOpen('trailweigh-fits')}
            onToggle={toggle}
          >
            {/* 023C: multi-use note — TrailWeigh is broader than backpacking */}
            <div className="bg-muted/60 border border-border rounded-xl px-4 py-3 text-sm text-foreground/80 leading-relaxed">
              <p>
                TrailWeigh is more than a pack-list tool. Use it to build and organize almost
                any kind of checklist or item list. Track weight when it is useful—or skip it
                entirely. Adding a weight is never required.
              </p>
            </div>
            <p>TrailWeigh is not here to decide what belongs in your backpack.</p>
            <p>That decision should remain yours.</p>
            <p>What TrailWeigh can do is make your decisions easier to see.</p>
            <ul className="list-disc list-inside space-y-1.5 ml-1">
              <li>Build a gear list, checklist, or item list.</li>
              <li>Organize equipment into systems and categories.</li>
              <li>Enter weights and quantities—or leave weight blank if it is not relevant.</li>
              <li>Select the gear you are actually taking on a particular trip.</li>
              <li>See where the weight comes from.</li>
              <li>Compare the parts of your system.</li>
              <li>Save different lists for different trails, seasons and conditions.</li>
              <li>
                Use the same list as also a packing checklist to gather and pack
                systematically—so important equipment does not stay on the garage floor
                when you leave for the trailhead.
              </li>
              <li>Print it.</li>
              <li>Share it.</li>
              <li>Come back later and reconsider it.</li>
            </ul>
            <p>Maybe an item stays.</p>
            <p>Maybe it goes.</p>
            <p>
              Maybe you discover that the three ounces you were obsessing over are less
              important than getting a good night's sleep.
            </p>
            <p>
              Maybe you discover that you have been carrying something for years simply
              because you never stopped to ask why.
            </p>
            <p>That is where TrailWeigh fits in.</p>
            <p>It does not decide what matters.</p>
            <p>It helps you decide.</p>
            <div className="pt-2 space-y-3">
              <PullQuote>
                Because the goal isn't the lightest possible pack.
                {' '}The goal is a pack that works for you and helps you enjoy whatever brought
                you to the trail.
              </PullQuote>
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-5 py-4 text-sm text-foreground/80 leading-relaxed font-medium">
                Carry what you need.<br />
                Understand why you carry it.<br />
                Make each item earn its place.
              </div>
              <p className="text-base font-bold text-foreground text-center pt-2">
                Then go outside.
              </p>
            </div>
          </Section>

          {/* 16. About the Creator */}
          <Section
            id="creator"
            title="About the Creator"
            isOpen={isOpen('creator')}
            onToggle={toggle}
          >
            <p>
              TrailWeigh was built by a hiker, backpacker and software developer who wanted
              a more practical tool for building, organizing and understanding gear lists
              for long-distance and multi-day hiking trips.
            </p>
            <p>
              The motivation was simple: existing tools were either too heavy (spreadsheets
              that became their own project) or too lightweight (basic list apps that
              showed totals without context). TrailWeigh tries to sit in the useful middle.
            </p>
            <p>
              More information about the creator will be added here.
            </p>
          </Section>

          {/* 17. Credits */}
          <Section
            id="credits"
            title="Credits"
            isOpen={isOpen('credits')}
            onToggle={toggle}
          >
            <p>
              TrailWeigh was built from ideas that have developed across generations of
              backpackers, hikers, explorers, inventors, researchers and outdoor educators.
            </p>
            <p>
              Modern lightweight and ultralight backpacking did not come from one person or
              one idea. It grew through experimentation, shared experience, new materials,
              cottage-industry innovation, long-distance hikers willing to question
              established practices, and countless conversations on trails, in books, in
              outdoor communities and around campfires.
            </p>
            <p>
              TrailWeigh recognizes Ray Jardine as one of the most influential early
              popularizers of the systematic lightweight approach that helped shape modern
              ultralight backpacking. His work is discussed separately in the Ray-Way
              section. References to Ray Jardine and Ray-Way are historical and educational
              and do not imply affiliation or endorsement.
            </p>
            <p>
              TrailWeigh also acknowledges the researchers whose work helps us better
              understand the relationships among physical activity, natural environments,
              mental well-being, awe, nature connectedness and human health. The research
              used in About TrailWeigh is identified in Sources &amp; References.
            </p>
            <p>
              Most of all, credit belongs to the broader hiking community—the people who
              test ideas in the real world, share what works and what does not, help one
              another on the trail, care for the places through which we travel, and
              continue asking a very useful question:
            </p>
            <PullQuote>Do I really need to carry this?</PullQuote>
            <p className="text-xs text-muted-foreground/60 pt-1">
              TrailWeigh is an independent project. References to individuals, companies,
              books, organizations, research institutions, religious or philosophical
              traditions, products or other third parties are provided for historical,
              educational or citation purposes and do not imply sponsorship, affiliation or
              endorsement.
            </p>
          </Section>

        </div>{/* end accordion sections */}

        {/* ── Sources & References link ───────────────────────────────────── */}
        <div className="mt-6 px-1">
          <button
            onClick={() => openSources()}
            className="text-[13px] text-primary underline underline-offset-2 hover:text-primary/80
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                       focus-visible:ring-offset-2 rounded"
          >
            Sources &amp; References
          </button>
        </div>

        {/* ── Help & How-To / Contact ─────────────────────────────────────── */}
        <div className="mt-4 bg-card border border-card-border rounded-xl p-5 shadow-sm text-sm text-muted-foreground leading-relaxed">
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

      {/* Sources & References modal (page-level; Footer has its own independent instance) */}
      <SourcesModal
        isOpen={sourcesOpen}
        onClose={() => setSourcesOpen(false)}
        scrollToRef={scrollToRef}
      />
    </div>
  );
}
