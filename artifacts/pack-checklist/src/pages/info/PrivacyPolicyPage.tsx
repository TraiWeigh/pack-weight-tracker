import React from 'react';
import { Link } from 'wouter';
import { Tent, ArrowLeft, Shield } from 'lucide-react';
import Footer from '@/components/Footer';

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-bold text-foreground mt-8 mb-3">{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-foreground/80 leading-relaxed mb-3">{children}</p>;
}

export default function PrivacyPolicyPage() {
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
            <Shield className="w-5 h-5" />
          </div>
          <h1 className="text-3xl font-black text-foreground">Privacy Policy</h1>
        </div>

        <div className="bg-amber-50 border border-amber-200/60 rounded-xl px-5 py-4 mb-8 text-sm text-amber-700/80 leading-relaxed">
          <strong className="font-semibold">Draft — not yet finalized.</strong> This policy
          describes TrailWeigh's current data practices to the best of our knowledge.
          It will be reviewed by qualified legal counsel before it is treated as a
          binding privacy statement. Check back for updates.
        </div>

        <div className="bg-card border border-card-border rounded-xl p-6 shadow-sm">

          <P>This Privacy Policy describes what information TrailWeigh collects, how it is used, and the choices available to you.</P>

          <H2>1. Information you provide</H2>
          <P><strong>Account information.</strong> When you create a TrailWeigh account, you provide an email address. Account creation, sign-in, and session management are handled by <strong>Clerk</strong>, a third-party authentication service. TrailWeigh does not independently store your password. Clerk's own privacy policy governs the handling of your authentication credentials and session data.</P>
          <P><strong>Gear list content.</strong> The gear lists, categories, item names, descriptions, weights, and quantities you enter in TrailWeigh are your own content. TrailWeigh stores this content so the application can function.</P>

          <H2>2. How TrailWeigh stores your data</H2>
          <P><strong>Browser storage (your device).</strong> Your current working gear list — including all items, categories, and settings — is stored in your browser's <strong>local storage</strong>, tied to your account identifier. This data lives on the device and browser you are using. It is not automatically synced to another device. Signing out of TrailWeigh does not automatically clear this local data.</P>
          <P><strong>Background images.</strong> If you select a background photo, any photo files associated with custom theme slots are stored in your browser's <strong>IndexedDB</strong> (a local browser database on your device). Preset background photos provided by TrailWeigh are hosted externally by Unsplash and are loaded over the network, not stored locally.</P>
          <P><strong>Saved gear lists (Locker).</strong> Gear lists you explicitly save to the Locker are stored in your browser's local storage under your account ID. They are accessible from the same browser and device where you saved them.</P>
          <P><strong>Shared links.</strong> When you use the Share feature, a snapshot of your gear list at that moment — including items, categories, weights, list name, unit preference, and background settings — is stored in TrailWeigh's server database. This snapshot is associated with a randomly generated link ID, not directly with your account. Anyone who has the link can access this snapshot.</P>
          <P><strong>Scan credits.</strong> AI scan credits are tracked in your browser's local storage. No credit or payment information is stored on TrailWeigh's servers.</P>

          <H2>3. Server-side data</H2>
          <P>TrailWeigh's server database stores only share-link snapshots (as described above). It does not maintain a user database of your gear lists, personal profile, or account details beyond what Clerk manages for authentication purposes.</P>
          <P>Server logs record standard HTTP request information (request method, URL path, response status, and a request identifier) for operational purposes. These logs do not contain gear list content or personal information beyond what is in standard web server logs.</P>

          <H2>4. Third-party services</H2>
          <P>TrailWeigh uses the following external services:</P>
          <ul className="text-sm text-foreground/80 leading-relaxed list-disc list-inside space-y-2 mb-3 ml-1">
            <li><strong>Clerk</strong> — account creation, authentication, and session management. Clerk handles your email address and sign-in credentials.</li>
            <li><strong>OpenAI</strong> — powers the Scan Gear List AI feature. When you use Scan Gear List, the content of the file you submit is sent to OpenAI's API for processing. OpenAI's privacy policy governs how that data is handled.</li>
            <li><strong>Unsplash</strong> — provides preset background photos. Selecting a preset photo loads it directly from Unsplash's servers.</li>
          </ul>
          <P>TrailWeigh does not use advertising networks, behavioral tracking, or third-party analytics services.</P>

          <H2>5. How your information is used</H2>
          <P>Information collected by TrailWeigh is used solely to provide and improve the TrailWeigh gear-tracking service — specifically to operate your gear lists, enable saving and sharing, and authenticate your account. It is not sold to third parties.</P>

          <H2>6. Data retention and deletion</H2>
          <P><strong>Browser-local data</strong> (your working list, Locker, background photos) persists in your browser until you clear your browser's site data for TrailWeigh, or until the browser itself removes it as part of storage management.</P>
          <P><strong>Share-link snapshots</strong> on the server are retained to support shared links. TrailWeigh does not currently associate share-link snapshots with a user account for deletion purposes.</P>
          <P><strong>Account deletion.</strong> To request deletion of your TrailWeigh account and associated data, see the <Link to="/delete-account" className="underline underline-offset-2 hover:text-foreground">Delete Account / Data</Link> page.</P>

          <H2>7. Security</H2>
          <P>TrailWeigh takes reasonable steps to protect the information it handles, including using established third-party services for authentication and hosting. No specific security certifications or guarantees are claimed here.</P>

          <H2>8. Children</H2>
          <P>TrailWeigh is not directed at children under 13. We do not knowingly collect personal information from children under 13.</P>

          <H2>9. Changes to this policy</H2>
          <P>This Privacy Policy may be updated as TrailWeigh's features and data practices evolve. Material changes will be noted on this page. Continued use of TrailWeigh after an update constitutes acceptance of the revised policy.</P>

          <H2>10. Contact</H2>
          <P>Questions about this Privacy Policy or your data can be directed through the <Link to="/contact" className="underline underline-offset-2 hover:text-foreground">Contact Us</Link> page.</P>

        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          See also:{' '}
          <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">Terms of Use</Link>{' · '}
          <Link to="/delete-account" className="underline underline-offset-2 hover:text-foreground">Delete Account / Data</Link>
        </p>
      </main>

      <Footer />
    </div>
  );
}
