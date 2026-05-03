// Electron Main Process エントリポイント

// .env を読み込む（開発時のみ使用）
import { config } from 'dotenv';
import path from 'node:path';
config({ path: path.resolve(process.cwd(), '.env') });

import { app, BrowserWindow } from 'electron';
import { createMainWindow } from './window.js';
import { registerIpcHandlers } from './ipc.js';

app.whenReady().then(() => {
  registerIpcHandlers();
  createMainWindow();

  app.on('activate', () => {
    // macOS: Dock アイコンをクリックしてウィンドウがない場合に再作成
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
