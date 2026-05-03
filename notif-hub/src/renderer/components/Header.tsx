// ヘッダーコンポーネント
// ドラッグ可能な領域として機能する

interface HeaderProps {
  onBack?: () => void;
  title?: string;
}

export function Header({ onBack, title = 'Notif Hub' }: HeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2 bg-gray-900/90 border-b border-gray-700/50"
      // -webkit-app-region: drag でドラッグ可能にする（Electron 固有）
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2">
        {onBack ? (
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white text-sm"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            ←
          </button>
        ) : (
          <span className="text-gray-400 text-sm">☰</span>
        )}
        <span className="text-white text-sm font-semibold">{title}</span>
      </div>
      {/* ウィンドウコントロールはフレームレスなので手動実装 */}
      <div
        className="flex items-center gap-1"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div className="w-3 h-3 rounded-full bg-yellow-500/80 hover:bg-yellow-400 cursor-pointer" />
        <div className="w-3 h-3 rounded-full bg-green-500/80 hover:bg-green-400 cursor-pointer" />
        <div className="w-3 h-3 rounded-full bg-red-500/80 hover:bg-red-400 cursor-pointer" />
      </div>
    </div>
  );
}
