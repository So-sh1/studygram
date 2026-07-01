import { DAY, todayKey } from "./utils.js";

export function createProgress() {
  return {
    correct: 0,
    wrong: 0,
    reviews: 0,
    due: Date.now(),
    interval: 0,
    ease: 2.5,
    starred: false,
    comment: "",
    lastReviewedAt: null,
    todayWrong: false
  };
}

export function progressFor(state, cardId) {
  if (!state.progress[cardId]) {
    state.progress[cardId] = createProgress();
  }
  return state.progress[cardId];
}

export function scheduleNext(progress, grade) {
  const now = Date.now();

  if (grade === 0) {
    progress.interval = 0;
    progress.due = now + 10 * 60 * 1000;
    progress.ease = Math.max(1.3, progress.ease - 0.25);
    return;
  }

  if (grade === 1) {
    progress.interval = Math.max(0.25, progress.interval * 0.5 || 0.25);
    progress.due = now + progress.interval * DAY;
    progress.ease = Math.max(1.3, progress.ease - 0.12);
    return;
  }

  if (grade === 2) {
    progress.interval = progress.interval < 1 ? 1 : Math.round(progress.interval * progress.ease);
    progress.due = now + progress.interval * DAY;
    return;
  }

  progress.interval = progress.interval < 1 ? 3 : Math.round(progress.interval * (progress.ease + 0.35));
  progress.due = now + progress.interval * DAY;
  progress.ease = Math.min(3.2, progress.ease + 0.08);
}

export function recordStudy(state, grade) {
  const today = todayKey();

  state.stats.history[today] = (state.stats.history[today] || 0) + 1;
  state.stats.totalReviews++;
  state.stats.xp += [4, 7, 10, 14][grade] || 5;

  if (state.stats.lastStudyDate !== today) {
    state.stats.streak = state.stats.lastStudyDate === todayKey(-1) ? state.stats.streak + 1 : 1;
    state.stats.bestStreak = Math.max(state.stats.bestStreak, state.stats.streak);
    state.stats.lastStudyDate = today;

    for (const progress of Object.values(state.progress)) {
      progress.todayWrong = false;
    }
  }
}

export function weakScore(progress) {
  return (progress.wrong * 2 + Math.max(0, progress.wrong - progress.correct)) / Math.max(1, progress.reviews);
}
