import { $$ } from "./dom.js";
import { todayKey, escapeHtml } from "../core/utils.js";
import { progressFor, weakScore } from "../core/scheduler.js";
import { allCards, allSharedCards } from "../core/decks.js";
import { textMatches } from "../core/matcher.js";

export function renderAll(ctx) {
  renderTheme(ctx);
  renderHomeStats(ctx);
  renderQuiz(ctx);
  renderRanges(ctx);
  renderCards(ctx);
  renderStats(ctx);
  renderSettings(ctx);
}

export function renderTheme(ctx) {
  document.body.classList.toggle("light", !ctx.state.settings.dark);
}

export function renderHomeStats(ctx) {
  const { state, els } = ctx;
  const today = state.stats.history[todayKey()] || 0;
  const progressList = Object.values(state.progress);
  const correct = progressList.reduce((sum, p) => sum + (p.correct || 0), 0);
  const wrong = progressList.reduce((sum, p) => sum + (p.wrong || 0), 0);
  const acc = correct + wrong ? Math.round(correct / (correct + wrong) * 100) : 0;
  const due = allCards(state).filter(card => card.enabled && progressFor(state, card.id).due <= Date.now()).length;

  els.todayCount.textContent = today;
  els.accuracyCount.textContent = acc;
  els.dueCount.textContent = due;
}

export function renderQuiz(ctx) {
  const { state, els } = ctx;
  const card = ctx.queue[ctx.currentIndex] || null;

  els.resultPanel.classList.add("hidden");
  els.answerInput.value = "";
  ctx.lastResult = null;

  els.cardProgress.textContent = ctx.queue.length ? `${ctx.currentIndex + 1} / ${ctx.queue.length}` : "0 / 0";

  if (!card) {
    els.cardSource.textContent = "未選択";
    els.cardMeta.textContent = "出題範囲をONにすると問題が表示されます。";
    els.questionText.textContent = "問題がありません";
    els.answerText.textContent = "";
    els.explainText.textContent = "";
    els.hintText.textContent = "";
    els.commentInput.value = "";
    els.starBtn.textContent = "☆";
    return;
  }

  const progress = progressFor(state, card.id);
  els.cardSource.textContent = card.source === "shared" ? `${card.subject} ${card.exam}` : "マイ問題";
  els.cardMeta.textContent = `${card.deckTitle}・正解${progress.correct} / 不正解${progress.wrong}`;
  els.questionText.textContent = card.question;
  els.answerText.textContent = card.answer;
  els.hintText.textContent = card.hint ? `ヒント：${card.hint}` : "";
  els.explainText.textContent = card.explanation || "";
  els.commentInput.value = progress.comment || "";
  els.starBtn.textContent = progress.starred ? "★" : "☆";
}

export function renderRanges(ctx) {
  const { state, els } = ctx;
  els.syncInfo.textContent = state.sync.lastMessage || "未同期";
  els.myCardsEnabled.checked = !!state.settings.myEnabled;
  els.sharedRangeList.innerHTML = "";

  const decks = Object.values(state.sharedDecks);

  if (!decks.length) {
    els.sharedRangeList.innerHTML = `<p class="card-meta">共有問題はまだありません。「同期」を押してください。</p>`;
    return;
  }

  for (const deck of decks) {
    const node = els.deckItemTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector(".deck-title").textContent = deck.title;
    node.querySelector(".deck-meta").textContent = `${deck.subject}・${deck.exam}・${deck.cards.length}問・更新 ${deck.updatedAt || "不明"}`;
    const checkbox = node.querySelector(".deck-enabled");
    checkbox.checked = !!state.settings.enabledSharedDecks[deck.deckId];
    checkbox.addEventListener("change", () => {
      state.settings.enabledSharedDecks[deck.deckId] = checkbox.checked;
      ctx.refresh();
    });
    els.sharedRangeList.appendChild(node);
  }
}

export function renderCards(ctx) {
  renderMyCards(ctx);
  renderSharedCards(ctx);
}

function renderMyCards(ctx) {
  const { state, els } = ctx;
  const query = els.mySearchInput.value;
  const cards = state.myCards.filter(card => textMatches(query, card.question, card.answer, card.subject, card.exam, (card.tags || []).join(" ")));

  els.myCardsSummary.textContent = `${cards.length} / ${state.myCards.length}問`;
  els.myCardsList.innerHTML = "";

  if (!cards.length) {
    els.myCardsList.innerHTML = `<p class="card-meta">マイ問題はまだありません。</p>`;
    return;
  }

  for (const card of cards) {
    const node = cardNode(ctx, card, true);
    els.myCardsList.appendChild(node);
  }
}

function renderSharedCards(ctx) {
  const { els, state } = ctx;
  const query = els.sharedSearchInput.value;
  const cards = allSharedCards(state).filter(card => textMatches(query, card.question, card.answer, card.subject, card.exam, (card.tags || []).join(" ")));

  els.sharedCardsList.innerHTML = "";

  if (!cards.length) {
    els.sharedCardsList.innerHTML = `<p class="card-meta">共有問題はまだありません。</p>`;
    return;
  }

  for (const card of cards) {
    els.sharedCardsList.appendChild(cardNode(ctx, card, false));
  }
}

function cardNode(ctx, card, editable) {
  const node = ctx.els.cardItemTemplate.content.firstElementChild.cloneNode(true);
  const progress = progressFor(ctx.state, card.id);

  node.querySelector(".card-question").textContent = card.question;
  node.querySelector(".card-answer").textContent = `答え：${card.answer}`;
  node.querySelector(".card-meta").textContent = `${card.subject || "その他"}・${card.exam || "未分類"}・正解${progress.correct} / 不正解${progress.wrong}`;

  const actions = node.querySelector(".card-actions");

  const star = document.createElement("button");
  star.textContent = progress.starred ? "★" : "☆";
  star.addEventListener("click", () => {
    progress.starred = !progress.starred;
    ctx.refresh();
  });
  actions.appendChild(star);

  const memo = document.createElement("button");
  memo.textContent = "メモ";
  memo.addEventListener("click", () => {
    const next = prompt("自分用メモ", progress.comment || "");
    if (next !== null) {
      progress.comment = next;
      ctx.refresh();
    }
  });
  actions.appendChild(memo);

  if (editable) {
    const edit = document.createElement("button");
    edit.textContent = "編集";
    edit.addEventListener("click", () => ctx.editMyCard(card.id));
    actions.appendChild(edit);

    const remove = document.createElement("button");
    remove.textContent = "削除";
    remove.className = "danger";
    remove.addEventListener("click", () => ctx.deleteMyCard(card.id));
    actions.appendChild(remove);
  }

  return node;
}

export function renderStats(ctx) {
  const { state, els } = ctx;
  const progressList = Object.values(state.progress);
  const weak = progressList.filter(p => p.wrong > p.correct);

  els.totalReviews.textContent = state.stats.totalReviews;
  els.streakDays.textContent = `${state.stats.streak}日`;
  els.levelText.textContent = Math.floor(Math.sqrt(state.stats.xp / 40)) + 1;
  els.weakCards.textContent = weak.length;

  const days = Array.from({ length: 7 }, (_, i) => todayKey(i - 6));
  const max = Math.max(1, ...days.map(day => state.stats.history[day] || 0));
  els.historyBars.innerHTML = days.map(day => {
    const value = state.stats.history[day] || 0;
    const height = Math.max(6, Math.round(value / max * 110));
    return `<div class="bar-wrap"><div class="bar" style="height:${height}px"></div><span>${day.slice(5).replace("-", "/")}</span><b>${value}</b></div>`;
  }).join("");

  const cardMap = new Map(allCards(state).map(card => [card.id, card]));
  const topWeak = Object.entries(state.progress)
    .filter(([, p]) => p.wrong > p.correct)
    .sort(([, a], [, b]) => weakScore(b) - weakScore(a))
    .slice(0, 5);

  els.weakList.innerHTML = topWeak.length
    ? topWeak.map(([id, p], index) => {
        const card = cardMap.get(id);
        return `<article class="card-item"><strong>${index + 1}. ${escapeHtml(card?.question || "削除済みの問題")}</strong><p class="card-meta">正解${p.correct} / 不正解${p.wrong}</p></article>`;
      }).join("")
    : `<p class="card-meta">苦手問題はまだありません。</p>`;
}

export function renderSettings(ctx) {
  const { state, els } = ctx;
  els.modeSelect.value = state.settings.mode;
  els.strictnessSelect.value = String(Number(state.settings.strictness).toFixed(2));
  els.dailyGoalInput.value = state.settings.dailyGoal;
}
