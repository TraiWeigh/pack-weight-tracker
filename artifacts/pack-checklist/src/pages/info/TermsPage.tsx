import React from 'react';
import { Link } from 'wouter';
import { Tent, ArrowLeft, FileText } from 'lucide-react';
import Footer from '@/components/Footer';

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-bold text-foreground mt-8 mb-3">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-foreground/80 leading-relaxed mb-3">{children}</p>;
}

export default function TermsPage() {
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

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-black text-foreground">Terms of Use</h1>
        </div>

        <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-5 py-4 mb-8 text-sm text-amber-700/80 leading-relaxed">
          <strong className="font-semibold">Draft — not yet finalized.</strong> These Terms
          of Use describe TrailWeigh's current expectations and practices in plain language.
          They will be reviewed by qualified legal counsel before being treated as a
          binding legal agreement. Check back for updates.
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">

          <P>By using TrailWeigh you agree to these Terms of Use. Please read them before using the service.</P>

          <H2>1. Using TrailWeigh</H2>
          <P>TrailWeigh is a gear-list and pack-weight planning application provided for personal use by hikers and backpackers. You may use TrailWeigh to create, manage, save, and share gear lists for your own trips and planning purposes.</P>

          <H2>2. Account responsibility</H2>
          <P>You are responsible for maintaining the security of your account credentials. You are responsible for all activity that occurs under your account. If you believe your account has been compromised, contact us promptly.</P>
          <P>You must be at least 13 years old to create a TrailWeigh account.</P>

          <H2>3. Acceptable use</H2>
          <P>You agree not to use TrailWeigh to:</P>
          <ul className="text-sm text-foreground/80 leading-relaxed list-disc list-inside space-y-1.5 mb-3 ml-1">
            <li>Violate any applicable law or regulation.</li>
            <li>Attempt to gain unauthorized access to TrailWeigh's systems or another user's data.</li>
            <li>Use automated tools to scrape, overload, or otherwise interfere with the service.</li>
            <li>Engage in any use that disrupts or harms TrailWeigh or its users.</li>
          </ul>

          <H2>4. Your gear-list content</H2>
          <P>The gear-list content you create in TrailWeigh — item names, descriptions, weights, and other information you enter — is yours. TrailWeigh stores and processes it only to provide the service to you.</P>
          <P>When you use the <strong>Share</strong> feature, you choose to make a snapshot of your gear list accessible to anyone with the link. You are responsible for deciding what to share and with whom.</P>

          <H2>5. TrailWeigh intellectual property</H2>
          <P>TrailWeigh and its associated software, design, interface, and content (other than your own gear-list content) are the property of TrailWeigh's creators. You may not copy, modify, distribute, or create derivative works from TrailWeigh's application code or design without permission.</P>

          <H2>6. Shared links</H2>
          <P>Shared links contain a snapshot of your gear list at the time the link was created. Anyone with the link can view that snapshot. Share links are not password-protected. Consider this before sharing a link to a list that contains information you do not want to be broadly accessible.</P>

          <H2>7. Service availability</H2>
          <P>TrailWeigh is provided on an as-available basis. We do not guarantee uninterrupted access. The service may be updated, modified, or temporarily unavailable from time to time.</P>

          <H2>8. Changes to features</H2>
          <P>TrailWeigh's features may change over time. Features may be added, modified, or removed. Where practical, significant changes will be communicated in advance.</P>

          <H2>9. Account termination</H2>
          <P>We reserve the right to suspend or terminate accounts that violate these Terms or that engage in behavior harmful to other users or to the service. You may also choose to delete your account at any time — see the <Link to="/delete-account" className="underline underline-offset-2 hover:text-foreground">Delete Account / Data</Link> page for how to do so.</P>

          <H2>10. Disclaimers</H2>
          <P>TrailWeigh is a planning and organizational tool. It is provided for informational and planning purposes only. TrailWeigh does not provide outdoor safety advice, fitness guidance, or recommendations about what to bring on any specific trip. You are responsible for your own safety and preparedness in the outdoors.</P>
          <P>TrailWeigh is provided without warranties of any kind, express or implied, to the extent permitted by applicable law.</P>

          <H2>11. Limitation of liability</H2>
          <P>To the extent permitted by applicable law, TrailWeigh's liability for any claim arising from your use of the service is limited. TrailWeigh is not liable for indirect, incidental, or consequential damages.</P>
          <P><em>Note: The specific limits, jurisdiction, and governing law for this section require legal review and will be defined in the final Terms of Use.</em></P>

          <H2>12. Changes to these Terms</H2>
          <P>These Terms of Use may be updated as the service evolves. Continued use of TrailWeigh after an update constitutes acceptance of the revised Terms. Material changes will be noted on this page.</P>

          <H2>13. Contact</H2>
          <P>Questions about these Terms can be directed through the <Link to="/contact" className="underline underline-offset-2 hover:text-foreground">Contact Us</Link> page.</P>

        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          See also:{' '}
          <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy Policy</Link>
        </p>
      </main>

      <Footer />
    </div>
  );
}
