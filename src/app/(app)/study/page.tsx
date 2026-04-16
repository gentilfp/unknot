"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import { Loader2, RotateCcw, Check, ChevronRight, Zap, PenLine } from "lucide-react";
import Link from "next/link";

export default function StudyPage() {
  const {
    data: dueCards,
    isLoading,
    refetch,
  } = trpc.cards.getDue.useQuery();
  const { data: stats } = trpc.cards.getStats.useQuery();
  const submitRating = trpc.cards.submit.useMutation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (!dueCards || dueCards.length === 0 || sessionComplete) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
        {sessionComplete ? (
          <>
            <Check className="h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-xl font-semibold">All done!</h2>
            <p className="mt-2 text-neutral-500">
              You reviewed {reviewedCount} card{reviewedCount !== 1 ? "s" : ""}{" "}
              this session.
            </p>
          </>
        ) : (
          <>
            <Check className="h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-xl font-semibold">No cards due!</h2>
            <p className="mt-2 text-neutral-500">
              Come back later or add more notes.
            </p>
          </>
        )}
        <Link
          href="/buffer"
          className="mt-6 flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          <PenLine className="h-4 w-4" />
          Capture more notes
        </Link>
      </div>
    );
  }

  const currentCard = dueCards[currentIndex];
  if (!currentCard) {
    setSessionComplete(true);
    return null;
  }

  const { card, vocab } = currentCard;

  async function handleRating(rating: 1 | 2 | 3 | 4) {
    try {
      await submitRating.mutateAsync({
        cardId: card.id,
        rating,
      });
      setFlipped(false);
      setReviewedCount((c) => c + 1);

      if (currentIndex + 1 >= dueCards!.length) {
        setSessionComplete(true);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    } catch {
      toast.error("Failed to submit rating");
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center">
      <div className="mb-6 text-sm text-neutral-400">
        {currentIndex + 1} of {dueCards.length} cards due
      </div>

      <button
        onClick={() => setFlipped(!flipped)}
        className="w-full cursor-pointer"
      >
        <div className="min-h-[280px] rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm transition-all dark:border-neutral-800 dark:bg-neutral-900">
          {!flipped ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center">
              <p className="text-2xl font-semibold">{vocab.term}</p>
              {vocab.ipa && (
                <p className="mt-2 text-sm text-neutral-400">{vocab.ipa}</p>
              )}
              <p className="mt-8 text-xs text-neutral-400">Tap to reveal</p>
            </div>
          ) : (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center space-y-3">
              <p className="text-lg font-medium text-neutral-500 dark:text-neutral-400">
                {vocab.term}
              </p>
              <p className="text-2xl font-semibold">{vocab.translation}</p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {vocab.partOfSpeech && (
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    {vocab.partOfSpeech}
                  </span>
                )}
                {vocab.gender && (
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                    {vocab.gender}
                  </span>
                )}
              </div>
              {vocab.exampleSentence && (
                <p className="pt-2 text-center text-sm italic text-neutral-500 dark:text-neutral-400">
                  &ldquo;{vocab.exampleSentence}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>
      </button>

      {flipped && (
        <div className="mt-6 grid w-full grid-cols-4 gap-2">
          <button
            onClick={() => handleRating(1)}
            disabled={submitRating.isPending}
            className="flex flex-col items-center gap-1 rounded-xl border border-red-200 bg-red-50 py-3 text-red-600 transition-colors hover:bg-red-100 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="text-xs font-medium">Again</span>
          </button>
          <button
            onClick={() => handleRating(2)}
            disabled={submitRating.isPending}
            className="flex flex-col items-center gap-1 rounded-xl border border-orange-200 bg-orange-50 py-3 text-orange-600 transition-colors hover:bg-orange-100 dark:border-orange-900/50 dark:bg-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/30"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="text-xs font-medium">Hard</span>
          </button>
          <button
            onClick={() => handleRating(3)}
            disabled={submitRating.isPending}
            className="flex flex-col items-center gap-1 rounded-xl border border-green-200 bg-green-50 py-3 text-green-600 transition-colors hover:bg-green-100 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
          >
            <Check className="h-4 w-4" />
            <span className="text-xs font-medium">Good</span>
          </button>
          <button
            onClick={() => handleRating(4)}
            disabled={submitRating.isPending}
            className="flex flex-col items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 py-3 text-blue-600 transition-colors hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
          >
            <Zap className="h-4 w-4" />
            <span className="text-xs font-medium">Easy</span>
          </button>
        </div>
      )}

      {stats && (
        <div className="mt-8 flex gap-6 text-center text-xs text-neutral-400">
          <div>
            <span className="block text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {Number(stats.total)}
            </span>
            Total
          </div>
          <div>
            <span className="block text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {Number(stats.dueNow)}
            </span>
            Due
          </div>
          <div>
            <span className="block text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {Number(stats.newCards)}
            </span>
            New
          </div>
        </div>
      )}
    </div>
  );
}
