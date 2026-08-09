import React from 'react';
import { ClerkProvider, SignIn, SignUp, Show } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';
import Checklist from './pages/Checklist';
import LandingPage from './pages/LandingPage';
import AdminPage from './pages/AdminPage';
import SharedPackView from './pages/SharedPackView';
import SharedChecklistPage from './pages/SharedChecklistPage';
import NotFound from '@/pages/not-found';
import AboutPage from './pages/info/AboutPage';
import HowItWorksPage from './pages/info/HowItWorksPage';
import HelpPage from './pages/info/HelpPage';
import ReportProblemPage from './pages/info/ReportProblemPage';
import ContactPage from './pages/info/ContactPage';
import PrivacyPolicyPage from './pages/info/PrivacyPolicyPage';
import TermsPage from './pages/info/TermsPage';
import DeleteAccountPage from './pages/info/DeleteAccountPage';
import AffiliatePage from './pages/info/AffiliatePage';
import AccessibilityPage from './pages/info/AccessibilityPage';

// REQUIRED — copy verbatim per Clerk skill
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — copy verbatim; empty in dev (intentional), auto-set in prod
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  // Clerk's OAuth callbacks may pass an absolute URL (e.g. after Google sign-in).
  // Extract the pathname+search+hash so the path comparison below works correctly.
  // Without this, routerPush receives "https://..." which wouter cannot use.
  let p = path;
  try {
    const url = new URL(path);
    p = url.pathname + url.search + url.hash;
  } catch {
    // Not an absolute URL — already a relative path, proceed as-is.
  }
  return basePath && p.startsWith(basePath)
    ? p.slice(basePath.length) || '/'
    : p;
}

if (!clerkPubKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: 'hsl(140, 15%, 35%)',
    colorForeground: 'hsl(150, 15%, 15%)',
    // Darker placeholder: ~33% lightness gives ~6:1 contrast on #F5F6F5 bg
    colorMutedForeground: 'hsl(150, 8%, 33%)',
    colorDanger: 'hsl(15, 45%, 50%)',
    colorBackground: 'hsl(40, 20%, 97%)',
    // colorInput feeds Clerk's internal border variable — also overridden
    // explicitly via formFieldInput element class for reliable rendering.
    colorInput: 'hsl(162, 5%, 63%)',            // #9CA6A0 equivalent
    colorInputForeground: 'hsl(150, 15%, 15%)',
    // colorNeutral: also overridden explicitly via socialButtonsBlockButton class
    colorNeutral: 'hsl(162, 5%, 55%)',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    borderRadius: '0.5rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'font-bold',
    headerSubtitle: '',
    socialButtonsBlockButtonText: '!text-[hsl(150,15%,20%)] !font-medium',
    formFieldLabel: 'font-medium',
    footerActionLink: 'font-semibold',
    footerActionText: '',
    dividerText: '',
    identityPreviewEditButton: '',
    formFieldSuccessText: '',
    alertText: '',
    logoBox: 'flex justify-center mb-2',
    logoImage: 'h-10',
    // Explicit medium-gray border so Google button outline is clearly visible
    socialButtonsBlockButton: '!border !border-[#9CA6A0] hover:!border-[#7a8480] !bg-white hover:!bg-[#F5F6F5] !transition-colors',
    // White text on the dark TrailWeigh green button (was inheriting dark colorForeground).
    // Disabled: muted light background + medium text so the shape stays visible
    // but is clearly distinguishable from the enabled dark-green state.
    formButtonPrimary: '!text-white disabled:!bg-[hsl(140,8%,82%)] disabled:!text-[hsl(150,8%,48%)] disabled:!opacity-100 aria-disabled:!bg-[hsl(140,8%,82%)] aria-disabled:!text-[hsl(150,8%,48%)]',
    // Explicit light-gray surface + medium-gray border so the field is
    // immediately visible against the white card without requiring focus.
    formFieldInput: '!bg-[#F5F6F5] !border !border-[#9CA6A0] placeholder:!text-[hsl(150,8%,38%)] focus:!border-[hsl(140,15%,35%)] !shadow-none !outline-none',
    // Password visibility toggle (eye icon) — applies to the show/hide button on
    // all password fields: sign-up, set new password, confirm password.
    // Without this override the button inherits an icon color that renders poorly
    // against the #F5F6F5 input background set above.
    // type="button" is enforced by Clerk internally so it does not submit forms.
    formFieldInputShowPasswordButton: '!text-[hsl(150,15%,35%)] hover:!text-[hsl(140,15%,20%)] !bg-transparent !border-0 !shadow-none focus-visible:!ring-2 focus-visible:!ring-[hsl(140,15%,35%)]/40 !rounded !p-1 !transition-colors',
    footerAction: '',
    dividerLine: '',
    alert: '',
    // OTP / verification-code fields: same surface + border treatment
    otpCodeFieldInput: '!bg-[#F5F6F5] !border !border-[#9CA6A0] !shadow-none !outline-none',
    formFieldRow: '',
    main: '',
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        // Explicit fallback so Clerk always has a destination after sign-in,
        // regardless of Clerk dashboard default-redirect configuration.
        fallbackRedirectUrl={`${basePath}/`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8 flex-col gap-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/`}
      />
      <p className="text-xs text-muted-foreground text-center max-w-sm px-2">
        By creating an account, you agree to TrailWeigh's{' '}
        <a href={`${basePath}/terms`} className="underline underline-offset-2 hover:text-foreground transition-colors">
          Terms of Use
        </a>{' '}
        and acknowledge the{' '}
        <a href={`${basePath}/privacy`} className="underline underline-offset-2 hover:text-foreground transition-colors">
          Privacy Policy
        </a>.
      </p>
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/checklist" />
      </Show>
      <Show when="signed-out">
        <LandingPage />
      </Show>
    </>
  );
}

function ChecklistRoute() {
  // Auth guard lives in the Checklist default export — redirects to /sign-in when signed out.
  return <Checklist />;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      // Belt-and-suspenders fallback redirect so Clerk always knows where to
      // land after auth completes, regardless of dashboard default configuration.
      signInFallbackRedirectUrl={`${basePath}/`}
      signUpFallbackRedirectUrl={`${basePath}/`}
      localization={{
        signIn: {
          start: {
            title: 'Welcome back',
            subtitle: 'Sign in to your TrailWeigh account',
          },
        },
        signUp: {
          start: {
            title: 'Create your account',
            subtitle: 'Start tracking your pack weight',
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <TooltipProvider>
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/checklist" component={ChecklistRoute} />
          <Route path="/shared" component={SharedPackView} />
          <Route path="/s/:id" component={SharedChecklistPage} />
          {/* REQUIRED — /*? matches both bare URL and Clerk's OAuth sub-paths */}
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/admin" component={AdminPage} />
          {/* ── Info / Legal / Help routes ── */}
          <Route path="/about" component={AboutPage} />
          <Route path="/how-it-works" component={HowItWorksPage} />
          <Route path="/help" component={HelpPage} />
          <Route path="/report-problem" component={ReportProblemPage} />
          <Route path="/contact" component={ContactPage} />
          <Route path="/privacy" component={PrivacyPolicyPage} />
          <Route path="/terms" component={TermsPage} />
          <Route path="/delete-account" component={DeleteAccountPage} />
          <Route path="/affiliate" component={AffiliatePage} />
          <Route path="/accessibility" component={AccessibilityPage} />
          <Route component={NotFound} />
        </Switch>
        <Toaster />
      </TooltipProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
