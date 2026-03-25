import { useCallback, useEffect, useRef, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import type { RGBAColor } from '../../types';

/** #RRGGBB 文字列をRGBAColorに変換 */
function hexToRGBA(hex: string, alpha: number): RGBAColor {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b, a: alpha };
}

/** RGBAColor を #RRGGBB に変換 */
function rgbaToHex(c: RGBAColor): string {
  return `#${c.r.toString(16).padStart(2, '0')}${c.g.toString(16).padStart(2, '0')}${c.b.toString(16).padStart(2, '0')}`;
}

/** RGBAをCSS文字列に変換 */
function rgbaToCSS(c: RGBAColor): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a / 255})`;
}

/** コピーアイコン（SVG） */
function CopyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5.5" y="5.5" width="8" height="8" rx="1.5" />
      <path d="M10.5 5.5V3.5a1.5 1.5 0 0 0-1.5-1.5H3.5A1.5 1.5 0 0 0 2 3.5V9a1.5 1.5 0 0 0 1.5 1.5h2" />
    </svg>
  );
}

/** チェックアイコン（SVG） */
function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5l3.5 3.5L13 4" />
    </svg>
  );
}

export function ColorPalette() {
  const currentColor = useEditorStore((s) => s.currentColor);
  const setCurrentColor = useEditorStore((s) => s.setCurrentColor);
  const hexInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // コピー表示タイマーのクリーンアップ
  useEffect(() => {
    return () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current); };
  }, []);

  const isTransparent = currentColor.a === 0;
  const hexValue = rgbaToHex(currentColor);

  // ストアの色が変わったら（スポイト等）hex入力欄も同期
  useEffect(() => {
    if (hexInputRef.current && document.activeElement !== hexInputRef.current) {
      hexInputRef.current.value = hexValue;
    }
  }, [hexValue]);

  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value;
    if (hexInputRef.current) hexInputRef.current.value = hex;
    setCurrentColor(hexToRGBA(hex, currentColor.a));
  }, [currentColor.a, setCurrentColor]);

  const handleHexInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      setCurrentColor(hexToRGBA(val, currentColor.a));
    }
  }, [currentColor.a, setCurrentColor]);

  const toggleTransparent = useCallback(() => {
    if (isTransparent) {
      setCurrentColor({ ...currentColor, a: 255 });
    } else {
      setCurrentColor({ ...currentColor, a: 0 });
    }
  }, [currentColor, isTransparent, setCurrentColor]);

  const handleCopyHex = useCallback(() => {
    navigator.clipboard.writeText(hexValue).then(() => {
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1200);
    });
  }, [hexValue]);

  return (
    <div className="panel panel--no-title">
      {/* 色プレビュー（クリックでカラーピッカーを開く） */}
      <div style={{ position: 'relative', marginBottom: 'var(--space-sm)' }}>
        <div style={{
          width: '100%',
          height: 48,
          borderRadius: 'var(--space-xs)',
          background: isTransparent
            ? 'repeating-conic-gradient(var(--color-checker-light) 0% 25%, var(--color-checker-dark) 0% 50%) 0 0 / 12px 12px'
            : `linear-gradient(${rgbaToCSS(currentColor)}, ${rgbaToCSS(currentColor)})`,
          cursor: 'pointer',
        }}
          onClick={() => {
            const picker = document.getElementById('color-picker-hidden');
            if (picker) picker.click();
          }}
        />
        <input
          id="color-picker-hidden"
          type="color"
          value={hexValue}
          onChange={handleColorChange}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 0,
            height: 0,
            opacity: 0,
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* HEX入力 + コピーボタン */}
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 'var(--space-xs)', marginBottom: 'var(--space-sm)', height: 30 }}>
        <input
          ref={hexInputRef}
          type="text"
          defaultValue={hexValue}
          onChange={handleHexInput}
          maxLength={7}
          style={{
            width: 0,
            flex: 1,
            minWidth: 0,
            padding: '0 var(--space-sm)',
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--space-xs)',
            color: isTransparent ? 'var(--color-text-light)' : 'var(--color-text)',
            fontFamily: 'monospace',
            fontSize: 'var(--font-size-base)',
            textAlign: 'center',
          }}
          disabled={isTransparent}
          placeholder="#000000"
        />
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={handleCopyHex}
            title="コピー"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: '100%',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--space-xs)',
              background: 'var(--color-bg)',
              color: copied ? 'var(--color-primary)' : 'var(--color-text-sub)',
              cursor: 'pointer',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
          {/* コピー時のツールチップ */}
          {copied && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              right: 0,
              marginBottom: 'var(--space-xs)',
              padding: '2px 6px',
              borderRadius: 3,
              background: 'var(--color-text)',
              color: '#fff',
              fontSize: 'var(--font-size-sm)',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
            }}>
              コピーしたよ!
            </div>
          )}
        </div>
      </div>

      {/* とうめいトグル */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-sm)',
      }}>
        <span style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-text)', flexShrink: 0 }}>とうめい</span>
        <button
          onClick={toggleTransparent}
          style={{
            flex: 1,
            height: 30,
            borderRadius: 'var(--radius-sm)',
            border: '1px solid',
            borderColor: isTransparent ? 'var(--color-primary)' : 'var(--color-border)',
            padding: 0,
            cursor: 'pointer',
            background: isTransparent ? 'var(--color-primary)' : 'var(--color-bg)',
            color: isTransparent ? '#fff' : 'var(--color-text-sub)',
            fontSize: 'var(--font-size-base)',
            fontWeight: 600,
            fontFamily: 'var(--font-family)',
            transition: 'background 0.2s, border-color 0.2s, color 0.2s',
            userSelect: 'none',
          }}
        >
          {isTransparent ? 'オン' : 'オフ'}
        </button>
      </div>
    </div>
  );
}
