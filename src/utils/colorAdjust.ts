/**
 * 色調整ユーティリティ
 * RGB ↔ HSL 変換、明るさ・コントラスト・彩度・色相・カラーノイズの適用
 */

import { SKIN_WIDTH } from '../constants/skinTemplate';
import type { PartRect, SkinData } from '../types';

// ===== 調整パラメータの型 =====

export interface AdjustParams {
  brightness: number;  // -100 ~ +100
  contrast: number;    // -100 ~ +100
  saturation: number;  // -100 ~ +100
  hue: number;         // -180 ~ +180
  noise: number;       // 0 ~ 100
}

export const DEFAULT_ADJUST_PARAMS: AdjustParams = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  noise: 0,
};

// ===== RGB ↔ HSL 変換 =====

interface HSL {
  h: number; // 0-360
  s: number; // 0-1
  l: number; // 0-1
}

function rgbToHsl(r: number, g: number, b: number): HSL {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) {
      h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    } else if (max === g) {
      h = ((b - r) / d + 2) * 60;
    } else {
      h = ((r - g) / d + 4) * 60;
    }
  }
  return { h, s, l };
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h = ((h % 360) + 360) % 360; // 0-360に正規化
  if (s === 0) {
    const v = Math.round(l * 255);
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hNorm = h / 360;
  return [
    Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255),
    Math.round(hue2rgb(p, q, hNorm) * 255),
    Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255),
  ];
}

// ===== 決定的乱数生成器（xorshift32） =====

function xorshift32(seed: number): () => number {
  let state = seed | 0 || 1; // 0は避ける
  return () => {
    state ^= state << 13;
    state ^= state >> 17;
    state ^= state << 5;
    // -1 ~ 1 の範囲に正規化
    return (state >>> 0) / 4294967296 * 2 - 1;
  };
}

// ===== 1ピクセルへの調整適用 =====

function adjustPixel(
  r: number, g: number, b: number,
  params: AdjustParams,
  noiseRandH: number, // -1 ~ 1
  noiseRandL: number, // -1 ~ 1
): [number, number, number] {
  const hsl = rgbToHsl(r, g, b);

  // 色相調整
  hsl.h += params.hue;

  // 彩度調整 (-100 ~ +100 → -1 ~ +1)
  if (params.saturation > 0) {
    hsl.s += (1 - hsl.s) * (params.saturation / 100);
  } else if (params.saturation < 0) {
    hsl.s += hsl.s * (params.saturation / 100);
  }

  // 明るさ調整 (-100 ~ +100 → -1 ~ +1)
  if (params.brightness > 0) {
    hsl.l += (1 - hsl.l) * (params.brightness / 100);
  } else if (params.brightness < 0) {
    hsl.l += hsl.l * (params.brightness / 100);
  }

  // コントラスト調整
  if (params.contrast !== 0) {
    // 0.5を中心に伸縮
    const factor = (100 + params.contrast) / 100;
    hsl.l = 0.5 + (hsl.l - 0.5) * factor;
  }

  // カラーノイズ（ゆらぎ）
  if (params.noise > 0) {
    const strength = params.noise / 100;
    // 色相ゆらぎ: 最大±15度
    hsl.h += noiseRandH * 15 * strength;
    // 明度ゆらぎ: 最大±0.1
    hsl.l += noiseRandL * 0.1 * strength;
  }

  // クランプ
  hsl.s = Math.max(0, Math.min(1, hsl.s));
  hsl.l = Math.max(0, Math.min(1, hsl.l));

  return hslToRgb(hsl.h, hsl.s, hsl.l);
}

// ===== 面の矩形に対する調整適用 =====

/**
 * data の指定矩形のピクセルに調整をインプレースで適用
 * alpha=0 のピクセルはスキップ
 */
function applyAdjustToRectInPlace(
  data: Uint8ClampedArray,
  rect: PartRect,
  params: AdjustParams,
  seed: number,
): void {
  const rand = xorshift32(seed);

  for (let ly = 0; ly < rect.h; ly++) {
    for (let lx = 0; lx < rect.w; lx++) {
      const i = ((rect.y + ly) * SKIN_WIDTH + (rect.x + lx)) * 4;
      const a = data[i + 3];
      if (a === 0) continue;

      const noiseRandH = rand();
      const noiseRandL = rand();

      const [nr, ng, nb] = adjustPixel(
        data[i], data[i + 1], data[i + 2],
        params,
        noiseRandH, noiseRandL,
      );
      data[i] = nr;
      data[i + 1] = ng;
      data[i + 2] = nb;
    }
  }
}

/**
 * プレビュー用: 複数の矩形に対して調整を適用
 * 元の skinData は変更しない（コピーを1回だけ作成）
 */
export function applyAdjustToRects(
  skinData: SkinData,
  rects: { rect: PartRect; seed: number }[],
  params: AdjustParams,
): SkinData {
  const result = new Uint8ClampedArray(skinData);
  for (const { rect, seed } of rects) {
    applyAdjustToRectInPlace(result, rect, params, seed);
  }
  return result as SkinData;
}

/** ランダムシード生成 */
export function generateSeed(): number {
  return Math.floor(Math.random() * 2147483647) + 1;
}
