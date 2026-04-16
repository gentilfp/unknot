import { describe, it, expect } from "vitest";
import { scheduleCard, newEmptyCard } from "@/lib/srs/fsrs";
import { Rating } from "ts-fsrs";

describe("FSRS wrapper", () => {
  it("creates an empty card with default values", () => {
    const card = newEmptyCard();
    expect(card.stability).toBeDefined();
    expect(card.difficulty).toBeDefined();
    expect(card.reps).toBe(0);
    expect(card.lapses).toBe(0);
  });

  it("schedules a new card after Good rating", () => {
    const card = newEmptyCard();
    const updated = scheduleCard(card, Rating.Good);

    expect(updated.reps).toBe(1);
    expect(updated.stability).toBeGreaterThan(0);
    expect(updated.due).toBeInstanceOf(Date);
    expect(updated.due.getTime()).toBeGreaterThan(Date.now());
  });

  it("schedules a new card after Again rating", () => {
    const card = newEmptyCard();
    const updated = scheduleCard(card, Rating.Again);

    expect(updated.reps).toBe(1);
    // New cards don't increment lapses on first Again — lapses only count for review cards
    expect(updated.lapses).toBe(0);
  });

  it("schedules a new card after Easy rating with longer interval", () => {
    const card = newEmptyCard();
    const good = scheduleCard(card, Rating.Good);
    const easy = scheduleCard(card, Rating.Easy);

    // Easy should schedule further out than Good
    expect(easy.scheduled_days).toBeGreaterThanOrEqual(
      good.scheduled_days
    );
  });

  it("increases reps on successive reviews", () => {
    let card = newEmptyCard();
    card = scheduleCard(card, Rating.Good);
    expect(card.reps).toBe(1);

    card = scheduleCard(card, Rating.Good);
    expect(card.reps).toBe(2);

    card = scheduleCard(card, Rating.Good);
    expect(card.reps).toBe(3);
  });
});
