"use client";

import { trpc } from "@/lib/trpc/client";
import { Loader2, FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useState } from "react";

export default function LibraryPage() {
  const { data: notes, isLoading, refetch } = trpc.notes.list.useQuery();
  const deleteNote = trpc.notes.delete.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Note deleted");
    },
  });

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [languageFilter, setLanguageFilter] = useState<string>("all");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  const languages = [
    "all",
    ...new Set(notes?.map((n) => n.language).filter(Boolean) as string[]),
  ];

  const filtered =
    languageFilter === "all"
      ? notes
      : notes?.filter((n) => n.language === languageFilter);

  if (!filtered || filtered.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Library</h1>
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center dark:border-neutral-800 dark:bg-neutral-900">
          <FileText className="mx-auto h-10 w-10 text-neutral-300 dark:text-neutral-600" />
          <p className="mt-3 text-neutral-500">No notes yet.</p>
          <Link
            href="/buffer"
            className="mt-3 inline-block text-sm font-medium text-neutral-900 underline dark:text-neutral-100"
          >
            Start capturing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Library</h1>
        {languages.length > 2 && (
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang === "all" ? "All languages" : lang}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="space-y-3">
        {filtered.map((note) => (
          <div
            key={note.id}
            className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="flex items-start justify-between">
              <button
                onClick={() =>
                  setExpandedId(expandedId === note.id ? null : note.id)
                }
                className="flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${
                      note.status === "done"
                        ? "bg-green-500"
                        : note.status === "error"
                          ? "bg-red-500"
                          : note.status === "processing"
                            ? "bg-yellow-500"
                            : "bg-neutral-300"
                    }`}
                  />
                  <span className="text-xs font-medium uppercase text-neutral-400">
                    {note.status}
                  </span>
                  {note.language && (
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                      {note.language}
                    </span>
                  )}
                  {note.label && (
                    <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      {note.label}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                  {note.rawText}
                </p>
                <p className="mt-1 text-xs text-neutral-400">
                  {note.createdAt
                    ? new Date(note.createdAt).toLocaleDateString()
                    : ""}
                </p>
              </button>
              <button
                onClick={() =>
                  deleteNote.mutate({ noteId: note.id })
                }
                className="ml-2 rounded-lg p-2 text-neutral-400 hover:bg-neutral-100 hover:text-red-500 dark:hover:bg-neutral-800"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {expandedId === note.id && (
              <div className="mt-3 rounded-lg bg-neutral-50 p-3 dark:bg-neutral-800/50">
                <pre className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">
                  {note.rawText}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
