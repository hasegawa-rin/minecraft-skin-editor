import { useEditorStore } from '../../store/editorStore';
import { UI_TEXT } from '../../constants/uiText';
import type { PreviewLayerMode } from '../../types';

const MODES: PreviewLayerMode[] = ['both', 'base', 'overlay'];

/**
 * プレビュー表示フィルター（右サイドバー用）
 * 3Dプレビューに表示するレイヤーを切り替える
 */
export function PreviewFilter() {
  const previewLayerMode = useEditorStore((s) => s.previewLayerMode);
  const setPreviewLayerMode = useEditorStore((s) => s.setPreviewLayerMode);

  return (
    <div className="panel">
      <p className="panel-title">プレビューするレイヤー</p>
      <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
        {MODES.map((mode) => (
          <button
            key={mode}
            className={`tool-btn ${previewLayerMode === mode ? 'active' : ''}`}
            onClick={() => setPreviewLayerMode(mode)}
            title={UI_TEXT.previewLayer[mode].tip}
            style={{ flex: 1 }}
          >
            {UI_TEXT.previewLayer[mode].name}
          </button>
        ))}
      </div>
    </div>
  );
}
