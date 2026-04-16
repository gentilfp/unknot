"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import {
  Loader2,
  Sparkles,
  ArrowLeft,
  GraduationCap,
  Archive,
  ChevronDown,
  Tag,
} from "lucide-react";
import Link from "next/link";

type VocabItem = {
  id: string;
  term: string;
  translation: string | null;
  partOfSpeech: string | null;
  gender: string | null;
  plural: string | null;
  ipa: string | null;
  category: string | null;
  exampleSentence: string | null;
  kept: boolean;
};

type UnknotResultData = {
  detectedLanguage: string | null;
  rawJson: unknown;
  vocabularyItems: VocabItem[];
};

export default function BufferPage() {
  const [rawText, setRawText] = useState("");
  const [label, setLabel] = useState("");
  const [showLabel, setShowLabel] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<UnknotResultData | null>(null);

  const createNote = trpc.notes.create.useMutation();
  const processNote = trpc.unknot.process.useMutation();
  const getResult = trpc.unknot.getResult.useQuery(
    { noteId: result ? "" : "" },
    { enabled: false }
  );
  const archiveItem = trpc.unknot.archiveItem.useMutation();

  async function handleUnknot() {
    if (!rawText.trim()) return;
    setProcessing(true);

    try {
      const note = await createNote.mutateAsync({
        rawText: rawText.trim(),
        label: label.trim() || undefined,
      });

      await processNote.mutateAsync({ noteId: note.id });

      // Fetch the result
      const res = await fetch(
        `/api/trpc/unknot.getResult?input=${encodeURIComponent(
          JSON.stringify({ noteId: note.id })
        )}`
      );
      const json = await res.json();
      const data = json.result?.data;

      if (data) {
        setResult(data);
        toast.success("Notes unknotted successfully!");
      }
    } catch (error) {
      toast.error("Failed to unknot notes. Please try again.");
      console.error(error);
    } finally {
      setProcessing(false);
    }
  }

  function handleArchive(itemId: string) {
    archiveItem.mutate(
      { vocabularyItemId: itemId },
      {
        onSuccess: () => {
          setResult((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              vocabularyItems: prev.vocabularyItems.map((item) =>
                item.id === itemId ? { ...item, kept: false } : item
              ),
            };
          });
          toast.success("Item archived");
        },
      }
    );
  }

  function handleReset() {
    setRawText("");
    setLabel("");
    setResult(null);
    setShowLabel(false);
  }

  const charCount = rawText.length;
  const isOverLimit = charCount > 2000;

  if (result) {
    const keptItems = result.vocabularyItems.filter((item) => item.kept);
    const rawJson = result.rawJson as { grammarPatterns?: Array<{ pattern: string; explanation: string; examples: string[] }> } | null;
    const grammarPatterns = rawJson?.grammarPatterns ?? [];

    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Buffer
          </button>
          <Link
            href="/study"
            className="flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            <GraduationCap className="h-4 w-4" />
            Study Now
          </Link>
        </div>

        {result.detectedLanguage && (
          <div className="inline-block rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
            {result.detectedLanguage}
          </div>
        )}

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            Vocabulary ({keptItems.length})
          </h2>
          {keptItems.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold">{item.term}</span>
                    {item.ipa && (
                      <span className="text-sm text-neutral-400">
                        {item.ipa}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-neutral-600 dark:text-neutral-400">
                    {item.translation}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.partOfSpeech && (
                      <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                        {item.partOfSpeech}
                      </span>
                    )}
                    {item.gender && (
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        {item.gender}
                      </span>
                    )}
                    {item.plural && (
                      <span className="rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                        pl. {item.plural}
                      </span>
                    )}
                    {item.category && (
                      <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-600 dark:bg-green-900/30 dark:text-green-400">
                        {item.category}
                      </span>
                    )}
                  </div>
                  {item.exampleSentence && (
                    <p className="mt-3 text-sm italic text-neutral-500 dark:text-neutral-400">
                      &ldquo;{item.exampleSentence}&rdquo;
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleArchive(item.id)}
                  className="ml-2 rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
                  title="Archive"
                >
                  <Archive className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {grammarPatterns.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Grammar Patterns</h2>
            {grammarPatterns.map((pattern, i) => (
              <div
                key={i}
                className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <h3 className="font-medium">{pattern.pattern}</h3>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                  {pattern.explanation}
                </p>
                {pattern.examples.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {pattern.examples.map((ex, j) => (
                      <li
                        key={j}
                        className="text-sm italic text-neutral-500 dark:text-neutral-400"
                      >
                        &ldquo;{ex}&rdquo;
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Buffer</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Paste or type your language notes. We&apos;ll unknot them for you.
        </p>
      </div>

      <div className="space-y-3">
        <textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder="Type or paste your notes here...

Examples:
  Grundstück - property/plot of land
  die Entscheidung treffen - to make a decision
  ich hätte gern - I would like"
          rows={10}
          className="w-full resize-none rounded-xl border border-neutral-200 bg-white p-4 text-base placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:focus:border-neutral-600 dark:focus:ring-neutral-600"
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!showLabel ? (
              <button
                onClick={() => setShowLabel(true)}
                className="flex items-center gap-1 text-sm text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
              >
                <Tag className="h-3.5 w-3.5" />
                Add label
              </button>
            ) : (
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., German B2 - Unit 4"
                className="w-48 rounded-lg border border-neutral-200 bg-transparent px-3 py-1.5 text-sm placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none dark:border-neutral-700"
              />
            )}
          </div>
          <span
            className={`text-sm ${
              isOverLimit
                ? "text-red-500"
                : "text-neutral-400"
            }`}
          >
            {charCount} / 2000
          </span>
        </div>

        <button
          onClick={handleUnknot}
          disabled={!rawText.trim() || isOverLimit || processing}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Unknotting...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Unknot this
            </>
          )}
        </button>
      </div>
    </div>
  );
}
