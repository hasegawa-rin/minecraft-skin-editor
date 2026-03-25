/**
 * クリップボードスライス
 * 面単位・パーツ単位のコピー＆貼り付け機能
 */

import { SKIN_WIDTH } from '../constants/skinTemplate';
import type { PartRect, PartUV, SkinData } from '../types';

// ===== 型定義 =====

/** 面単位のクリップボード（矩形のピクセルデータ） */
export interface FaceClipboard {
  pixels: Uint8ClampedArray;
  w: number;
  h: number;
}

/** パーツ全体のクリップボード（6面分） */
export interface PartClipboard {
  faces: Record<keyof PartUV, FaceClipboard>;
}

/** 貼り付けモード */
export type PasteMode = 'normal' | 'flipH' | 'flipV';

// ===== ユーティリティ =====

/** skinData の指定矩形からピクセルを抽出 */
export function extractRect(skinData: SkinData, rect: PartRect): FaceClipboard {
  const pixels = new Uint8ClampedArray(rect.w * rect.h * 4);
  for (let ly = 0; ly < rect.h; ly++) {
    for (let lx = 0; lx < rect.w; lx++) {
      const srcI = ((rect.y + ly) * SKIN_WIDTH + (rect.x + lx)) * 4;
      const dstI = (ly * rect.w + lx) * 4;
      pixels[dstI] = skinData[srcI];
      pixels[dstI + 1] = skinData[srcI + 1];
      pixels[dstI + 2] = skinData[srcI + 2];
      pixels[dstI + 3] = skinData[srcI + 3];
    }
  }
  return { pixels, w: rect.w, h: rect.h };
}

/** クリップボードのピクセルを skinData の指定矩形に書き込み（反転対応） */
export function writeRectWithFlip(
  result: Uint8ClampedArray,
  rect: PartRect,
  clip: FaceClipboard,
  mode: PasteMode,
): void {
  const { pixels, w, h } = clip;
  for (let ly = 0; ly < h; ly++) {
    for (let lx = 0; lx < w; lx++) {
      let srcX = lx;
      let srcY = ly;
      if (mode === 'flipH') srcX = w - 1 - lx;
      if (mode === 'flipV') srcY = h - 1 - ly;
      const srcI = (srcY * w + srcX) * 4;
      const dstI = ((rect.y + ly) * SKIN_WIDTH + (rect.x + lx)) * 4;
      result[dstI] = pixels[srcI];
      result[dstI + 1] = pixels[srcI + 1];
      result[dstI + 2] = pixels[srcI + 2];
      result[dstI + 3] = pixels[srcI + 3];
    }
  }
}

// ===== スライスの状態・アクション型 =====

export interface ClipboardState {
  faceClipboard: FaceClipboard | null;
  partClipboard: PartClipboard | null;
}

export interface ClipboardActions {
  copyFace: (rect: PartRect) => void;
  copyPart: (partUV: PartUV) => void;
  pasteFace: (rect: PartRect, mode: PasteMode) => void;
  pastePart: (partUV: PartUV, mode: PasteMode) => void;
}

// ===== スライス生成 =====

type SetFn = (partial: Record<string, unknown>) => void;
type GetFn = () => { skinData: SkinData } & ClipboardState;

export function createClipboardSlice(set: SetFn, get: GetFn): ClipboardState & ClipboardActions {
  return {
    faceClipboard: null,
    partClipboard: null,

    copyFace: (rect) => {
      const { skinData } = get();
      set({ faceClipboard: extractRect(skinData, rect) });
    },

    copyPart: (partUV) => {
      const { skinData } = get();
      const faces = {
        top: extractRect(skinData, partUV.top),
        bottom: extractRect(skinData, partUV.bottom),
        front: extractRect(skinData, partUV.front),
        back: extractRect(skinData, partUV.back),
        left: extractRect(skinData, partUV.left),
        right: extractRect(skinData, partUV.right),
      };
      set({ partClipboard: { faces } });
    },

    pasteFace: (rect, mode) => {
      const { skinData, faceClipboard } = get();
      if (!faceClipboard) return;
      if (faceClipboard.w !== rect.w || faceClipboard.h !== rect.h) return;

      const result = new Uint8ClampedArray(skinData);
      writeRectWithFlip(result, rect, faceClipboard, mode);
      set({ skinData: result });
    },

    pastePart: (partUV, mode) => {
      const { skinData, partClipboard } = get();
      if (!partClipboard) return;

      const result = new Uint8ClampedArray(skinData);
      const faceNames: (keyof PartUV)[] = ['top', 'bottom', 'front', 'back', 'left', 'right'];

      for (const faceName of faceNames) {
        const clip = partClipboard.faces[faceName];
        const rect = partUV[faceName];
        if (clip.w !== rect.w || clip.h !== rect.h) return;
        writeRectWithFlip(result, rect, clip, mode);
      }
      set({ skinData: result });
    },
  };
}
