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
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || '/'
    : path;
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
    // Slightly darker placeholder text for readability (was 45% lightness)
    colorMutedForeground: 'hsl(150, 8%, 40%)',
    colorDanger: 'hsl(15, 45%, 50%)',
    colorBackground: 'hsl(40, 20%, 97%)',
    // Darkened from 85% → 58% lightness so input borders are clearly visible
    // on the white sign-in card (~3.2:1 contrast ratio against white)
    colorInput: 'hsl(140, 8%, 58%)',
    colorInputForeground: 'hsl(150, 15%, 15%)',
    // Darkened from 85% → 60% so Continue-with-Google button boundary is visible
    colorNeutral: 'hsl(140, 6%, 60%)',
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
    socialButtonsBlockButtonText: '',
    formFieldLabel: 'font-medium',
    footerActionLink: 'font-semibold',
    footerActionText: '',
    dividerText: '',
    identityPreviewEditButton: '',
    formFieldSuccessText: '',
    alertText: '',
    logoBox: 'flex justify-center mb-2',
    logoImage: 'h-10',
    // No extra class needed; colorNeutral now gives visible boundary
    socialButtonsBlockButton: '',
    formButtonPrimary: '',
    // Subtle off-white background so the field is distinguishable from the card
    formFieldInput: '!bg-neutral-50',
    footerAction: '',
    dividerLine: '',
    alert: '',
    // Same off-white for OTP / verification-code inputs
    otpCodeFieldInput: '!bg-neutral-50',
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
