import { allCards } from "./decks.js";
import { progressFor, weakScore } from "./scheduler.js";

export function buildQueue(state) {
  let cards = allCards(state).filter(card => card.enabled);
  const mode = state.settings.mode;
  const now = Date.now();

  if (mode === "smart") {
    const due = cards.filter(card => progressFor(state, card.id).due <= now);
    const weak = cards.filter(card => {
      const p = progressFor(state, card.id);
      return p.wrong > p.correct;
    });

    cards = [...new Map([...due, ...weak, ...cards].map(card => [card.id, card])).values()];
    cards.sort((a, b) => {
      const pa = progressFor(state, a.id);
      const pb = progressFor(state, b.id);
      return (pa.due - pb.due) || (weakScore(pb) - weakScore(pa));
    });

    return cards;
  }

  if (mode === "weak") {
    return cards.filter(card => {
      const p = progressFor(state, card.id);
      return p.wrong > p.correct;
    }).sort((a, b) => weakScore(progressFor(state, b.id)) - weakScore(progressFor(state, a.id)));
  }

  if (mode === "starred") {
    return cards.filter(card => progressFor(state, card.id).starred);
  }

  if (mode === "todayWrong") {
    return cards.filter(card => progressFor(state, card.id).todayWrong);
  }

  return cards;
}
