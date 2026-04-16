"use client";

import { trpc } from "@/lib/trpc/client";
import { Loader2, Archive, Layers } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function CardsPage() {
  const { data: cards, isLoading, refetch } = trpc.cards.list.useQuery();
  const archiveCard = trpc.cards.archive.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Card archived");
    },
  });

  const [languageFilter, setLanguageFilter] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const activeCards = cards?.filter((c) => c.vocab.kept) ?? [];

  const languages = [
    "all",
    ...new Set(
      activeCards
        .map((c) => c.vocab.category)
        .filter(Boolean) as string[]
    ),
  ];

  const filtered =
    languageFilter === "all"
      ? activeCards
      : activeCards.filter((c) => c.vocab.category === languageFilter);

  if (activeCards.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Cards</h1>
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <Layers className="mx-auto h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="mt-3 text-neutral-500">No flashcards yet.</p>
        </div>
      </div>
    );
  }

  const stateColors: Record<string, string> = {
    new: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    learning:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    review:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    relearning:
      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Cards ({activeCards.length})
        </h1>
        {languages.length > 2 && (
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang === "all" ? "All categories" : lang}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-2">
        {filtered.map(({ card, vocab }) => (
          <div
            key={card.id}
            className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{vocab.term}</span>
                <span className="text-sm text-neutral-400">
                  {vocab.translation}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${stateColors[card.state] ?? stateColors.new}`}
                >
                  {card.state}
                </span>
                <span className="text-xs text-neutral-400">
                  Due:{" "}
                  {card.dueAt
                    ? new Date(card.dueAt).toLocaleDateString()
                    : "now"}
                </span>
                {vocab.category && (
                  <span className="text-xs text-neutral-400">
                    {vocab.category}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => archiveCard.mutate({ cardId: card.id })}
              className="rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 dark:hover:bg-neutral-800"
              title="Archive"
            >
              <Archive className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
