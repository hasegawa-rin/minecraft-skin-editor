import { useState, useEffect, useRef, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { useEditorStore } from '../../store/editorStore';
import { getPartUV, SKIN_WIDTH, SKIN_HEIGHT } from '../../constants/skinTemplate';
import { loadPngAsData } from '../../utils/skinIO';
import type { PartKey } from '../../constants/skinTemplate';
import type { PartUV, PartRect, ModelType, SkinData } from '../../types';

import { SCALE, OVERLAY_EXPAND } from '../../constants/preview3d';

/** サンプルスキンの定義 */
const SKIN_CHARACTERS = [
  { id: 'steve', name: 'Steve', nameJa: 'スティーブ' },
  { id: 'alex', name: 'Alex', nameJa: 'アレックス' },
  { id: 'ari', name: 'Ari', nameJa: 'アリ' },
  { id: 'efe', name: 'Efe', nameJa: 'エフェ' },
  { id: 'kai', name: 'Kai', nameJa: 'カイ' },
  { id: 'makena', name: 'Makena', nameJa: 'マケナ' },
  { id: 'noor', name: 'Noor', nameJa: 'ノール' },
  { id: 'sunny', name: 'Sunny', nameJa: 'サニー' },
  { id: 'zuri', name: 'Zuri', nameJa: 'ズリ' },
] as const;

// ===== UV マッピング（Preview3D と同じロジック） =====

function rectToUV(rect: PartRect): [number, number, number, number] {
  return [
    rect.x / SKIN_WIDTH,
    rect.y / SKIN_HEIGHT,
    (rect.x + rect.w) / SKIN_WIDTH,
    (rect.y + rect.h) / SKIN_HEIGHT,
  ];
}

const FACE_ORDER: (keyof PartUV)[] = ['left', 'right', 'top', 'bottom', 'front', 'back'];

function applyUVs(geo: THREE.BoxGeometry, partUV: PartUV) {
  const uvAttr = geo.getAttribute('uv');
  const uv = uvAttr.array as Float32Array;
  for (let face = 0; face < 6; face++) {
    const [u0, v0, u1, v1] = rectToUV(partUV[FACE_ORDER[face]]);
    const o = face * 8;
    uv[o] = u0; uv[o + 1] = v0;
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

function getPartDefs(slim: boolean): PartDef[] {
  const armW = slim ? 3 : 4;
  const armOffX = 4 + armW / 2;
  return [
    { key: 'head', w: 8, h: 8, d: 8, x: 0, y: 28, z: 0 },
    { key: 'body', w: 8, h: 12, d: 4, x: 0, y: 18, z: 0 },
    { key: 'rightArm', w: armW, h: 12, d: 4, x: -armOffX, y: 18, z: 0 },
    { key: 'leftArm', w: armW, h: 12, d: 4, x: armOffX, y: 18, z: 0 },
    { key: 'rightLeg', w: 4, h: 12, d: 4, x: -2, y: 6, z: 0 },
    { key: 'leftLeg', w: 4, h: 12, d: 4, x: 2, y: 6, z: 0 },
  ];
}

// ===== 3D サムネイルモデル =====

export function ThumbnailModel({ skinData, modelType }: { skinData: SkinData; modelType: ModelType }) {
  const isSlim = modelType === 'slim';
  const texRef = useRef<THREE.DataTexture | null>(null);

  if (!texRef.current) {
    const tex = new THREE.DataTexture(
      new Uint8Array(SKIN_WIDTH * SKIN_HEIGHT * 4),
      SKIN_WIDTH, SKIN_HEIGHT, THREE.RGBAFormat,
    );
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    texRef.current = tex;
  }

  useEffect(() => {
    const tex = texRef.current!;
    (tex.image.data as Uint8Array).set(skinData);
    tex.needsUpdate = true;
  }, [skinData]);

  const parts = useMemo(() => getPartDefs(isSlim), [isSlim]);

  const baseMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ map: texRef.current!, transparent: true, alphaTest: 0.1 }),
    [],
  );
  const overlayMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({ map: texRef.current!, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide }),
    [],
  );

  const geometries = useMemo(() => {
    const result: Record<string, { base: THREE.BoxGeometry; overlay: THREE.BoxGeometry }> = {};
    for (const p of parts) {
      const baseUV = getPartUV(p.key, 'base', modelType);
      const overlayUV = getPartUV(p.key, 'overlay', modelType);
      const baseGeo = new THREE.BoxGeometry(p.w, p.h, p.d);
      applyUVs(baseGeo, baseUV);
      const overlayGeo = new THREE.BoxGeometry(p.w + OVERLAY_EXPAND, p.h + OVERLAY_EXPAND, p.d + OVERLAY_EXPAND);
      applyUVs(overlayGeo, overlayUV);
      result[p.key] = { base: baseGeo, overlay: overlayGeo };
    }
    return result;
  }, [parts, modelType]);

  useEffect(() => {
    return () => {
      Object.values(geometries).forEach(({ base, overlay }) => { base.dispose(); overlay.dispose(); });
    };
  }, [geometries]);

  return (
    <group scale={[SCALE, SCALE, SCALE]} position={[0, -16 * SCALE, 0]}>
      {parts.map((p) => (
        <group key={p.key} position={[p.x, p.y, p.z]}>
          <mesh geometry={geometries[p.key].base} material={baseMaterial} />
          <mesh geometry={geometries[p.key].overlay} material={overlayMaterial} />
        </group>
      ))}
    </group>
  );
}

// ===== サムネイルカード =====

function SkinCard({
  name,
  nameJa,
  skinData,
  modelType,
  selected,
  onClick,
}: {
  name: string;
  nameJa: string;
  skinData: SkinData | null;
  modelType: ModelType;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 'var(--space-xs)',
        padding: 'var(--space-xs)',
        border: selected ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        background: selected ? 'var(--color-primary-light)' : 'var(--color-bg-panel)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ width: 104, height: 130, borderRadius: 'var(--space-xs)', overflow: 'hidden', background: 'var(--color-bg-thumbnail)' }}>
        {skinData ? (
          <Canvas camera={{ position: [0, 0, 2.8], fov: 50 }} flat>
            <ThumbnailModel skinData={skinData} modelType={modelType} />
          </Canvas>
        ) : (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: 'var(--color-text-sub)',
          }}>
            ...
          </div>
        )}
      </div>
      <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: selected ? 700 : 400, lineHeight: 1.2 }}>
        {name}
      </span>
      <span style={{ fontSize: 10, color: 'var(--color-text-sub)', lineHeight: 1.2 }}>
        {nameJa}
      </span>
    </button>
  );
}

// ===== メインコンポーネント: 1画面でモデル切替＋スキン選択 =====

export function SkinSelector() {
  const modelType = useEditorStore((s) => s.modelType);
  const setModelType = useEditorStore((s) => s.setModelType);
  const startEditing = useEditorStore((s) => s.startEditing);

  const [skinDataMap, setSkinDataMap] = useState<Record<string, SkinData>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // モデルタイプが変わったらサンプルスキンを再読み込み
  useEffect(() => {
    const suffix = modelType === 'classic' ? 'wide' : 'slim';
    const promises = SKIN_CHARACTERS.map(async (char) => {
      const url = `${import.meta.env.BASE_URL}skins/${char.id}_${suffix}.png`;
      try {
        const data = await loadPngAsData(url);
        return { id: char.id, data };
      } catch {
        return null;
      }
    });
    Promise.all(promises).then((results) => {
      const map: Record<string, SkinData> = {};
      for (const r of results) {
        if (r) map[r.id] = r.data;
      }
      setSkinDataMap(map);
    });
  }, [modelType]);

  const handleStart = () => {
    if (selectedId === 'empty') {
      startEditing(new Uint8ClampedArray(SKIN_WIDTH * SKIN_HEIGHT * 4));
    } else if (selectedId && skinDataMap[selectedId]) {
      startEditing(skinDataMap[selectedId]);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', padding: 'var(--space-lg)', gap: 'var(--space-lg)',
    }}>
      <h2 style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary)', margin: 0 }}>
        ベースにするスキンをえらぼう
      </h2>

      {/* スキングリッド */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, auto)',
        gap: 'var(--space-sm)',
      }}>
        {SKIN_CHARACTERS.map((char) => (
          <SkinCard
            key={char.id}
            name={char.name}
            nameJa={char.nameJa}
            skinData={skinDataMap[char.id] ?? null}
            modelType={modelType}
            selected={selectedId === char.id}
            onClick={() => setSelectedId(char.id)}
          />
        ))}
        {/* 透明（じゆうにつくる） */}
        <button
          onClick={() => setSelectedId('empty')}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 'var(--space-xs)', padding: 'var(--space-xs)',
            border: selectedId === 'empty' ? '2px solid var(--color-primary)' : '2px solid var(--color-border)',
            borderRadius: 'var(--radius-sm)',
            background: selectedId === 'empty' ? 'var(--color-primary-light)' : 'var(--color-bg-panel)',
            cursor: 'pointer', transition: 'all 0.15s ease',
          }}
        >
          <div style={{
            width: 104, height: 130, borderRadius: 'var(--space-xs)', overflow: 'hidden',
            background: 'repeating-conic-gradient(var(--color-checker-light) 0% 25%, var(--color-checker-dark) 0% 50%) 50% / 12px 12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 20 }}>✨</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 'calc(var(--font-size-sm) * 1.2 + 10px * 1.2 + 2px)',
          }}>
            <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: selectedId === 'empty' ? 700 : 400, whiteSpace: 'nowrap', lineHeight: 1.2 }}>
              じゆうにつくる
            </span>
          </div>
        </button>
      </div>

      {/* 下部: うでのふとさ切替 + はじめるボタン */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 612 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)' }}>
          <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 700, color: 'var(--color-primary)' }}>
            うでのふとさ
          </span>
          <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
            <button
              className={`tool-btn ${modelType === 'slim' ? 'active' : ''}`}
              onClick={() => setModelType('slim')}
            >
              ほそめ
            </button>
            <button
              className={`tool-btn ${modelType === 'classic' ? 'active' : ''}`}
              onClick={() => setModelType('classic')}
            >
              ふとめ
            </button>
          </div>
        </div>

        <button
          className={`tool-btn btn-primary`}
          disabled={!selectedId}
          onClick={handleStart}
          style={{ paddingInline: 40 }}
        >
          このスキンではじめる
        </button>
      </div>
    </div>
  );
}
