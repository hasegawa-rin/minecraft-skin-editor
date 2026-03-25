# プロジェクト共通ルール

## プロジェクトの原則
- 本プロジェクトの回答・ドキュメント作成はすべて日本語で行うこと
- ユーザーは非エンジニアである。専門用語を使う場合は必ず簡潔な補足を添えること

## プロジェクトの目的
- マインクラフトのスキン（キャラクターの見た目）を編集できるWebアプリの開発
- ブラウザ上で2D編集と3Dプレビューができるスキンエディタ

## 技術構成
- React 19 + TypeScript（UIフレームワーク＋型安全な言語）
- Vite 8（開発サーバー＋ビルドツール）
- Three.js + React Three Fiber / Drei（3Dプレビュー表示用）
- Zustand（状態管理：アプリ全体のデータを一元管理するライブラリ）
- スキンデータは 64x64px の RGBA 画像（Uint8ClampedArray で管理）

---

# セッション管理（3ファイル体制）

## 3ファイルの役割
| ファイル | 書き手 | 役割 |
|---|---|---|
| CLAUDE.md（本ファイル） | 人間 | 不変のルール・プロジェクト方針 |
| `.agent/memory/MEMORY.md` | AI | 積み上がる経験・学習記録 |
| `.agent/handoff/HANDOFF.md` | AI（人間がレビュー） | セッション間の引き継ぎ |

## セッション開始時（必須）
セッション開始時、ユーザーへの最初の応答の前に、以下の2ファイルを読み込み、読み込んだことを報告すること：
- `.agent/memory/MEMORY.md`（学習した知識・教訓）
- `.agent/handoff/HANDOFF.md`（前回の作業引き継ぎ）

## メモリ管理ルール
- 新しい知識・教訓を学んだ場合は `.agent/memory/MEMORY.md` を更新する
- 更新前に、現在のファイルを `.agent/memory/YYYY-MM-DD.md` にアーカイブしてから新規作成する
- MEMORY.md は 200行以内を維持すること
- 本ファイル（CLAUDE.md）と重複する内容は MEMORY.md に書かない

## ハンドオフ管理ルール
- ユーザーが「引き継ぎを作って」「ハンドオフして」「作業を終わる」と言ったら、HANDOFF.md を作成する
- 保存先は `.agent/handoff/HANDOFF.md`（固定名）
- 作成時は既存ファイルを `.agent/handoff/YYYY-MM-DD-HHMM.md` にリネームしてから新規作成する
- HANDOFF.md には以下を必ず含めること：
  - 現在のタスクと進捗
  - 試したこと・結果（成功/失敗とその理由）
  - 次のセッションで最初にやること
  - 注意点・未解決の問題

---

# 仕様駆動開発（SDD）ルール

## 基本方針
- コーディングや作業を開始する前に、必ず `.spec/` 配下の4ファイルを確認・更新すること
- 作業の順序：PLAN（目的確認）→ SPEC（要件確認）→ TODO（タスク確認）→ 実作業

## 各ファイルの運用
- **PLAN.md** は人間の口頭メモ・自由記述であり、箇条書き・口語・断片的な内容で構わない
- PLAN.md を読んだら、そのまま実装に入らず、不明点をヒアリングしながら SPEC.md を作成・確定させること
- SPEC.md が確定してから TODO.md のタスク分解を行い、ユーザーの承認を得てから実作業を開始する
- 作業完了後は TODO.md の該当タスクにチェックを入れ、KNOWLEDGE.md に学びを記録する
- 仕様が不明確な場合は作業を開始せず、ユーザーに確認してから SPEC.md を更新する

## 新しい開発サイクルの開始（newplan）
ユーザーが「新しいプランを始めたい」「次の機能に進みたい」と言ったら：
1. `.spec/` 配下の4ファイルを `PLAN-YYYY-MM-DD.md` 等にアーカイブ
2. 新しいテンプレートで4ファイルを新規作成
3. KNOWLEDGE.md のみ、前回の内容をそのままコピーして引き継ぐ（知見を蓄積するため）

---

# 理解負債の防止ルール

## コード解説の義務
- コードを新規作成・大幅修正したときは、**そのコードが何をしているか**を日本語で必ず解説すること
- 解説は「エンジニアでない人が読んでもわかるレベル」を目指すこと
- ファイルごとの役割一覧を KNOWLEDGE.md に記録・更新すること

## 設計判断の記録
- 技術選定やアーキテクチャの判断をしたときは、**なぜそうしたか（理由）**を KNOWLEDGE.md に記録すること
- 「他にも選択肢があったが、○○の理由でこちらを選んだ」という形式で書くこと

## コードの簡潔さ
- AI が生成するコードは冗長になりがちであることを自覚すること
- 不要なエッジケース処理、使われない抽象化、過剰な条件分岐がないか自ら振り返ること
- 「もっとシンプルに書けないか？」を常に自問すること

## 変更時の影響説明
- 既存コードを変更する際は、変更の影響範囲を事前に説明すること
- 「この変更で○○が影響を受ける可能性がある」という形で伝えること

---

# 画面エリアとファイルの対応表（AI向け早見表）
ユーザーが「画面のどこ」を指して話しているかで、読むべきファイルを特定する。
全ファイルを読む必要はない。該当ファイルだけ Read して作業すること。

| ユーザーの言い方 | 対応ファイル |
|---|---|
| ヘッダー、よみこみ、ほぞんボタン | `src/components/panels/FileActions.tsx` |
| ツール（ペン、バケツ等） | `src/components/toolbar/Toolbar.tsx` |
| 色、カラーパレット、HEX | `src/components/palette/ColorPalette.tsx` |
| レイヤー（した/うえ）、えをかくレイヤー | `src/components/panels/LayerSelector.tsx` |
| まんなかのキャンバス、おえかき画面 | `src/components/canvas/SkinCanvas.tsx` |
| 面（まえ/うしろ等）、右クリックメニュー | `src/components/canvas/FaceCanvas.tsx` |
| もどる、すすむ、undo、redo | `src/components/canvas/SkinCanvas.tsx`（UndoRedoControls） |
| ズーム、大きく/小さく | `src/components/canvas/SkinCanvas.tsx`（ZoomControls） |
| 3Dプレビュー | `src/components/preview3d/Preview3D.tsx` |
| パーツ（あたま/からだ等） | `src/components/panels/PartSelector.tsx` |
| プレビューのレイヤー表示（ぜんぶ/しただけ） | `src/components/panels/PreviewFilter.tsx` |
| ボタンの名前、メッセージ文言 | `src/constants/uiText.ts` |
| 色・フォント・余白などのデザイン全般 | `src/index.css`（トークン）、`src/App.css`（レイアウト） |
| スキンデータ、状態管理、履歴 | `src/store/editorStore.ts` |
| パーツのUV座標、テンプレート | `src/constants/skinTemplate.ts` |
| PNG読み込み・書き出し | `src/utils/skinIO.ts` |
| 描画ロジック（ブラシ、バケツ等） | `src/utils/drawingTools.ts` |

---

# フォルダ構成
- `.agent/memory/` ：AIの学習記録（MEMORY.md + アーカイブ）
- `.agent/handoff/` ：セッション引き継ぎ（HANDOFF.md + アーカイブ）
- `.agent/skills/`  ：プロジェクト固有のスキル（必要に応じて追加）
- `.spec/`          ：設計ドキュメント（PLAN / SPEC / TODO / KNOWLEDGE）
- `src/`            ：ソースコード
- `src/components/`  ：UIコンポーネント（canvas, palette, panels, preview3d, toolbar）
- `src/store/`       ：状態管理（editorStore.ts）
- `src/types/`       ：型定義
- `src/utils/`       ：ユーティリティ関数（描画ツール、スキン入出力）
- `src/constants/`   ：定数（スキンテンプレート、UIテキスト）
- `docs/`            ：参考資料・成果物
