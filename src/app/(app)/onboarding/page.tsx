"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { useRouter } from "next/navigation";
import { Loader2, ArrowRight } from "lucide-react";

const LANGUAGES = [
  "English",
  "Portuguese",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Dutch",
  "Russian",
  "Chinese",
  "Japanese",
  "Korean",
  "Arabic",
  "Turkish",
  "Polish",
  "Swedish",
  "Other",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("");
  const updateUser = trpc.users.update.useMutation({
    onSuccess: () => router.push("/buffer"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nativeLanguage) return;
    updateUser.mutate({
      name: name.trim() || undefined,
      nativeLanguage,
    });
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to Unknot
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Let&apos;s set up your profile so we can help you learn better.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Your name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How should we call you?"
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
              What&apos;s your native language?
            </label>
            <select
              value={nativeLanguage}
              onChange={(e) => setNativeLanguage(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
            >
              <option value="">Select your language...</option>
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-neutral-400">
              We&apos;ll use this to translate vocabulary into your language.
            </p>
          </div>

          <button
            type="submit"
            disabled={!nativeLanguage || updateUser.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-neutral-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            {updateUser.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Get started
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
