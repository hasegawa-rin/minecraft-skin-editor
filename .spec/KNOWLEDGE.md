# KNOWLEDGE - ドメイン知識・調査結果

## ファイル構成と各ファイルの役割

### src/
| ファイル | 役割 |
|---|---|
| `App.tsx` | アプリ全体のレイアウト。ヘッダー（タイトル＋FileActions右寄せ）、左サイドバー・中央・右サイドバーの3カラム構成。phase管理（selecting/editing）、中央エリア右クリックメニュー（「さいしょからつくりなおす」→選択画面へ戻る） |
| `App.css` | レイアウトCSS。サイドバー幅、枠なしパネル＋区切り線スタイル、ボタン共通（.tool-btn）、右クリックメニュー（.context-menu / .context-menu-item / .context-menu-item--disabled）、モーダル（.modal-overlay / .modal-dialog）、パーツカード（.part-card / .part-card__label: タブ型ラベルデザイン）を定義 |
| `main.tsx` | アプリのエントリーポイント（起動ファイル） |
| `index.css` | デザイントークン（CSS変数: カラー、スペーシング、フォント、チェッカーボード色、サムネイル背景色）、リセットCSS、グローバルフォーカススタイル（input:focus / button:focus-visible → outline消去＋border-color: primary）、スクロールバースタイル |

### src/components/common/
| ファイル | 役割 |
|---|---|
| `ContextMenu.tsx` | 汎用の右クリックメニューコンポーネント。pos（表示位置）、items（メニュー項目配列、各項目に optional `disabled` プロパティ対応）、dividerAfter（区切り線位置）、onClose を受け取る。メニュー外クリックで自動で閉じる。ビューポートからはみ出す場合は useEffect + getBoundingClientRect で自動位置補正（8pxマージン確保）。FaceCanvas、SkinCanvas（PartBlockWithMenu）、App.tsx で使用 |

### src/components/canvas/
| ファイル | 役割 |
|---|---|
| `SkinCanvas.tsx` | 面ごと分割表示のメインコンポーネント。全パーツ一覧モード（体の形配置）、ZoomControls（右下）、UndoRedoControls（左上、disabled状態＋吹き出しメッセージ付き）。PartBlockWithMenuコンポーネントで各パーツをカード化（タブ型ラベル＋パーツ全体の右クリックコピペ対応）。AllPartsOverviewにpadding: 50vh 50vwで端パーツのセンタリング対応、マウント時にスクロール位置を中央に自動設定 |
| `FaceCanvas.tsx` | 1つの面（まえ/うしろ等）を描画・編集する個別キャンバス。右クリックメニュー（面コピー・貼り付け3モード〈通常/左右反転/上下反転〉、面の塗りつぶし・消去、「さいしょからつくりなおす」→選択画面へ戻る）。stopPropagationで親のcontextmenuに伝播させない。面ラベルにwhiteSpace: nowrap設定（縮小時の折り返し防止） |

### src/components/selector/
| ファイル | 役割 |
|---|---|
| `SkinSelector.tsx` | 起動時のスキン選択画面。デフォルト9キャラ（Steve〜Efe）＋「じゆうにつくる」（透明）を5列グリッドで表示。3Dサムネイル（ThumbnailModel）、モデルタイプ切替（ほそめ/ふとめ）、「このスキンではじめる」ボタン |

### public/skins/
| ファイル | 役割 |
|---|---|
| `{name}_{wide\|slim}.png` | デフォルトスキン18ファイル（9キャラ × 2モデル）。Minecraft公式デフォルトスキン |
| `test_ambiguous.png` | テスト用PNG。右腕(x=54)にデータあり・左腕(x=46)にデータなしで、detectModelTypeがnullを返す（判定不能ダイアログの動作確認用） |

### src/components/
| ファイル | 役割 |
|---|---|
| `palette/ColorPalette.tsx` | カラーパレット。色プレビュー（クリックでピッカー）、HEX入力＋コピーボタン、透明モードトグル |
| `panels/FileActions.tsx` | ヘッダー右寄せの「よみこみ」「ほぞん」ボタン群（Grid: 1fr 1fr, width:256でPartSelectorと幅を合わせる）。読み込み時にモデルタイプ自動判定→判定不能時は「うでのふとさはどっち？」ダイアログ表示（3Dサムネイル付き、ほそめ/ふとめ/わからない の3択） |
| `panels/LayerSelector.tsx` | 「えをかくレイヤー」切替（した/うえ）＋「?」ヘルプモーダル。左サイドバー配置（じゅんびフェーズ） |
| `panels/PreviewFilter.tsx` | 「プレビューしたいレイヤー」フィルター（ぜんぶ/しただけ/うえだけ）。右サイドバー配置（たしかめるフェーズ） |
| `panels/PartSelector.tsx` | 「プレビューしたいパーツ」選択パネル。右サイドバー配置 |
| `preview3d/Preview3D.tsx` | Three.js (react-three-fiber + drei) による3Dプレビュー。flex:1で残りスペースを最大活用。パーツ別・レイヤー別表示、DataTexture、BoxGeometry UV書き換え |
| `toolbar/Toolbar.tsx` | ツール切り替え（ペン/バケツ/けしゴム/スポイト）のみ。もどる/すすむはSkinCanvas.tsxのUndoRedoControlsに移動済み |

### src/store/（Zustandスライスパターン）
| ファイル | 役割 |
|---|---|
| `editorStore.ts` | メインストア。コア状態（phase, skinData, modelType, currentTool, currentColor, activeLayer, viewMode, zoomLevel, history）＋スライスの統合。clipboardSlice と adjustSlice を `create()` 内で spread して合成。既存の import パスを維持するため、FaceKey, FaceClipboard 等を re-export |
| `clipboardSlice.ts` | クリップボードスライス。FaceClipboard（面単位: pixels, w, h）、PartClipboard（パーツ6面分）の型定義。copyFace/copyPart/pasteFace/pastePart アクション（貼り付けモード: PasteMode = normal/flipH/flipV）。共通ユーティリティ: `extractRect()`（矩形からピクセル抽出）、`writeRectWithFlip()`（反転付きピクセル書き込み）|
| `adjustSlice.ts` | 色調整スライス。isAdjusting, adjustParams, adjustTargetLayer, adjustSelectedFaces(Set\<FaceKey\>), adjustSeeds(Map\<FaceKey,number\>), adjustOriginalData, adjustPreviewData の状態管理。スナップショットベースundo/redo: adjustHistory\[{params,seeds}\], adjustHistoryIndex。`ADJUST_RESET_STATE` で cancelAdjust/commitAdjust のリセット処理を共通化。FaceKey/makeFaceKey もここで定義 |

### src/utils/
| ファイル | 役割 |
|---|---|
| `drawingTools.ts` | 描画ロジック。getPixelColor, setPixelDirect, floodFill（全体）, floodFillInRect（面制約付き） |
| `skinIO.ts` | PNG読み込み（64x64 or 64x32→64x64変換）・書き出し処理。detectModelType()でClassic/Slim自動判定（x=54右腕＋x=46左腕のalpha値チェック、判定不能時はnull返却） |

### src/types/
| ファイル | 役割 |
|---|---|
| `index.ts` | 型定義。ModelType, ToolType, LayerType, PreviewLayerMode, ViewMode, RGBAColor, SkinData, PartRect, PartUV, HistoryEntry。クリップボード型は clipboardSlice.ts、FaceKey/AdjustTargetLayer は adjustSlice.ts で定義 |

### src/constants/
| ファイル | 役割 |
|---|---|
| `skinTemplate.ts` | 全パーツのUV座標定義（Classic/Slim × base/overlay）。getPartUV()ヘルパー関数 |
| `uiText.ts` | UI表示テキスト。ツール名、パーツ名、面名、レイヤー名など全て子供向け日本語 |
| `preview3d.ts` | 3Dプレビュー共通定数。SCALE(1/16)、OVERLAY_EXPAND(0.5)。Preview3D.tsx と SkinSelector.tsx で共用 |
| `colors.ts` | Canvas 2D API 用の色定数。チェッカーボード色(COLOR_CHECKER_LIGHT/DARK)、色調整選択枠線色(COLOR_ADJUST_OUTLINE)。CSS変数(index.css)と同じ値をJS定数として管理 |

## マインクラフトスキンのドメイン知識
- スキンは64x64pxのPNG画像（古い形式は64x32で自動変換対応済み）
- Classic（スティーブ型）は腕幅4px、Slim（アレックス型）は腕幅3px
- 各パーツ（頭、体、右腕、左腕、右脚、左脚）にbase（下地）とoverlay（重ね着）の2レイヤー
- 64x64テンプレート上の各パーツの位置はMinecraft Wikiで定義されており、skinTemplate.tsに実装済み
- Bedrock Edition: alpha ≤25 → 完全透明、alpha ≥26 → 完全不透明（半透明なし）

## 技術的な知見
- スキンデータは `Uint8ClampedArray`（0〜255に自動クランプされる配列）で管理。64x64x4 = 16384要素
- Zustand の状態更新では、配列を新しく作り直す（`new Uint8ClampedArray(skinData)`）ことで React に変更を通知
- undo/redo は最大20件のスナップショット履歴で実装
- **redo の実装詳細**: store の `redo()` は `history[historyIndex + 2]` のデータを参照する。そのため `canRedo` の判定は `historyIndex < historyLength - 2`（`-1` ではない）
- FaceCanvasは各面のPartRect（x,y,w,h）を受け取り、ローカル座標⇔64x64テンプレート座標の変換を内部で行う
- フラッドフィルは面制約版（floodFillInRect）を使い、塗りつぶしが隣の面に漏れないようにする
- 3DプレビューはDataTexture (flipY=false) を使い、BoxGeometryのUV属性を手動で書き換えて各面にテクスチャをマッピング
- **ContextMenuのビューポート補正**: 初回レンダリング後にuseEffectでgetBoundingClientRectを計測し、画面端からはみ出す場合は位置をadjusted stateで補正（VIEWPORT_MARGIN=8px）
- **中央エリアのスクロール余白**: AllPartsOverviewにpadding: 50vh 50vwを設定してズーム時に端のパーツも画面中央にスクロール可能に。マウント時にscrollLeft/scrollTopを中央に自動設定

## UI/UX設計方針：画面構造のアーキテクチャ

### 基本原則
ユーザー（小1〜2年生）の操作フローは「じゅんび → かく → たしかめる」の3ステップ。
画面の各エリアがこの3ステップに対して明確に1対1でマッピングされるべき。
目的の異なるコントロールを同じエリアに混在させない。

### 各エリアの役割定義

| エリア | 目的 | 含まれるもの |
|---|---|---|
| ヘッダー | アプリ全体の操作（ファイル管理） | タイトル（左）、よみこみ＋ほぞんボタン（右寄せ、Grid 1fr 1fr, width:256） |
| 左サイドバー | **じゅんび**（描く前に決めること） | ツール選択、カラーパレット、えをかくレイヤー切替（した/うえ） |
| 中央 | **かく**（作業そのもの） | 2Dスキンキャンバス、もどる/すすむ（左上）、ズームコントロール（右下） |
| 右サイドバー | **たしかめる**（描いた結果を見る） | 3Dプレビュー（flex:1で高さ最大化）、プレビューしたいパーツ、プレビューしたいレイヤー |

### ヘッダーの設計判断
- ファイル操作（よみこみ/ほぞん）はヘッダーに右寄せ配置
- 「あたらしくつくる」ボタンは廃止（ブラウザ更新で対応）。代わりに2D右クリックメニューに「さいしょからつくりなおす」を配置
- ほぞんボタンは `.btn-primary`（緑塗りつぶし・太字）でCTAとして目立たせる
- ボタン幅は右サイドバーのPartSelectorと揃えるため Grid `1fr 1fr` + `width: 256` を使用

### レイヤー切替の配置判断
- 「した/うえ」は左サイドバーへ移動（ツール直下、カラーパレット直上）→ 現在はカラーパレット直下
- 理由：「どの層に描くか」はキャンバスをクリックする前に決める描画の前提条件であり、ツールや色の選択と同じ「じゅんびフェーズ」に属する
- 「ぜんぶ/しただけ/うえだけ」は右サイドバーに残留
- 理由：プレビューの表示フィルターであり、「たしかめるフェーズ」に属する

### パーツ選択の配置判断
- 3Dプレビューの直下に配置（右サイドバー内）
- 理由：3Dプレビューのどの部分を見るかのコントロールであり、「たしかめる」目的
- 2Dキャンバスのナビゲーションには使わない設計（確定済み）

### 左右の扱い（正面視ルール）
- エディター全体で「正面から見た視点」で統一
- キャラの右腕（Minecraft内部名: rightArm）は画面左に表示 →「ひだりうで」と表記
- 2D展開図、3Dプレビュー、パーツ選択ボタンすべてでこの規則を適用

### デザインシステム（フォント・余白・ボタン）

#### タイプスケール（3段階のみ）
| 用途 | サイズ | ウェイト |
|---|---|---|
| パネルタイトル | 12px | 700 (bold) |
| ボタン・本文・入力 | 12px | 400 (normal) |
| 補足テキスト | 11px | 400 |

#### スペーシングスケール（4の倍数）
| トークン | 値 | 用途 |
|---|---|---|
| --space-xs | 4px | ボタン間の隙間、最小ギャップ |
| --space-sm | 8px | パネル内の余白、パネル間のギャップ |
| --space-md | 12px | サイドバーのpadding（左右統一） |
| --space-lg | 16px | セクション間の区切り |

#### カラートークン（CSS変数）
| トークン | 値 | 用途 |
|---|---|---|
| --color-bg-thumbnail | #d4e8e0 | 3Dサムネイル・プレビューの背景 |
| --color-checker-light | #e0e0e0 | チェッカーボード背景（透明表現）の明色 |
| --color-checker-dark | #c0c0c0 | チェッカーボード背景（透明表現）の暗色 |

**ルール**: ハードコードの色値は禁止。すべてCSS変数を使う。Canvas 2D APIの `fillStyle` など CSS変数が使えない場面のみ JS定数で管理。

#### パネルスタイル（枠なしデザイン）
- `.panel` は `padding: 0`（背景・ボーダー・角丸なし）
- パネル間の区切りは `.panel + .panel` で `border-top: 1px solid var(--color-border-light)` + `padding-top: var(--space-sm)`
- 左右サイドバーの padding は両方 `var(--space-md)` で統一

#### ボタンスタイル
| 種類 | 用途 | 特徴 |
|---|---|---|
| `.tool-btn` | サイドバー内のすべてのボタン | padding: 6px 10px |
| `.tool-btn.btn-primary` | ほぞんボタン等のCTA | 緑塗りつぶし、font-weight: 700 |
| `.tool-btn:disabled` | 押せない状態のボタン（もどる/すすむ） | opacity: 0.35、hover無効 |
| `.tool-btn-sm` | ヘッダー用（現在未使用） | padding: 4px 10px |
| `.btn-group` | もどる/すすむの横並びグループ | 隣接ボーダー重ね、角丸は両端のみ |

#### 右クリックメニュー・モーダルの共通スタイル
| クラス | 用途 |
|---|---|
| `.context-menu` | 右クリックメニューのコンテナ（position: fixed, zIndex: 1000） |
| `.context-menu-item` | メニュー項目ボタン（hover:not(:disabled) で primary-light 背景） |
| `.context-menu-item--disabled` | 無効状態のメニュー項目（color: text-light, cursor: default） |
| `.context-menu-divider` | メニュー項目間の区切り線 |
| `.modal-overlay` | モーダルの背景オーバーレイ（inset: 0, zIndex: 2000, 半透明黒） |
| `.modal-dialog` | モーダルのダイアログボックス（白背景、padding: 24px、maxWidth: 460px） |

**ルール**: 新しいメニューやモーダルを追加するときは、必ずこれらのCSSクラスを使う。インラインスタイルで個別定義しない。

#### パーツカードスタイル
| クラス | 用途 |
|---|---|
| `.part-card` | パーツ全体を囲むカードコンテナ（border: 1px solid bg-panel色、margin-top: 20px でラベル飛び出し分確保、cursor: context-menu） |
| `.part-card__label` | カード上辺の外に飛び出すタブ型ラベル（position: absolute, bottom: 100%, left: -1px）。tool-btnと同じ配色（白背景、カードと同色ボーダー、普通書体）。min-width: 5.5emで全パーツ統一幅 |

**カードの角丸ルール**: 左上のみ直角（ラベル接合部）、他3つは角丸（`border-radius: 0 var(--radius-sm) var(--radius-sm) var(--radius-sm)`）。ラベルは上2つが角丸、下2つが直角。

#### ラベルの方針
- **不要なラベル（削除）**：「ツール」「カラーパレット」— パネル内のボタンや色プレビューを見れば用途がわかる
- **わかりやすく改名したラベル**：
  - 「みたいパーツ」→「プレビューしたいパーツ」
  - 「みたいレイヤー」→「プレビューしたいレイヤー」
  - 「レイヤー」→「えをかくレイヤー」
- レイヤーのラベルは残す — 初見で概念がわからないユーザーのために、ヘルプ「?」ボタンとセットで必要

### もどる/すすむ（UndoRedoControls）の設計
- 中央キャンバスの左上に `position: absolute` で固定表示
- 押せないときは `disabled` 属性で非活性化（canUndo / canRedo）
- 限界まで押したときはツールチップ風の吹き出しで「これいじょうもどれないよ」「これいじょうすすめないよ」を表示
- 吹き出しは押したボタンの真下に表示（undo/redo で位置が変わる）
- 2秒後に自動消去

### 右クリックメニュー（3段構成）
- **FaceCanvas上**（canvas要素に直接バインド、stopPropagationで親に伝播しない）:
  - コピー
  - はりつける / さゆうをはんてんさせてはりつけ / じょうげをはんてんさせてはりつけ（サイズ不一致時はdisabled）
  - 区切り線（dividerAfter={[3, 5]}）
  - ぜんぶぬりつぶす / ぜんぶとうめいにする
  - さいしょからつくりなおす（confirm付き → backToSelecting()）
- **パーツカード上**（PartBlockWithMenuコンポーネント、stopPropagationで親に伝播しない）:
  - パーツをコピー（6面まとめてコピー）
  - 区切り線（dividerAfter={[0]}）
  - はりつける / さゆうをはんてんさせてはりつけ / じょうげをはんてんさせてはりつけ（全6面のサイズ一致時のみ有効）
- **中央エリア全体**（App.tsxのmain要素にバインド、canvas以外の空きスペースで発火）:
  - 「さいしょからつくりなおす」のみ（confirm付き → backToSelecting()）
  - 選択画面（phase='selecting'）では表示しない

### コピー＆貼り付けの仕様
- **面単位クリップボード（FaceClipboard）**: pixels（Uint8ClampedArray）、w、h を保持
- **パーツ単位クリップボード（PartClipboard）**: 6面分のFaceClipboardをRecord<keyof PartUV, FaceClipboard>で保持
- **貼り付けモード**: 'normal'（そのまま）、'flipH'（左右反転）、'flipV'（上下反転）
- **サイズ互換性チェック**: 貼り付け時にw/hが一致するかチェック。Classic腕脚は全て4x12x4で相互コピー可能。Slimは腕↔腕、脚↔脚のみ
- **backToSelecting()時**: 両クリップボードをnullにクリア

### スキン選択画面（SkinSelector）
- phase='selecting'のときに中央に表示。9キャラ＋透明の10カードを5列グリッドで表示
- サムネイルは3D（ThumbnailModel: DataTexture + BoxGeometry UV書き換え、Preview3Dと同じロジック）
- モデルタイプ切替（「うでのふとさ」: ほそめ/ふとめ）で即座にサムネイル再読み込み
- 「このスキンではじめる」ボタンで startEditing() → phase='editing' へ遷移
- デフォルトスキンPNGは public/skins/ に配置（9キャラ × 2モデル = 18ファイル）
- モデルタイプ自動判定: detectModelType()（詳細は下記「モデルタイプ自動判定の詳細」参照）

## モデルタイプ自動判定の詳細

### 判定ロジック（detectModelType in skinIO.ts）
- **右腕チェック**: x=54, y=20-31（Classic back面の末尾列。Slimでは完全未使用）
- **左腕チェック**: x=46, y=52-63（Classic back面の末尾列。Slimでは完全未使用）
- 両方データなし → `'slim'`
- 両方データあり → `'classic'`
- 片方だけデータあり → `null`（判定不能）

### なぜ x=54 / x=46 なのか
- 以前のロジック（x=47チェック）は公式Minecraftスキンで誤判定した
- 公式スキンはslim/wideで同じPNGピクセルデータを持ち、モデルタイプはゲームプロファイルのメタデータで区別される
- x=47 は slim レイアウトでも別の面（左腕の内側面）で使用されており、alpha>0 のデータが存在する
- x=54（右腕）と x=46（左腕）は slim レイアウトでは完全に未使用の列であり、ここにデータがあれば確実に classic
- 18枚の公式デフォルトスキン全てで100%正確に判定可能

### 判定不能時のUI（FileActions.tsx）
- 「うでのふとさはどっち？」ダイアログを表示
- 3Dサムネイル（Alex slim / Steve wide）を左右に並べて視覚的に比較
- 3択: 「ほそめ」（Slim/アレックス型/うでのはば3px）/ 「ふとめ」（Wide/スティーブ型/うでのはば4px）/ 「わからない（システムにまかせる）」→ slimにフォールバック
- ダイアログ: maxWidth 460px, padding 24px, サムネイル 88×110px

### テスト用PNG
- `public/skins/test_ambiguous.png`: 右腕(x=54)にデータあり、左腕(x=46)にデータなし → detectModelType が null を返す

## 「いろのちょうせい」機能 — 実装済み仕様

### 概要
描画済みのスキンに対して、明るさ・コントラスト・彩度・色相・カラーノイズ（ゆらぎ）を調整する機能。
左サイドバーの「えをかくレイヤー」の下に「いろのちょうせい」ボタンを配置。ボタンを押すと色ちょうせいモードに入る。

### 色ちょうせいモード中の左サイドバー（ColorAdjustPanel）
通常の左サイドバー（ツール、カラーパレット、えをかくレイヤー）を**非表示**にし、以下を表示:

1. **いろのちょうせい**（ヘッダー）
2. **ちょうせいするはんい**（パーツ選択ボタン群 = AdjustRangeButtons）
   - 「ぜんたい」ボタン（1行フル幅）
   - 「あたま / からだ」（2列）
   - 「ひだりうで / みぎうで」（2列）
   - 「ひだりあし / みぎあし」（2列）
   - 初回表示時に吹き出しガイド「ちょうせいしたいぶぶんをえらんでね」を表示（position: fixed, z-index: 9999）
3. **パラメーター**（5つのスライダー + ゆらぎパターンボタン）
   - あかるさ（明度）: -100 〜 +100
   - コントラスト: -100 〜 +100
   - あざやかさ（彩度）: -100 〜 +100
   - いろあい（色相）: -180 〜 +180
   - ゆらぎ（カラーノイズ）: 0 〜 100
   - 「ゆらぎパターンをかえる」ボタン（noise=0 or 面未選択時disabled）
   - 面未選択時はスライダー全体がdisabled表示
4. **ちょうせいするレイヤー**
   - 「ぜんぶ」ボタン（1行フル幅）
   - 「しただけ / うえだけ」（2列）
   - レイヤー切替時に面選択を引き継ぐ（FaceKeyの部位+面を抽出して再生成）
5. **やめる / けってい**ボタン（画面下に固定、marginTop: auto）

### 色ちょうせいモード中の中央エリア
- 描画は無効（クリック=面選択トグル）
- adjustTargetLayerに応じた表示:
  - 「ぜんぶ」: baseレイヤーのrectにoverlayRectを合成表示
  - 「しただけ」/「うえだけ」: 指定レイヤーのみ表示
- 面選択方法（2つのみ、誤操作防止）:
  - 面キャンバスをクリック → その面だけ選択/解除
  - パーツカードのラベル（.part-card__label--clickable）をクリック → そのパーツ全面を選択/解除
  - カード背景クリックは無効化
- 選択中の面は白3pxアウトライン（色フィルターは正確な色が見えなくなるため廃止）
- 右クリックメニューは色調整モード中は非表示
- スライダーの効果はリアルタイムプレビュー（2Dキャンバスと3Dプレビューの両方）

### undo/redo（色調整モード専用）
- スナップショットベースの履歴: `{ params: AdjustParams; seeds: Map<FaceKey, number> }[]`
- `adjustHistory[0]` = 初期状態（全パラメータ0、初期シード）
- パラメータ変更・ゆらぎパターン変更のみ履歴に記録（面選択変更は含めない）
- スライダードラッグ中はsetAdjustParamsLive（履歴なし）、ドラッグ完了時にpushAdjustHistory
- 中央エリア左上のもどる/すすむボタンが色調整モードでも機能

### 「けってい」時の動作
- adjustPreviewDataをskinDataに焼き込み
- adjustOriginalDataを通常undo履歴にpush
- 色調整モードを終了、通常描画モードに戻る

### ゆらぎ（カラーノイズ）
- 面ごとにシード値を持ち、xorshift32による決定的ランダム
- 各ピクセルのHSLに微小なランダムオフセット（明度±0.1 + 色相±15°）
- 「ゆらぎパターンをかえる」で全面のシードを再生成、undo/redoに対応

### 3Dプレビュー対応
- useSkinTexture内でisAdjusting時にadjustPreviewDataを使用
- スライダードラッグ中もリアルタイムで3Dプレビューに反映

### 関連ファイル
| ファイル | 色調整での役割 |
|---|---|
| `panels/ColorAdjustPanel.tsx` | 左パネル全体（AdjustSlider, AdjustRangeButtons, ColorAdjustButton, ColorAdjustPanel） |
| `store/editorStore.ts` | 色調整の全状態管理（adjustParams, adjustSelectedFaces, adjustSeeds, adjustHistory等） |
| `utils/colorAdjust.ts` | HSL変換、adjustPixel、applyAdjustToRects、xorshift32 |
| `canvas/SkinCanvas.tsx` | 色調整モードの面選択UI、UndoRedoControlsの色調整対応 |
| `canvas/FaceCanvas.tsx` | 面クリックトグル、白枠線表示、overlayRect合成描画 |
| `preview3d/Preview3D.tsx` | adjustPreviewDataによるリアルタイム3Dプレビュー |
| `App.tsx` | isAdjustingによる左サイドバーの切り替え |
| `App.css` | .adjust-slider, .adjust-balloon, .part-card__label--clickable のスタイル |

## 決定事項と理由
- **状態管理にZustandを選択**：Reduxより軽量でシンプル。ボイラープレートコードが少なく、非エンジニアにも理解しやすい
- **3DプレビューにReact Three Fiberを選択**：Three.jsをReactのコンポーネントとして扱えるため、コードの見通しが良い
- **面ごと分割表示を採用**：元の64x64テンプレート直接表示では、どこに描いたらどのパーツに反映されるかユーザーにわからない。面ごとにラベル付きキャンバスを分離し、内部で64x64への変換を自動で行う設計にした
- **透明度をオン/オフの2値にした**：Bedrock Editionでは半透明が表現できないため、スライダーは不要。シンプルさを優先
- **絵文字アイコンを全廃止**：フラットデザイン方針に合わせ、テキストのみのUIに。必要な箇所のみSVG線画アイコン（コピーボタン等）
- **12pxグリッド基準のレイアウト**：市松模様、パネル幅、プレビュー高さを全て12の倍数に揃えることで、視覚的な統一感を確保
- **「あたらしくつくる」ボタン廃止**：ヘッダーのスペース節約。代わりに右クリックメニュー + ブラウザ更新で対応
- **枠なしパネルデザイン**：パネルの枠（border/background/border-radius）を全廃止。区切り線（`.panel + .panel`）でセクション分離。広く使えるフラットな印象に
- **スキン選択画面の導入**: 起動時にいきなり空白キャンバスではなく、デフォルトスキンから選べるように。初めてのユーザーが何をすればいいか迷わない
- **「さいしょからつくりなおす」→選択画面に戻る**: newSkin()（空白リセット）ではなく backToSelecting()（選択画面遷移）に変更。ユーザーが別のスキンを選び直せる
