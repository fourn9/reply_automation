// ウィンドウ管理

import { BrowserWindow, screen } from 'electron';
import path from 'node:path';

export function createMainWindow(): BrowserWindow {
  const { width: w, height: h } = screen.getPrimaryDisplay().workAreaSize;

  const win = new BrowserWindow({
    width: 360,
    height: 540,
    // 画面右下に配置（DESIGN.md 6. ウィンドウ設定に準拠）
    x: w - 380,
    y: h - 560,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: true,
    webPreferences: {
      // __dirname はビルド後の dist-electron/main/ を指す
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // 開発時は Vite dev server、本番は静的ファイルを読み込む
  if (process.env.VITE_DEV_SERVER_URL) {
    void win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    void win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  return win;
}
