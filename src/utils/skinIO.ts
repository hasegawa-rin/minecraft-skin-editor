import { SKIN_WIDTH, SKIN_HEIGHT } from '../constants/skinTemplate';
import type { ModelType, SkinData } from '../types';

/**
 * URL から PNG を読み込んで SkinData に変換する
 * サムネイル表示やサンプルスキンの読み込みに使う
 */
export function loadPngAsData(url: string): Promise<SkinData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = SKIN_WIDTH;
      canvas.height = SKIN_HEIGHT;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, SKIN_WIDTH, SKIN_HEIGHT);
      resolve(new Uint8ClampedArray(imageData.data));
    };
    img.onerror = () => reject(new Error(`Failed to load: ${url}`));
    img.src = url;
  });
}

/**
 * SkinData を 64x64 PNG としてダウンロードする
 */
export function downloadSkinAsPNG(skinData: SkinData, filename = 'skin.png'): void {
  const canvas = document.createElement('canvas');
  canvas.width = SKIN_WIDTH;
  canvas.height = SKIN_HEIGHT;
  const ctx = canvas.getContext('2d')!;
  const imageData = new ImageData(
    new Uint8ClampedArray(skinData),
    SKIN_WIDTH,
    SKIN_HEIGHT
  );
  ctx.putImageData(imageData, 0, 0);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

/**
 * SkinData からワイド（Classic）かスリム（Slim）かを自動判定する
 *
 * 判定方法:
 *   Classic の腕は幅4px、Slim は幅3px。この差で各面の配置が2pxずれる。
 *   右腕 back 面の最終2列（x=54-55, y=20-31）と
 *   左腕 back 面の最終2列（x=46-47, y=52-63）は
 *   Classic でのみ使用され、Slim では必ず空。
 *   Minecraft公式スキンでもこの判定は正確に機能する。
 *
 *   両方とも透明 → Slim
 *   両方ともデータあり → Classic
 *   片方だけ → 判定不能（null）
 */
export function detectModelType(data: SkinData): ModelType | null {
  // 右腕: x=54, y=20-31（Classic back面の末尾列、Slimでは完全未使用）
  let rightHasData = false;
  for (let y = 20; y < 32; y++) {
    const i = (y * SKIN_WIDTH + 54) * 4;
    if (data[i + 3] > 0) { rightHasData = true; break; }
  }

  // 左腕: x=46, y=52-63（Classic back面の末尾列、Slimでは完全未使用）
  let leftHasData = false;
  for (let y = 52; y < 64; y++) {
    const i = (y * SKIN_WIDTH + 46) * 4;
    if (data[i + 3] > 0) { leftHasData = true; break; }
  }

  if (!rightHasData && !leftHasData) return 'slim';
  if (rightHasData && leftHasData) return 'classic';

  // 片方だけデータがある → 判定不能
  return null;
}

/**
 * PNG ファイルを読み込んで SkinData に変換する
 * 64x64 または 64x32 に対応。64x32 は 64x64 に自動変換する。
 */
export function loadSkinFromFile(file: File): Promise<SkinData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        // サイズバリデーション
        if (
          !(img.width === 64 && img.height === 64) &&
          !(img.width === 64 && img.height === 32)
        ) {
          reject(new Error('スキンのサイズは 64x64 か 64x32 にしてね'));
          return;
        }

        const canvas = document.createElement('canvas');
        canvas.width = SKIN_WIDTH;
        canvas.height = SKIN_HEIGHT;
        const ctx = canvas.getContext('2d')!;

        // 64x32 の場合は上半分にだけ描画（下半分は透明のまま）
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, SKIN_WIDTH, SKIN_HEIGHT);
        resolve(new Uint8ClampedArray(imageData.data));
      };
      img.onerror = () => reject(new Error('がぞうのよみこみにしっぱいしたよ'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('ファイルのよみこみにしっぱいしたよ'));
    reader.readAsDataURL(file);
  });
}
