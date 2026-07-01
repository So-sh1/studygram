import { loadState, saveState, exportState, importState } from "./core/storage.js";
import { uuid, parseTags, todayKey, downloadJson, readJsonFile } from "./core/utils.js";
import { similarity } from "./core/matcher.js";
import { progressFor, scheduleNext, recordStudy } from "./core/scheduler.js";
import { syncSharedDecks } from "./core/decks.js";
import { buildQueue } from "./core/quiz.js";
import { $, $$, setScreen, showToast } from "./ui/dom.js";
import { renderAll } from "./ui/render.js";

const state = loadState();

const ctx = {
  state,
  queue: [],
  currentIndex: 0,
  lastResult: null,
  els: {
    todayCount: $("#todayCount"),
    accuracyCount: $("#accuracyCount"),
    dueCount: $("#dueCount"),
    cardSource: $("#cardSource"),
    cardProgress: $("#cardProgress"),
    cardMeta: $("#cardMeta"),
    questionText: $("#questionText"),
    answerInput: $("#answerInput"),
    checkAnswerBtn: $("#checkAnswerBtn"),
    showAnswerBtn: $("#showAnswerBtn"),
    resultPanel: $("#resultPanel"),
    judgeText: $("#judgeText"),
    matchRate: $("#matchRate"),
    answerText: $("#answerText"),
    hintText: $("#hintText"),
    explainText: $("#explainText"),
    commentInput: $("#commentInput"),
    prevCardBtn: $("#prevCardBtn"),
    nextCardBtn: $("#nextCardBtn"),
    starBtn: $("#starBtn"),
    themeToggle: $("#themeToggle"),
    syncBtn: $("#syncBtn"),
    syncInfo: $("#syncInfo"),
    sharedRangeList: $("#sharedRangeList"),
    myCardsEnabled: $("#myCardsEnabled"),
    myCardForm: $("#myCardForm"),
    myQuestion: $("#myQuestion"),
    myAnswer: $("#myAnswer"),
    mySubject: $("#mySubject"),
    myExam: $("#myExam"),
    myTags: $("#myTags"),
    myHint: $("#myHint"),
    myExplanation: $("#myExplanation"),
    mySearchInput: $("#mySearchInput"),
    sharedSearchInput: $("#sharedSearchInput"),
    myCardsList: $("#myCardsList"),
    sharedCardsList: $("#sharedCardsList"),
    myCardsSummary: $("#myCardsSummary"),
    totalReviews: $("#totalReviews"),
    streakDays: $("#streakDays"),
    levelText: $("#levelText"),
    weakCards: $("#weakCards"),
    historyBars: $("#historyBars"),
    weakList: $("#weakList"),
    modeSelect: $("#modeSelect"),
    strictnessSelect: $("#strictnessSelect"),
    dailyGoalInput: $("#dailyGoalInput"),
    exportBtn: $("#exportBtn"),
    importFile: $("#importFile"),
    resetBtn: $("#resetBtn"),
    deckItemTemplate: $("#deckItemTemplate"),
    cardItemTemplate: $("#cardItemTemplate")
  },
  refresh,
  editMyCard,
  deleteMyCard
};

function refresh() {
  ctx.queue = buildQueue(ctx.state);
  if (ctx.currentIndex >= ctx.queue.length) ctx.currentIndex = 0;
  renderAll(ctx);
  saveState(ctx.state);
}

function currentCard() {
  return ctx.queue[ctx.currentIndex] || null;
}

function checkAnswer(showOnly = false) {
  const card = currentCard();
  if (!card) return;

  const score = showOnly ? 0 : similarity(ctx.els.answerInput.value, card.answer);
  const ok = score >= Number(ctx.state.settings.strictness);

  ctx.els.resultPanel.classList.remove("hidden");
  ctx.els.matchRate.textContent = showOnly ? "表示" : `${Math.round(score * 100)}%`;
  ctx.els.judgeText.textContent = showOnly ? "答え確認" : ok ? "たぶん正解" : "要確認";
  ctx.els.judgeText.style.background = showOnly ? "var(--blue)" : ok ? "var(--green)" : "var(--yellow)";
  ctx.els.answerText.textContent = card.answer;
  ctx.els.hintText.textContent = card.hint ? `ヒント：${card.hint}` : "";
  ctx.els.explainText.textContent = card.explanation || "";
  ctx.els.commentInput.value = progressFor(ctx.state, card.id).comment || "";
  ctx.lastResult = { ok, score };
}

function gradeCurrent(grade) {
  const card = currentCard();
  if (!card) return;

  const progress = progressFor(ctx.state, card.id);
  progress.comment = ctx.els.commentInput.value.trim();
  progress.reviews++;
  progress.lastReviewedAt = Date.now();
  progress.todayWrong = grade < 2;

  if (grade >= 2) progress.correct++;
  else progress.wrong++;

  scheduleNext(progress, grade);
  recordStudy(ctx.state, grade);
  nextCard();
}

function nextCard() {
  if (ctx.queue.length) ctx.currentIndex = (ctx.currentIndex + 1) % ctx.queue.length;
  refresh();
}

function prevCard() {
  if (ctx.queue.length) ctx.currentIndex = (ctx.currentIndex - 1 + ctx.queue.length) % ctx.queue.length;
  refresh();
}

function addMyCard(data) {
  ctx.state.myCards.push({
    id: uuid("my"),
    question: data.question.trim(),
    answer: data.answer.trim(),
    subject: data.subject.trim() || "その他",
    exam: data.exam.trim() || "未分類",
    tags: parseTags(data.tags),
    hint: data.hint.trim(),
    explanation: data.explanation.trim(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
}

function editMyCard(id) {
  const card = ctx.state.myCards.find(card => card.id === id);
  if (!card) return;

  const question = prompt("問題", card.question);
  if (question === null) return;
  const answer = prompt("答え", card.answer);
  if (answer === null) return;
  const subject = prompt("教科", card.subject);
  if (subject === null) return;
  const exam = prompt("テスト", card.exam);
  if (exam === null) return;

  card.question = question.trim();
  card.answer = answer.trim();
  card.subject = subject.trim() || "その他";
  card.exam = exam.trim() || "未分類";
  card.updatedAt = Date.now();
  refresh();
}

function deleteMyCard(id) {
  if (!confirm("このマイ問題を削除しますか？")) return;
  ctx.state.myCards = ctx.state.myCards.filter(card => card.id !== id);
  refresh();
}

function bindEvents() {
  $$(".nav-btn").forEach(button => {
    button.addEventListener("click", () => setScreen(button.dataset.target));
  });

  $$(".segment-btn").forEach(button => {
    button.addEventListener("click", () => {
      $$(".segment-btn").forEach(btn => btn.classList.toggle("active", btn === button));
      $$(".card-panel").forEach(panel => panel.classList.toggle("active", panel.id === button.dataset.cardPanel));
    });
  });

  ctx.els.themeToggle.addEventListener("click", () => {
    ctx.state.settings.dark = !ctx.state.settings.dark;
    refresh();
  });

  ctx.els.checkAnswerBtn.addEventListener("click", () => checkAnswer(false));
  ctx.els.showAnswerBtn.addEventListener("click", () => checkAnswer(true));
  ctx.els.nextCardBtn.addEventListener("click", nextCard);
  ctx.els.prevCardBtn.addEventListener("click", prevCard);

  $("#hintBtn")?.addEventListener("click", () => {
    const card = currentCard();
    showToast(card?.hint || "ヒントはありません。");
  });

  ctx.els.starBtn.addEventListener("click", () => {
    const card = currentCard();
    if (!card) return;
    const progress = progressFor(ctx.state, card.id);
    progress.starred = !progress.starred;
    refresh();
  });

  $$(".grade").forEach(button => {
    button.addEventListener("click", () => gradeCurrent(Number(button.dataset.grade)));
  });

  ctx.els.answerInput.addEventListener("keydown", event => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (ctx.els.resultPanel.classList.contains("hidden")) checkAnswer(false);
      else gradeCurrent(ctx.lastResult?.ok ? 2 : 1);
    }
  });

  ctx.els.syncBtn.addEventListener("click", async () => {
    ctx.els.syncBtn.disabled = true;
    ctx.els.syncInfo.textContent = "同期中...";
    try {
      const result = await syncSharedDecks(ctx.state);
      showToast(`同期完了：${result.cards}問`);
    } catch (error) {
      ctx.state.sync.lastMessage = "同期に失敗しました。ファイル配置を確認してください。";
      showToast("同期に失敗しました。");
    }
    ctx.els.syncBtn.disabled = false;
    refresh();
  });

  ctx.els.myCardsEnabled.addEventListener("change", () => {
    ctx.state.settings.myEnabled = ctx.els.myCardsEnabled.checked;
    refresh();
  });

  ctx.els.myCardForm.addEventListener("submit", event => {
    event.preventDefault();
    addMyCard({
      question: ctx.els.myQuestion.value,
      answer: ctx.els.myAnswer.value,
      subject: ctx.els.mySubject.value,
      exam: ctx.els.myExam.value,
      tags: ctx.els.myTags.value,
      hint: ctx.els.myHint.value,
      explanation: ctx.els.myExplanation.value
    });
    ctx.els.myCardForm.reset();
    setScreen("home");
    showToast("マイ問題を保存しました。");
    refresh();
  });

  ctx.els.mySearchInput.addEventListener("input", refresh);
  ctx.els.sharedSearchInput.addEventListener("input", refresh);

  ctx.els.modeSelect.addEventListener("change", () => {
    ctx.state.settings.mode = ctx.els.modeSelect.value;
    ctx.currentIndex = 0;
    refresh();
  });

  ctx.els.strictnessSelect.addEventListener("change", () => {
    ctx.state.settings.strictness = Number(ctx.els.strictnessSelect.value);
    refresh();
  });

  ctx.els.dailyGoalInput.addEventListener("input", () => {
    ctx.state.settings.dailyGoal = Math.max(1, Number(ctx.els.dailyGoalInput.value || 30));
    refresh();
  });

  ctx.els.exportBtn.addEventListener("click", () => {
    downloadJson(`studygram-backup-${todayKey()}.json`, exportState(ctx.state));
  });

  ctx.els.importFile.addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const backup = await readJsonFile(file);
      const imported = importState(ctx.state, backup);
      Object.assign(ctx.state, imported);
      showToast("バックアップを読み込みました。");
      refresh();
    } catch {
      showToast("読み込みに失敗しました。");
    } finally {
      event.target.value = "";
    }
  });

  ctx.els.resetBtn.addEventListener("click", () => {
    if (!confirm("この端末のデータをすべて削除しますか？")) return;
    localStorage.removeItem("studygram_v2_state");
    location.reload();
  });
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

bindEvents();
refresh();
