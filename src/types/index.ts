// ===== モデルタイプ =====
/** Classic = スティーブだい（腕幅4px）, Slim = アレックスだい（腕幅3px） */
export type ModelType = 'classic' | 'slim';

// ===== 描画ツール =====
export type ToolType = 'brush' | 'bucket' | 'eyedropper' | 'eraser';

// ===== レイヤー =====
export type LayerType = 'base' | 'overlay';

// ===== 3Dプレビューのレイヤー表示 =====
export type PreviewLayerMode = 'both' | 'base' | 'overlay';

// ===== パーツ =====
export type PartName = 'head' | 'body' | 'rightArm' | 'leftArm' | 'rightLeg' | 'leftLeg';

// ===== 表示モード =====
export type ViewMode = 'all' | PartName;

// ===== RGBA カラー =====
export interface RGBAColor {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a: number; // 0-255
}

// ===== スキンデータ =====
/** 64x64 のピクセルデータ（RGBA × 4096ピクセル = 16384要素） */
export type SkinData = Uint8ClampedArray;

// ===== パーツの矩形領域定義 =====
export interface PartRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ===== パーツの全面定義（展開図） =====
export interface PartUV {
  top: PartRect;
  bottom: PartRect;
  front: PartRect;
  back: PartRect;
  left: PartRect;
  right: PartRect;
}

// ===== 操作履歴 =====
export interface HistoryEntry {
  /** 操作前のスキンデータのスナップショット */
  data: SkinData;
}
