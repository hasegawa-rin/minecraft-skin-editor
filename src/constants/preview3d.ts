/**
 * 3Dプレビュー共通定数・ユーティリティ
 * Preview3D.tsx と SkinSelector.tsx の両方で使用
 */
import { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { SKIN_WIDTH, SKIN_HEIGHT } from './skinTemplate';
import type { SkinData } from '../types';

/** 1ピクセル = SCALE ユニット（32px高キャラ → 2ユニット高） */
export const SCALE = 1 / 16;

/** オーバーレイレイヤーの膨らみ（ピクセル単位） */
export const OVERLAY_EXPAND = 0.5;

/**
 * スキンデータから DataTexture を生成する
 * - NearestFilter: ドット絵をぼかさずカクッと表示
 * - SRGBColorSpace: 正しい色味
 * - flipY = false（デフォルト）: データ先頭行 = V=0 = 画像上端
 *
 * 生成したテクスチャは呼び出し側で dispose() すること。
 */
export function createSkinTexture(data: SkinData): THREE.DataTexture {
  const tex = new THREE.DataTexture(
    new Uint8Array(data),
    SKIN_WIDTH,
    SKIN_HEIGHT,
    THREE.RGBAFormat,
  );
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * スキンデータを Three.js テクスチャとして提供するフック。
 *
 * データが変わるたびに新しいテクスチャを生成する（64×64と軽量なので毎回生成して問題ない）。
 * こうすることで「ミュータブルなテクスチャをレンダー外で書き換える」必要がなくなり、
 * React のルール（refをレンダー中に読まない・値を直接書き換えない）に自然に適合する。
 * 古いテクスチャは effect でクリーンアップする。
 */
export function useSkinTexture(data: SkinData): THREE.DataTexture {
  const texture = useMemo(() => createSkinTexture(data), [data]);

  useEffect(() => {
    return () => { texture.dispose(); };
  }, [texture]);

  return texture;
}
