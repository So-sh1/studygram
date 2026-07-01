# StudyGram v2

スマホ向けの一問一答アプリです。共有問題とマイ問題を分け、学習履歴を問題IDごとに保存します。

## v2の方針

- UI文言は標準語
- スマホファースト
- 共有問題とマイ問題を分離
- 学習履歴は問題データと分離
- GitHub Pagesで公開可能
- 共有問題はJSONで同期
- 後から機能追加しやすいファイル分割構成

## ファイル構成

```txt
studygram-v2/
├─ index.html
├─ manifest.webmanifest
├─ sw.js
├─ README.md
├─ assets/
│  └─ icon.svg
├─ data/
│  └─ shared-decks/
│     ├─ index.json
│     ├─ chem-final.json
│     └─ physics-mid.json
└─ src/
   ├─ app.js
   ├─ core/
   │  ├─ storage.js
   │  ├─ utils.js
   │  ├─ matcher.js
   │  ├─ scheduler.js
   │  ├─ decks.js
   │  └─ quiz.js
   ├─ ui/
   │  ├─ dom.js
   │  └─ render.js
   └─ styles/
      ├─ base.css
      └─ app.css
```

## GitHub Pagesで公開する方法

1. ZIPを解凍
2. 中身をリポジトリ直下にアップロード
3. Settings → Pages
4. Source: Deploy from a branch
5. Branch: main
6. Folder: /root
7. Save

## 共有問題を追加する方法

1. `data/shared-decks/` に新しいJSONを追加
2. `data/shared-decks/index.json` にそのデッキ情報を追加
3. GitHubにアップロード
4. 利用者がアプリで「同期」を押す

## 共有問題の例

```json
{
  "deckId": "math-final",
  "title": "数学 前期期末",
  "subject": "数学",
  "exam": "前期期末",
  "version": "1.0.0",
  "updatedAt": "2026-07-01",
  "cards": [
    {
      "id": "shared-math-final-001",
      "question": "問題文",
      "answer": "答え",
      "tags": ["タグ"],
      "hint": "ヒント",
      "explanation": "解説"
    }
  ]
}
```

## 重要

共有問題の `id` は変えないでください。  
idを変えると別の問題として扱われ、学習履歴が引き継がれません。
