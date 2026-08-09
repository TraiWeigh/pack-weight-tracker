/**
 * Footer.tsx — TrailWeigh site footer
 *
 * Always dark-charcoal regardless of Light / Dark / System theme.
 * Three columns on desktop, stacked on mobile.
 *
 * Props
 *   informationalOnly  — omit owner-only links (Delete Account / Data)
 *                        for use in shared-list views.
 */
import React, { useState } from 'react';
import { Link } from 'wouter';
import SourcesModal from '@/components/SourcesModal';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

interface FooterProps {
  /** When true, omits owner-account controls (Delete Account / Data). */
  informationalOnly?: boolean;
}

// ── Typography / colour tokens for the footer
// These are hard-coded (not Tailwind theme vars) so the footer stays dark
// regardless of the active colour-scheme / CSS variable set.
const BG        = '#1e2322';  // very dark charcoal, slight warm-forest cast
const HEAD_CLS  = 'text-[14px] font-semibold text-white/90 mb-2 tracking-wide';
const LINK_CLS  = 'block text-[14px] text-white/70 hover:text-white/95 transition-colors leading-[21px]';
const COPY_CLS  = 'text-[12px] text-white/45';

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className={LINK_CLS}>
      {children}
    </Link>
  );
}

export default function Footer({ informationalOnly = false }: FooterProps) {
  const [sourcesOpen, setSourcesOpen] = useState(false);

  return (
    <>
    <SourcesModal isOpen={sourcesOpen} onClose={() => setSourcesOpen(false)} />
    <footer
      data-footer="trailweigh"
      style={{ backgroundColor: BG }}
      className="w-full flex-shrink-0 print:hidden"
    >
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* ── Three-column grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6 mb-8">

          {/* Column 1 — TrailWeigh */}
          <div>
            <p className={HEAD_CLS}>TrailWeigh</p>
            <nav aria-label="About TrailWeigh">
              <FooterLink to="/about">About TrailWeigh</FooterLink>
              <FooterLink to="/how-it-works">How It Works</FooterLink>
              <button
                onClick={() => setSourcesOpen(true)}
                className="block text-[14px] text-white/70 hover:text-white/95 transition-colors leading-[21px] text-left w-full"
                data-testid="footer-sources-btn"
              >
                Sources &amp; References
              </button>
            </nav>
          </div>

          {/* Column 2 — Help */}
          <div>
            <p className={HEAD_CLS}>Help</p>
            <nav aria-label="Help and support">
              <FooterLink to="/help">Help &amp; How-To</FooterLink>
              <FooterLink to="/report-problem">Report a Problem</FooterLink>
              <FooterLink to="/contact">Contact Us</FooterLink>
            </nav>
          </div>

          {/* Column 3 — Account & Privacy */}
          <div>
            <p className={HEAD_CLS}>Account &amp; Privacy</p>
            <nav aria-label="Account and privacy">
              <FooterLink to="/privacy">Privacy Policy</FooterLink>
              <FooterLink to="/terms">Terms of Use</FooterLink>
              {!informationalOnly && (
                <FooterLink to="/delete-account">Delete Account / Data</FooterLink>
              )}
              <FooterLink to="/affiliate">Affiliate Disclosure</FooterLink>
              <FooterLink to="/accessibility">Accessibility</FooterLink>
            </nav>
          </div>
        </div>

        {/* ── Copyright line ── */}
        <div className="border-t border-white/10 pt-5 text-center">
          <p className={COPY_CLS}>
            © 2026 TrailWeigh · All rights reserved.
          </p>
        </div>
      </div>
    </footer>
    </>
  );
}
