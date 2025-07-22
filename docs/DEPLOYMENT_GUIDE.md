# Mindmapify デプロイメントガイド

> ✅ **現在のステータス**: 本プロジェクトは既にVercelにデプロイ済みです  
> 🌐 **Live URL**: https://mindmapify-git-main-keisuke-kakudas-projects.vercel.app

## 🚀 現在の設定

### デプロイ済み環境
- **プラットフォーム**: Vercel
- **フレームワーク**: Vite (自動検出)
- **ビルドコマンド**: `npm run build`
- **出力ディレクトリ**: `dist`
- **自動デプロイ**: `main`ブランチへのpush時

### アクセス情報
- **本番URL**: https://mindmapify-git-main-keisuke-kakudas-projects.vercel.app
- **デプロイ管理**: [Vercelダッシュボード](https://vercel.com/dashboard)

## 🔧 運用・メンテナンス

### コードの更新デプロイ
```bash
# 変更をコミット
git add .
git commit -m "機能追加・修正内容"

# mainブランチにプッシュ → 自動デプロイ
git push origin main
```

### デプロイ前の確認事項
```bash
# ローカルビルドテスト
npm run build

# TypeScript確認
npm run typecheck

# 機能テスト
npm run test:quick
```

## ⚠️ 本番環境でのトラブルシューティング

### ビルドエラーが発生した場合
1. **Vercelダッシュボード**でビルドログを確認
2. **ローカル環境**で `npm run build` を実行して再現
3. **TypeScriptエラー**を修正: `npm run typecheck`
4. **修正後に再push**

### パフォーマンスモニタリング
- **Core Web Vitals**: Vercel Analytics で自動計測
- **バンドルサイズ**: 現在 173KB (gzipped)
- **ビルド時間**: 通常1-2分

## 🔄 ブランチ戦略

- **main**: 本番環境（自動デプロイ）
- **feature/***: プレビューURL自動生成
- **develop**: 統合テスト用（手動デプロイ）

## 💡 URL管理

### 現在のURL構成
- **デフォルトURL**: `mindmapify-git-main-keisuke-kakudas-projects.vercel.app`
- **短縮可能**: Vercelプロジェクト設定でドメイン名変更可能

### カスタムドメイン設定（オプション）
1. Vercel → Project Settings → Domains
2. 希望ドメインを追加
3. DNS設定を完了

## 📊 現在のVercel利用状況

**無料プラン範囲内**: 
- ビルド時間: 1-2分/回
- 帯域幅: 軽量アプリのため十分
- 同時接続: 制限なし

---

**Next Steps**: 新機能追加時は上記の「コードの更新デプロイ」手順に従ってください。