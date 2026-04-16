"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Save, LogOut } from "lucide-react";

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

export default function SettingsPage() {
  const { data: user, isLoading } = trpc.users.me.useQuery();
  const updateUser = trpc.users.update.useMutation({
    onSuccess: () => toast.success("Settings saved"),
  });

  const [name, setName] = useState("");
  const [nativeLanguage, setNativeLanguage] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setNativeLanguage(user.nativeLanguage || "");
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  function handleSave() {
    updateUser.mutate({ name, nativeLanguage });
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

      <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Native language
          </label>
          <select
            value={nativeLanguage}
            onChange={(e) => setNativeLanguage(e.target.value)}
            className="mt-1 w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:focus:border-neutral-100 dark:focus:ring-neutral-100"
          >
            <option value="">Select...</option>
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-neutral-400">
            Used for translations when unknotting your notes.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={updateUser.isPending}
          className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {updateUser.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save
        </button>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Signed in as <strong>{user?.email}</strong>
        </p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
