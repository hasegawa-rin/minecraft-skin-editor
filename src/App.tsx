import { SkinCanvas, ZoomControls, CanvasTopControls } from './components/canvas/SkinCanvas';
import { Preview3D } from './components/preview3d/Preview3D';
import { Toolbar } from './components/toolbar/Toolbar';
import { ColorPalette } from './components/palette/ColorPalette';
import { LayerSelector } from './components/panels/LayerSelector';
import { ColorAdjustButton, ColorAdjustPanel } from './components/panels/ColorAdjustPanel';
import { PreviewFilter } from './components/panels/PreviewFilter';
import { PartSelector } from './components/panels/PartSelector';
import { FileActions } from './components/panels/FileActions';
import { SkinSelector } from './components/selector/SkinSelector';
import { useState } from 'react';
import { useEditorStore } from './store/editorStore';
import { ContextMenu } from './components/common/ContextMenu';
import './App.css';

function App() {
  const phase = useEditorStore((s) => s.phase);
  const isEditing = phase === 'editing';
  const isAdjusting = useEditorStore((s) => s.isAdjusting);
  const backToSelecting = useEditorStore((s) => s.backToSelecting);

  // 中央エリア右クリックメニュー
  const [mainMenuPos, setMainMenuPos] = useState<{ x: number; y: number } | null>(null);

  const handleMainContextMenu = (e: React.MouseEvent) => {
    if (!isEditing) return;          // 選択画面では不要
    if (isAdjusting) return;         // 色調整モードでは通常メニュー不要
    e.preventDefault();
    setMainMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleResetFromMenu = () => {
    const ok = window.confirm(
      'いまつくっているスキンは、ほぞんしていないとなくなっちゃうよ。\nさいしょからつくりなおしてもいい？'
    );
    if (!ok) { setMainMenuPos(null); return; }
    backToSelecting();
    setMainMenuPos(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>スキンエディター</h1>
        <FileActions />
      </header>

      <div className="app-layout">
        {/* 左サイドバー: 通常モード or 色調整モード */}
        <aside className={`sidebar-left ${!isEditing ? 'sidebar-disabled' : ''}`}>
          {isAdjusting ? (
            <ColorAdjustPanel />
          ) : (
            <>
              <Toolbar />
              <ColorPalette />
              <ColorAdjustButton />
              <LayerSelector />
            </>
          )}
        </aside>

        {/* 中央: 選択画面 or 作業画面 */}
        <main className="editor-main" onContextMenu={handleMainContextMenu}>
          {isEditing ? (
            <>
              <SkinCanvas />
              <CanvasTopControls />
              <ZoomControls />
            </>
          ) : (
            <SkinSelector />
          )}

          {/* 中央エリア右クリックメニュー（編集中のみ） */}
          {mainMenuPos && (
            <ContextMenu
              pos={mainMenuPos}
              items={[{ label: 'さいしょからつくりなおす', onClick: handleResetFromMenu }]}
              onClose={() => setMainMenuPos(null)}
            />
          )}
        </main>

        {/* 右サイドバー: たしかめる（描いた結果を見る） */}
        <aside className={`sidebar-right ${!isEditing ? 'sidebar-disabled' : ''}`}>
          <Preview3D />
          <PartSelector />
          <PreviewFilter />
        </aside>
      </div>
    </div>
  );
}

export default App;
