# Mindmapify - Claude Development Context

## プロジェクト概要

**Mindmapify**は、ブレインストーミングのアイデアを即座にMermaidマインドマップコードに変換するホワイトボードアプリケーションです。

## 関連ドキュメント

Claude Codeでの開発に必要な設計書は以下に整理されています：

- `docs/MVP_DEFINITION.md` - MVP機能要件とタイムライン
- `docs/USER_EXPERIENCE_DESIGN.md` - ユーザージャーニーとUI/UX設計
- `docs/WIREFRAMES.md` - 詳細なワイヤーフレームとレイアウト設計
- `docs/IMPLEMENTATION_ROADMAP.md` - **現在進行中・今後のタスク管理**
- `docs/IMPLEMENTATION_ARCHIVE.md` - **Phase 1-5B完了済み65タスクの履歴**
- `docs/DESIGN_RULE.md` - **デザインシステム・実装チェックリスト**
- `docs/TEST_GUIDE.md` - **統合テストスイート使用ガイド**

## 現在の開発状況

### ✅ 完了済みフェーズ
- **フェーズ1**: 基盤構築（状態管理・キャンバス）
- **フェーズ2**: ノード操作（作成・編集・移動）
- **フェーズ3**: 接続とコード生成（接続線・Mermaid出力）
- **Phase 4A**: 緊急UX改善（矢印ヘッド・ノード内編集）
- **Phase 4B**: 操作性向上（削除機能・ラベル編集）
- **Phase 5A**: 実用性向上（COPY機能・スクロール改善）
- **Phase 5B**: 高度な操作機能（キーボードショートカット・履歴管理）

### 🔄 進行中
**Phase 6: 細部改善** - 接続システムの精度向上

### 🎯 次のマイルストーン
- 接続線ダブルクリック精度向上 ✅完了
- 接続点固定システム実装
- 動的プレビュー改善

### 🧪 テスト戦略・デバッグ環境

#### 🎯 統合テストスイート（必須使用）
**重要**: 従来の散乱したtempファイルは削除済み。このシステムのみ使用してください。

##### 基本テストコマンド
```bash
# 開発時の基本テスト（最頻用）
npm run test:debug    # ブラウザ表示 + スクリーンショット保存

# 迅速な動作確認
npm run test:quick    # 2分、基本機能のみ、headless

# 包括的な動作確認
npm run test:full     # 5分、全機能、headless

# 複雑ワークフローテスト
npm run test:workflows # 実践的マインドマップ作成、2分

# 開発サーバー込みでテスト
npm run test:dev      # 開発サーバー起動 + デバッグテスト実行
```

##### カテゴリ別テスト（問題特定用）
```bash
# 特定カテゴリのみテスト
npm run test:specific=basic,mermaid
npm run test:specific=connections
npm run test:specific=shortcuts

# 利用可能カテゴリ
basic       🏗️ 基本機能（ノード作成・編集・移動）30秒
nodes       📝 ノード操作（テキスト編集・削除・配置）45秒
connections 🔗 接続システム（接続線作成・編集・ラベル）60秒
shortcuts   ⌨️ キーボードショートカット（履歴機能）30秒
ui          🎨 UI/UX（スクロール・ズーム・ツールバー）30秒
mermaid     📊 Mermaidコード生成（コピー機能）15秒
workflows   🔄 複雑ワークフロー（実践的マインドマップ作成）2分
```

##### 高度なオプション
```bash
# ヘルプ表示
node test-suite.js --help

# ヘッドレス/ビジュアル指定
node test-suite.js --headless
node test-suite.js --debug

# 複数カテゴリ組み合わせ
node test-suite.js --specific=basic,nodes,mermaid --debug
```

#### 🔧 Claude Code CLI専用ガイド

##### 問題発生時の対応手順
1. **再現確認**: `npm run test:debug` で問題を視覚的に確認
2. **範囲特定**: 該当カテゴリのみテスト実行で原因特定
3. **修正実装**: コード修正後、同じカテゴリで動作確認
4. **回帰テスト**: `npm run test:full` で全体への影響確認

##### 実装後の検証手順
1. **基本動作確認**: `npm run test:quick` で素早くチェック
2. **関連機能確認**: 該当カテゴリで詳細チェック
3. **最終確認**: `npm run test:full` で全機能確認

##### スクリーンショット活用
- `--debug`オプション使用時、temp/にスクリーンショット自動保存
- ファイル名: `screenshot-{category}-{timestamp}.png`
- 問題箇所の視覚的記録として活用

#### 🚨 Claude Code CLI必須ルール
**絶対に従ってください - テスト実行時の唯一の方法**

- **test-suite.js必須使用**: 全てのテストはtest-suite.jsのみ実行
- **test-suite.js修正OK**: 不足機能があればtest-suite.jsに追加・修正する
- **tempファイル作成禁止**: 個別puppeteerスクリプト作成禁止
- **npmスクリプト経由実行**: `npm run test:debug`等を必ず使用
- **レガシーテスト禁止**: 古いtest-*.jsファイルは全て削除済み

#### 🎯 Claude Code CLIが必ず使うべきコマンド
```bash
# 問題が発生した場合（最優先）
npm run test:debug

# 機能確認時
npm run test:quick

# 包括的確認時  
npm run test:full

# 複雑なワークフロー確認時
npm run test:workflows
```

#### ✅ 許可事項（推奨）
- **test-suite.js修正・拡張**: 不足機能の追加・改善
- **新カテゴリ追加**: TEST_CATEGORIESへの新しいテストカテゴリ追加
- **npmスクリプト追加**: package.jsonへの新しいテストコマンド追加
- **新機能テスト統合**: 新機能実装時はtest-suite.jsに直接統合

#### ⚠️ 絶対禁止事項
- puppeteerスクリプトの直接作成・実行（test-suite.js以外）
- tempディレクトリ内への個別テストファイル作成
- test-*.jsなどの散乱ファイル作成

#### 📋 解決済み問題（Phase 6）
**問題**: Claude Codeが複数選択機能のテストで個別ファイル（temp/test-multi-select-manual.cjs等）を作成
**解決**: test-suite.jsのノード操作テストセクションに多重選択テストを統合済み

### コアコンセプト
- 「Think freely. Export clearly.」
- クリック → ノード作成 → ドラッグで接続 → 即座にMermaidコード生成
- 技術的複雑さを隠し、思考の流れを妨げない直感的体験

## アーキテクチャ方針

### フロントエンド中心設計
- **SPA**: Single Page Application、ページ遷移なし
- **状態管理**: ローカル中心、リアルタイム更新
- **レスポンシブ**: デスクトップ優先、タブレット対応

### パフォーマンス優先
- **初期ロード**: 3秒以内
- **操作レスポンス**: 100ms以内（ノード作成）
- **Mermaidコード生成**: 500ms以内

## 技術スタック（確定・実装済み）

### ✅ 確定済み技術
- **ビルドツール**: Vite（高速開発サーバー）
- **言語**: TypeScript（strict mode）
- **フレームワーク**: React.js
- **状態管理**: Zustand + immer（実装済み）

### ✅ UI/描画（実装済み）
- **キャンバス**: Konva.js（react-konva）
- **HTML Overlay**: **Konvaネイティブ実装**（react-konva-utils廃止済み）
- **スタイリング**: Tailwind CSS + Apple HIG準拠デザインシステム
- **アイコン**: Lucide React

### ✅ マインドマップ生成（実装済み）
- **コード生成**: Mermaid Flowchart記法（ループ対応）
- **関係性ラベル**: 8種類プリセット（原因、結果、手段、具体例、要素、同類、対比、補完）
- **リアルタイム更新**: useMemoメモ化済み

### 🔧 重要な技術的決定事項
- **react-konva-utils→Konvaネイティブ移行**: HTML overlay問題解決のため
- **12種類→8種類ラベル縮約**: ユーザビリティ向上のため
- **常時表示接続点**: 編集しやすさ重視
- **Flowchart記法採用**: ループ表現対応のため

## 📋 実装済み機能（Phase 5B完了時点）

### ✅ コア機能
- **ノード操作**: 作成、ドラッグ移動、1クリック編集、自動リサイズ、ペースト対応
- **テキスト編集**: Konva直接編集、カーソル制御、自動折り返し、複数行対応
- **接続システム**: 常時表示接続点、点線プレビュー、実線接続、接続先変更機能
- **関係性ラベル**: 8種類プリセット、ダブルクリック編集、シンプルテキスト表示
- **削除機能**: 個別削除（Deleteキー・ツールバー）、全削除、関連接続線自動削除

### ✅ 高度な機能
- **Mermaidコード生成**: Flowchart記法、ループ対応、ラベル付き矢印、クリップボードコピー
- **履歴管理**: 完全なUndo/Redo（ノード移動・テキスト編集対応）
- **キーボードショートカット**: UI統合型安全ショートカット、編集中削除対応、連続ズーム
- **UI/UX**: レスポンシブキャンバス、リアルタイム更新、スクロール操作、ズームボタン
- **ノード配置**: 重複回避グリッド配置、画面内表示最適化

### 🎯 Phase 6残タスク（細部改善）
- 接続点固定システム実装
- 矢印ヘッド視認性改善  
- 接続編集時の動的プレビュー
- ラベル編集ショートカット（数字キー1-8）

## 設計原則

### ユーザー体験
- **即座性**: 待機時間を最小化
- **直感性**: 説明不要の操作
- **予測可能性**: 一貫したインタラクション

### 開発体験
- **型安全性**: TypeScriptで実行時エラー防止
- **テスト容易性**: 関数型アプローチ、副作用分離
- **保守性**: 単一責任原則、明確な依存関係

## データ構造

### ノード
```typescript
interface Node {
  id: string;
  text: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: NodeStyle;
}
```

### 接続
```typescript
interface Connection {
  id: string;
  from: string; // ノードID
  to: string;   // ノードID
  style?: ConnectionStyle;
}
```

### マインドマップ状態
```typescript
interface MindmapState {
  nodes: Node[];
  connections: Connection[];
  selectedNodeId?: string;
  selectedConnectionId?: string;
  canvasOffset: { x: number; y: number };
  canvasZoom: number;
}
```

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 型チェック
npm run typecheck

# Linting
npm run lint

# E2Eテスト（要: 開発サーバー起動中）
npm run test:quick    # 簡易テスト（5秒、headless）
npm run test:e2e      # フル機能テスト（30秒、headless）
npm run test:debug    # デバッグ用（ブラウザ表示 + スクリーンショット）
npm run test:dev      # 開発サーバー起動 + テスト実行
```

## デプロイ

### 静的サイトホスティング
- **候補**: Vercel, Netlify, GitHub Pages
- **理由**: フロントエンドのみ、CDN配信、無料枠あり

## パフォーマンス最適化方針

### 大量ノード対応
- **仮想化**: 50ノード超で表示領域外は非レンダリング
- **遅延更新**: Mermaidコード生成をデバウンス（300ms）
- **メモ化**: React.memo、useMemo積極活用

### バンドルサイズ
- **Code Splitting**: ルート別分割
- **Tree Shaking**: 未使用コード除去
- **Dynamic Import**: 非必須機能の遅延読み込み

## セキュリティ考慮

### XSS対策
- **ユーザー入力**: HTMLエスケープ
- **CSP**: Content Security Policy設定

### データ保護
- **ローカルストレージ**: 機密情報は保存しない
- **HTTPS**: 本番環境では必須

## アクセシビリティ

### WCAG 2.1 AA準拠目標
- **キーボードナビゲーション**: 全機能アクセス可能
- **スクリーンリーダー**: 適切なARIAラベル
- **色覚**: 色のみに依存しない情報伝達
- **コントラスト**: 4.5:1以上

## 開発時の注意点

### 🧪 テスト実行（最重要）
**Claude Code CLI必須ルール - 違反厳禁**

#### 必ず使用するコマンド
```bash
# 問題発生時（最優先）
npm run test:debug

# 修正後の確認
npm run test:specific=該当カテゴリ

# 最終確認
npm run test:full
```

#### ✅ 推奨・許可事項
- **test-suite.js修正**: 不足機能があれば積極的に追加・改善
- **新テストカテゴリ追加**: TEST_CATEGORIESに新しいカテゴリ追加
- **npmスクリプト追加**: package.jsonに便利なテストコマンド追加

#### ❌ 絶対禁止
- puppeteerスクリプトの個別新規作成
- tempディレクトリへの散乱ファイル作成
- test-*.jsなどの個別テストファイル作成

### 🎨 UI/UXデザイン（最重要）
**必ずDESIGN_RULE.mdに従ってください**

#### 必須チェック項目
- **コントラスト**: 4.5:1以上（`text-gray-900`, `text-gray-600`, `text-blue-600`使用）
- **タッチターゲット**: 44px以上（ボタン`h-11 w-11`、アイコン`w-10 h-10`）
- **8pxグリッド**: 全余白は4の倍数（`p-4`, `m-6`, `gap-4`）
- **角丸一貫性**: ボタン`rounded-lg`、カード`rounded-xl`、入力`rounded-md`
- **影システム**: インタラクティブ要素に`shadow-elevation-1`、ホバー時`elevation-2`
- **フォーカス**: `focus:ring-2 focus:ring-blue-500`
- **キーボードナビゲーション**: Tab移動、Enter/Space操作対応

#### Mindmapify固有デザイン
- **キャンバス**: `bg-gray-50`背景
- **ノード**: `min-w-24 min-h-12`、選択時`border-blue-500 shadow-elevation-3`
- **接続線**: 通常`stroke-gray-500(2px)`、選択時`stroke-blue-500(3px)`
- **ツールバー**: `bg-white shadow-elevation-2`、アイコン`w-10 h-10 rounded-lg`

#### 禁止事項
- **真っ黒禁止**: `#000000`使用禁止 → `text-gray-900`使用
- **小タッチターゲット**: 44px未満禁止
- **影なしボタン**: インタラクティブ要素に影必須
- **同色系重複**: 青背景+青ボタン禁止
- **薄色背景多用**: `-50`系は大領域のみ

### 状態管理
- **単一データフロー**: Zustandでシンプルに
- **イミュータブル**: 状態の直接変更禁止
- **副作用分離**: ピュア関数中心の設計

### TypeScript
- **strict mode**: 有効化必須
- **any禁止**: unknown使用推奨
- **型ガード**: 実行時型チェック

### テスト（必須事項）
**⚠️ Claude Code CLI専用指示**
- **E2Eテストのみ**: test-suite.jsによる統合テスト必須
- **個別スクリプト禁止**: puppeteer直接実行禁止
- **npmスクリプト必須**: `npm run test:debug`等のみ使用
- **テスト前確認**: `npm run test:debug`で問題の視覚的確認必須

## トラブルシューティング

### よくある問題
1. **Konvaパフォーマンス**: レイヤー分割、オブジェクトプール
2. **Mermaid描画エラー**: 構文検証、フォールバック表示
3. **メモリリーク**: useEffectクリーンアップ、イベントリスナー解除

### デバッグツール
- **React DevTools**: コンポーネント状態確認
- **Redux DevTools**: Zustand状態履歴
- **Performance Tab**: レンダリング最適化

## リリース戦略

### バージョニング
- **Semantic Versioning**: MAJOR.MINOR.PATCH
- **Git Tags**: リリース時タグ付け

### リリースフロー
1. **開発**: feature/xxx ブランチ
2. **統合**: develop ブランチでテスト
3. **リリース**: main ブランチにマージ
4. **デプロイ**: 自動デプロイ（CI/CD）

---

このCLAUDE.mdは開発進行に合わせて更新し、プロジェクトの「生きた仕様書」として維持します。