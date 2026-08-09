/**
 * SourcesModal.tsx — Reusable Sources & References modal
 * Prompt 022L: research and historical references used in About TrailWeigh.
 *
 * Accessible dialog:
 *  - role="dialog" / aria-modal / aria-labelledby
 *  - Escape closes
 *  - Focus trapped inside; returns to trigger on close
 *  - Vertically scrollable; works on narrow screens
 *  - Scrolls to scrollToRef entry on open when provided
 */
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional id of an element inside the modal to scroll to on open (e.g. "ref-3") */
  scrollToRef?: string | null;
}

export default function SourcesModal({ isOpen, onClose, scrollToRef }: SourcesModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus close button on open; scroll to target ref
  useEffect(() => {
    if (!isOpen) return;
    const raf = requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
      if (scrollToRef) {
        const el = document.getElementById(scrollToRef);
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [isOpen, scrollToRef]);

  // Escape closes
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen) return;
    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const el = dialogRef.current;
      if (!el) return;
      const focusable = el.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last  = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sources-modal-title"
        className="bg-background border border-border rounded-t-2xl sm:rounded-2xl
                   w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[82vh]
                   flex flex-col overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <h2 id="sources-modal-title" className="font-bold text-foreground text-base">
            Sources &amp; References
          </h2>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground
                       hover:bg-muted/50 transition-colors
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close Sources & References"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-5 space-y-7 text-sm text-muted-foreground leading-relaxed">

          {/* Introduction */}
          <p className="text-foreground/80">
            The scientific and historical material in About TrailWeigh is based on the
            sources below. Research findings describe results observed in studies and
            populations; they are not guarantees of individual outcomes and should not be
            interpreted as medical advice.
          </p>

          {/* ── Mind ──────────────────────────────────────────────────────── */}
          <section>
            <h3 className="font-semibold text-foreground text-sm mb-3 pb-1 border-b border-border">
              Mind — Mental &amp; Emotional Benefits
            </h3>
            <ol className="space-y-4 list-none">
              <li id="ref-1">
                <span className="font-medium text-foreground/80">[1]</span>{' '}
                Liu X, Sun Z, Wang X, Dong D, Samsudin SB.
                &ldquo;Effects of green exercise on mental health: a systematic review and
                meta-analysis.&rdquo;
                <em> Frontiers in Psychology.</em> 2026;17:1802759.{' '}
                DOI:{' '}
                <a href="https://doi.org/10.3389/fpsyg.2026.1802759" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  10.3389/fpsyg.2026.1802759
                </a>{' '}
                &middot; PMID:{' '}
                <a href="https://pubmed.ncbi.nlm.nih.gov/42058299/" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  42058299
                </a>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  A systematic review and meta-analysis examining mental-health outcomes from green exercise.
                </p>
              </li>

              <li id="ref-2">
                <span className="font-medium text-foreground/80">[2]</span>{' '}
                Bettmann JE, Speelman E, Blumenthal E, Couch S, McArthur T.
                &ldquo;How Does Nature Exposure Affect Adults With Symptoms of Mental Illness?
                A Meta-Analysis.&rdquo;
                <em> International Journal of Mental Health Nursing.</em> 2024;33(6):1889&ndash;1907.{' '}
                DOI:{' '}
                <a href="https://doi.org/10.1111/inm.13400" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  10.1111/inm.13400
                </a>{' '}
                &middot; PMID:{' '}
                <a href="https://pubmed.ncbi.nlm.nih.gov/39209768/" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  39209768
                </a>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  A meta-analysis examining nature exposure among adults with symptoms of mental illness.
                </p>
              </li>

              <li id="ref-3">
                <span className="font-medium text-foreground/80">[3]</span>{' '}
                Stevenson MP, Schilhab T, Bentsen P.
                &ldquo;Attention Restoration Theory II: a systematic review to clarify attention
                processes affected by exposure to natural environments.&rdquo;
                <em> Journal of Toxicology and Environmental Health, Part B.</em> 2018;21(4):227&ndash;268.{' '}
                DOI:{' '}
                <a href="https://doi.org/10.1080/10937404.2018.1505571" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  10.1080/10937404.2018.1505571
                </a>{' '}
                &middot; PMID:{' '}
                <a href="https://pubmed.ncbi.nlm.nih.gov/30130463/" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  30130463
                </a>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  A systematic review examining cognitive domains affected by exposure to natural environments.
                </p>
              </li>
            </ol>
          </section>

          {/* ── Body ──────────────────────────────────────────────────────── */}
          <section>
            <h3 className="font-semibold text-foreground text-sm mb-3 pb-1 border-b border-border">
              Body — Physical Benefits
            </h3>
            <ol className="space-y-4 list-none">
              <li id="ref-4">
                <span className="font-medium text-foreground/80">[4]</span>{' '}
                Centers for Disease Control and Prevention.
                &ldquo;Health Benefits of Physical Activity for Adults.&rdquo;{' '}
                <a href="https://www.cdc.gov/physical-activity-basics/benefits/index.html"
                   target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  cdc.gov
                </a>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Authoritative public-health guidance summarizing established health benefits
                  associated with regular physical activity.
                </p>
              </li>

              <li id="ref-5">
                <span className="font-medium text-foreground/80">[5]</span>{' '}
                Liu XX, Ma XL, Huang WZ, et al.
                &ldquo;Green space and cardiovascular disease: A systematic review with
                meta-analysis.&rdquo;
                <em> Environmental Pollution.</em> 2022;301:118990.{' '}
                DOI:{' '}
                <a href="https://doi.org/10.1016/j.envpol.2022.118990" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  10.1016/j.envpol.2022.118990
                </a>{' '}
                &middot; PMID:{' '}
                <a href="https://pubmed.ncbi.nlm.nih.gov/35181451/" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  35181451
                </a>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  A large systematic review and meta-analysis examining green-space exposure
                  and cardiovascular outcomes.
                </p>
              </li>

              <li id="ref-6">
                <span className="font-medium text-foreground/80">[6]</span>{' '}
                &ldquo;The Effects of Forest Therapy on the Blood Pressure and Salivary Cortisol
                Levels of Urban Residents: A Meta-Analysis.&rdquo; 2023.{' '}
                PMID:{' '}
                <a href="https://pubmed.ncbi.nlm.nih.gov/36612777/" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  36612777
                </a>
              </li>

              <li id="ref-7">
                <span className="font-medium text-foreground/80">[7]</span>{' '}
                Antonelli M, Barbieri G, Donelli D.
                &ldquo;Effects of forest bathing (shinrin-yoku) on levels of cortisol as a stress
                biomarker: a systematic review and meta-analysis.&rdquo;
                <em> International Journal of Biometeorology.</em> 2019;63(8):1117&ndash;1134.{' '}
                DOI:{' '}
                <a href="https://doi.org/10.1007/s00484-019-01717-x" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  10.1007/s00484-019-01717-x
                </a>{' '}
                &middot; PMID:{' '}
                <a href="https://pubmed.ncbi.nlm.nih.gov/31001682/" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  31001682
                </a>
              </li>

              <li id="ref-8">
                <span className="font-medium text-foreground/80">[8]</span>{' '}
                Shin JC, Parab KV, An R, Grigsby-Toussaint DS.
                &ldquo;Greenspace exposure and sleep: A systematic review.&rdquo;
                <em> Environmental Research.</em> 2020;182:109081.{' '}
                DOI:{' '}
                <a href="https://doi.org/10.1016/j.envres.2019.109081" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  10.1016/j.envres.2019.109081
                </a>{' '}
                &middot; PMID:{' '}
                <a href="https://pubmed.ncbi.nlm.nih.gov/31891829/" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  31891829
                </a>
              </li>

              <li id="ref-9">
                <span className="font-medium text-foreground/80">[9]</span>{' '}
                Zhang YD, Zhou GL, Wang L, et al.
                &ldquo;Greenspace and human microbiota: A systematic review.&rdquo;
                <em> Environment International.</em> 2024;187:108662.{' '}
                DOI:{' '}
                <a href="https://doi.org/10.1016/j.envint.2024.108662" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  10.1016/j.envint.2024.108662
                </a>{' '}
                &middot; PMID:{' '}
                <a href="https://pubmed.ncbi.nlm.nih.gov/38653130/" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  38653130
                </a>
              </li>

              <li id="ref-10">
                <span className="font-medium text-foreground/80">[10]</span>{' '}
                Robinson JM, Breed AC, Camargo A, Redvers N, Breed MF.
                &ldquo;Biodiversity and human health: A scoping review and examples of
                underrepresented linkages.&rdquo;
                <em> Environmental Research.</em> 2024;246:118115.{' '}
                DOI:{' '}
                <a href="https://doi.org/10.1016/j.envres.2024.118115" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  10.1016/j.envres.2024.118115
                </a>{' '}
                &middot; PMID:{' '}
                <a href="https://pubmed.ncbi.nlm.nih.gov/38199470/" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  38199470
                </a>
              </li>

              <li id="ref-11">
                <span className="font-medium text-foreground/80">[11]</span>{' '}
                Andersen L, Corazon SS, Stigsdotter UK.
                &ldquo;Nature Exposure and Its Effects on Immune System Functioning:
                A Systematic Review.&rdquo;
                <em> International Journal of Environmental Research and Public Health.</em>{' '}
                2021;18(4):1416.{' '}
                DOI:{' '}
                <a href="https://doi.org/10.3390/ijerph18041416" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  10.3390/ijerph18041416
                </a>{' '}
                &middot; PMID:{' '}
                <a href="https://pubmed.ncbi.nlm.nih.gov/33546397/" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  33546397
                </a>
              </li>
            </ol>
          </section>

          {/* ── Spirit ────────────────────────────────────────────────────── */}
          <section>
            <h3 className="font-semibold text-foreground text-sm mb-3 pb-1 border-b border-border">
              Spirit — Awe, Connection &amp; Meaning
            </h3>
            <ol className="space-y-4 list-none">
              <li id="ref-12">
                <span className="font-medium text-foreground/80">[12]</span>{' '}
                Piff PK, Dietze P, Feinberg M, Stancato DM, Keltner D.
                &ldquo;Awe, the small self, and prosocial behavior.&rdquo;
                <em> Journal of Personality and Social Psychology.</em> 2015;108(6):883&ndash;899.{' '}
                DOI:{' '}
                <a href="https://doi.org/10.1037/pspi0000018" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  10.1037/pspi0000018
                </a>{' '}
                &middot; PMID:{' '}
                <a href="https://pubmed.ncbi.nlm.nih.gov/25984788/" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  25984788
                </a>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Five studies examining awe, the &ldquo;small self,&rdquo; generosity and prosocial behavior.
                </p>
              </li>

              <li id="ref-13">
                <span className="font-medium text-foreground/80">[13]</span>{' '}
                Sparkman DJ, et al.
                &ldquo;No one is an island: Awe encourages global citizenship identification.&rdquo;
                <em> Emotion.</em>{' '}
                DOI:{' '}
                <a href="https://doi.org/10.1037/emo0001160" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  10.1037/emo0001160
                </a>{' '}
                &middot; PMID:{' '}
                <a href="https://pubmed.ncbi.nlm.nih.gov/36074621/" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  36074621
                </a>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Experimental work examining awe, perceived smallness, interconnectedness and
                  global citizenship identification.
                </p>
              </li>

              <li id="ref-14">
                <span className="font-medium text-foreground/80">[14]</span>{' '}
                Capaldi CA, Dopko RL, Zelenski JM.
                &ldquo;The relationship between nature connectedness and happiness:
                a meta-analysis.&rdquo;
                <em> Frontiers in Psychology.</em> 2014;5:976.{' '}
                DOI:{' '}
                <a href="https://doi.org/10.3389/fpsyg.2014.00976" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  10.3389/fpsyg.2014.00976
                </a>{' '}
                &middot; PMID:{' '}
                <a href="https://pubmed.ncbi.nlm.nih.gov/25249992/" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  25249992
                </a>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Meta-analysis of 30 samples and 8,523 participants examining nature
                  connectedness and subjective well-being.
                </p>
              </li>

              <li id="ref-15">
                <span className="font-medium text-foreground/80">[15]</span>{' '}
                Whitburn J, Linklater W, Abrahamse W.
                &ldquo;Meta-analysis of human connection to nature and proenvironmental behavior.&rdquo;
                <em> Conservation Biology.</em> 2020;34(1):180&ndash;193.{' '}
                DOI:{' '}
                <a href="https://doi.org/10.1111/cobi.13381" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  10.1111/cobi.13381
                </a>{' '}
                &middot; PMID:{' '}
                <a href="https://pubmed.ncbi.nlm.nih.gov/31251416/" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  31251416
                </a>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Meta-analysis of 37 samples and 13,237 participants examining connection to
                  nature and pro-environmental behavior.
                </p>
              </li>

              <li id="ref-16">
                <span className="font-medium text-foreground/80">[16]</span>{' '}
                Barragan-Jason G, de Mazancourt C, Parmesan C, Singer MC, Loreau M.
                &ldquo;Human-nature connectedness as a pathway to sustainability:
                A global meta-analysis.&rdquo;
                <em> Conservation Letters.</em> 2022;15(1).{' '}
                DOI:{' '}
                <a href="https://doi.org/10.1111/conl.12852" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  10.1111/conl.12852
                </a>{' '}
                &middot; PMID:{' '}
                <a href="https://pubmed.ncbi.nlm.nih.gov/35865265/" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  35865265
                </a>
              </li>

              <li id="ref-17">
                <span className="font-medium text-foreground/80">[17]</span>{' '}
                Christens BD, McCormick ML, Wolf J.
                &ldquo;Understanding and promoting nature connectedness:
                A human ecological perspective.&rdquo;
                <em> Current Opinion in Psychology.</em> 2025;65:102046.{' '}
                DOI:{' '}
                <a href="https://doi.org/10.1016/j.copsyc.2025.102046" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  10.1016/j.copsyc.2025.102046
                </a>{' '}
                &middot; PMID:{' '}
                <a href="https://pubmed.ncbi.nlm.nih.gov/40334530/" target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  40334530
                </a>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  A review contrasting human-exceptionalist views with a human-ecological
                  perspective that understands humans as part of nature.
                </p>
              </li>
            </ol>
          </section>

          {/* ── Quotations & Historical Texts ─────────────────────────────── */}
          <section>
            <h3 className="font-semibold text-foreground text-sm mb-3 pb-1 border-b border-border">
              Quotations &amp; Historical Texts
            </h3>
            <ol className="space-y-4 list-none">
              <li id="ref-18">
                <span className="font-medium text-foreground/80">[18]</span>{' '}
                John Muir.{' '}
                <em>My First Summer in the Sierra.</em> 1911, p.&nbsp;110.
                <br />
                Quote: &ldquo;When we try to pick out anything by itself, we find it hitched
                to everything else in the Universe.&rdquo;
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Public domain.{' '}
                  <a href="https://archive.org/details/myfirstsummerins00muir_0"
                     target="_blank" rel="noreferrer"
                     className="underline underline-offset-2 hover:text-foreground">
                    Internet Archive
                  </a>
                  {' '}&middot;{' '}
                  <a href="https://www.sierraclub.org/john-muir-exhibit/writings/my_first_summer_in_the_sierra/"
                     target="_blank" rel="noreferrer"
                     className="underline underline-offset-2 hover:text-foreground">
                    Sierra Club Muir Exhibit
                  </a>
                </p>
              </li>

              <li id="ref-19">
                <span className="font-medium text-foreground/80">[19]</span>{' '}
                Tao Te Ching / Dao De Jing. Chapter&nbsp;25.
                James Legge translation, 1891.
                <br />
                Quote: &ldquo;Man takes his law from the Earth; the Earth takes its law from Heaven.&rdquo;
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Legge translation is in the public domain.{' '}
                  <a href="https://ctext.org/dao-de-jing" target="_blank" rel="noreferrer"
                     className="underline underline-offset-2 hover:text-foreground">
                    Chinese Text Project
                  </a>
                </p>
              </li>

              <li id="ref-20">
                <span className="font-medium text-foreground/80">[20]</span>{' '}
                Psalm 24:1. King James Version (public domain).
                <br />
                Quote: &ldquo;The earth is the LORD&rsquo;s, and the fulness thereof.&rdquo;
              </li>

              <li id="ref-21">
                <span className="font-medium text-foreground/80">[21]</span>{' '}
                Kara&#7751;&#299;ya Mett&#257; Sutta. Sutta Nip&#257;ta&nbsp;1.8 /
                Khuddakap&#257;&#7789;ha&nbsp;9.
                Translation by Acharya Buddharakkhita.
                <br />
                Quote: &ldquo;May all beings be happy!&rdquo;
                <p className="mt-1 text-xs text-muted-foreground/70">
                  <a href="https://www.accesstoinsight.org/tipitaka/kn/snp/snp.1.08.budd.html"
                     target="_blank" rel="noreferrer"
                     className="underline underline-offset-2 hover:text-foreground">
                    Access to Insight
                  </a>
                </p>
              </li>
            </ol>
          </section>

          {/* ── Ray Jardine / Ray-Way History ─────────────────────────────── */}
          <section>
            <h3 className="font-semibold text-foreground text-sm mb-3 pb-1 border-b border-border">
              Ray Jardine / Ray-Way History
            </h3>
            <ol className="space-y-4 list-none">
              <li id="ref-22">
                <span className="font-medium text-foreground/80">[22]</span>{' '}
                Wild Country. &ldquo;Making Friends Since 1977: The History.&rdquo;{' '}
                <a href="https://www.wildcountry.com/en-gb/making-friends-since-1977"
                   target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  wildcountry.com
                </a>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Wild Country&rsquo;s historical account of Ray Jardine&rsquo;s aerospace background,
                  Friend prototypes, collaboration with Mark Vallance and the commercial
                  production of Friends beginning in 1977.
                </p>
              </li>

              <li id="ref-23">
                <span className="font-medium text-foreground/80">[23]</span>{' '}
                Ray Jardine. &ldquo;Profile of Ray Jardine.&rdquo;{' '}
                <a href="https://www.rayjardine.com/ray-way/about-ray/index.htm"
                   target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  rayjardine.com
                </a>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Source for the long-distance hiking chronology, including the five major
                  1987&ndash;1994 hikes totaling approximately 12,500 miles.
                </p>
              </li>

              <li id="ref-24">
                <span className="font-medium text-foreground/80">[24]</span>{' '}
                Ray Jardine. &ldquo;Appalachian Trail hiking adventure, 1993 &mdash; Pearl Four.&rdquo;{' '}
                <a href="https://www.rayjardine.com/ray-way/AT/Pearl4/index.htm"
                   target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  rayjardine.com
                </a>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Source for Jardine&rsquo;s description of the sub-10-pound &ldquo;Baseline Pack
                  Weight&rdquo; and his acknowledgement of earlier lightweight backpacking.
                </p>
              </li>

              <li id="ref-25">
                <span className="font-medium text-foreground/80">[25]</span>{' '}
                Ray Jardine. &ldquo;Trail Life&rsquo;s Publication History.&rdquo;{' '}
                <a href="https://www.rayjardine.com/ray-way/Trail-Life/publication-history/index.htm"
                   target="_blank" rel="noreferrer"
                   className="underline underline-offset-2 hover:text-foreground">
                  rayjardine.com
                </a>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Source for: PCT Hiker&rsquo;s Handbook (beta: December 1991; first commercial
                  printing: April 1992), Pacific Crest Trail Hiker&rsquo;s Handbook Second Edition
                  (1996), Beyond Backpacking (1999), Trail Life (2008).
                </p>
              </li>
            </ol>
          </section>

          {/* ── About These Sources ───────────────────────────────────────── */}
          <section className="border-t border-border pt-5">
            <h3 className="font-semibold text-foreground text-sm mb-3">About These Sources</h3>
            <div className="space-y-3 text-xs text-muted-foreground/80 leading-relaxed">
              <p>
                Scientific research evolves. TrailWeigh summarizes research for general
                educational purposes and will favor systematic reviews, meta-analyses,
                peer-reviewed research and authoritative public-health sources whenever
                practical.
              </p>
              <p>
                Research findings describe averages and associations observed in particular
                studies and populations. They do not guarantee that any individual will
                experience the same result and should not be interpreted as medical advice.
              </p>
              <p>
                Religious and philosophical quotations are included as examples of different
                ways human beings have expressed ideas about nature, meaning, stewardship and
                connection. They are not presented as scientific evidence, and their inclusion
                does not indicate that TrailWeigh endorses a particular religious or
                philosophical belief.
              </p>
              <p>
                TrailWeigh is an independent project. References to Ray Jardine, Ray-Way,
                researchers, authors, publishers, religious or philosophical texts, companies
                and other third parties are provided for historical, educational and citation
                purposes only and do not imply sponsorship, affiliation or endorsement.
              </p>
            </div>
          </section>

        </div>{/* end scrollable body */}
      </div>
    </div>
  );
}
