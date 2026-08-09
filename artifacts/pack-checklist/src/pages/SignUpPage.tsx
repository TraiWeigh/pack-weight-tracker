import React from 'react';
import { SignUp } from '@clerk/react';

const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

// NOTE: This standalone file is not used by the router (App.tsx defines its own
// inline SignUpPage function). It is kept for reference only. The canonical
// sign-up component is the inline SignUpPage in App.tsx.
export default function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/`}
      />
    </div>
  );
}
