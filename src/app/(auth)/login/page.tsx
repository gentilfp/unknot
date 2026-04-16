"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Mail, ArrowRight, CheckCircle, Loader2 } from "lucide-react";

function LoginForm() {
  const searchParams = useSearchParams();
  const isVerify = searchParams.get("verify") === "true";
  const callbackUrl = searchParams.get("callbackUrl") || "/buffer";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(isVerify);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await signIn("email", { email, callbackUrl, redirect: false });
    setLoading(false);
    setSent(true);
  }

  return (
    <>
      {sent ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <CheckCircle className="mx-auto mb-4 h-10 w-10 text-green-500" />
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            We sent a magic link to <strong>{email || "your email"}</strong>.
            Click it to sign in.
          </p>
          <button
            onClick={() => setSent(false)}
            className="mt-4 text-sm text-neutral-500 underline hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <label
            htmlFor="email"
            className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Email address
          </label>
          <div className="relative mt-2">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-neutral-300 bg-transparent py-2.5 pl-10 pr-4 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:text-neutral-100 dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !email}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Send magic link
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 dark:bg-neutral-950">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Unknot
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Capture. Unknot. Learn.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
