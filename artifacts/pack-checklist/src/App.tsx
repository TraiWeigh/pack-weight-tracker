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
import NotFound from '@/pages/not-found';

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
    colorMutedForeground: 'hsl(150, 8%, 45%)',
    colorDanger: 'hsl(15, 45%, 50%)',
    colorBackground: 'hsl(40, 20%, 97%)',
    colorInput: 'hsl(140, 10%, 85%)',
    colorInputForeground: 'hsl(150, 15%, 15%)',
    colorNeutral: 'hsl(140, 10%, 85%)',
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
    socialButtonsBlockButton: '',
    formButtonPrimary: '',
    formFieldInput: '',
    footerAction: '',
    dividerLine: '',
    alert: '',
    otpCodeFieldInput: '',
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
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
      />
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
  // Allow access whether signed in or not — guests use the local guest key
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
          {/* REQUIRED — /*? matches both bare URL and Clerk's OAuth sub-paths */}
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/admin" component={AdminPage} />
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
