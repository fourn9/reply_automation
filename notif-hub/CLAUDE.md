# Claude Code への指示書

このドキュメントは、Claude Codeがこのプロジェクトで作業するときに最初に読む指示書です。

## プロジェクト概要

**Notif Hub** は macOSデスクトップ常駐型の通知統合ツール。
Slack / Gmail / Notion / Figma の通知を一元管理し、Claude Agent SDK + MCP を使って各サービスに直接アクセスして返信送信まで行う。

詳しい設計は `DESIGN.md` を参照。

## 重要：技術選定の前提

- **Claude Agent SDK** (`@anthropic-ai/claude-agent-sdk`) を使う。直接 `@anthropic-ai/sdk` (Anthropic SDK) を使わない
- 各サービス連携は **MCP経由のみ**。Slack SDK や Gmail API ライブラリを直接インストールしない
- Agent SDK は Node.js 20+ 必須。Electron の Node.js バージョンに注意
- HTTP MCP transport を使う。stdio transport は当面使わない
- モデルは `claude-opus-4-7` を使う（要 Agent SDK v0.2.111+）

## 開発スタイル

- **TypeScript必須**: すべて型付け
- **コミット粒度**: 機能単位で細かく
- **ESLint + Prettier**: 整形は厳密に
- **コメントは日本語**: 業務理解優先
- **パス**: 絶対パスエイリアス（`@/main`, `@/renderer`, `@/shared`）を使う

## 重要な原則

1. **段階的に進める**: Phase 1 → Phase 2 → ... の順。一度に全部やらない
2. **モック優先**: Phase 1 では MCP接続せず、Agent SDK で文章生成だけ動かす
3. **エラーハンドリング**: Agent SDK の query() は AsyncGenerator なので、try-catch + iterator のパターンで囲む
4. **シークレット管理**: API key を絶対にコードに直接書かない。`.env` を使う

## 最初にやること

### Step 1: プロジェクト初期化

```bash
npm create vite@latest . -- --template react-ts
npm install
```

### Step 2: Electron + Agent SDK 導入

```bash
npm install --save-dev electron electron-builder vite-plugin-electron vite-plugin-electron-renderer
npm install --save-dev @types/node concurrently wait-on
npm install @anthropic-ai/claude-agent-sdk
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 3: vite.config.ts の更新

`vite-plugin-electron` の設定を追加：

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: { entry: 'src/main/index.ts' },
      preload: { input: 'src/preload/index.ts' },
      renderer: {},
    }),
  ],
});
```

### Step 4: フローティングウィンドウの起動

`src/main/index.ts`:

```typescript
import { app, BrowserWindow, screen } from 'electron';
import path from 'node:path';

function createWindow() {
  const { width: w, height: h } = screen.getPrimaryDisplay().workAreaSize;
  
  const win = new BrowserWindow({
    width: 360,
    height: 480,
    x: w - 380,
    y: h - 500,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(createWindow);
```

### Step 5: Agent SDK ラッパー作成

`src/main/agent/client.ts`:

```typescript
import { query, type Options } from '@anthropic-ai/claude-agent-sdk';
import type { Notification } from '@/shared/types';
import { buildReplyGenerationPrompt } from './prompts';

const baseOptions: Options = {
  model: 'claude-opus-4-7',
  // Phase 1ではMCPなしでテスト
  mcpServers: {},
};

export async function generateReply(params: {
  notification: Notification;
  instruction: string;
}): Promise<string> {
  const prompt = buildReplyGenerationPrompt(params);
  let result = '';
  
  try {
    for await (const message of query({ prompt, options: baseOptions })) {
      if (message.type === 'result' && message.subtype === 'success') {
        result = message.result;
      }
    }
  } catch (err) {
    console.error('generateReply error:', err);
    throw err;
  }
  
  return result;
}
```

### Step 6: モック通知データ + UI

`src/renderer/App.tsx` で `NotificationList` コンポーネントを表示し、
モック通知3件を出す。

クリックで `NotificationDetail` に遷移し、
「生成」ボタンで `window.electron.generateReply()` を呼ぶ。

### Step 7: 動作確認

```bash
npm run dev
```

画面右下にフローティングウィンドウが出て、
モック通知が3件表示され、
詳細画面で返信文を直接入力 →「送信」で console.log() に出れば成功。

## 完了の定義（Phase 1）✅ 完了

- [x] フローティングウィンドウが画面右下に出る
- [x] モック通知3件がリスト表示される（Slack / Gmail / Notion）
- [x] 通知クリックで詳細画面に遷移する
- [x] 返信文を直接入力 → 「送信」で console.log() に内容が出る

## フェーズ概要（全体設計）

**中心コンセプト**: Gmail の「AI で返信を作成」と同じ体験を
Slack / Gmail / Notion / Figma すべてでこのウィンドウから実現する。

```
概要を入力 → AI が返信文を提案 → 編集 → 承認して送信
```

## Phase 2: AI 下書き生成機能（全サービス共通）

- Agent SDK 連携（MCP なし、テキスト生成のみ）
- 概要入力 →「AI で下書き生成」→ 返信文を提案
- 編集可能 → 「承認して送信」→ コンソール出力（実送信は Phase 3 以降）
- すべてのサービスで共通 UI として動作

## Phase 3: Gmail 実送信

- MCP HTTP transport で Gmail MCP に接続
- 未読メール取得 → AI 下書き → 承認 → 実送信

## Phase 4: Slack / Notion / Figma 実送信

- 各サービスの MCP を順次追加
- Phase 3 と同じフローを全サービスに展開

## Phase 5: 自動化と永続化

- 自動ポーリング（定期的に未読通知を取得）
- electron-store でローカル保存
- macOS ネイティブ通知

各Phaseで必ず動作確認 → コミット → 次へ。

## 参考リンク

- Agent SDK: https://platform.claude.com/docs/en/agent-sdk/overview
- Agent SDK TypeScript reference: https://platform.claude.com/docs/en/agent-sdk/typescript
- MCP servers connection: https://platform.claude.com/docs/en/agent-sdk/mcp
- vite-plugin-electron: https://github.com/electron-vite/vite-plugin-electron

## やってはいけないこと

- ❌ Slack SDK / Gmail API クライアント / Notion SDK を直接 npm install する
- ❌ OAuth フローを自前で実装する（MCPサーバーが処理）
- ❌ `console.log` を MCPサーバーの stdio に書き込む（プロトコル破壊）
- ❌ `@anthropic-ai/sdk` を直接使う（Agent SDK 経由で）
- ❌ Phase 1 完了前に Phase 2 に着手する
