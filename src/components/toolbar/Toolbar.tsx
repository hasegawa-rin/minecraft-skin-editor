import { useEditorStore } from '../../store/editorStore';
import { UI_TEXT } from '../../constants/uiText';
import type { ToolType } from '../../types';

/** ツールの表示順: ペン → バケツ → けしゴム → スポイト */
const TOOLS: ToolType[] = ['brush', 'bucket', 'eraser', 'eyedropper'];

export function Toolbar() {
  const currentTool = useEditorStore((s) => s.currentTool);
  const setCurrentTool = useEditorStore((s) => s.setCurrentTool);

  return (
    <div className="panel panel--no-title">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
        {TOOLS.map((type) => (
          <button
            key={type}
            className={`tool-btn ${currentTool === type ? 'active' : ''}`}
            onClick={() => setCurrentTool(type)}
            title={UI_TEXT.tools[type].tip}
          >
            {UI_TEXT.tools[type].name}
          </button>
        ))}
      </div>
    </div>
  );
}
