import { useMemo, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useEditorStore } from '../../store/editorStore';
import { getPartUV, SKIN_WIDTH, SKIN_HEIGHT } from '../../constants/skinTemplate';
import type { PartKey } from '../../constants/skinTemplate';
import type { PartUV, PartRect, SkinData } from '../../types';

import { SCALE, OVERLAY_EXPAND, useSkinTexture } from '../../constants/preview3d';

// ===== UV マッピング =====

/**
 * PartRect → テクスチャ上のUV座標 [u0, v0, u1, v1]
 *
 * DataTexture は flipY=false なので:
 *   V=0 → データ先頭行（画像の上端, y=0）
 *   V=1 → データ最終行（画像の下端, y=63）
 * つまり V は画像の y 座標にそのまま比例する
 */
function rectToUV(rect: PartRect): [number, number, number, number] {
  return [
    rect.x / SKIN_WIDTH,                // u0: 左端
    rect.y / SKIN_HEIGHT,               // v0: 上端（小さいV = 画像上）
    (rect.x + rect.w) / SKIN_WIDTH,     // u1: 右端
    (rect.y + rect.h) / SKIN_HEIGHT,    // v1: 下端（大きいV = 画像下）
  ];
}

/**
 * Three.js BoxGeometry の面グループ順序:
 *   0: +X → キャラの左(left)   ← カメラから見て右
 *   1: -X → キャラの右(right)  ← カメラから見て左
 *   2: +Y → うえ(top)
 *   3: -Y → した(bottom)
 *   4: +Z → まえ(front)        ← カメラ方向
 *   5: -Z → うしろ(back)
 *
 * ※ キャラは +Z 方向（カメラ側）を向いている。
 *   +X はカメラから見て右 = キャラの左手側。
 */
const FACE_ORDER: (keyof PartUV)[] = [
  'left',    // +X → キャラの左
  'right',   // -X → キャラの右
  'top',     // +Y
  'bottom',  // -Y
  'front',   // +Z
  'back',    // -Z
];

/**
 * BoxGeometry の UV 属性をスキンテクスチャに合わせて書き換える
 *
 * BoxGeometry の各面は4頂点を持ち、外側から見たとき:
 *   頂点0 = 左上,  頂点1 = 右上,  頂点2 = 左下,  頂点3 = 右下
 *
 * DataTexture (flipY=false) では:
 *   小さいV = 画像上端,  大きいV = 画像下端
 * なので、上の頂点に v0（小）、下の頂点に v1（大）を割り当てる。
 *
 * 全6面で同じ割り当てにすることで、
 * 2D展開図を折りたたんだ結果と3Dプレビューが一致する。
 */
function applyUVs(geo: THREE.BoxGeometry, partUV: PartUV) {
  const uvAttr = geo.getAttribute('uv');
  const uv = uvAttr.array as Float32Array;

  for (let face = 0; face < 6; face++) {
    const [u0, v0, u1, v1] = rectToUV(partUV[FACE_ORDER[face]]);
    const o = face * 8; // 4頂点 × 2成分
    // 頂点0(左上) → v0, 頂点1(右上) → v0, 頂点2(左下) → v1, 頂点3(右下) → v1
    uv[o    ] = u0; uv[o + 1] = v0;
    uv[o + 2] = u1; uv[o + 3] = v0;
    uv[o + 4] = u0; uv[o + 5] = v1;
    uv[o + 6] = u1; uv[o + 7] = v1;
  }
  uvAttr.needsUpdate = true;
}

// ===== パーツ定義 =====

interface PartDef {
  key: PartKey;
  w: number; h: number; d: number;
  x: number; y: number; z: number;
}

/**
 * キャラクターの各パーツの寸法と配置（ピクセル単位）
 * 足元 y=0、頭頂 y=32
 */
function getPartDefs(slim: boolean): PartDef[] {
  const armW = slim ? 3 : 4;
  const armOffX = 4 + armW / 2; // からだの半幅(4) + うでの半幅
  return [
    { key: 'head',     w: 8,    h: 8,  d: 8, x: 0,        y: 28, z: 0 },
    { key: 'body',     w: 8,    h: 12, d: 4, x: 0,        y: 18, z: 0 },
    { key: 'rightArm', w: armW, h: 12, d: 4, x: -armOffX, y: 18, z: 0 },
    { key: 'leftArm',  w: armW, h: 12, d: 4, x: armOffX,  y: 18, z: 0 },
    { key: 'rightLeg', w: 4,    h: 12, d: 4, x: -2,       y: 6,  z: 0 },
    { key: 'leftLeg',  w: 4,    h: 12, d: 4, x: 2,        y: 6,  z: 0 },
  ];
}

// ===== テクスチャフック =====

/** 表示中のスキンデータ（色調整中はプレビュー、通常時はskinData）を返す */
function useDisplayData(): SkinData {
  const skinData = useEditorStore((s) => s.skinData);
  const isAdjusting = useEditorStore((s) => s.isAdjusting);
  const adjustPreviewData = useEditorStore((s) => s.adjustPreviewData);
  return isAdjusting && adjustPreviewData ? adjustPreviewData : skinData;
}

// ===== 3D スキンモデル =====

function SkinModel() {
  const modelType = useEditorStore((s) => s.modelType);
  const previewLayerMode = useEditorStore((s) => s.previewLayerMode);
  const viewMode = useEditorStore((s) => s.viewMode);
  const texture = useSkinTexture(useDisplayData());

  const isSlim = modelType === 'slim';
  const showBase = previewLayerMode !== 'overlay';
  const showOverlay = previewLayerMode !== 'base';

  const allParts = useMemo(() => getPartDefs(isSlim), [isSlim]);

  // viewMode に応じて表示パーツをフィルタ（'all' なら全部、それ以外は指定パーツのみ）
  const parts = useMemo(
    () => viewMode === 'all' ? allParts : allParts.filter((p) => p.key === viewMode),
    [allParts, viewMode],
  );

  // ベースレイヤー用マテリアル（MeshBasicMaterial: ライティング無視で色をそのまま表示）
  const baseMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.1,
      }),
    [texture],
  );

  // オーバーレイレイヤー用マテリアル
  const overlayMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.1,
        side: THREE.DoubleSide,
      }),
    [texture],
  );

  // 全パーツのジオメトリを生成（modelType が変わったら再生成）
  const geometries = useMemo(() => {
    const result: Record<string, { base: THREE.BoxGeometry; overlay: THREE.BoxGeometry }> = {};
    for (const p of allParts) {
      const baseUV = getPartUV(p.key, 'base', modelType);
      const overlayUV = getPartUV(p.key, 'overlay', modelType);

      const baseGeo = new THREE.BoxGeometry(p.w, p.h, p.d);
      applyUVs(baseGeo, baseUV);

      const overlayGeo = new THREE.BoxGeometry(
        p.w + OVERLAY_EXPAND,
        p.h + OVERLAY_EXPAND,
        p.d + OVERLAY_EXPAND,
      );
      applyUVs(overlayGeo, overlayUV);

      result[p.key] = { base: baseGeo, overlay: overlayGeo };
    }
    return result;
  }, [allParts, modelType]);

  // ジオメトリのクリーンアップ
  useEffect(() => {
    return () => {
      Object.values(geometries).forEach(({ base, overlay }) => {
        base.dispose();
        overlay.dispose();
      });
    };
  }, [geometries]);

  // 表示パーツの中心を原点に合わせるオフセット（ピクセル単位）
  const centerOffset = useMemo(() => {
    if (parts.length === 0) return { x: 0, y: 16, z: 0 };
    if (parts.length === 1) {
      // 単一パーツ: そのパーツの中心を原点にする
      return { x: parts[0].x, y: parts[0].y, z: parts[0].z };
    }
    // 全パーツ: キャラ全体の中心 (y=16)
    return { x: 0, y: 16, z: 0 };
  }, [parts]);

  return (
    <group scale={[SCALE, SCALE, SCALE]} position={[
      -centerOffset.x * SCALE,
      -centerOffset.y * SCALE,
      -centerOffset.z * SCALE,
    ]}>
      {parts.map((p) => (
        <group key={p.key} position={[p.x, p.y, p.z]}>
          {showBase && (
            <mesh geometry={geometries[p.key].base} material={baseMaterial} />
          )}
          {showOverlay && (
            <mesh geometry={geometries[p.key].overlay} material={overlayMaterial} />
          )}
        </group>
      ))}
    </group>
  );
}

// ===== Preview3D コンポーネント =====

export function Preview3D() {
  return (
    <div className="panel" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <p className="panel-title">3Dプレビュー</p>
      <div style={{ flex: 1, minHeight: 100, borderRadius: 'var(--radius-sm)', overflow: 'hidden', background: 'var(--color-bg-thumbnail)' }}>
        <Canvas
          camera={{ position: [0, 0, 3], fov: 50 }}
          flat        /* トーンマッピング無効化: 色をそのまま表示 */
        >
          {/* MeshBasicMaterial なのでライティング不要 */}
          <SkinModel />
          <OrbitControls
            enablePan={false}
            enableDamping={false}
            minDistance={0.5}
            maxDistance={6}
          />
        </Canvas>
      </div>
      <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-sub)', margin: 'var(--space-xs) 0 0', textAlign: 'center' }}>
        マウスでまわせるよ ホイールでズーム
      </p>
    </div>
  );
}
