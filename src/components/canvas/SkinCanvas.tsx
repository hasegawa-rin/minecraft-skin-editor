import { useRef, useCallback, useState, useEffect } from 'react';
import { useEditorStore, makeFaceKey } from '../../store/editorStore';
import { getPartUV } from '../../constants/skinTemplate';
import { UI_TEXT } from '../../constants/uiText';
import { FaceCanvas } from './FaceCanvas';
import { ContextMenu } from '../common/ContextMenu';
import type { MenuPos, ContextMenuEntry } from '../common/ContextMenu';
import type { PartName, PartUV } from '../../types';

/** 吹き出し表示時間（ms） */
const TOOLTIP_DURATION = 2000;

/**
 * 1パーツの全6面を展開図的に表示（CSS Grid）
 *
 * 列: ひだり | まえ | みぎ | うしろ
 * 行1:        うえ
 * 行2: ひだり まえ  みぎ  うしろ
 * 行3:        した
 *
 * → うえ・まえ・した が縦一列に揃う
 *
 * ★ 面の配置ルール（直感的な展開図）:
 *   展開図を折りたたんだとき、3Dプレビューの正面から見た姿と一致するように
 *   配置する。つまり「まえ」の左に置く面は、3Dで正面から見て左側に来る面。
 *
 *   Minecraftの面名は「キャラの左右」基準だが、正面から見ると左右が逆になる。
 *   そのため展開図上の位置を入れ替える:
 *     - 「ひだり」位置（まえの左） → partUV.right（キャラの右 = 正面から見て左）
 *     - 「みぎ」位置（まえの右）  → partUV.left （キャラの左 = 正面から見て右）
 *
 *   これにより Minecraft テクスチャストリップ順序
 *   (right → front → left → back) とも一致する。
 */
function PartFacesLayout({ partUV, baseUV, overlayUV, pixelSize, part }: { partUV: PartUV; baseUV?: PartUV; overlayUV?: PartUV; pixelSize: number; part: PartName }) {
  const faces = UI_TEXT.faces;
  const isAdjusting = useEditorStore((s) => s.isAdjusting);
  const adjustTargetLayer = useEditorStore((s) => s.adjustTargetLayer);

  /** 色調整モード用: ターゲットレイヤーに応じたFaceKeyを返す */
  const getAdjustKeys = (face: keyof PartUV) => {
    if (!isAdjusting) return undefined;
    if (adjustTargetLayer === 'both') {
      return [makeFaceKey(part, 'base', face), makeFaceKey(part, 'overlay', face)];
    }
    return [makeFaceKey(part, adjustTargetLayer, face)];
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'auto auto auto auto',
      gridTemplateRows: 'auto auto auto',
      gap: 'var(--space-xs)',
      justifyItems: 'center',
      alignItems: 'start',
    }}>
      {/* 行1: うえ（2列目=まえの上） */}
      <div style={{ gridColumn: 2, gridRow: 1 }}>
        <FaceCanvas rect={partUV.top} label={faces.top} pixelSize={pixelSize} baseRect={baseUV?.top} overlayRect={overlayUV?.top} adjustFaceKeys={getAdjustKeys('top')} />
      </div>

      {/* 行2: ひだり・まえ・みぎ・うしろ
       *   展開図の左位置 = 3Dで正面から見て左 = キャラの右(partUV.right)
       *   展開図の右位置 = 3Dで正面から見て右 = キャラの左(partUV.left)
       */}
      <div style={{ gridColumn: 1, gridRow: 2 }}>
        <FaceCanvas rect={partUV.right} label={faces.left} pixelSize={pixelSize} baseRect={baseUV?.right} overlayRect={overlayUV?.right} adjustFaceKeys={getAdjustKeys('right')} />
      </div>
      <div style={{ gridColumn: 2, gridRow: 2 }}>
        <FaceCanvas rect={partUV.front} label={faces.front} pixelSize={pixelSize} baseRect={baseUV?.front} overlayRect={overlayUV?.front} adjustFaceKeys={getAdjustKeys('front')} />
      </div>
      <div style={{ gridColumn: 3, gridRow: 2 }}>
        <FaceCanvas rect={partUV.left} label={faces.right} pixelSize={pixelSize} baseRect={baseUV?.left} overlayRect={overlayUV?.left} adjustFaceKeys={getAdjustKeys('left')} />
      </div>
      <div style={{ gridColumn: 4, gridRow: 2 }}>
        <FaceCanvas rect={partUV.back} label={faces.back} pixelSize={pixelSize} baseRect={baseUV?.back} overlayRect={overlayUV?.back} adjustFaceKeys={getAdjustKeys('back')} />
      </div>

      {/* 行3: した（2列目=まえの下） */}
      <div style={{ gridColumn: 2, gridRow: 3 }}>
        <FaceCanvas rect={partUV.bottom} label={faces.bottom} pixelSize={pixelSize} baseRect={baseUV?.bottom} overlayRect={overlayUV?.bottom} adjustFaceKeys={getAdjustKeys('bottom')} />
      </div>
    </div>
  );
}

/**
 * 全パーツ一覧モード
 * 体の配置に合わせて並べる（中央揃え）:
 *
 *            あたま
 *   ひだりうで からだ みぎうで
 *   ひだりあし        みぎあし
 */
/**
 * パーツ全体の右クリックコピー＆貼り付けに対応するパーツカード
 * カード全体を右クリックで6面まとめてコピー・貼り付けできる
 */
function PartBlockWithMenu({ part, partUV, baseUV, overlayUV, pixelSize }: {
  part: PartName;
  partUV: PartUV;
  baseUV?: PartUV;
  overlayUV?: PartUV;
  pixelSize: number;
}) {
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);
  const partClipboard = useEditorStore((s) => s.partClipboard);
  const copyPart = useEditorStore((s) => s.copyPart);
  const pastePart = useEditorStore((s) => s.pastePart);
  const pushHistory = useEditorStore((s) => s.pushHistory);

  // ----- 色調整モード関連 -----
  const isAdjusting = useEditorStore((s) => s.isAdjusting);
  const toggleAdjustPart = useEditorStore((s) => s.toggleAdjustPart);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleCopy = () => {
    copyPart(partUV);
    setMenuPos(null);
  };

  /** クリップボードの全6面がこのパーツと同じサイズかチェック */
  const canPaste = (() => {
    if (!partClipboard) return false;
    const faceNames: (keyof PartUV)[] = ['top', 'bottom', 'front', 'back', 'left', 'right'];
    return faceNames.every((f) =>
      partClipboard.faces[f].w === partUV[f].w && partClipboard.faces[f].h === partUV[f].h
    );
  })();

  const handlePaste = (mode: 'normal' | 'flipH' | 'flipV') => {
    if (!canPaste) return;
    pushHistory();
    pastePart(partUV, mode);
    setMenuPos(null);
  };

  // ----- メニュー構築 -----
  const buildMenuItems = (): ContextMenuEntry[] => {
    if (isAdjusting) return [];
    return [
      { label: 'パーツをコピー', onClick: handleCopy },
      { label: 'はりつける', onClick: () => handlePaste('normal'), disabled: !canPaste },
      { label: 'さゆうをはんてんさせてはりつけ', onClick: () => handlePaste('flipH'), disabled: !canPaste },
      { label: 'じょうげをはんてんさせてはりつけ', onClick: () => handlePaste('flipV'), disabled: !canPaste },
    ];
  };

  return (
    <div
      className={`part-card${isAdjusting ? ' part-card--adjusting' : ''}`}
      onContextMenu={handleContextMenu}
    >
      <span
        className={`part-card__label${isAdjusting ? ' part-card__label--clickable' : ''}`}
        onClick={isAdjusting ? (e) => { e.stopPropagation(); toggleAdjustPart(part); } : undefined}
      >
        {UI_TEXT.parts[part]}
      </span>
      <PartFacesLayout partUV={partUV} baseUV={baseUV} overlayUV={overlayUV} pixelSize={pixelSize} part={part} />

      {menuPos && !isAdjusting && (
        <ContextMenu
          pos={menuPos}
          items={buildMenuItems()}
          dividerAfter={[0]}
          onClose={() => setMenuPos(null)}
        />
      )}
    </div>
  );
}

function AllPartsOverview({ pixelSize }: { pixelSize: number }) {
  const modelType = useEditorStore((s) => s.modelType);
  const activeLayer = useEditorStore((s) => s.activeLayer);
  const isAdjusting = useEditorStore((s) => s.isAdjusting);
  const adjustTargetLayer = useEditorStore((s) => s.adjustTargetLayer);

  // 色調整モード中はadjustTargetLayerに従う
  const effectiveLayer = isAdjusting
    ? (adjustTargetLayer === 'both' ? 'base' : adjustTargetLayer)
    : activeLayer;

  const getUV = (part: PartName) => getPartUV(part, effectiveLayer, modelType);

  // overlay編集中はbaseレイヤーのUVも取得して透かし表示に使う（色調整モード中は不要）
  const getBaseUV = !isAdjusting && activeLayer === 'overlay'
    ? (part: PartName) => getPartUV(part, 'base', modelType)
    : undefined;

  // 色調整モードで「ぜんぶ」の場合、overlayレイヤーのUVを追加で渡す
  const getOverlayUV = isAdjusting && adjustTargetLayer === 'both'
    ? (part: PartName) => getPartUV(part, 'overlay', modelType)
    : undefined;

  const renderPart = (part: PartName) => (
    <PartBlockWithMenu key={part} part={part} partUV={getUV(part)} baseUV={getBaseUV?.(part)} overlayUV={getOverlayUV?.(part)} pixelSize={pixelSize} />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-lg)', width: 'fit-content', margin: '0 auto', padding: '50vh 50vw' }}>
      {/* あたま */}
      {renderPart('head')}

      {/* 正面から見た配置: 画面左=キャラの右うで、画面右=キャラの左うで */}
      <div style={{ display: 'flex', gap: 32, alignItems: 'start', justifyContent: 'center' }}>
        {renderPart('rightArm')}
        {renderPart('body')}
        {renderPart('leftArm')}
      </div>

      {/* 正面から見た配置: 画面左=キャラの右あし、画面右=キャラの左あし */}
      <div style={{ display: 'flex', gap: 32, alignItems: 'start', justifyContent: 'center' }}>
        {renderPart('rightLeg')}
        {renderPart('leftLeg')}
      </div>
    </div>
  );
}

/** ズームの段階定義（%表示用） */
const ZOOM_STEPS = [4, 6, 8, 10, 12, 14, 16, 20, 24, 32];
const DEFAULT_ZOOM_INDEX = 4; // 12px = 100%

/** もどる/すすむコントロール
 * 通常モード: skinData の履歴を操作
 * 色調整モード: adjustParams + adjustSelectedFaces の履歴を操作
 */
export function UndoRedoControls() {
  const isAdjusting = useEditorStore((s) => s.isAdjusting);

  // 通常モード用
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const historyIndex = useEditorStore((s) => s.historyIndex);
  const historyLength = useEditorStore((s) => s.history.length);

  // 色調整モード用
  const undoAdjust = useEditorStore((s) => s.undoAdjust);
  const redoAdjust = useEditorStore((s) => s.redoAdjust);
  const adjustHistoryIndex = useEditorStore((s) => s.adjustHistoryIndex);
  const adjustHistoryLength = useEditorStore((s) => s.adjustHistory.length);

  const [tooltip, setTooltip] = useState<{ msg: string; target: 'undo' | 'redo' } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoBtnRef = useRef<HTMLButtonElement>(null);
  const redoBtnRef = useRef<HTMLButtonElement>(null);

  const showTooltip = useCallback((msg: string, target: 'undo' | 'redo') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setTooltip({ msg, target });
    timerRef.current = setTimeout(() => setTooltip(null), TOOLTIP_DURATION);
  }, []);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  // モードに応じてundo/redoの可否とハンドラーを切り替え
  // adjustHistory: index=0が初期状態、index>0ならundoできる
  const canUndo = isAdjusting ? adjustHistoryIndex > 0 : historyIndex >= 0;
  const canRedo = isAdjusting
    ? adjustHistoryIndex < adjustHistoryLength - 1
    : historyIndex < historyLength - 2;

  const handleUndo = () => {
    if (isAdjusting) {
      undoAdjust();
      const nextIndex = useEditorStore.getState().adjustHistoryIndex;
      if (nextIndex <= 0) {
        showTooltip('これいじょうもどれないよ', 'undo');
      }
    } else {
      undo();
      const nextIndex = useEditorStore.getState().historyIndex;
      if (nextIndex < 0) {
        showTooltip('これいじょうもどれないよ', 'undo');
      }
    }
  };

  const handleRedo = () => {
    if (isAdjusting) {
      redoAdjust();
      const s = useEditorStore.getState();
      if (s.adjustHistoryIndex >= s.adjustHistory.length - 1) {
        showTooltip('これいじょうすすめないよ', 'redo');
      }
    } else {
      redo();
      const s = useEditorStore.getState();
      if (s.historyIndex >= s.history.length - 2) {
        showTooltip('これいじょうすすめないよ', 'redo');
      }
    }
  };

  // 吹き出しの左位置をターゲットボタンに合わせる
  const tooltipLeft = tooltip
    ? (tooltip.target === 'redo' ? (redoBtnRef.current?.offsetLeft ?? 0) : 0)
    : 0;

  return (
    <div style={{ position: 'relative' }}>
      <div className="btn-group">
        <button ref={undoBtnRef} className="tool-btn" onClick={handleUndo} disabled={!canUndo} title={UI_TEXT.actions.undo.tip} style={{ minWidth: 36 }}>
          {UI_TEXT.actions.undo.name}
        </button>
        <button ref={redoBtnRef} className="tool-btn" onClick={handleRedo} disabled={!canRedo} title={UI_TEXT.actions.redo.tip} style={{ minWidth: 36 }}>
          {UI_TEXT.actions.redo.name}
        </button>
      </div>
      {tooltip && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: tooltipLeft,
          marginTop: 6,
          padding: '4px 10px',
          background: 'var(--color-text)',
          color: 'var(--color-bg-panel)',
          fontSize: 'var(--font-size-sm)',
          borderRadius: 'var(--radius-sm)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 1,
        }}>
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: 12,
            width: 0,
            height: 0,
            borderLeft: '5px solid transparent',
            borderRight: '5px solid transparent',
            borderBottom: '5px solid var(--color-text)',
          }} />
          {tooltip.msg}
        </div>
      )}
    </div>
  );
}

/**
 * 中央エリア左上の固定コントロール（もどる/すすむ）
 */
export function CanvasTopControls() {
  return (
    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
      <UndoRedoControls />
    </div>
  );
}

/** ズームコントロール（親の右下に固定表示） */
export function ZoomControls() {
  const zoomLevel = useEditorStore((s) => s.zoomLevel);
  const setZoomLevel = useEditorStore((s) => s.setZoomLevel);

  const clampedIndex = Math.max(0, Math.min(ZOOM_STEPS.length - 1, zoomLevel));
  const pixelSize = ZOOM_STEPS[clampedIndex];
  const zoomPercent = Math.round((pixelSize / ZOOM_STEPS[DEFAULT_ZOOM_INDEX]) * 100);

  return (
    <div className="btn-group" style={{ position: 'absolute', bottom: 10, right: 10, zIndex: 10 }}>
      <button
        className="tool-btn"
        onClick={() => { if (clampedIndex > 0) setZoomLevel(clampedIndex - 1); }}
        disabled={clampedIndex <= 0}
        style={{ minWidth: 36 }}
      >
        −
      </button>
      <button
        className="tool-btn"
        onClick={() => setZoomLevel(DEFAULT_ZOOM_INDEX)}
        title="100%にもどす"
        style={{ fontWeight: 600, minWidth: 56 }}
      >
        {zoomPercent}%
      </button>
      <button
        className="tool-btn"
        onClick={() => { if (clampedIndex < ZOOM_STEPS.length - 1) setZoomLevel(clampedIndex + 1); }}
        disabled={clampedIndex >= ZOOM_STEPS.length - 1}
        style={{ minWidth: 36 }}
      >
        ＋
      </button>
    </div>
  );
}

export function SkinCanvas() {
  const zoomLevel = useEditorStore((s) => s.zoomLevel);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panState = useRef<{ active: boolean; lastX: number; lastY: number }>({
    active: false, lastX: 0, lastY: 0,
  });

  const clampedIndex = Math.max(0, Math.min(ZOOM_STEPS.length - 1, zoomLevel));
  const pixelSize = ZOOM_STEPS[clampedIndex];

  // マウント時にコンテンツが中央に来るようスクロール位置を設定
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    // スクロール可能な余白（50vh/50vw）の分だけ中央にずらす
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
    el.scrollTop = (el.scrollHeight - el.clientHeight) / 2;
  }, []);

  // 左クリックドラッグでキャンバスをつかんで移動（FaceCanvas上以外の背景部分）
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    // FaceCanvas（canvas要素）上では描画を優先
    if ((e.target as HTMLElement).tagName === 'CANVAS') return;
    e.preventDefault();
    panState.current = { active: true, lastX: e.clientX, lastY: e.clientY };
    document.body.style.cursor = 'grabbing';
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!panState.current.active) return;
    const el = wrapperRef.current;
    if (!el) return;
    const dx = e.clientX - panState.current.lastX;
    const dy = e.clientY - panState.current.lastY;
    // 手でつかんで動かす：ドラッグ方向にコンテンツがついてくる
    el.scrollLeft -= dx;
    el.scrollTop -= dy;
    panState.current.lastX = e.clientX;
    panState.current.lastY = e.clientY;
  }, []);

  const handleMouseUp = useCallback(() => {
    if (panState.current.active) {
      panState.current.active = false;
      document.body.style.cursor = '';
    }
  }, []);

  return (
    <div
      ref={wrapperRef}
      className="skin-canvas-wrapper"
      style={{ overflow: 'auto', padding: 'var(--space-lg)', height: '100%', width: '100%' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* 2D作業画面は常に全パーツ表示（パーツ絞り込みは3Dプレビュー側で行う） */}
      <AllPartsOverview pixelSize={pixelSize} />
    </div>
  );
}
