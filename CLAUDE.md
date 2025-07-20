# Mindmapify - Claude Development Context

## プロジェクト概要

**Mindmapify**は、ブレインストーミングのアイデアを即座にMermaidマインドマップコードに変換するホワイトボードアプリケーションです。

## 関連ドキュメント

Claude Codeでの開発に必要な設計書は以下に整理されています：

- `docs/MVP_DEFINITION.md` - MVP機能要件とタイムライン
- `docs/USER_EXPERIENCE_DESIGN.md` - ユーザージャーニーとUI/UX設計
- `docs/WIREFRAMES.md` - 詳細なワイヤーフレームとレイアウト設計
- `docs/IMPLEMENTATION_ROADMAP.md` - **実装ロードマップとタスク管理**
- `docs/DESIGN_RULE.md` - **デザインシステム・実装チェックリスト**

## 現在の開発状況

### 完了済み
✅ プロジェクト設計・環境構築完了  
✅ React + TypeScript + Vite + Konva + Zustand 環境

### 進行中
🔄 **フェーズ1: 基盤構築** - 状態管理とキャンバス基本実装

### 次のマイルストーン
🎯 ノード編集機能（ダブルクリックでテキスト編集）

### 🧪 自動テスト機能
Claude CodeはPuppeteerでブラウザを自動操作してテスト実行可能：
- `npm run test:quick` - 5秒で基本動作確認（headless）
- `npm run test:debug` - デバッグ用（ブラウザ表示 + スクリーンショット）

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

## 技術スタック（予定）

### 開発環境
- **ビルドツール**: Vite
- **言語**: TypeScript
- **フレームワーク**: React.js
- **状態管理**: Zustand（軽量、シンプル）

### UI/描画
- **キャンバス**: Konva.js（高性能2Dレンダリング）
- **スタイリング**: Tailwind CSS（ユーティリティファースト）
- **コンポーネント**: Headless UI（アクセシビリティ対応）

### マインドマップ変換
- **レンダリング**: mermaid.js
- **コード生成**: カスタムパーサー（ノード構造 → Mermaid構文）

### 開発ツール
- **Linter**: ESLint
- **Formatter**: Prettier
- **型チェック**: TypeScript Compiler

## フォルダ構造（予定）

```
src/
├── components/          # UIコンポーネント
│   ├── Canvas/         # キャンバス関連
│   ├── Node/           # ノード関連
│   ├── MermaidPanel/   # コードプレビューパネル
│   └── common/         # 共通コンポーネント
├── hooks/              # カスタムフック
├── stores/             # 状態管理（Zustand）
├── utils/              # ユーティリティ関数
│   ├── mermaid.ts      # Mermaidコード生成
│   └── canvas.ts       # キャンバス操作
├── types/              # TypeScript型定義
└── App.tsx             # メインアプリケーション
```

## 開発フェーズ

### MVP機能（優先度順）
1. **基本キャンバス**: クリックでノード作成
2. **ノード編集**: ダブルクリックでテキスト編集
3. **ノード接続**: ドラッグで線作成
4. **Mermaidコード生成**: リアルタイム変換
5. **基本操作**: Undo/Redo、削除、コピー

### 将来的機能（スコープ外）
- ユーザーアカウント
- クラウド保存
- リアルタイムコラボレーション
- モバイルアプリ

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

### テスト
- **ユニットテスト**: ユーティリティ関数、フック
- **統合テスト**: コンポーネント間連携
- **E2Eテスト**: 主要ユーザーフロー

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