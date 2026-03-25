import type { RGBAColor, SkinData, PartRect } from '../types';
import { SKIN_WIDTH, SKIN_HEIGHT } from '../constants/skinTemplate';

/** ピクセル位置から RGBA を取得 */
export function getPixelColor(data: SkinData, x: number, y: number): RGBAColor {
  const i = (y * SKIN_WIDTH + x) * 4;
  return {
    r: data[i],
    g: data[i + 1],
    b: data[i + 2],
    a: data[i + 3],
  };
}

/** ピクセル位置に RGBA を書き込む（データを直接変更） */
export function setPixelDirect(
  data: SkinData,
  x: number,
  y: number,
  color: RGBAColor
): void {
  if (x < 0 || x >= SKIN_WIDTH || y < 0 || y >= SKIN_HEIGHT) return;
  const i = (y * SKIN_WIDTH + x) * 4;
  data[i] = color.r;
  data[i + 1] = color.g;
  data[i + 2] = color.b;
  data[i + 3] = color.a;
}

/** 2つの色が同じかどうか比較 */
function colorsEqual(a: RGBAColor, b: RGBAColor): boolean {
  return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
}

/**
 * フラッドフィルの共通実装
 * isInBounds で境界判定をカスタマイズ可能
 */
function floodFillImpl(
  data: SkinData,
  startX: number,
  startY: number,
  fillColor: RGBAColor,
  isInBounds: (x: number, y: number) => boolean
): SkinData {
  const result = new Uint8ClampedArray(data);
  const targetColor = getPixelColor(result, startX, startY);

  if (colorsEqual(targetColor, fillColor)) return result;

  const stack: [number, number][] = [[startX, startY]];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    if (!isInBounds(x, y)) continue;

    const currentColor = getPixelColor(result, x, y);
    if (!colorsEqual(currentColor, targetColor)) continue;

    visited.add(key);
    setPixelDirect(result, x, y, fillColor);

    stack.push([x + 1, y]);
    stack.push([x - 1, y]);
    stack.push([x, y + 1]);
    stack.push([x, y - 1]);
  }

  return result;
}

/**
 * フラッドフィル（バケツ塗りつぶし）
 * 64x64 全体を対象
 */
export function floodFill(
  data: SkinData,
  startX: number,
  startY: number,
  fillColor: RGBAColor
): SkinData {
  return floodFillImpl(data, startX, startY, fillColor, (x, y) =>
    x >= 0 && x < SKIN_WIDTH && y >= 0 && y < SKIN_HEIGHT
  );
}

/**
 * 面制約付きフラッドフィル
 * 指定されたPartRect内でのみ塗りつぶしを行う
 */
export function floodFillInRect(
  data: SkinData,
  startX: number,
  startY: number,
  fillColor: RGBAColor,
  rect: PartRect
): SkinData {
  const minX = rect.x;
  const minY = rect.y;
  const maxX = rect.x + rect.w;
  const maxY = rect.y + rect.h;
  return floodFillImpl(data, startX, startY, fillColor, (x, y) =>
    x >= minX && x < maxX && y >= minY && y < maxY
  );
}
