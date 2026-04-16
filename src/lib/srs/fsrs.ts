import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  type Card,
  type Grade,
} from "ts-fsrs";

const f = fsrs(generatorParameters({ enable_fuzz: true }));

export function scheduleCard(card: Card, rating: Grade) {
  const now = new Date();
  const scheduling = f.repeat(card, now);
  return scheduling[rating].card;
}

export function newEmptyCard() {
  return createEmptyCard();
}

export { type Card, type Grade };
