import { parseTags } from "./utils.js";

export const DECK_INDEX_URL = "./data/shared-decks/index.json";

export async function syncSharedDecks(state) {
  const indexData = await fetchJson(DECK_INDEX_URL);
  let added = 0;
  let updated = 0;
  let cards = 0;

  for (const meta of indexData.decks || []) {
    const deck = sanitizeDeck(await fetchJson(meta.file), meta);
    const existed = !!state.sharedDecks[deck.deckId];

    state.sharedDecks[deck.deckId] = deck;
    if (!(deck.deckId in state.settings.enabledSharedDecks)) {
      state.settings.enabledSharedDecks[deck.deckId] = true;
    }

    existed ? updated++ : added++;
    cards += deck.cards.length;
  }

  state.sync.lastSyncedAt = new Date().toLocaleString("ja-JP");
  state.sync.lastMessage = `同期完了：${cards}問`;
  return { added, updated, cards };
}

async function fetchJson(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Fetch failed: ${url}`);
  return response.json();
}

function sanitizeDeck(deck, meta = {}) {
  const deckId = String(deck.deckId || meta.deckId || "");
  if (!deckId) throw new Error("Deck id is required");

  return {
    deckId,
    title: String(deck.title || meta.title || deckId),
    subject: String(deck.subject || meta.subject || "その他"),
    exam: String(deck.exam || meta.exam || "未分類"),
    version: String(deck.version || meta.version || "1.0.0"),
    updatedAt: String(deck.updatedAt || meta.updatedAt || ""),
    cards: (deck.cards || [])
      .map(card => ({
        id: String(card.id || ""),
        question: String(card.question || ""),
        answer: String(card.answer || ""),
        tags: Array.isArray(card.tags) ? card.tags.map(String) : parseTags(card.tags),
        hint: String(card.hint || ""),
        explanation: String(card.explanation || "")
      }))
      .filter(card => card.id && card.question && card.answer)
  };
}

export function allSharedCards(state) {
  return Object.values(state.sharedDecks).flatMap(deck =>
    deck.cards.map(card => ({
      ...card,
      source: "shared",
      deckId: deck.deckId,
      deckTitle: deck.title,
      subject: deck.subject,
      exam: deck.exam,
      enabled: !!state.settings.enabledSharedDecks[deck.deckId]
    }))
  );
}

export function allMyCards(state) {
  return state.myCards.map(card => ({
    ...card,
    source: "my",
    deckId: "my",
    deckTitle: "マイ問題",
    enabled: !!state.settings.myEnabled
  }));
}

export function allCards(state) {
  return [...allSharedCards(state), ...allMyCards(state)];
}
