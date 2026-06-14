import { useCallback, useEffect, useState } from 'react';

export interface MenuPos {
  x: number;
  y: number;
}

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  /** true にするとグレーアウトしてクリック不可になる */
  disabled?: boolean;
}

/** ヘッダー型: クリック不可の見出し行 */
export interface ContextMenuHeader {
  label: string;
  isHeader: true;
}

/** メニュー項目（通常アイテム or ヘッダー） */
export type ContextMenuEntry = ContextMenuItem | ContextMenuHeader;

/** ヘッダーかどうかの判定 */
function isHeader(entry: ContextMenuEntry): entry is ContextMenuHeader {
  return 'isHeader' in entry && entry.isHeader;
}

interface ContextMenuProps {
  pos: MenuPos;
  items: ContextMenuEntry[];
  /** 区切り線を入れるインデックス（items[i] の後ろに挿入） */
  dividerAfter?: number[];
  onClose: () => void;
}

/** ビューポート端からの最小マージン（px） */
const VIEWPORT_MARGIN = 8;

/**
 * 汎用の右クリックメニュー
 * - pos で固定位置表示
 * - ビューポートからはみ出す場合は自動で位置を補正
 * - メニュー外クリックで自動で閉じる
 * - ヘッダー行対応（isHeader: true）
 */
export function ContextMenu({ pos, items, dividerAfter = [], onClose }: ContextMenuProps) {
  const [finalPos, setFinalPos] = useState(pos);

  // メニュー外クリックで閉じる
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener('mousedown', close);
    return () => window.removeEventListener('mousedown', close);
  }, [onClose]);

  // 要素がDOMに付いた瞬間（=レンダー外）にサイズを測り、ビューポートに収まる位置へ補正する。
  // ref コールバックはレンダー中ではないので、ここでの setState はルール違反にならない。
  const measureRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let x = pos.x;
    let y = pos.y;

    // 右端からはみ出す場合は左にずらす
    if (x + rect.width > window.innerWidth - VIEWPORT_MARGIN) {
      x = window.innerWidth - rect.width - VIEWPORT_MARGIN;
    }
    // 下端からはみ出す場合は上にずらす
    if (y + rect.height > window.innerHeight - VIEWPORT_MARGIN) {
      y = window.innerHeight - rect.height - VIEWPORT_MARGIN;
    }
    // 左端・上端を下回らないように
    if (x < VIEWPORT_MARGIN) x = VIEWPORT_MARGIN;
    if (y < VIEWPORT_MARGIN) y = VIEWPORT_MARGIN;

    setFinalPos({ x, y });
  }, [pos]);

  return (
    <div
      ref={measureRef}
      className="context-menu"
      style={{ left: finalPos.x, top: finalPos.y }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {items.map((entry, i) => (
        <div key={i}>
          {isHeader(entry) ? (
            <div className="context-menu-header">{entry.label}</div>
          ) : (
            <button
              className={`context-menu-item${entry.disabled ? ' context-menu-item--disabled' : ''}`}
              onClick={entry.disabled ? undefined : entry.onClick}
              disabled={entry.disabled}
            >
              {entry.label}
            </button>
          )}
          {dividerAfter.includes(i) && <div className="context-menu-divider" />}
        </div>
      ))}
    </div>
  );
}
