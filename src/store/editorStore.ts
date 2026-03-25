/**
 * エディターストア（Zustand）
 * コアの状態管理 + クリップボードスライス + 色調整スライス
 */

import { create } from 'zustand';
import type {
  ModelType,
  ToolType,
  LayerType,
  PreviewLayerMode,
  ViewMode,
  RGBAColor,
  SkinData,
  HistoryEntry,
} from '../types';
import { SKIN_WIDTH, SKIN_HEIGHT } from '../constants/skinTemplate';

// スライスの再エクスポート（既存の import パスを維持するため）
export { makeFaceKey } from './adjustSlice';
export type { FaceKey, AdjustTargetLayer } from './adjustSlice';
export type { FaceClipboard, PartClipboard, PasteMode } from './clipboardSlice';

// スライス生成関数
import { createClipboardSlice } from './clipboardSlice';
import type { ClipboardState, ClipboardActions } from './clipboardSlice';
import { createAdjustSlice } from './adjustSlice';
import type { AdjustState, AdjustActions } from './adjustSlice';

/** アプリのフェーズ（初期選択 → 編集） */
export type AppPhase = 'selecting' | 'editing';

const MAX_HISTORY = 20;

/** 空のスキンデータ（64x64、全て透明）を生成 */
function createEmptySkin(): SkinData {
  return new Uint8ClampedArray(SKIN_WIDTH * SKIN_HEIGHT * 4);
}

/** SkinDataのディープコピー */
function cloneSkinData(data: SkinData): SkinData {
  return new Uint8ClampedArray(data);
}

// ===== コア状態の型定義 =====

interface CoreState {
  phase: AppPhase;
  skinData: SkinData;
  modelType: ModelType;
  currentTool: ToolType;
  currentColor: RGBAColor;
  activeLayer: LayerType;
  previewLayerMode: PreviewLayerMode;
  viewMode: ViewMode;
  zoomLevel: number;
  history: HistoryEntry[];
  historyIndex: number;
}

interface CoreActions {
  setModelType: (type: ModelType) => void;
  setCurrentTool: (tool: ToolType) => void;
  setCurrentColor: (color: RGBAColor) => void;
  setActiveLayer: (layer: LayerType) => void;
  setPreviewLayerMode: (mode: PreviewLayerMode) => void;
  setViewMode: (mode: ViewMode) => void;
  setZoomLevel: (level: number) => void;
  setPixel: (x: number, y: number, color: RGBAColor) => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  loadSkinData: (data: SkinData, model: ModelType) => void;
  newSkin: (model: ModelType) => void;
  startEditing: (skinData: SkinData) => void;
  backToSelecting: () => void;
}

// ===== 統合型 =====

type EditorState = CoreState & CoreActions & ClipboardState & ClipboardActions & AdjustState & AdjustActions;

// ===== ストア生成 =====

export const useEditorStore = create<EditorState>((set, get) => ({
  // ===== コア初期値 =====
  phase: 'selecting',
  skinData: createEmptySkin(),
  modelType: 'slim',

  currentTool: 'brush',
  currentColor: { r: 0, g: 0, b: 0, a: 255 },

  activeLayer: 'base',
  previewLayerMode: 'both',

  viewMode: 'all',
  zoomLevel: 4, // ZOOM_STEPS[4] = 12px = 100%

  history: [],
  historyIndex: -1,

  // ===== コアセッター =====
  setModelType: (type) => set({ modelType: type }),
  setCurrentTool: (tool) => set({ currentTool: tool }),
  setCurrentColor: (color) => set({ currentColor: color }),
  setActiveLayer: (layer) => set({ activeLayer: layer }),
  setPreviewLayerMode: (mode) => set({ previewLayerMode: mode }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setZoomLevel: (level) => set({ zoomLevel: Math.max(0, Math.min(9, level)) }),

  // ===== ピクセル操作 =====
  setPixel: (x, y, color) => {
    const { skinData } = get();
    if (x < 0 || x >= SKIN_WIDTH || y < 0 || y >= SKIN_HEIGHT) return;
    const i = (y * SKIN_WIDTH + x) * 4;
    skinData[i] = color.r;
    skinData[i + 1] = color.g;
    skinData[i + 2] = color.b;
    skinData[i + 3] = color.a;
    set({ skinData: new Uint8ClampedArray(skinData) });
  },

  // ===== 履歴 =====
  pushHistory: () => {
    const { skinData, history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ data: cloneSkinData(skinData) });
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    }
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex, skinData } = get();
    if (historyIndex < 0) return;
    const currentEntry = { data: cloneSkinData(skinData) };
    const targetData = cloneSkinData(history[historyIndex].data);

    const newHistory = [...history];
    if (historyIndex === history.length - 1) {
      newHistory.push(currentEntry);
    } else {
      newHistory[historyIndex + 1] = currentEntry;
    }

    set({
      skinData: targetData,
      history: newHistory,
      historyIndex: historyIndex - 1,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const nextIndex = historyIndex + 1;
    // redo先は historyIndex+2 のデータ
    if (nextIndex + 1 < history.length) {
      set({
        skinData: cloneSkinData(history[nextIndex + 1].data),
        historyIndex: nextIndex,
      });
    }
  },

  // ===== ファイル操作 =====
  loadSkinData: (data, model) => {
    set({
      skinData: cloneSkinData(data),
      modelType: model,
      phase: 'editing',
      history: [],
      historyIndex: -1,
    });
  },

  newSkin: (model) => {
    set({
      skinData: createEmptySkin(),
      modelType: model,
      phase: 'editing',
      history: [],
      historyIndex: -1,
      activeLayer: 'base',
      viewMode: 'all',
    });
  },

  // ===== フェーズ管理 =====
  startEditing: (skinData) => {
    set({
      skinData: cloneSkinData(skinData),
      phase: 'editing',
      history: [],
      historyIndex: -1,
      activeLayer: 'base',
      viewMode: 'all',
    });
  },

  backToSelecting: () => {
    set({
      phase: 'selecting',
      skinData: createEmptySkin(),
      history: [],
      historyIndex: -1,
      activeLayer: 'base',
      viewMode: 'all',
      faceClipboard: null,
      partClipboard: null,
    });
  },

  // ===== クリップボードスライス =====
  ...createClipboardSlice(
    set as Parameters<typeof createClipboardSlice>[0],
    get as unknown as Parameters<typeof createClipboardSlice>[1],
  ),

  // ===== 色調整スライス =====
  ...createAdjustSlice(
    set as Parameters<typeof createAdjustSlice>[0],
    get as unknown as Parameters<typeof createAdjustSlice>[1],
  ),
}));
