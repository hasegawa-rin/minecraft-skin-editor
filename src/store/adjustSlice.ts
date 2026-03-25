/**
 * 色調整スライス
 * いろのちょうせいモードの全状態管理・アクション
 */

import { getPartUV } from '../constants/skinTemplate';
import type { PartRect, PartUV, SkinData, PartName } from '../types';
import type { AdjustParams } from '../utils/colorAdjust';
import { DEFAULT_ADJUST_PARAMS, generateSeed, applyAdjustToRects } from '../utils/colorAdjust';
import type { HistoryEntry, ModelType } from '../types';

/** 面を識別するキー（"head_base_front" 形式） */
export type FaceKey = string;

/** FaceKeyを生成 */
export function makeFaceKey(part: PartName, layer: 'base' | 'overlay', face: keyof PartUV): FaceKey {
  return `${part}_${layer}_${face}`;
}

/** 調整対象レイヤー */
export type AdjustTargetLayer = 'both' | 'base' | 'overlay';

/** 調整履歴のスナップショット */
interface AdjustSnapshot {
  params: AdjustParams;
  seeds: Map<FaceKey, number>;
}

// ===== パーツ・面の定数 =====
const ALL_PARTS: PartName[] = ['head', 'body', 'rightArm', 'leftArm', 'rightLeg', 'leftLeg'];
const ALL_LAYERS: ('base' | 'overlay')[] = ['base', 'overlay'];
const ALL_FACES: (keyof PartUV)[] = ['top', 'bottom', 'front', 'back', 'left', 'right'];

// ===== スライスの型定義 =====

export interface AdjustState {
  isAdjusting: boolean;
  adjustParams: AdjustParams;
  adjustTargetLayer: AdjustTargetLayer;
  adjustSelectedFaces: Set<FaceKey>;
  adjustSeeds: Map<FaceKey, number>;
  adjustOriginalData: SkinData | null;
  adjustPreviewData: SkinData | null;
  adjustHistory: AdjustSnapshot[];
  adjustHistoryIndex: number;
}

export interface AdjustActions {
  enterAdjustMode: () => void;
  cancelAdjust: () => void;
  commitAdjust: () => void;
  setAdjustParams: (params: AdjustParams) => void;
  setAdjustParamsLive: (params: AdjustParams) => void;
  setAdjustTargetLayer: (layer: AdjustTargetLayer) => void;
  toggleAdjustFace: (faceKey: FaceKey) => void;
  toggleAdjustPart: (part: PartName) => void;
  selectAllAdjustFaces: () => void;
  reshuffleSeeds: () => void;
  updateAdjustPreview: () => void;
  undoAdjust: () => void;
  redoAdjust: () => void;
  pushAdjustHistory: () => void;
}

/** 色調整モードの初期状態（リセット用） */
const ADJUST_RESET_STATE: Omit<AdjustState, 'isAdjusting'> = {
  adjustParams: { ...DEFAULT_ADJUST_PARAMS },
  adjustSelectedFaces: new Set<FaceKey>(),
  adjustSeeds: new Map<FaceKey, number>(),
  adjustOriginalData: null,
  adjustPreviewData: null,
  adjustHistory: [],
  adjustHistoryIndex: -1,
  adjustTargetLayer: 'both',
};

// ===== ユーティリティ =====

/** SkinDataのディープコピー */
function cloneSkinData(data: SkinData): SkinData {
  return new Uint8ClampedArray(data);
}

const MAX_HISTORY = 20;

// ===== スライス生成 =====

type SetFn = (partial: Record<string, unknown>) => void;
type GetFn = () => AdjustState & AdjustActions & {
  skinData: SkinData;
  modelType: ModelType;
  history: HistoryEntry[];
  historyIndex: number;
};

export function createAdjustSlice(set: SetFn, get: GetFn): AdjustState & AdjustActions {
  return {
    // ----- 初期値 -----
    isAdjusting: false,
    adjustParams: { ...DEFAULT_ADJUST_PARAMS },
    adjustTargetLayer: 'both',
    adjustSelectedFaces: new Set<FaceKey>(),
    adjustSeeds: new Map<FaceKey, number>(),
    adjustOriginalData: null,
    adjustPreviewData: null,
    adjustHistory: [],
    adjustHistoryIndex: -1,

    // ----- アクション -----

    enterAdjustMode: () => {
      const { skinData } = get();
      const seeds = new Map<FaceKey, number>();
      for (const part of ALL_PARTS) {
        for (const layer of ALL_LAYERS) {
          for (const face of ALL_FACES) {
            seeds.set(makeFaceKey(part, layer, face), generateSeed());
          }
        }
      }
      const initialSnapshot: AdjustSnapshot = {
        params: { ...DEFAULT_ADJUST_PARAMS },
        seeds: new Map(seeds),
      };
      set({
        isAdjusting: true,
        adjustParams: { ...DEFAULT_ADJUST_PARAMS },
        adjustTargetLayer: 'both',
        adjustSelectedFaces: new Set<FaceKey>(),
        adjustSeeds: seeds,
        adjustOriginalData: cloneSkinData(skinData),
        adjustPreviewData: null,
        adjustHistory: [initialSnapshot],
        adjustHistoryIndex: 0,
      });
    },

    cancelAdjust: () => {
      const { adjustOriginalData } = get();
      set({
        isAdjusting: false,
        ...ADJUST_RESET_STATE,
        ...(adjustOriginalData ? { skinData: cloneSkinData(adjustOriginalData) } : {}),
      });
    },

    commitAdjust: () => {
      const { adjustPreviewData, adjustOriginalData } = get();
      if (!adjustPreviewData || !adjustOriginalData) {
        set({ isAdjusting: false, ...ADJUST_RESET_STATE });
        return;
      }
      // undo履歴に元データをpush → 調整済みデータを適用
      const { history, historyIndex } = get();
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push({ data: cloneSkinData(adjustOriginalData) });
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }
      set({
        skinData: cloneSkinData(adjustPreviewData),
        isAdjusting: false,
        ...ADJUST_RESET_STATE,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      });
    },

    setAdjustParams: (params) => {
      set({ adjustParams: { ...params } });
      get().updateAdjustPreview();
      get().pushAdjustHistory();
    },

    setAdjustParamsLive: (params) => {
      set({ adjustParams: { ...params } });
      get().updateAdjustPreview();
    },

    setAdjustTargetLayer: (layer) => {
      const { adjustSelectedFaces } = get();
      const next = new Set<FaceKey>();
      const seen = new Set<string>();
      for (const key of adjustSelectedFaces) {
        const parts = key.split('_');
        const part = parts[0];
        const face = parts.slice(2).join('_');
        const pf = `${part}_${face}`;
        if (seen.has(pf)) continue;
        seen.add(pf);
        if (layer === 'both') {
          next.add(makeFaceKey(part as PartName, 'base', face as keyof PartUV));
          next.add(makeFaceKey(part as PartName, 'overlay', face as keyof PartUV));
        } else {
          next.add(makeFaceKey(part as PartName, layer, face as keyof PartUV));
        }
      }
      set({ adjustTargetLayer: layer, adjustSelectedFaces: next });
      get().updateAdjustPreview();
    },

    toggleAdjustFace: (faceKey) => {
      const { adjustSelectedFaces } = get();
      const next = new Set(adjustSelectedFaces);
      if (next.has(faceKey)) {
        next.delete(faceKey);
      } else {
        next.add(faceKey);
      }
      set({ adjustSelectedFaces: next });
      get().updateAdjustPreview();
    },

    toggleAdjustPart: (part) => {
      const { adjustSelectedFaces, adjustTargetLayer } = get();
      const next = new Set(adjustSelectedFaces);
      const layers: ('base' | 'overlay')[] =
        adjustTargetLayer === 'both' ? ['base', 'overlay'] : [adjustTargetLayer];
      const partKeys: FaceKey[] = [];
      for (const layer of layers) {
        for (const face of ALL_FACES) {
          partKeys.push(makeFaceKey(part, layer, face));
        }
      }
      const allSelected = partKeys.every((k) => next.has(k));
      if (allSelected) {
        for (const k of partKeys) next.delete(k);
      } else {
        for (const k of partKeys) next.add(k);
      }
      set({ adjustSelectedFaces: next });
      get().updateAdjustPreview();
    },

    selectAllAdjustFaces: () => {
      const { adjustSelectedFaces, adjustTargetLayer } = get();
      const layers: ('base' | 'overlay')[] =
        adjustTargetLayer === 'both' ? ['base', 'overlay'] : [adjustTargetLayer];
      const allKeys: FaceKey[] = [];
      for (const part of ALL_PARTS) {
        for (const layer of layers) {
          for (const face of ALL_FACES) {
            allKeys.push(makeFaceKey(part, layer, face));
          }
        }
      }
      const allSelected = allKeys.every((k) => adjustSelectedFaces.has(k));
      const next = allSelected ? new Set<FaceKey>() : new Set(allKeys);
      set({ adjustSelectedFaces: next });
      get().updateAdjustPreview();
    },

    reshuffleSeeds: () => {
      const { adjustSeeds } = get();
      const next = new Map<FaceKey, number>();
      for (const key of adjustSeeds.keys()) {
        next.set(key, generateSeed());
      }
      set({ adjustSeeds: next });
      get().updateAdjustPreview();
      get().pushAdjustHistory();
    },

    updateAdjustPreview: () => {
      const { adjustOriginalData, adjustSelectedFaces, adjustParams, adjustSeeds, modelType } = get();
      if (!adjustOriginalData) return;

      const isDefault = adjustParams.brightness === 0 && adjustParams.contrast === 0 &&
        adjustParams.saturation === 0 && adjustParams.hue === 0 && adjustParams.noise === 0;

      if (isDefault || adjustSelectedFaces.size === 0) {
        set({ adjustPreviewData: cloneSkinData(adjustOriginalData) });
        return;
      }

      const rects: { rect: PartRect; seed: number }[] = [];
      for (const part of ALL_PARTS) {
        for (const layer of ALL_LAYERS) {
          const partUV = getPartUV(part, layer, modelType);
          for (const face of ALL_FACES) {
            const key = makeFaceKey(part, layer, face);
            if (adjustSelectedFaces.has(key)) {
              rects.push({
                rect: partUV[face],
                seed: adjustSeeds.get(key) || 1,
              });
            }
          }
        }
      }

      const preview = applyAdjustToRects(adjustOriginalData, rects, adjustParams);
      set({ adjustPreviewData: preview });
    },

    pushAdjustHistory: () => {
      const { adjustParams, adjustSeeds, adjustHistory, adjustHistoryIndex } = get();
      const newHistory = adjustHistory.slice(0, adjustHistoryIndex + 1);
      newHistory.push({
        params: { ...adjustParams },
        seeds: new Map(adjustSeeds),
      });
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      set({
        adjustHistory: newHistory,
        adjustHistoryIndex: newHistory.length - 1,
      });
    },

    undoAdjust: () => {
      const { adjustHistory, adjustHistoryIndex } = get();
      if (adjustHistoryIndex <= 0) return;
      const prevIndex = adjustHistoryIndex - 1;
      const entry = adjustHistory[prevIndex];
      set({
        adjustParams: { ...entry.params },
        adjustSeeds: new Map(entry.seeds),
        adjustHistoryIndex: prevIndex,
      });
      get().updateAdjustPreview();
    },

    redoAdjust: () => {
      const { adjustHistory, adjustHistoryIndex } = get();
      if (adjustHistoryIndex >= adjustHistory.length - 1) return;
      const nextIndex = adjustHistoryIndex + 1;
      const entry = adjustHistory[nextIndex];
      set({
        adjustParams: { ...entry.params },
        adjustSeeds: new Map(entry.seeds),
        adjustHistoryIndex: nextIndex,
      });
      get().updateAdjustPreview();
    },
  };
}
