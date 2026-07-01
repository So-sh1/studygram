function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[ぁ-ん]/g, char => String.fromCharCode(char.charCodeAt(0) + 0x60))
    .replace(/[。、．，,.\s_\-ー=＝]/g, "")
    .replace(/[()（）「」『』[\]{}]/g, "");
}

function levenshtein(a, b) {
  a = normalize(a);
  b = normalize(b);

  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  const current = Array(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;

    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }

    for (let j = 0; j <= b.length; j++) previous[j] = current[j];
  }

  return previous[b.length];
}

export function similarity(userAnswer, correctAnswer) {
  const answers = String(correctAnswer)
    .split(/[\/／,、;；]/)
    .map(v => v.trim())
    .filter(Boolean);

  const candidates = answers.length ? answers : [correctAnswer];
  let best = 0;

  for (const answer of candidates) {
    const user = normalize(userAnswer);
    const correct = normalize(answer);

    if (!correct) continue;
    if (user === correct) best = Math.max(best, 1);
    if (user && correct.includes(user)) best = Math.max(best, Math.min(0.92, user.length / correct.length + 0.18));
    if (correct && user.includes(correct)) best = Math.max(best, Math.min(0.98, correct.length / user.length + 0.18));

    const distance = levenshtein(user, correct);
    best = Math.max(best, 1 - distance / Math.max(user.length, correct.length, 1));
  }

  return Math.max(0, Math.min(1, best));
}

export function textMatches(query, ...parts) {
  const q = normalize(query);
  if (!q) return true;
  return normalize(parts.join(" ")).includes(q);
}
