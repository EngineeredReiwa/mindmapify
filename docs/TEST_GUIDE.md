# Mindmapify テストガイド

統合テストスイート（test-suite.js）の使用方法

## 🚀 クイックスタート

### 最頻用コマンド
```bash
# デバッグテスト（ブラウザ表示 + スクリーンショット）
npm run test:debug

# 高速確認（2分、headless）
npm run test:quick

# 完全テスト（5分、全機能）
npm run test:full
```

## 📋 テストカテゴリ

| カテゴリ | 機能 | 時間 | 用途 |
|---------|------|------|------|
| `basic` | ノード作成・編集・移動 | 30秒 | 基本動作確認 |
| `nodes` | テキスト編集・削除・配置 | 45秒 | ノード関連問題 |
| `connections` | 接続線・ラベル編集 | 60秒 | 接続システム問題 |
| `shortcuts` | キーボードショートカット | 30秒 | ショートカット問題 |
| `ui` | スクロール・ズーム | 30秒 | UI/UX問題 |
| `mermaid` | コード生成・コピー | 15秒 | Mermaid出力問題 |
| `workflows` | 複雑ワークフロー | 2分 | 実践的マインドマップ作成 |

## 🎯 用途別コマンド

### 問題特定
```bash
# 接続システムのみテスト
npm run test:specific=connections

# 基本機能 + Mermaidのみ
npm run test:specific=basic,mermaid

# ノード操作 + UI確認
npm run test:specific=nodes,ui

# 頻出ワークフローのみ
npm run test:workflows
```

### 開発フロー
```bash
# 1. 修正前の問題確認
npm run test:debug

# 2. 修正後の該当機能確認
npm run test:specific=connections

# 3. 最終的な全体確認
npm run test:full
```

## 📸 スクリーンショット

`--debug`オプション使用時：
- temp/フォルダに自動保存
- ファイル名: `screenshot-{category}-{timestamp}.png`
- 各テストカテゴリで自動撮影

## ⚠️ 重要なルール

### ✅ 正しい使用方法
- 統合テストスイート（test-suite.js）のみ使用
- package.jsonのnpmスクリプト経由で実行
- 問題特定にはカテゴリ別テスト活用

### ❌ 禁止事項
- temp/内に個別テストファイル作成禁止
- レガシーテストファイル使用禁止
- 直接puppeteerスクリプト作成禁止

## 🔧 トラブルシューティング

### よくある問題

**Q: テストが失敗する**
```bash
# 開発サーバーが起動しているか確認
npm run dev

# 別ターミナルでテスト実行
npm run test:debug
```

**Q: 特定の機能だけテストしたい**
```bash
# 該当カテゴリを指定
npm run test:specific=connections
```

**Q: スクリーンショットが保存されない**
```bash
# --debugオプションが必要
npm run test:debug
# または
node test-suite.js --debug
```

## 📊 レポート例

テスト実行後の出力例：
```
📊 TEST RESULTS SUMMARY
=========================================================

🏗️ 基本機能
  Passed: 3 | Failed: 0

🔗 接続システム  
  Passed: 2 | Failed: 1
    ❌ Connection Label Editing: Timeout error

🎯 TOTAL: 5 passed, 1 failed
⏱️ Duration: 45 seconds
📸 Screenshots: 6 saved in temp/
📈 Success Rate: 83%
✅ Good! Most functionality working, minor issues detected.
```

---

このガイドに従って、効率的で一貫したテストを実行してください。