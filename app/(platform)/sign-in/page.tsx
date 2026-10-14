import type { Metadata } from 'next';
import { SignInForm } from '@/components/sign-in-form';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default function SignInPage() {
  return (
    <div className="wrap max-w-md pb-24 pt-32">
      <h1 className="display text-6xl">Sign in</h1>
      <p className="mt-3 text-mute">Fans sign in to vote and to make their score reports count for more. Coaches and reporters sign in, then request verification.</p>
      <div className="mt-8"><SignInForm /></div>
    </div>
  );
}
