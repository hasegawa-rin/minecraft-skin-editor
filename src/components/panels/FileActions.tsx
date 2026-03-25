import { useRef, useCallback, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useEditorStore } from '../../store/editorStore';
import { UI_TEXT } from '../../constants/uiText';
import { downloadSkinAsPNG, loadSkinFromFile, detectModelType, loadPngAsData } from '../../utils/skinIO';
import { ThumbnailModel } from '../selector/SkinSelector';
import type { ModelType, SkinData } from '../../types';

/**
 * ヘッダー右寄せのファイル操作ボタン群
 * - よみこみ（常に有効。モデルタイプ自動判定、判定不能時はダイアログで確認）
 * - ほぞん（editing中のみ有効）
 */
export function FileActions() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const skinData = useEditorStore((s) => s.skinData);
  const loadSkinData = useEditorStore((s) => s.loadSkinData);
  const phase = useEditorStore((s) => s.phase);
  const history = useEditorStore((s) => s.history);

  const isEditing = phase === 'editing';

  // モデルタイプ確認ダイアログ用
  const [pendingSkinData, setPendingSkinData] = useState<SkinData | null>(null);

  // ダイアログ内の3Dサムネイル用サンプルスキン
  const [alexSkin, setAlexSkin] = useState<SkinData | null>(null);
  const [steveSkin, setSteveSkin] = useState<SkinData | null>(null);

  useEffect(() => {
    if (!pendingSkinData) return;
    let cancelled = false;
    loadPngAsData(`${import.meta.env.BASE_URL}skins/alex_slim.png`)
      .then((d) => { if (!cancelled) setAlexSkin(d); })
      .catch(() => {});
    loadPngAsData(`${import.meta.env.BASE_URL}skins/steve_wide.png`)
      .then((d) => { if (!cancelled) setSteveSkin(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [pendingSkinData]);

  const handleDownload = useCallback(() => {
    downloadSkinAsPNG(skinData);
  }, [skinData]);

  const handleModelSelect = (model: ModelType) => {
    if (pendingSkinData) {
      loadSkinData(pendingSkinData, model);
      setPendingSkinData(null);
    }
  };

  const handleCancelDialog = () => {
    setPendingSkinData(null);
  };

  const handleImport = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // editing中は確認ダイアログ
      if (isEditing && history.length > 0) {
        const ok = window.confirm(
          'いまつくっているスキンは、ほぞんしていないとなくなっちゃうよ。\nよみこんでもいい？'
        );
        if (!ok) {
          e.target.value = '';
          return;
        }
      }

      try {
        const data = await loadSkinFromFile(file);
        const model = detectModelType(data);
        if (model) {
          // 判定できた → そのまま読み込み
          loadSkinData(data, model);
        } else {
          // 判定できなかった → ダイアログで確認
          setPendingSkinData(data);
        }
      } catch (err) {
        alert(err instanceof Error ? err.message : 'よみこみにしっぱいしたよ');
      }
      e.target.value = '';
    },
    [isEditing, history, loadSkinData],
  );

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xs)', width: 256 }}>
        <button
          className="tool-btn"
          onClick={() => fileInputRef.current?.click()}
          title={UI_TEXT.file.import.tip}
        >
          {UI_TEXT.file.import.name}
        </button>
        <button
          className="tool-btn btn-primary"
          onClick={handleDownload}
          disabled={!isEditing}
          title={UI_TEXT.file.download.tip}
        >
          {UI_TEXT.file.download.name}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".png"
          onChange={handleImport}
          style={{ display: 'none' }}
        />
      </div>

      {/* モデルタイプ確認ダイアログ */}
      {pendingSkinData && (
        <div className="modal-overlay" onClick={handleCancelDialog}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <p style={{
              fontSize: 'var(--font-size-base)', fontWeight: 700,
              color: 'var(--color-primary)', margin: '0 0 var(--space-sm)',
            }}>
              うでのふとさはどっち？
            </p>
            <p style={{
              fontSize: 'var(--font-size-sm)', color: 'var(--color-text-sub)',
              margin: '0 0 var(--space-md)', lineHeight: 1.6,
            }}>
              よみこんだスキンの「うでのふとさ」がはんていできませんでした。
              マイクラでは「ほそめ」と「ふとめ」の2しゅるいがあるよ。
              うでのはばが 3px か 4px かのちがいだよ。
            </p>

            {/* スキン例の3Dサムネイル + 選択ボタン */}
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
              {/* ほそめ（Slim） */}
              <button
                className="tool-btn"
                onClick={() => handleModelSelect('slim')}
                style={{
                  flex: 1, flexDirection: 'column', alignItems: 'center',
                  padding: 'var(--space-sm)', gap: 'var(--space-xs)',
                }}
              >
                <div style={{ width: 88, height: 110, borderRadius: 'var(--space-xs)', overflow: 'hidden', background: 'var(--color-bg-thumbnail)' }}>
                  {alexSkin && (
                    <Canvas camera={{ position: [0, 0, 2.8], fov: 50 }} flat>
                      <ThumbnailModel skinData={alexSkin} modelType="slim" />
                    </Canvas>
                  )}
                </div>
                <span style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>ほそめ</span>
                <span style={{ fontSize: 10, color: 'var(--color-text-sub)', lineHeight: 1.3, textAlign: 'center' }}>
                  Slim / アレックス型
                  <br />うでのはば 3px
                </span>
              </button>

              {/* ふとめ（Classic） */}
              <button
                className="tool-btn"
                onClick={() => handleModelSelect('classic')}
                style={{
                  flex: 1, flexDirection: 'column', alignItems: 'center',
                  padding: 'var(--space-sm)', gap: 'var(--space-xs)',
                }}
              >
                <div style={{ width: 88, height: 110, borderRadius: 'var(--space-xs)', overflow: 'hidden', background: 'var(--color-bg-thumbnail)' }}>
                  {steveSkin && (
                    <Canvas camera={{ position: [0, 0, 2.8], fov: 50 }} flat>
                      <ThumbnailModel skinData={steveSkin} modelType="classic" />
                    </Canvas>
                  )}
                </div>
                <span style={{ fontWeight: 700, fontSize: 'var(--font-size-base)' }}>ふとめ</span>
                <span style={{ fontSize: 10, color: 'var(--color-text-sub)', lineHeight: 1.3, textAlign: 'center' }}>
                  Wide / スティーブ型
                  <br />うでのはば 4px
                </span>
              </button>
            </div>

            {/* わからない */}
            <button
              className="tool-btn"
              onClick={() => handleModelSelect('slim')}
              style={{ width: '100%' }}
            >
              わからない（システムにまかせる）
            </button>
          </div>
        </div>
      )}
    </>
  );
}
