import { useEditorStore } from '../../store/editorStore';
import { UI_TEXT } from '../../constants/uiText';
import type { ViewMode, PartName } from '../../types';

/**
 * パーツセレクター: 3Dプレビューの表示パーツを切り替える
 *
 * レイアウト（正面から見た体の配置に合わせる）:
 *   [     ぜんたい     ]   ← 幅いっぱい
 *   [ あたま ] [ からだ ]
 *   [ひだりうで][みぎうで]  ← 展開図と同じく正面視点（画面左=キャラ右）
 *   [ひだりあし][みぎあし]
 */

/** ボタン行の定義: [左ボタン, 右ボタン] or [幅いっぱいボタン] */
const BUTTON_ROWS: ViewMode[][] = [
  ['all'],
  ['head', 'body'],
  ['rightArm', 'leftArm'],   // 正面視: 画面左=キャラ右うで、画面右=キャラ左うで
  ['rightLeg', 'leftLeg'],
];

function getLabel(mode: ViewMode): string {
  if (mode === 'all') return UI_TEXT.viewMode.all.name;
  return UI_TEXT.parts[mode as PartName];
}

export function PartSelector() {
  const viewMode = useEditorStore((s) => s.viewMode);
  const setViewMode = useEditorStore((s) => s.setViewMode);

  return (
    <div className="panel">
      <p className="panel-title">プレビューするパーツ</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
        {BUTTON_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} style={{ display: 'grid', gridTemplateColumns: row.length === 1 ? '1fr' : '1fr 1fr', gap: 'var(--space-xs)' }}>
            {row.map((mode) => (
              <button
                key={mode}
                className={`tool-btn ${viewMode === mode ? 'active' : ''}`}
                onClick={() => setViewMode(mode)}
              >
                {getLabel(mode)}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
