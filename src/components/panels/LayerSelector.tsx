import { useState, useCallback } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { UI_TEXT } from '../../constants/uiText';
import type { LayerType } from '../../types';

/** レイヤー解説モーダル */
function LayerHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: 420, lineHeight: 1.8 }}
        onClick={(e) => e.stopPropagation()}
      >
        <p style={{ fontWeight: 700, fontSize: 'var(--font-size-base)', margin: '0 0 var(--space-md)', color: 'var(--color-primary)' }}>
          レイヤーってなに？
        </p>

        <p style={{ margin: '0 0 var(--space-sm)' }}>
          レイヤーは、かさねられるとうめいなシートのことだよ。
        </p>
        <p style={{ margin: '0 0 var(--space-sm)' }}>
          マイクラのスキンは、<strong>「した」と「うえ」の2まいのレイヤー</strong>がかさなってできているよ。
        </p>

        <p style={{ margin: '0 0 var(--space-xs)', fontWeight: 600, color: 'var(--color-primary)' }}>
          したのレイヤー（ベース）
        </p>
        <p style={{ margin: '0 0 var(--space-sm)' }}>
          はだの色やかおなど、からだのもとになる絵をかくよ。
        </p>

        <p style={{ margin: '0 0 var(--space-xs)', fontWeight: 600, color: 'var(--color-primary)' }}>
          うえのレイヤー（オーバーレイ）
        </p>
        <p style={{ margin: '0 0 var(--space-sm)' }}>
          ぼうしやメガネ、ふくのもようなど、うえからかさねるものをここにかくよ。
          ぬらなかったところは、すきとおって下の絵が見えるよ。
        </p>

        <div style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border-light)',
          borderRadius: 'var(--radius-sm)',
          padding: 'var(--space-sm) var(--space-md)',
          margin: 'var(--space-md) 0',
          fontSize: 'var(--font-size-base)',
          lineHeight: 1.7,
        }}>
          <p style={{ margin: 0, fontWeight: 600 }}>たとえば…</p>
          <p style={{ margin: 'var(--space-xs) 0 0' }}>
            「したのレイヤー」にかおをかいて、「うえのレイヤー」にサングラスをかくと、
            サングラスをかけたキャラができるよ！
          </p>
        </div>

        <button
          className="tool-btn"
          onClick={onClose}
          style={{ width: '100%', marginTop: 'var(--space-sm)', justifyContent: 'center' }}
        >
          とじる
        </button>
      </div>
    </div>
  );
}

/**
 * レイヤー切替パネル（左サイドバー用）
 * 「したのいろ / うえのいろ」＝描画先レイヤーの選択
 */
export function LayerSelector() {
  const activeLayer = useEditorStore((s) => s.activeLayer);
  const setActiveLayer = useEditorStore((s) => s.setActiveLayer);

  const [showHelp, setShowHelp] = useState(false);
  const openHelp = useCallback(() => setShowHelp(true), []);
  const closeHelp = useCallback(() => setShowHelp(false), []);

  const layers: LayerType[] = ['base', 'overlay'];

  return (
    <div className="panel">
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-xs)', marginBottom: 'var(--space-xs)' }}>
        <p className="panel-title" style={{ margin: 0 }}>えをかくレイヤー</p>
        <button
          onClick={openHelp}
          title="レイヤーってなに？"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 18,
            height: 18,
            padding: 0,
            border: '1px solid var(--color-border)',
            borderRadius: '50%',
            background: 'var(--color-bg)',
            color: 'var(--color-text-sub)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            cursor: 'pointer',
            lineHeight: 1,
            fontFamily: 'var(--font-family)',
          }}
        >
          ?
        </button>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
        {layers.map((type) => (
          <button
            key={type}
            className={`tool-btn ${activeLayer === type ? 'active' : ''}`}
            onClick={() => setActiveLayer(type)}
            title={UI_TEXT.layers[type].tip}
            style={{ flex: 1 }}
          >
            {UI_TEXT.layers[type].name}
          </button>
        ))}
      </div>

      {showHelp && <LayerHelpModal onClose={closeHelp} />}
    </div>
  );
}
