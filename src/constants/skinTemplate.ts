import type { PartUV, ModelType } from '../types';

/** スキンの幅・高さ */
export const SKIN_WIDTH = 64;
export const SKIN_HEIGHT = 64;

/**
 * 64x64テンプレートにおける各パーツのUV座標定義
 * Minecraft Wiki (https://minecraft.wiki/w/Skin) に準拠
 *
 * Classic と Slim で腕のサイズが異なる:
 *   Classic: 腕 4x12x4
 *   Slim:    腕 3x12x4
 */

// ===== ベースレイヤー =====

export const HEAD_BASE: PartUV = {
  top:    { x: 8,  y: 0,  w: 8, h: 8 },
  bottom: { x: 16, y: 0,  w: 8, h: 8 },
  front:  { x: 8,  y: 8,  w: 8, h: 8 },
  back:   { x: 24, y: 8,  w: 8, h: 8 },
  right:  { x: 0,  y: 8,  w: 8, h: 8 },
  left:   { x: 16, y: 8,  w: 8, h: 8 },
};

export const BODY_BASE: PartUV = {
  top:    { x: 20, y: 16, w: 8, h: 4 },
  bottom: { x: 28, y: 16, w: 8, h: 4 },
  front:  { x: 20, y: 20, w: 8, h: 12 },
  back:   { x: 32, y: 20, w: 8, h: 12 },
  right:  { x: 16, y: 20, w: 4, h: 12 },
  left:   { x: 28, y: 20, w: 4, h: 12 },
};

export const RIGHT_ARM_BASE_CLASSIC: PartUV = {
  top:    { x: 44, y: 16, w: 4, h: 4 },
  bottom: { x: 48, y: 16, w: 4, h: 4 },
  front:  { x: 44, y: 20, w: 4, h: 12 },
  back:   { x: 52, y: 20, w: 4, h: 12 },
  right:  { x: 40, y: 20, w: 4, h: 12 },
  left:   { x: 48, y: 20, w: 4, h: 12 },
};

export const RIGHT_ARM_BASE_SLIM: PartUV = {
  top:    { x: 44, y: 16, w: 3, h: 4 },
  bottom: { x: 47, y: 16, w: 3, h: 4 },
  front:  { x: 44, y: 20, w: 3, h: 12 },
  back:   { x: 51, y: 20, w: 3, h: 12 },
  right:  { x: 40, y: 20, w: 4, h: 12 },
  left:   { x: 47, y: 20, w: 4, h: 12 },
};

export const LEFT_ARM_BASE_CLASSIC: PartUV = {
  top:    { x: 36, y: 48, w: 4, h: 4 },
  bottom: { x: 40, y: 48, w: 4, h: 4 },
  front:  { x: 36, y: 52, w: 4, h: 12 },
  back:   { x: 44, y: 52, w: 4, h: 12 },
  right:  { x: 32, y: 52, w: 4, h: 12 },
  left:   { x: 40, y: 52, w: 4, h: 12 },
};

export const LEFT_ARM_BASE_SLIM: PartUV = {
  top:    { x: 36, y: 48, w: 3, h: 4 },
  bottom: { x: 39, y: 48, w: 3, h: 4 },
  front:  { x: 36, y: 52, w: 3, h: 12 },
  back:   { x: 43, y: 52, w: 3, h: 12 },
  right:  { x: 32, y: 52, w: 4, h: 12 },
  left:   { x: 39, y: 52, w: 4, h: 12 },
};

export const RIGHT_LEG_BASE: PartUV = {
  top:    { x: 4,  y: 16, w: 4, h: 4 },
  bottom: { x: 8,  y: 16, w: 4, h: 4 },
  front:  { x: 4,  y: 20, w: 4, h: 12 },
  back:   { x: 12, y: 20, w: 4, h: 12 },
  right:  { x: 0,  y: 20, w: 4, h: 12 },
  left:   { x: 8,  y: 20, w: 4, h: 12 },
};

export const LEFT_LEG_BASE: PartUV = {
  top:    { x: 20, y: 48, w: 4, h: 4 },
  bottom: { x: 24, y: 48, w: 4, h: 4 },
  front:  { x: 20, y: 52, w: 4, h: 12 },
  back:   { x: 28, y: 52, w: 4, h: 12 },
  right:  { x: 16, y: 52, w: 4, h: 12 },
  left:   { x: 24, y: 52, w: 4, h: 12 },
};

// ===== オーバーレイレイヤー =====

export const HEAD_OVERLAY: PartUV = {
  top:    { x: 40, y: 0,  w: 8, h: 8 },
  bottom: { x: 48, y: 0,  w: 8, h: 8 },
  front:  { x: 40, y: 8,  w: 8, h: 8 },
  back:   { x: 56, y: 8,  w: 8, h: 8 },
  right:  { x: 32, y: 8,  w: 8, h: 8 },
  left:   { x: 48, y: 8,  w: 8, h: 8 },
};

export const BODY_OVERLAY: PartUV = {
  top:    { x: 20, y: 32, w: 8, h: 4 },
  bottom: { x: 28, y: 32, w: 8, h: 4 },
  front:  { x: 20, y: 36, w: 8, h: 12 },
  back:   { x: 32, y: 36, w: 8, h: 12 },
  right:  { x: 16, y: 36, w: 4, h: 12 },
  left:   { x: 28, y: 36, w: 4, h: 12 },
};

export const RIGHT_ARM_OVERLAY_CLASSIC: PartUV = {
  top:    { x: 44, y: 32, w: 4, h: 4 },
  bottom: { x: 48, y: 32, w: 4, h: 4 },
  front:  { x: 44, y: 36, w: 4, h: 12 },
  back:   { x: 52, y: 36, w: 4, h: 12 },
  right:  { x: 40, y: 36, w: 4, h: 12 },
  left:   { x: 48, y: 36, w: 4, h: 12 },
};

export const RIGHT_ARM_OVERLAY_SLIM: PartUV = {
  top:    { x: 44, y: 32, w: 3, h: 4 },
  bottom: { x: 47, y: 32, w: 3, h: 4 },
  front:  { x: 44, y: 36, w: 3, h: 12 },
  back:   { x: 51, y: 36, w: 3, h: 12 },
  right:  { x: 40, y: 36, w: 4, h: 12 },
  left:   { x: 47, y: 36, w: 4, h: 12 },
};

export const LEFT_ARM_OVERLAY_CLASSIC: PartUV = {
  top:    { x: 52, y: 48, w: 4, h: 4 },
  bottom: { x: 56, y: 48, w: 4, h: 4 },
  front:  { x: 52, y: 52, w: 4, h: 12 },
  back:   { x: 60, y: 52, w: 4, h: 12 },
  right:  { x: 48, y: 52, w: 4, h: 12 },
  left:   { x: 56, y: 52, w: 4, h: 12 },
};

export const LEFT_ARM_OVERLAY_SLIM: PartUV = {
  top:    { x: 52, y: 48, w: 3, h: 4 },
  bottom: { x: 55, y: 48, w: 3, h: 4 },
  front:  { x: 52, y: 52, w: 3, h: 12 },
  back:   { x: 59, y: 52, w: 3, h: 12 },
  right:  { x: 48, y: 52, w: 4, h: 12 },
  left:   { x: 55, y: 52, w: 4, h: 12 },
};

export const RIGHT_LEG_OVERLAY: PartUV = {
  top:    { x: 4,  y: 32, w: 4, h: 4 },
  bottom: { x: 8,  y: 32, w: 4, h: 4 },
  front:  { x: 4,  y: 36, w: 4, h: 12 },
  back:   { x: 12, y: 36, w: 4, h: 12 },
  right:  { x: 0,  y: 36, w: 4, h: 12 },
  left:   { x: 8,  y: 36, w: 4, h: 12 },
};

export const LEFT_LEG_OVERLAY: PartUV = {
  top:    { x: 4,  y: 48, w: 4, h: 4 },
  bottom: { x: 8,  y: 48, w: 4, h: 4 },
  front:  { x: 4,  y: 52, w: 4, h: 12 },
  back:   { x: 12, y: 52, w: 4, h: 12 },
  right:  { x: 0,  y: 52, w: 4, h: 12 },
  left:   { x: 8,  y: 52, w: 4, h: 12 },
};

// ===== パーツ取得ヘルパー =====

export type PartKey = 'head' | 'body' | 'rightArm' | 'leftArm' | 'rightLeg' | 'leftLeg';

export function getPartUV(
  part: PartKey,
  layer: 'base' | 'overlay',
  model: ModelType
): PartUV {
  switch (part) {
    case 'head':
      return layer === 'base' ? HEAD_BASE : HEAD_OVERLAY;
    case 'body':
      return layer === 'base' ? BODY_BASE : BODY_OVERLAY;
    case 'rightArm':
      if (layer === 'base') {
        return model === 'classic' ? RIGHT_ARM_BASE_CLASSIC : RIGHT_ARM_BASE_SLIM;
      }
      return model === 'classic' ? RIGHT_ARM_OVERLAY_CLASSIC : RIGHT_ARM_OVERLAY_SLIM;
    case 'leftArm':
      if (layer === 'base') {
        return model === 'classic' ? LEFT_ARM_BASE_CLASSIC : LEFT_ARM_BASE_SLIM;
      }
      return model === 'classic' ? LEFT_ARM_OVERLAY_CLASSIC : LEFT_ARM_OVERLAY_SLIM;
    case 'rightLeg':
      return layer === 'base' ? RIGHT_LEG_BASE : RIGHT_LEG_OVERLAY;
    case 'leftLeg':
      return layer === 'base' ? LEFT_LEG_BASE : LEFT_LEG_OVERLAY;
  }
}
