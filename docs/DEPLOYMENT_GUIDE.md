# Mindmapify デプロイメントガイド

本ガイドでは、MindmapifyをVercelにデプロイする手順を説明します。

## 🚀 Vercelデプロイ手順

### 前提条件
- [x] GitHubリポジトリにプッシュ済み
- [x] プロジェクトがビルド可能（`npm run build`が成功する）
- [ ] Vercelアカウント作成

### Step 1: Vercelアカウント作成・ログイン

1. [Vercel](https://vercel.com/)にアクセス
2. 「Sign Up」をクリック
3. **GitHubアカウントでログイン**を選択（推奨）
4. GitHubの認証を完了

### Step 2: プロジェクトのインポート

1. Vercelダッシュボードで「**Add New...**」→「**Project**」をクリック
2. 「**Import Git Repository**」セクションで`mindmapify`リポジトリを選択
3. 「**Import**」をクリック

### Step 3: ビルド設定の確認

Vercelが自動検出しますが、以下を確認：

```yaml
# 自動設定される内容
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**重要**: 通常は自動設定で問題ありません。変更不要です。

### Step 4: デプロイ実行

1. 「**Deploy**」ボタンをクリック
2. ビルドプロセスを待機（通常1-3分）
3. デプロイ完了後、URLが表示される

例：`https://mindmapify-xxx.vercel.app`

### Step 5: デプロイ確認

1. 生成されたURLにアクセス
2. 以下の機能をテスト：
   - [ ] ノード作成（Add Nodeボタン）
   - [ ] ノード編集（クリックして編集）
   - [ ] 接続線作成（ドラッグ&ドロップ）
   - [ ] Mermaidコード生成（Copyボタン）
   - [ ] キーボードショートカット（Cmd+Shift+A）

## 🔧 デプロイ後の設定

### 自動デプロイの確認

- **mainブランチにプッシュ** → **自動デプロイ**が実行される
- デプロイ履歴はVercelダッシュボードで確認可能

### カスタムドメイン設定（オプション）

1. Vercelプロジェクトページで「**Domains**」タブ
2. 「**Add**」をクリック
3. ドメイン名を入力（例：`mindmapify.example.com`）
4. DNS設定を完了

## 🛠️ トラブルシューティング

### ビルドエラーが発生する場合

```bash
# ローカルでビルドテスト
npm run build

# TypeScriptエラーチェック
npm run typecheck

# Lintエラーチェック  
npm run lint
```

### よくあるエラー

**1. TypeScriptエラー**
```bash
# 解決方法
npm run typecheck
# エラーを修正後にpush
```

**2. 依存関係エラー**
```bash
# package-lock.jsonを確認
npm ci
npm run build
```

**3. メモリ不足エラー**
```yaml
# vercel.jsonに追加（必要に応じて）
{
  "functions": {
    "app/api/**/*.js": {
      "memory": 1024
    }
  }
}
```

## 📊 パフォーマンス最適化

### Build時間短縮

```json
// package.jsonのscriptsに追加
{
  "build:fast": "vite build --mode production"
}
```

### CDN最適化

Vercelは自動的に以下を提供：
- **Global CDN**: 世界中のエッジサーバー
- **画像最適化**: 自動WebP変換
- **Gzip圧縮**: 自動圧縮
- **HTTP/2**: 高速プロトコル

## 🔐 セキュリティ設定

### HTTPS
- Vercelは自動的にHTTPS証明書を提供
- カスタムドメインでも自動対応

### 環境変数（必要に応じて）

1. Vercelダッシュボード → 「**Settings**」 → 「**Environment Variables**」
2. 変数を追加（例：API_URL, DB_CONNECTION等）
3. 再デプロイで反映

**注意**: Mindmapifyはフロントエンドのみなので、通常は環境変数不要

## 📈 モニタリング

### アクセス解析

Vercelダッシュボードで確認可能：
- **Visits**: ページビュー数
- **Bandwidth**: データ転送量
- **Function Invocations**: API呼び出し数（該当なし）

### パフォーマンス

- **Core Web Vitals**: 自動計測
- **Lighthouse Score**: 週次レポート

## 🔄 継続的デプロイ

### ワークフロー

```mermaid
graph LR
    A[コード修正] --> B[git push]
    B --> C[Vercel自動ビルド]
    C --> D[デプロイ完了]
    D --> E[URL更新]
```

### ブランチ戦略

- **main**: 本番環境（自動デプロイ）
- **develop**: プレビュー環境（プレビューURL生成）
- **feature/***: 個別プレビュー（プルリクエスト毎）

## 💡 ベストプラクティス

### デプロイ前チェックリスト

- [ ] `npm run build`が成功する
- [ ] `npm run test:full`が通る
- [ ] TypeScriptエラーがない
- [ ] 本番ビルドでの動作確認
- [ ] 重要な機能のマニュアルテスト

### コスト管理

**Vercel無料プラン制限**:
- **ビルド時間**: 月間100GB時間
- **帯域幅**: 月間100GB
- **関数実行**: 月間100GB時間（該当なし）

Mindmapifyは軽量なので、無料プランで十分です。

## 📞 サポート

### 問題が発生した場合

1. **Vercelダッシュボード**でログ確認
2. **GitHub Issues**で報告
3. **Vercelサポート**（有料プランのみ）

---

以上でMindmapifyのVercelデプロイが完了します。シンプルなフロントエンドアプリなので、通常は数分でデプロイできます。