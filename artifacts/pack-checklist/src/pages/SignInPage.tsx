import React from 'react';
import { SignIn } from '@clerk/react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

// NOTE: This standalone file is not used by the router (App.tsx defines its own
// inline SignInPage function). It is kept for reference only. The canonical
// sign-in component is the inline SignInPage in App.tsx.
export default function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/`}
      />
    </div>
  );
}
