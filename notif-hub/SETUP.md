# セットアップ手順

## 1. プロジェクトをローカルに配置

zipを解凍して任意の場所へ：

```bash
mv ~/Downloads/notif-hub ~/projects/
cd ~/projects/notif-hub
```

## 2. 環境変数の設定

```bash
cp .env.example .env
```

`.env` を開いて `ANTHROPIC_API_KEY` を設定。
Phase 1 のモック動作確認だけならこのキーがあれば十分。

取得先: https://console.anthropic.com/settings/keys

## 3. Claude Code起動

```bash
cd ~/projects/notif-hub
claude
```

起動後、最初に以下のように指示：

```
CLAUDE.md と DESIGN.md を読んで、Phase 1のタスクから順に進めて。
まず Vite + React + TypeScript + Electron + Agent SDK のプロジェクトを初期化して、
画面右下にフローティングウィンドウが起動するところまで作って。
モック通知データ3件を表示して、Agent SDK で返信文が生成できることまで確認したい。
```

Claude Code は自動的に `CLAUDE.md` を読み込み、その内容に従って作業します。

## 4. Node.js のバージョン確認

Agent SDK は Node.js 20+ 必須。

```bash
node --version  # v20.x.x 以上であること
```

低い場合は `nvm` などでアップデート。

## 5. 開発の進め方

Phase 1 → Phase 2 → ... の順で進める。

**各 Phase が完了したら必ず動作確認 → コミット → 次へ。**

迷ったら Claude Code に「次に何すべき？」と聞けばOK。

## 重要な注意

- API key を絶対に Git にコミットしない（`.gitignore` に `.env` を入れてある）
- Phase 1 で完璧を目指さない。動くものを早く作る
- Claude Code は CLAUDE.md の「やってはいけないこと」を守ること
