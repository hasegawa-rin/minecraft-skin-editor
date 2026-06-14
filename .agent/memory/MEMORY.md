# MEMORY

## プロジェクト概要
- マインクラフトのスキンエディタWebアプリ（mc-skin-editor）
- ターゲットユーザー：小学校低学年（1-2年生）
- UIテキストは全てひらがな・カタカナ（小3以上の漢字にはふりがな）
- ブラウザ上で2D編集と3Dプレビューができる
- React 19 + TypeScript + Vite 8 + Three.js (react-three-fiber + drei) + Zustand

## スキンの仕様
- 64x64pxのPNG画像、RGBA形式
- Classic（腕幅4px）と Slim（腕幅3px）の2モデル
- 各パーツ6面にbase（下地）とoverlay（重ね着）の2レイヤー
- Bedrock Edition: alpha ≤25 → 完全透明、alpha ≥26 → 完全不透明（半透明なし）
- デフォルトスキン: Steve, Alex, Ari, Efe, Kai, Makena, Noor, Sunny, Zuri の9キャラ × 2モデル

## デザイン原則
- 「ナチュラルライト」テーマ：緑系プライマリ、オレンジアクセント、クリーム背景
- フラットデザイン（シャドウなし、パネル枠なし）
- アイコンは絵文字不使用、必要ならシンプルなSVG線画
- 12pxグリッド基準でUI要素のサイズを揃える

## 学習した知識・教訓

### UI設計
- 展開図の位置揃えは `paddingLeft` ではなくCSS Gridが確実。ラベル幅が不定だとpaddingで位置がずれる
- スクロール可能なコンテナ内の `position: sticky` は意図通りに固定されないことがある。固定UIは親要素に `position: absolute` で配置するのが安全
- `useState` で管理するフォーム値は、外部からの更新（スポイト等）と競合する。`useRef + useEffect` で同期するパターンが適切
- パネル枠を外して区切り線にする場合、`.panel + .panel` のCSSシブリングセレクタが便利
- ボタン幅を別エリアのボタンと揃えたい場合、CSS Grid `1fr 1fr` + 固定 width を使うと確実
- カードグリッドのサイズは固定px + `repeat(N, auto)` が安定。`1fr` や `width:100%` だと親要素いっぱいに広がりすぎる
- ボタンの高さを揃えたい場合、インラインstyleのpaddingがCSSクラスのデフォルトpaddingを上書きしていないか注意。`paddingInline` で横のみ変えるのが安全

### redo実装の注意
- editorStoreのredo()は `history[historyIndex + 2]` のデータを参照する特殊な構造
- canRedoの判定は `historyIndex < historyLength - 2`（`-1` ではない）
- undo/redo の限界メッセージは回数ベース（「20かいまでだよ」）より状態ベース（「これいじょうもどれないよ」）のほうが自然

### ツールチップの位置制御
- 複数ボタンのうちどれが押されたかで吹き出し位置を変えるには、target を state で追跡し、ボタンの ref.current.offsetLeft を使う
- サイドバー端のボタン上のツールチップは `left: 50% + translateX(-50%)` だとサイドバーの overflow でクリップされる。`right: 0` で右揃えにして左方向に伸ばす

### フォーカススタイル
- グローバルルール（index.css）: `input:focus` / `button:focus-visible` で outline を消し border-color を primary に統一
- インラインスタイルの border を上書きするため `!important` が必要
- ブラウザ標準カラーピッカー（`<input type="color">`）内のR/G/B欄はネイティブUIのためCSS制御不可（受け入れ済み）

### 右クリックメニューのイベント伝播
- 子要素（FaceCanvas）と親要素（main）の両方にonContextMenuがある場合、子で `e.stopPropagation()` しないと両方のメニューが出る
- canvas上ではFaceCanvas独自メニュー（塗りつぶし・消去・つくりなおす）、canvas以外の空きスペースではApp側メニュー（つくりなおすのみ）

### マイクラ特有
- Bedrock Editionでは半透明が効かないので、透明度スライダーは不要。オン/オフの2値で十分
- バケツツールは面をまたがないよう、面制約付きフラッドフィル（floodFillInRect）が必要
- Classic/Slim自動判定: x=54（右腕）+ x=46（左腕）のalpha値チェック。slimでは完全未使用の列
- **公式スキンのslim/wideは同一PNGピクセルデータ**: モデルタイプはゲームプロファイルのメタデータで区別される。PNG単体では判定不能なケースがある
- x=47は判定に使えない: slim レイアウトでも左腕内側面で使用されておりデータが存在する
- 判定不能（片方の腕だけデータあり等）時はダイアログでユーザーに確認する設計が正解

### レイアウト
- 左サイドバー幅200px → パネル内コンテンツ幅が12の倍数で市松模様がぴったりタイルされる
- サイドバーpadding は左右とも var(--space-md) で統一すること（微妙なズレに気づかれる）
- 横スクロールバーの高さは `::-webkit-scrollbar { height }` で設定する（widthだけでは縦のみ）
- 3Dプレビューの高さ最大化は flex:1 + minHeight:0 で実現

### コード設計ルール
- **右クリックメニュー**: 共通 ContextMenu コンポーネント（src/components/common/ContextMenu.tsx）を使う。インラインスタイルで個別メニューを作らない
- **モーダル**: .modal-overlay + .modal-dialog のCSSクラスを使う。インラインで position: fixed + zIndex を書かない
- **色**: すべてCSS変数（index.css の :root）で管理。ハードコードの色値は禁止。Canvas 2D API の fillStyle のみ JS定数で許容
- **スペーシング**: 4の倍数ルール（--space-xs=4, --space-sm=8, --space-md=12, --space-lg=16）。gap: 2 や padding: 10 のような値は使わない
- **フォントサイズ**: 3段階のみ（var(--font-size-base)=12px, var(--font-size-sm)=11px, bold=700）。14pxや16pxをハードコードしない
- **フラッドフィル**: floodFillImpl に境界判定を isInBounds で渡す共通実装。floodFill と floodFillInRect はそのラッパー
- **loadPngAsData**: skinIO.ts に一元管理。コンポーネント内にローカル定義しない
- **setTimeout/非同期処理**: useRef + useEffect cleanup で確実にクリーンアップ。cancelled フラグで stale な Promise 結果を無視
- **クリップボード**: clipboardSlice.ts で FaceClipboard・PartClipboard を管理。共通ユーティリティ: extractRect()（矩形からピクセル抽出）、writeRectWithFlip()（反転付きピクセル書き込み）
- **コピペの貼り付けモード**: PasteMode = 'normal' / 'flipH'（さゆうをはんてんさせてはりつけ）/ 'flipV'（じょうげをはんてんさせてはりつけ）の3種類
- **コピペのサイズ互換性**: 貼り付け時に全面のw/hが一致するかチェック。Classic腕脚は全て4x12x4で相互コピー可。Slimは腕↔腕、脚↔脚のみ
- **パーツカードデザイン**: タブ型ラベル（カード上辺の外に飛び出す）。ラベルはtool-btnと同じ配色（白背景＋カードと同色ボーダー＋普通書体）。ラベル幅はmin-width: 5.5emで全パーツ統一。カード左上のみ直角（ラベル接合部）、他3つは角丸
- **中央エリアのスクロール余白**: AllPartsOverviewにpadding: 50vh 50vwを設定してズーム時に端のパーツも画面中央に持ってこれるようにしている。マウント時にスクロール位置を中央に自動設定
- **ContextMenuの位置補正**: ビューポートからはみ出す場合はuseEffectでgetBoundingClientRectを使い自動で位置を補正（8pxマージン）

### デザイン教訓
- **装飾の足し算はダサくなりやすい**: パーツカードでボーダー装飾（かぎかっこ）、フラッシュアニメーション（背景色、ボーダー幅変化、box-shadow）、背景色（pale green、白）を試したが、いずれも過剰に見えた。最終的にシンプルなタブ型ラベル＋白ボーダーのみに
- **border表示/非表示の切替はレイアウトシフトを起こす**: border: none → border: 1px solid を切り替えると要素が1pxずつ上下にずれて意図しない挙動に見える。アニメーションにborderの有無変更は避ける
- **色面積が増えると画面が重くなる**: カード背景にpale greenを敷いたら一気にダサくなった。色は最小限に

### いろのちょうせい機能の設計方針
- **モード切替方式**: 描画モードと色ちょうせいモードは排他的。左サイドバーの内容をごっそり入れ替える。混在させない
- **けってい＝ベイク**: 調整中は非破壊プレビュー（adjustPreviewData）、「けってい」でskinDataに焼き込み＋undo履歴追加。調整レイヤーを永続化しない
- **ユーザーの想定フロー**: ①描く → ②色を調整する → ③手直しする。この流れに合わせた設計
- **カラーノイズ（ゆらぎ）**: ディザリングではなく「色のゆらぎ」。各ピクセルのHSLにランダムオフセット（明度＋色相）。面ごとシード値で再現性を確保
- **調整パラメータのコピペは不要だった**: 仕様に入れたが、実装中に複雑さに対してユーザー価値が低いと判断して廃止。シンプルさを優先

### いろのちょうせい - 実装で得た知見

#### スナップショットベースのundo/redo
- 通常のundo/redo（skinData全体のスナップショット）と色調整のundo/redo（パラメータ+シード）は完全に別系統
- 色調整の履歴モデル: `adjustHistory[0]` = 初期状態（全パラメータ0）、以降は変更のたびにスナップショットを追加
- **面選択の変更は履歴に含めない**: パラメータやシードの変更だけが「もどる」の対象。面選択を履歴に入れると「ぜんたいボタンを押しただけでもどるが出る」という違和感のある挙動になる

#### スライダーのドラッグとコミットの分離
- `setAdjustParamsLive`: ドラッグ中（onPointerDown→onChange間）のリアルタイムプレビュー用。履歴に保存しない
- `pushAdjustHistory`: onPointerUpで呼び出し、ドラッグ完了時に1回だけ履歴に記録
- `AdjustSlider`コンポーネント内のdragging refで状態管理。onChangeだけではドラッグか直接入力か区別できないのでonPointerDownフラグが必要

#### ゆらぎパターンのシードを履歴に含める
- `reshuffleSeeds` は全面のシードを再生成してから `pushAdjustHistory()` を呼ぶ
- 履歴スナップショットに `seeds: Map<FaceKey, number>` を含める → undo/redoでシードも復元される
- これにより「ゆらぎパターンをかえる → もどる」で前のパターンに正しく戻る

#### レイヤー切替時の面選択引き継ぎ
- `setAdjustTargetLayer`ではFaceKeyを解析して部位+面を抽出し、新しいレイヤーのキーに再生成
- FaceKey = "part_layer_face" → split('_')で[0]=part, [2:]=face として再構築
- 「ぜんぶ」→「しただけ」: base+overlayのキーからpart+faceを取り出し、baseのみのキーに変換
- これにより、レイヤーを変えても選択状態がリセットされない

#### 「ぜんぶ」モードのキャンバス合成
- adjustTargetLayer === 'both' の場合、FaceCanvasにoverlayRect propを追加で渡す
- FaceCanvasは通常のrect（base）の上にoverlayRectの内容をα合成して描画
- 通常の overlay編集時の baseRect（透かし表示）とは別の仕組み

#### 吹き出しガイドのposition: fixed
- 左サイドバー内の要素から、サイドバーの外（右側）に吹き出しを出す必要があった
- `position: fixed` + `z-index: 9999` で画面全体の上に表示
- ラベル要素のgetBoundingClientRectで位置を計算、pointerdownイベントで消す

### リファクタリングで得た教訓
- **Zustandのスライスパターン**: `createXxxSlice(set, get)` 関数で状態+アクションを返す形式。GetFnの型にはスライス自身のアクション型（AdjustActions等）も含める必要がある（自己参照するため）
- **スライス分割時のre-export**: 既存コンポーネントが `import { makeFaceKey } from '../../store/editorStore'` でインポートしているため、editorStore.ts から `export { makeFaceKey } from './adjustSlice'` でre-exportして互換性維持
- **Canvas 2D API 用の色定数は constants/colors.ts に一元管理**: CSS変数が使えない場面のJS定数。index.cssのCSS変数と同じ値であることをコメントで明示
- **3D定数（SCALE, OVERLAY_EXPAND）は constants/preview3d.ts に一元管理**: Preview3D.tsx と SkinSelector.tsx の両方で使用
- **色調整リセット状態の共通化**: `ADJUST_RESET_STATE` 定数を作ってcancelAdjust/commitAdjustで spread することで重複排除
- **applyAdjustToRects のインプレース化**: 以前は各rect処理のたびにUint8ClampedArrayを新規作成していた。コピーを1回だけ作ってインプレースで書き換える方式に変更し、GC負荷を軽減

### react-hooks v7（lint）と Three.js の両立
- react-hooks v7 は厳格な新ルールを持つ: `refs`（レンダー中にref.currentを読むな）、`immutability`（hookが返した値を書き換えるな）、`set-state-in-effect`（effect内で同期setStateするな）
- これらは Three.js / react-three-fiber の「ミュータブルなGPUリソースをReact外で更新する」パターンと根本的に衝突する。useRef/useStateで保持して書き換える方式は全部lint違反になる
- **解決策＝テクスチャは都度生成**: `useSkinTexture(data)` フックで、データが変わるたびに新しいDataTextureを `useMemo` で生成し、effectで旧テクスチャをdispose。書き換えがないのでrefもimmutabilityも違反しない。64×64と軽量なので毎回生成で問題なし（constants/preview3d.ts に集約）
- **DOM測定→setStateはrefコールバックで**: ContextMenuの位置補正のように「要素のサイズを測って位置を決める」処理は、useLayoutEffect内setStateだと set-state-in-effect 違反。refコールバック（`ref={(el)=>{...}}`）内ならレンダー外なので違反にならない
- **effectで導出state同期は避ける**: 「selectedCountが増えたらshowBalloonをfalseに」のような同期effectは、派生値（`!dismissed && noSelection`）で表現すればeffect不要
- **抑制コメントやルールOFFは技術的負債**: ユーザー方針は「設計で正攻法に解決」。eslint-disableで逃げない

### バンドル最適化
- Three.jsは巨大（~900KB）。vite.config.ts の `manualChunks` で three / @react-three を 'three' チャンクに分離すると、メインJSが激減し（1134KB→235KB）、3Dライブラリは長期キャッシュ可能に
- vite 8（rolldown）の manualChunks は**関数形式のみ**（オブジェクト形式は型エラー）。`manualChunks(id) { if (id.includes('node_modules/three')) return 'three' }`
- threeチャンク自体は大きいままなので `chunkSizeWarningLimit: 1000` で警告抑制（隔離済みなので妥当）

### Cowork環境
- ファイル削除には `mcp__cowork__allow_cowork_file_delete` ツールが必要（rm は Operation not permitted）
- マウントされたユーザーフォルダで `.git` が壊れる場合がある（cloneのlockファイルが残存）。`/tmp` で正常cloneし `.git` を `cp -a` でコピーすれば履歴・origin付きで復旧できる
- 編集はファイルツールでユーザーフォルダに直接、検証は `/tmp` 作業コピーに rsync 同期して lint/build、という運用が安定
- Chrome実機確認は Cowork の Chrome ツールでできる（ユーザーが手元で `npm run dev` 起動 → localhost:5173 を開いて確認）

### 作業プロセス（ユーザーから学んだこと）
- **判断を勝手にしない**: デザインや機能の方針は、実装前に必ずユーザーに確認する
- **提案→確認→実装** の順序を守る。「良さそうだから」で勝手に実装しない
- メッセージテキストはユーザーの感覚を優先する（技術的に正確でも、ユーザー体験として違和感があれば変える）
- ユーザーが「元に戻したい」と言ったらすぐ戻す。議論や説得をしない
