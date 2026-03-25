/**
 * Canvas 2D API 用の色定数
 * CSS変数（index.css の :root）と同じ値を JS 定数として管理
 *
 * CSS変数が使えない Canvas 2D API の fillStyle 等で使用する。
 * 値を変更する場合は index.css 側も同時に変更すること。
 */

/** チェッカーボード背景（透明表現）の明色 — CSS: --color-checker-light */
export const COLOR_CHECKER_LIGHT = '#e0e0e0';

/** チェッカーボード背景（透明表現）の暗色 — CSS: --color-checker-dark */
export const COLOR_CHECKER_DARK = '#c0c0c0';

/** 色調整モードの選択枠線色 — CSS: --color-bg-panel (#FDFDFC) に近い白 */
export const COLOR_ADJUST_OUTLINE = '#ffffff';
