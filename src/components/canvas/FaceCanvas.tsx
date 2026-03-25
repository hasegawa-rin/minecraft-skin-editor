import { useRef, useEffect, useCallback, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import type { FaceKey } from '../../store/editorStore';
import { SKIN_WIDTH } from '../../constants/skinTemplate';
import { getPixelColor, floodFillInRect, setPixelDirect } from '../../utils/drawingTools';
import { ContextMenu } from '../common/ContextMenu';
import type { MenuPos, ContextMenuEntry } from '../common/ContextMenu';
import type { PartRect, RGBAColor, SkinData } from '../../types';
import { COLOR_CHECKER_LIGHT, COLOR_CHECKER_DARK, COLOR_ADJUST_OUTLINE } from '../../constants/colors';

/** したレイヤーの透かし表示の透明度（0〜1） */
const BASE_GHOST_OPACITY = 0.25;

interface FaceCanvasProps {
  /** この面のUV矩形（64x64テンプレート上の位置） */
  rect: PartRect;
  /** 面のラベル（「まえ」「うしろ」など） */
  label: string;
  /** 1ピクセルあたりの表示サイズ */
  pixelSize: number;
  /** overlay編集中に薄く表示するbaseレイヤーの同じ面のrect（省略時は表示しない） */
  baseRect?: PartRect;
  /** 「ぜんぶ」表示時にbaseの上に重ねて描画するoverlayレイヤーのrect */
  overlayRect?: PartRect;
  /**
   * 色調整モードでの面識別キー配列（base+overlay両方）
   * クリックで両方同時にトグルする。省略時は色調整機能を使わない
   */
  adjustFaceKeys?: FaceKey[];
}

/** 面全体を指定色で塗りつぶす */
function fillRect(data: SkinData, rect: PartRect, color: RGBAColor): SkinData {
  const result = new Uint8ClampedArray(data);
  for (let ly = 0; ly < rect.h; ly++) {
    for (let lx = 0; lx < rect.w; lx++) {
      setPixelDirect(result, rect.x + lx, rect.y + ly, color);
    }
  }
  return result;
}

/**
 * 1つの面（まえ、うしろ等）を描画・編集するキャンバス
 * rect で指定されたUV矩形を切り出して表示し、
 * 描画操作は内部的に 64x64 SkinData の対応位置に書き込む
 *
 * 色調整モード中は描画を無効にし、クリックで面選択をトグルする
 */
export function FaceCanvas({ rect, label, pixelSize, baseRect, overlayRect, adjustFaceKeys }: FaceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [menuPos, setMenuPos] = useState<MenuPos | null>(null);

  const skinData = useEditorStore((s) => s.skinData);
  const currentTool = useEditorStore((s) => s.currentTool);
  const currentColor = useEditorStore((s) => s.currentColor);
  const setPixel = useEditorStore((s) => s.setPixel);
  const pushHistory = useEditorStore((s) => s.pushHistory);
  const setCurrentColor = useEditorStore((s) => s.setCurrentColor);

  // ----- 色調整モード関連 -----
  const isAdjusting = useEditorStore((s) => s.isAdjusting);
  const adjustPreviewData = useEditorStore((s) => s.adjustPreviewData);
  const adjustSelectedFaces = useEditorStore((s) => s.adjustSelectedFaces);
  const toggleAdjustFace = useEditorStore((s) => s.toggleAdjustFace);

  const hasFaceKeys = isAdjusting && adjustFaceKeys && adjustFaceKeys.length > 0;
  const isSelected = hasFaceKeys ? adjustFaceKeys.some((k) => adjustSelectedFaces.has(k)) : false;

  // 色調整モード中はプレビューデータを使う（あれば）
  const displayData = isAdjusting && adjustPreviewData ? adjustPreviewData : skinData;

  const canvasW = rect.w * pixelSize;
  const canvasH = rect.h * pixelSize;

  // キャンバスに面のピクセルデータを描画
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, canvasW, canvasH);

    for (let ly = 0; ly < rect.h; ly++) {
      for (let lx = 0; lx < rect.w; lx++) {
        // チェッカーボード背景
        const isLight = (lx + ly) % 2 === 0;
        ctx.fillStyle = isLight ? COLOR_CHECKER_LIGHT : COLOR_CHECKER_DARK;
        ctx.fillRect(lx * pixelSize, ly * pixelSize, pixelSize, pixelSize);

        // baseレイヤーの透かし表示（overlay編集中のみ、非調整モード時のみ）
        if (baseRect && !isAdjusting) {
          const bx = baseRect.x + lx;
          const by = baseRect.y + ly;
          const bi = (by * SKIN_WIDTH + bx) * 4;
          const ba = displayData[bi + 3];
          if (ba > 0) {
            ctx.fillStyle = `rgba(${displayData[bi]},${displayData[bi + 1]},${displayData[bi + 2]},${(ba / 255) * BASE_GHOST_OPACITY})`;
            ctx.fillRect(lx * pixelSize, ly * pixelSize, pixelSize, pixelSize);
          }
        }

        // スキンデータの対応ピクセル（現在の編集レイヤー / baseレイヤー）
        const sx = rect.x + lx;
        const sy = rect.y + ly;
        const i = (sy * SKIN_WIDTH + sx) * 4;
        const a = displayData[i + 3];
        if (a > 0) {
          ctx.fillStyle = `rgba(${displayData[i]},${displayData[i + 1]},${displayData[i + 2]},${a / 255})`;
          ctx.fillRect(lx * pixelSize, ly * pixelSize, pixelSize, pixelSize);
        }

        // 「ぜんぶ」表示時: baseの上にoverlayを合成
        if (overlayRect) {
          const ox = overlayRect.x + lx;
          const oy = overlayRect.y + ly;
          const oi = (oy * SKIN_WIDTH + ox) * 4;
          const oa = displayData[oi + 3];
          if (oa > 0) {
            ctx.fillStyle = `rgba(${displayData[oi]},${displayData[oi + 1]},${displayData[oi + 2]},${oa / 255})`;
            ctx.fillRect(lx * pixelSize, ly * pixelSize, pixelSize, pixelSize);
          }
        }
      }
    }

    // グリッド線
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.5;
    for (let lx = 0; lx <= rect.w; lx++) {
      ctx.beginPath();
      ctx.moveTo(lx * pixelSize, 0);
      ctx.lineTo(lx * pixelSize, canvasH);
      ctx.stroke();
    }
    for (let ly = 0; ly <= rect.h; ly++) {
      ctx.beginPath();
      ctx.moveTo(0, ly * pixelSize);
      ctx.lineTo(canvasW, ly * pixelSize);
      ctx.stroke();
    }

    // 色調整モードで選択中の面には枠線のみ（CSSのoutlineで実現、Canvas上では描画なし）
  }, [displayData, rect, baseRect, overlayRect, pixelSize, canvasW, canvasH, isAdjusting]);

  useEffect(() => {
    render();
  }, [render]);

  // ローカル座標 → 64x64テンプレート座標
  const toSkinCoord = (e: React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const r = canvas.getBoundingClientRect();
    const lx = Math.floor((e.clientX - r.left) / pixelSize);
    const ly = Math.floor((e.clientY - r.top) / pixelSize);
    if (lx < 0 || lx >= rect.w || ly < 0 || ly >= rect.h) return null;
    return { x: rect.x + lx, y: rect.y + ly };
  };

  const applyTool = (coord: { x: number; y: number }, isStart: boolean) => {
    if (currentTool === 'eyedropper') {
      const color = getPixelColor(skinData, coord.x, coord.y);
      setCurrentColor(color);
      return;
    }

    if (isStart) pushHistory();

    if (currentTool === 'bucket') {
      const filled = floodFillInRect(skinData, coord.x, coord.y, currentColor, rect);
      useEditorStore.setState({ skinData: filled });
      return;
    }

    const color: RGBAColor = currentTool === 'eraser'
      ? { r: 0, g: 0, b: 0, a: 0 }
      : currentColor;
    setPixel(coord.x, coord.y, color);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;

    // 色調整モード中はクリックで面選択トグル（base+overlay両方）
    if (hasFaceKeys) {
      for (const k of adjustFaceKeys!) {
        toggleAdjustFace(k);
      }
      return;
    }

    const coord = toSkinCoord(e);
    if (!coord) return;
    isDrawing.current = true;
    applyTool(coord, true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isAdjusting) return; // 調整モード中はドラッグ描画なし
    if (!isDrawing.current) return;
    const coord = toSkinCoord(e);
    if (!coord) return;
    const color: RGBAColor = currentTool === 'eraser'
      ? { r: 0, g: 0, b: 0, a: 0 }
      : currentColor;
    setPixel(coord.x, coord.y, color);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  // 右クリックメニュー（親の main メニューに伝播させない）
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleFillAll = () => {
    pushHistory();
    const filled = fillRect(skinData, rect, currentColor);
    useEditorStore.setState({ skinData: filled });
    setMenuPos(null);
  };

  const handleClearAll = () => {
    pushHistory();
    const cleared = fillRect(skinData, rect, { r: 0, g: 0, b: 0, a: 0 });
    useEditorStore.setState({ skinData: cleared });
    setMenuPos(null);
  };

  // ----- クリップボード -----
  const faceClipboard = useEditorStore((s) => s.faceClipboard);
  const copyFace = useEditorStore((s) => s.copyFace);
  const pasteFace = useEditorStore((s) => s.pasteFace);

  const handleCopyFace = () => {
    copyFace(rect);
    setMenuPos(null);
  };

  /** クリップボードのサイズがこの面と一致するか */
  const canPaste = faceClipboard !== null && faceClipboard.w === rect.w && faceClipboard.h === rect.h;

  const handlePasteFace = (mode: 'normal' | 'flipH' | 'flipV') => {
    if (!canPaste) return;
    pushHistory();
    pasteFace(rect, mode);
    setMenuPos(null);
  };

  const backToSelecting = useEditorStore((s) => s.backToSelecting);
  const handleResetAll = () => {
    const ok = window.confirm(
      'いまつくっているスキンは、ほぞんしていないとなくなっちゃうよ。\nさいしょからつくりなおしてもいい？'
    );
    if (!ok) return;
    backToSelecting();
    setMenuPos(null);
  };


  // ----- 通常モードの右クリックメニュー -----
  const buildNormalMenuItems = (): ContextMenuEntry[] => [
    { label: 'コピー', onClick: handleCopyFace },
    { label: 'はりつける', onClick: () => handlePasteFace('normal'), disabled: !canPaste },
    { label: 'さゆうをはんてんさせてはりつけ', onClick: () => handlePasteFace('flipH'), disabled: !canPaste },
    { label: 'じょうげをはんてんさせてはりつけ', onClick: () => handlePasteFace('flipV'), disabled: !canPaste },
    { label: 'ぜんぶぬりつぶす', onClick: handleFillAll },
    { label: 'ぜんぶとうめいにする', onClick: handleClearAll },
    { label: 'さいしょからつくりなおす', onClick: handleResetAll },
  ];

  // カーソル: 調整モードでは選択用ポインター、通常はクロスヘア
  const cursor = isAdjusting ? 'pointer' : 'crosshair';

  // 選択ハイライト: outlineはレイアウトに影響しない
  const outlineStyle = isAdjusting && isSelected
    ? `3px solid ${COLOR_ADJUST_OUTLINE}`
    : 'none';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-xs)' }}>
      <span style={{
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-sub)',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
      <canvas
        ref={canvasRef}
        width={canvasW}
        height={canvasH}
        style={{
          cursor,
          imageRendering: 'pixelated',
          border: '1px solid var(--color-border)',
          borderRadius: 2,
          outline: outlineStyle,
          outlineOffset: -1,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
      />
      <span style={{ fontSize: 9, color: 'var(--color-text-light)' }}>
        {rect.w}x{rect.h}
      </span>

      {/* 右クリックメニュー */}
      {menuPos && !isAdjusting && (
        <ContextMenu
          pos={menuPos}
          items={buildNormalMenuItems()}
          dividerAfter={[3, 5]}
          onClose={() => setMenuPos(null)}
        />
      )}
    </div>
  );
}
