import { useCallback, useRef, useState, useEffect } from 'react';
import { useEditorStore, makeFaceKey } from '../../store/editorStore';
import { UI_TEXT } from '../../constants/uiText';
import type { AdjustParams } from '../../utils/colorAdjust';
import type { PartName, PartUV } from '../../types';

/** スライダー1本分 */
function AdjustSlider({ label, value, min, max, disabled, onChange, onLiveChange, onCommit }: {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (v: number) => void;
  onLiveChange: (v: number) => void;
  onCommit: () => void;
}) {
  const dragging = useRef(false);

  return (
    <div className="adjust-slider" style={disabled ? { opacity: 0.4, pointerEvents: 'none' } : undefined}>
      <div className="adjust-slider__header">
        <span className="adjust-slider__label">{label}</span>
        <span className="adjust-slider__value">{value > 0 ? `+${value}` : value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onPointerDown={() => { dragging.current = true; }}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (dragging.current) {
            onLiveChange(v);
          } else {
            onChange(v);
          }
        }}
        onPointerUp={() => {
          if (dragging.current) {
            dragging.current = false;
            onCommit();
          }
        }}
        className="adjust-slider__input"
      />
    </div>
  );
}

/** ちょうせいするはんい（パーツ選択ボタン群） */
function AdjustRangeButtons() {
  const toggleAdjustPart = useEditorStore((s) => s.toggleAdjustPart);
  const selectAll = useEditorStore((s) => s.selectAllAdjustFaces);
  const adjustSelectedFaces = useEditorStore((s) => s.adjustSelectedFaces);
  const adjustTargetLayer = useEditorStore((s) => s.adjustTargetLayer);

  const isPartSelected = (part: PartName): boolean => {
    const faceNames: (keyof PartUV)[] = ['top', 'bottom', 'front', 'back', 'left', 'right'];
    const layers: ('base' | 'overlay')[] =
      adjustTargetLayer === 'both' ? ['base', 'overlay'] : [adjustTargetLayer];
    return layers.every((layer) =>
      faceNames.every((face) => adjustSelectedFaces.has(makeFaceKey(part, layer, face)))
    );
  };

  const allParts: PartName[] = ['head', 'body', 'rightArm', 'leftArm', 'rightLeg', 'leftLeg'];
  const isAllSelected = allParts.every((p) => isPartSelected(p));

  const BUTTON_ROWS: (PartName | 'all')[][] = [
    ['all'],
    ['head', 'body'],
    ['rightArm', 'leftArm'],
    ['rightLeg', 'leftLeg'],
  ];

  const getLabel = (mode: PartName | 'all'): string =>
    mode === 'all' ? UI_TEXT.viewMode.all.name : UI_TEXT.parts[mode];

  const isActive = (mode: PartName | 'all'): boolean =>
    mode === 'all' ? isAllSelected : isPartSelected(mode);

  const handleClick = (mode: PartName | 'all') => {
    if (mode === 'all') {
      selectAll();
    } else {
      toggleAdjustPart(mode);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
      {BUTTON_ROWS.map((row, rowIdx) => (
        <div key={rowIdx} style={{ display: 'grid', gridTemplateColumns: row.length === 1 ? '1fr' : '1fr 1fr', gap: 'var(--space-xs)' }}>
          {row.map((mode) => (
            <button
              key={mode}
              className={`tool-btn ${isActive(mode) ? 'active' : ''}`}
              onClick={() => handleClick(mode)}
              style={{ fontSize: 'var(--font-size-sm)' }}
            >
              {getLabel(mode)}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}

/** 色調整モードの入り口ボタン（通常モードで表示） */
export function ColorAdjustButton() {
  const enterAdjustMode = useEditorStore((s) => s.enterAdjustMode);
  const isEditing = useEditorStore((s) => s.phase) === 'editing';

  if (!isEditing) return null;

  return (
    <div className="panel">
      <button
        className="tool-btn"
        onClick={enterAdjustMode}
        style={{ width: '100%' }}
      >
        いろのちょうせい
      </button>
    </div>
  );
}

/** 色調整パネル（色調整モード中に左サイドバーに表示） */
export function ColorAdjustPanel() {
  const adjustParams = useEditorStore((s) => s.adjustParams);
  const setAdjustParams = useEditorStore((s) => s.setAdjustParams);
  const setAdjustParamsLive = useEditorStore((s) => s.setAdjustParamsLive);
  const pushAdjustHistory = useEditorStore((s) => s.pushAdjustHistory);
  const commitAdjust = useEditorStore((s) => s.commitAdjust);
  const cancelAdjust = useEditorStore((s) => s.cancelAdjust);
  const reshuffleSeeds = useEditorStore((s) => s.reshuffleSeeds);
  const adjustTargetLayer = useEditorStore((s) => s.adjustTargetLayer);
  const setAdjustTargetLayer = useEditorStore((s) => s.setAdjustTargetLayer);
  const selectedCount = useEditorStore((s) => s.adjustSelectedFaces.size);

  const updateParam = useCallback((key: keyof AdjustParams, value: number) => {
    setAdjustParams({ ...adjustParams, [key]: value });
  }, [adjustParams, setAdjustParams]);

  const updateParamLive = useCallback((key: keyof AdjustParams, value: number) => {
    setAdjustParamsLive({ ...adjustParams, [key]: value });
  }, [adjustParams, setAdjustParamsLive]);

  const noSelection = selectedCount === 0;

  // 吹き出しガイド: 面が未選択のとき表示、何か操作したら消える
  // dismissed = ユーザーが手動で消した／画面クリックした、の意。
  // 面が選択されたら noSelection が false になり自動で非表示になる（state同期は不要）
  const [dismissed, setDismissed] = useState(false);
  const rangeLabelRef = useRef<HTMLParagraphElement>(null);
  const [balloonPos, setBalloonPos] = useState<{ top: number; left: number } | null>(null);

  const showBalloon = !dismissed && noSelection;

  // 吹き出し位置を計算
  useEffect(() => {
    if (!showBalloon || !rangeLabelRef.current) return;
    const rect = rangeLabelRef.current.getBoundingClientRect();
    setBalloonPos({ top: rect.top + rect.height / 2, left: rect.right + 12 });
  }, [showBalloon]);

  // 画面全体のクリック/ポインターダウンで吹き出しを消す
  useEffect(() => {
    if (!showBalloon) return;
    const dismiss = () => setDismissed(true);
    // 少し遅延させてマウント直後のイベントを無視
    const timer = setTimeout(() => {
      window.addEventListener('pointerdown', dismiss, { once: true });
    }, 100);
    return () => { clearTimeout(timer); window.removeEventListener('pointerdown', dismiss); };
  }, [showBalloon]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', height: '100%' }}>
      {/* ヘッダー */}
      <p className="adjust-mode-header">いろのちょうせいモード</p>

      {/* ① ちょうせいするはんい */}
      <div>
        <p ref={rangeLabelRef} className="panel-title" style={{ margin: '0 0 var(--space-xs)' }}>ちょうせいするはんい</p>

        {/* 吹き出しガイド（画面全体の上に表示） */}
        {showBalloon && balloonPos && (
          <div
            className="adjust-balloon"
            style={{
              position: 'fixed',
              top: balloonPos.top,
              left: balloonPos.left,
              transform: 'translateY(-50%)',
              zIndex: 9999,
            }}
          >
            ちょうせいしたいぶぶんをえらんでね
          </div>
        )}
        <AdjustRangeButtons />
      </div>

      {/* ② パラメーター */}
      <div>
        <p className="panel-title" style={{ margin: '0 0 var(--space-xs)' }}>パラメーター</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <AdjustSlider label="あかるさ" value={adjustParams.brightness} min={-100} max={100} disabled={noSelection} onChange={(v) => updateParam('brightness', v)} onLiveChange={(v) => updateParamLive('brightness', v)} onCommit={pushAdjustHistory} />
          <AdjustSlider label="コントラスト" value={adjustParams.contrast} min={-100} max={100} disabled={noSelection} onChange={(v) => updateParam('contrast', v)} onLiveChange={(v) => updateParamLive('contrast', v)} onCommit={pushAdjustHistory} />
          <AdjustSlider label="あざやかさ" value={adjustParams.saturation} min={-100} max={100} disabled={noSelection} onChange={(v) => updateParam('saturation', v)} onLiveChange={(v) => updateParamLive('saturation', v)} onCommit={pushAdjustHistory} />
          <AdjustSlider label="いろあい" value={adjustParams.hue} min={-180} max={180} disabled={noSelection} onChange={(v) => updateParam('hue', v)} onLiveChange={(v) => updateParamLive('hue', v)} onCommit={pushAdjustHistory} />
          <AdjustSlider label="ゆらぎ" value={adjustParams.noise} min={0} max={100} disabled={noSelection} onChange={(v) => updateParam('noise', v)} onLiveChange={(v) => updateParamLive('noise', v)} onCommit={pushAdjustHistory} />
          <button
            className="tool-btn"
            onClick={reshuffleSeeds}
            disabled={noSelection || adjustParams.noise === 0}
            style={{ width: '100%', fontSize: 'var(--font-size-sm)' }}
          >
            ゆらぎパターンをかえる
          </button>
        </div>
      </div>

      {/* ③ ちょうせいするレイヤー */}
      <div>
        <p className="panel-title" style={{ margin: '0 0 var(--space-xs)' }}>ちょうせいするレイヤー</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
          <button
            className={`tool-btn${adjustTargetLayer === 'both' ? ' active' : ''}`}
            onClick={() => setAdjustTargetLayer('both')}
            style={{ width: '100%' }}
          >
            ぜんぶ
          </button>
          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
            <button
              className={`tool-btn${adjustTargetLayer === 'base' ? ' active' : ''}`}
              onClick={() => setAdjustTargetLayer('base')}
              style={{ flex: 1 }}
            >
              しただけ
            </button>
            <button
              className={`tool-btn${adjustTargetLayer === 'overlay' ? ' active' : ''}`}
              onClick={() => setAdjustTargetLayer('overlay')}
              style={{ flex: 1 }}
            >
              うえだけ
            </button>
          </div>
        </div>
      </div>

      {/* ④ 確定/キャンセルボタン（画面下に固定） */}
      <div className="adjust-mode-footer">
        <button
          className="tool-btn"
          onClick={cancelAdjust}
          style={{ flex: 1 }}
        >
          やめる
        </button>
        <button
          className="tool-btn btn-primary"
          onClick={commitAdjust}
          style={{ flex: 1 }}
          disabled={noSelection}
        >
          けってい
        </button>
      </div>
    </div>
  );
}
