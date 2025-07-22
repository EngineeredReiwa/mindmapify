# Mindmapify デザインルール

Appleのデザイン哲学に基づいた、洗練されたデザインシステム

## 🎯 デザイン哲学

### Core Principles
- **Clarity**: 機能が形を決定する。明確で直感的なインターフェース
- **Deference**: UIは内容をサポートし、邪魔をしない
- **Depth**: 視覚的階層と適切な奥行きでユーザーの理解を促進

### ブランドアイデンティティ
- **Think freely. Export clearly.**
- 思考の流れを妨げない直感的体験
- プロフェッショナルながら親しみやすいトーン
- クリエイティビティを引き出すデザイン

## 🎨 カラーシステム

### Primary Colors (メイン)
```css
/* Brand Primary - インテリジェントなブルー */
--color-primary-50: #eff6ff;    /* bg-blue-50 */
--color-primary-100: #dbeafe;   /* bg-blue-100 */
--color-primary-500: #3b82f6;   /* bg-blue-500 */
--color-primary-600: #2563eb;   /* bg-blue-600 */
--color-primary-700: #1d4ed8;   /* bg-blue-700 */
```

### Semantic Colors (機能的色彩)
```css
/* Success - 成功・完了 */
--color-success-50: #f0fdf4;    /* bg-green-50 */
--color-success-500: #22c55e;   /* bg-green-500 */
--color-success-600: #16a34a;   /* bg-green-600 */

/* Warning - 警告・注意 */
--color-warning-50: #fffbeb;    /* bg-amber-50 */
--color-warning-500: #f59e0b;   /* bg-amber-500 */
--color-warning-600: #d97706;   /* bg-amber-600 */

/* Error - エラー・削除 */
--color-error-50: #fef2f2;      /* bg-red-50 */
--color-error-500: #ef4444;     /* bg-red-500 */
--color-error-600: #dc2626;     /* bg-red-600 */
```

### Neutral Colors (背景・テキスト)
```css
/* Grays - Apple風の暖かみのあるニュートラル */
--color-gray-50: #f9fafb;       /* bg-gray-50 */
--color-gray-100: #f3f4f6;      /* bg-gray-100 */
--color-gray-200: #e5e7eb;      /* bg-gray-200 */
--color-gray-300: #d1d5db;      /* bg-gray-300 */
--color-gray-400: #9ca3af;      /* bg-gray-400 */
--color-gray-500: #6b7280;      /* bg-gray-500 */
--color-gray-600: #4b5563;      /* bg-gray-600 */
--color-gray-700: #374151;      /* bg-gray-700 */
--color-gray-800: #1f2937;      /* bg-gray-800 */
--color-gray-900: #111827;      /* bg-gray-900 */
```

### Canvas Colors (キャンバス専用)
```css
/* Canvas Background */
--color-canvas-bg: #fefefe;     /* bg-gray-50 with slight warmth */
--color-canvas-grid: #f0f0f0;   /* bg-gray-200 with opacity */

/* Node Colors */
--color-node-bg: #ffffff;       /* bg-white */
--color-node-border: #e5e7eb;   /* border-gray-200 */
--color-node-selected: #3b82f6; /* border-blue-500 */

/* Connection Colors */
--color-connection: #6b7280;    /* stroke-gray-500 */
--color-connection-hover: #374151; /* stroke-gray-700 */
```

## ✏️ タイポグラフィ

### フォントファミリー
```css
/* Apple風のシステムフォント */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif;

/* Tailwind Classes */
.font-system { font-family: ui-sans-serif, system-ui, sans-serif; }
```

### フォントサイズ階層
```css
/* Display - 大見出し */
.text-display { @apply text-4xl font-bold tracking-tight; }    /* text-4xl font-bold */

/* Headline - 見出し */
.text-headline-lg { @apply text-2xl font-semibold; }          /* text-2xl font-semibold */
.text-headline { @apply text-xl font-semibold; }              /* text-xl font-semibold */

/* Body - 本文 */
.text-body-lg { @apply text-lg font-normal; }                 /* text-lg */
.text-body { @apply text-base font-normal; }                  /* text-base */
.text-body-sm { @apply text-sm font-normal; }                 /* text-sm */

/* Caption - 補助テキスト */
.text-caption { @apply text-xs font-medium uppercase tracking-wide; } /* text-xs font-medium uppercase tracking-wide */
```

### フォントウェイト
```css
.font-light { font-weight: 300; }      /* font-light */
.font-normal { font-weight: 400; }     /* font-normal */
.font-medium { font-weight: 500; }     /* font-medium */
.font-semibold { font-weight: 600; }   /* font-semibold */
.font-bold { font-weight: 700; }       /* font-bold */
```

## 📏 余白・間隔システム

### Spacing Scale (Apple 8pt Grid System)
```css
/* Base unit: 4px (Tailwind's default) */
--spacing-xs: 4px;     /* space-1 */
--spacing-sm: 8px;     /* space-2 */
--spacing-md: 16px;    /* space-4 */
--spacing-lg: 24px;    /* space-6 */
--spacing-xl: 32px;    /* space-8 */
--spacing-2xl: 48px;   /* space-12 */
--spacing-3xl: 64px;   /* space-16 */
```

### Layout Spacing
```css
/* Container */
.container-spacing { @apply px-4 md:px-6 lg:px-8; }

/* Section Spacing */
.section-spacing-y { @apply py-12 md:py-16 lg:py-20; }
.section-spacing-x { @apply px-4 md:px-8; }

/* Component Spacing */
.component-spacing { @apply p-4 md:p-6; }
.component-spacing-sm { @apply p-3; }
.component-spacing-lg { @apply p-6 md:p-8; }
```

## 🔄 角丸システム

### Border Radius Scale
```css
/* Apple風の滑らかな角丸 */
--radius-xs: 4px;      /* rounded */
--radius-sm: 6px;      /* rounded-md */
--radius-md: 8px;      /* rounded-lg */
--radius-lg: 12px;     /* rounded-xl */
--radius-xl: 16px;     /* rounded-2xl */
--radius-full: 9999px; /* rounded-full */
```

### 用途別角丸
```css
/* Buttons */
.btn-radius { @apply rounded-lg; }        /* 8px - 親しみやすさ */

/* Cards */
.card-radius { @apply rounded-xl; }       /* 12px - 洗練された印象 */

/* Input Fields */
.input-radius { @apply rounded-md; }      /* 6px - 機能的 */

/* Modal/Dialog */
.modal-radius { @apply rounded-2xl; }     /* 16px - プレミアム感 */

/* Nodes (Canvas) */
.node-radius { @apply rounded-lg; }       /* 8px - バランス重視 */
```

## 🌊 影の効果

### Shadow System (Apple風の繊細な影)
```css
/* Elevation Shadows */
.shadow-elevation-1 { 
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  /* shadow-sm */
}

.shadow-elevation-2 { 
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  /* shadow-md */
}

.shadow-elevation-3 { 
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  /* shadow-lg */
}

.shadow-elevation-4 { 
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  /* shadow-xl */
}

.shadow-elevation-5 { 
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  /* shadow-2xl */
}
```

### 用途別影
```css
/* Cards */
.card-shadow { @apply shadow-elevation-2; }

/* Buttons */
.btn-shadow { @apply shadow-elevation-1; }
.btn-shadow-hover { @apply shadow-elevation-2; }

/* Modals */
.modal-shadow { @apply shadow-elevation-4; }

/* Canvas Nodes */
.node-shadow { @apply shadow-elevation-1; }
.node-shadow-selected { @apply shadow-elevation-3; }

/* Toolbar */
.toolbar-shadow { @apply shadow-elevation-2; }
```

## 🎛️ コンポーネント設計

### Buttons
```css
/* Primary Button */
.btn-primary {
  @apply bg-blue-600 text-white font-medium px-4 py-2 rounded-lg shadow-elevation-1
         hover:bg-blue-700 hover:shadow-elevation-2
         active:bg-blue-800 active:shadow-elevation-1
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
         disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed
         transition-all duration-200 ease-in-out;
}

/* Secondary Button */
.btn-secondary {
  @apply bg-gray-100 text-gray-700 font-medium px-4 py-2 rounded-lg shadow-elevation-1
         hover:bg-gray-200 hover:shadow-elevation-2
         active:bg-gray-300 active:shadow-elevation-1
         focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
         disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed
         transition-all duration-200 ease-in-out;
}

/* Icon Button */
.btn-icon {
  @apply w-10 h-10 rounded-lg bg-gray-100 text-gray-600 shadow-elevation-1
         hover:bg-gray-200 hover:shadow-elevation-2
         active:bg-gray-300 active:shadow-elevation-1
         focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2
         flex items-center justify-center
         transition-all duration-200 ease-in-out;
}

/* Danger Button */
.btn-danger {
  @apply bg-red-600 text-white font-medium px-4 py-2 rounded-lg shadow-elevation-1
         hover:bg-red-700 hover:shadow-elevation-2
         active:bg-red-800 active:shadow-elevation-1
         focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
         transition-all duration-200 ease-in-out;
}
```

### Cards
```css
/* Basic Card */
.card {
  @apply bg-white rounded-xl shadow-elevation-2 p-6
         border border-gray-200
         transition-all duration-200 ease-in-out;
}

/* Interactive Card */
.card-interactive {
  @apply bg-white rounded-xl shadow-elevation-2 p-6
         border border-gray-200
         hover:shadow-elevation-3 hover:border-gray-300
         transition-all duration-200 ease-in-out
         cursor-pointer;
}

/* Canvas Node States */
.node {
  @apply bg-white rounded-lg shadow-elevation-1 p-3 min-w-24 min-h-12
         border border-gray-200
         transition-all duration-200 ease-in-out;
}

/* ノード状態別視覚設計（Phase 6実装済み） */

/* 通常状態 */
.node {
  @apply bg-white rounded-lg shadow-elevation-1 p-3 min-w-24 min-h-12
         border border-gray-200 text-gray-900
         transition-all duration-200 ease-in-out;
}

/* 選択モード（Ctrl+Click、複数選択時） */
.node-selected {
  background-color: #17a2b8;  /* 水色 */
  border-color: #138496;      /* 濃い水色 */
  color: #ffffff;             /* 白テキスト */
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-lg */
}

/* 編集モード（1クリック編集時） */
.node-editing {
  background-color: #007bff;  /* 青色 */
  border-color: #0056b3;      /* 濃い青 */
  color: #ffffff;             /* 白テキスト */
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); /* shadow-xl */
}

/* 状態遷移と操作方法 */
/* 
通常状態 → 編集モード: 1クリック（即座にテキスト編集開始）
通常状態 → 選択モード: Ctrl+クリック（複数選択可能）
編集モード → 通常状態: Enter/Ctrl+Enter（保存）、Esc（キャンセル）、外クリック（自動保存）
選択モード → 通常状態: 空白クリック、Esc

優先度: 編集モード > 選択モード > 通常状態
複数ノード選択時の編集: 編集モードが個別に優先される
*/
```

### Input Fields
```css
/* Text Input */
.input {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md shadow-elevation-1
         bg-white text-gray-900 placeholder-gray-500
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
         disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed
         transition-all duration-200 ease-in-out;
}

/* Search Input */
.input-search {
  @apply w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-elevation-1
         bg-white text-gray-900 placeholder-gray-500
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
         transition-all duration-200 ease-in-out;
}
```

### Panels & Modals
```css
/* Side Panel */
.panel {
  @apply bg-white border-l border-gray-200 shadow-elevation-3
         flex flex-col h-full w-80
         transition-all duration-300 ease-in-out;
}

/* Modal */
.modal {
  @apply bg-white rounded-2xl shadow-elevation-5 p-6
         max-w-md mx-auto
         transform transition-all duration-300 ease-in-out;
}

/* Modal Backdrop */
.modal-backdrop {
  @apply fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm
         flex items-center justify-center p-4
         transition-all duration-300 ease-in-out;
}
```

## 🎯 アクセシビリティ配慮

### Color Contrast
```css
/* WCAG AA準拠のコントラスト比 (4.5:1以上) */

/* Text on Background */
.text-primary { @apply text-gray-900; }      /* Contrast: 21:1 */
.text-secondary { @apply text-gray-600; }    /* Contrast: 7:1 */
.text-tertiary { @apply text-gray-500; }     /* Contrast: 5.9:1 */

/* Interactive Elements */
.link { @apply text-blue-600 hover:text-blue-700 underline; }
.link-subtle { @apply text-blue-600 hover:text-blue-700 hover:underline; }
```

### Focus Management
```css
/* Focus Ring System */
.focus-ring {
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}

.focus-ring-inset {
  @apply focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset;
}

/* Skip to Content */
.skip-link {
  @apply sr-only focus:not-sr-only
         bg-blue-600 text-white px-4 py-2 rounded-md
         absolute top-4 left-4 z-50;
}
```

### Screen Reader Support
```css
/* Screen Reader Only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.sr-only.focus:not-sr-only {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### Motion & Animation
```css
/* Reduced Motion Support */
@media (prefers-reduced-motion: reduce) {
  .motion-safe {
    transition: none !important;
    animation: none !important;
  }
}

/* Smooth Transitions */
.transition-smooth {
  @apply transition-all duration-200 ease-in-out;
}

.transition-slow {
  @apply transition-all duration-300 ease-in-out;
}
```

## 📱 レスポンシブデザイン

### Breakpoints (Tailwind Default)
```css
/* Mobile First Approach */
sm: 640px    /* Small screens */
md: 768px    /* Medium screens */
lg: 1024px   /* Large screens */
xl: 1280px   /* Extra large screens */
2xl: 1536px  /* 2X large screens */
```

### Layout Patterns
```css
/* Container */
.container-responsive {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

/* Grid Systems */
.grid-responsive {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

/* Canvas Responsive */
.canvas-container {
  @apply w-full h-screen relative overflow-hidden
         bg-gray-50;
}
```

## 🎨 Dark Mode Support

### Dark Color Palette
```css
/* Dark Theme Colors */
.dark {
  --color-bg-primary: #000000;      /* bg-black */
  --color-bg-secondary: #1f2937;    /* bg-gray-800 */
  --color-bg-tertiary: #374151;     /* bg-gray-700 */
  
  --color-text-primary: #ffffff;    /* text-white */
  --color-text-secondary: #d1d5db;  /* text-gray-300 */
  --color-text-tertiary: #9ca3af;   /* text-gray-400 */
  
  --color-border: #4b5563;          /* border-gray-600 */
}

/* Dark Mode Classes */
.bg-primary { @apply bg-white dark:bg-gray-900; }
.bg-secondary { @apply bg-gray-50 dark:bg-gray-800; }
.text-primary { @apply text-gray-900 dark:text-white; }
.text-secondary { @apply text-gray-600 dark:text-gray-300; }
.border-primary { @apply border-gray-200 dark:border-gray-700; }
```

## 📋 Implementation Guidelines

### CSS Custom Properties Usage
```css
/* CSS Variables for Dynamic Theming */
:root {
  --color-brand-primary: theme('colors.blue.600');
  --color-brand-secondary: theme('colors.gray.600');
  --radius-default: theme('borderRadius.lg');
  --shadow-default: theme('boxShadow.md');
}
```

### Component Structure
```jsx
// React Component Example
const Button = ({ variant = 'primary', size = 'md', children, ...props }) => {
  const baseClasses = 'font-medium rounded-lg shadow-elevation-1 transition-smooth focus-ring';
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger'
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
};
```

---

## 🎯 Design Tokens Summary

このデザインシステムは、Appleの洗練されたデザイン哲学を基に、Mindmapifyの創造的で直感的な体験を実現するために策定されました。一貫性のあるビジュアル言語を通じて、ユーザーが思考に集中できる環境を提供します。

### Key Principles
1. **Clarity**: 明確で理解しやすいインターフェース
2. **Consistency**: 一貫したデザインパターン
3. **Accessibility**: すべてのユーザーにとって使いやすい設計
4. **Performance**: レスポンシブで軽快な操作感

このルールに従うことで、プロフェッショナルで美しく、実用的なマインドマップツールを実現できます。

## 📋 実装チェックリスト

### ✅ 必須項目（アクセシビリティ）

- [ ] **コントラスト4.5:1以上** - `text-gray-900`, `text-gray-600`, `text-blue-600`使用
- [ ] **44pxタッチターゲット** - ボタン`h-11 w-11`、アイコン`w-10 h-10`+ padding
- [ ] **キーボードナビゲーション** - Tab移動、Enter/Space操作、Escape閉じる
- [ ] **フォーカス表示** - `focus:ring-2 focus:ring-blue-500`使用
- [ ] **aria属性** - `aria-label`, `aria-expanded`, `role`適切に設定

### ✅ 必須項目（デザイン）

- [ ] **8pxグリッド** - 全余白・間隔は4の倍数（`p-4`, `m-6`, `gap-4`）
- [ ] **角丸一貫性** - ボタン`rounded-lg`、カード`rounded-xl`、入力`rounded-md`
- [ ] **影システム** - インタラクティブ要素に`shadow-elevation-1`、ホバー時`elevation-2`
- [ ] **スムーズトランジション** - `transition-all duration-200 ease-in-out`
- [ ] **真っ黒禁止** - `text-gray-900`使用、`#000000`禁止
- [ ] **ボタンフォント** - `font-medium`以上

### 🎯 Mindmapify固有

- [ ] **キャンバス** - `bg-gray-50`背景、ズーム時視認性維持
- [ ] **ノード** - `min-w-24 min-h-12`、選択時`border-blue-500 shadow-elevation-3`
- [ ] **接続線** - 通常`stroke-gray-500(2px)`、選択時`stroke-blue-500(3px)`
- [ ] **ツールバー** - `bg-white shadow-elevation-2`、アイコン`w-10 h-10 rounded-lg`

### ⚠️ 注意点

- [ ] **同色系回避** - 青背景+青ボタン❌、背景とアクション要素の色相分離
- [ ] **薄色背景制限** - `-50`系は大領域のみ、カード内❌
- [ ] **色盲配慮** - 色のみ依存禁止、アイコン・テキスト補完必須

## ⛔ 禁止事項

### 🚫 絶対回避
- [ ] **コントラスト不足** - `text-gray-400` on white (4.1:1)❌
- [ ] **小タッチターゲット** - 44px未満❌
- [ ] **影なしボタン** - インタラクティブ要素に影必須
- [ ] **キーボード操作不可** - Tab移動、フォーカス不可❌
- [ ] **点滅効果** - 3秒間に3回以上❌

### ⚠️ 制限使用
- [ ] **薄色背景** - `-50`,`-100`系は目的明確時のみ
- [ ] **アニメーション** - 200ms以下、`prefers-reduced-motion`対応
- [ ] **装飾要素** - 機能直結のみ、グラデーション禁止

## 🚨 品質保証

- [ ] **ブラウザ確認** - Chrome, Firefox, Safari, Edge
- [ ] **デバイス確認** - デスクトップ〜モバイル (320px-1920px+)
- [ ] **アクセシビリティ** - Lighthouse Score 90+、WAVE/axe検証
- [ ] **パフォーマンス** - FCP < 1.5s、LCP < 2.5s、CLS < 0.1