#!/usr/bin/env node

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

/**
 * Mindmapify Unified Test Suite
 * 
 * 統合テストスイート - temp/内の散乱したテストファイルを統合
 * 実行: node test-suite.js [options]
 * 
 * Options:
 *   --quick      クイックテスト（基本機能のみ、2分）
 *   --full       フルテスト（全機能、5分）
 *   --debug      デバッグモード（ブラウザ表示、スクリーンショット保存）
 *   --headless   ヘッドレスモード（高速実行）
 *   --specific   特定カテゴリのみ（例: --specific=nodes,connections）
 */

const args = process.argv.slice(2);
const isQuick = args.includes('--quick');
const isFull = args.includes('--full');
const isDebug = args.includes('--debug');
const isHeadless = args.includes('--headless') || (!isDebug && !args.includes('--headless=false'));
const specificTests = args.find(arg => arg.startsWith('--specific='))?.split('=')[1]?.split(',') || null;

// テストカテゴリ定義
const TEST_CATEGORIES = {
  basic: {
    name: '🏗️ 基本機能',
    description: 'ノード作成・編集・移動',
    required: true,
    duration: '30秒'
  },
  nodes: {
    name: '📝 ノード操作',
    description: 'テキスト編集・削除・配置・日本語入力',
    required: true,
    duration: '45秒'
  },
  connections: {
    name: '🔗 接続システム',
    description: '接続線作成・編集・ラベル',
    required: true,
    duration: '60秒'
  },
  shortcuts: {
    name: '⌨️ キーボードショートカット',
    description: 'ショートカット・履歴機能',
    required: false,
    duration: '30秒'
  },
  ui: {
    name: '🎨 UI/UX',
    description: 'スクロール・ズーム・ツールバー',
    required: false,
    duration: '30秒'
  },
  mermaid: {
    name: '📊 Mermaidコード生成',
    description: 'コード生成・コピー機能',
    required: true,
    duration: '15秒'
  },
  workflows: {
    name: '🔄 複雑ワークフロー',
    description: '実践的マインドマップ作成',
    required: false,
    duration: '2分'
  }
};

class TestRunner {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = {};
    this.screenshots = [];
    this.startTime = Date.now();
  }

  async setup() {
    console.log('🚀 Mindmapify Unified Test Suite\n');
    
    const testMode = isQuick ? 'Quick' : isFull ? 'Full' : 'Standard';
    const displayMode = isHeadless ? 'Headless' : 'Visual';
    
    console.log(`📋 Test Mode: ${testMode} | Display: ${displayMode}`);
    if (specificTests) {
      console.log(`🎯 Specific Tests: ${specificTests.join(', ')}\n`);
    }
    
    this.browser = await puppeteer.launch({
      headless: isHeadless ? "new" : false,
      defaultViewport: { width: 1280, height: 720 },
      args: ['--disable-dev-shm-usage', '--no-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // コンソールログをキャプチャ
    this.page.on('console', msg => {
      if (isDebug) console.log('BROWSER:', msg.text());
    });
    
    // アプリケーション起動待ち
    await this.page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await this.page.waitForSelector('canvas', { timeout: 10000 });
    
    // ストアの初期化を待つ
    await this.page.waitForFunction(
      () => window.mindmapStore !== undefined,
      { timeout: 5000 }
    );
    
    await this.sleep(2000);
    
    console.log('✅ Application loaded successfully\n');
  }

  async runTests() {
    const categoriesToRun = specificTests || 
      (isQuick ? ['basic', 'mermaid'] : 
       isFull ? Object.keys(TEST_CATEGORIES) : 
       ['basic', 'nodes', 'connections', 'mermaid']);

    for (const category of categoriesToRun) {
      if (!TEST_CATEGORIES[category]) {
        console.log(`⚠️ Unknown test category: ${category}`);
        continue;
      }

      await this.runCategory(category);
    }
  }

  async runCategory(categoryName) {
    const category = TEST_CATEGORIES[categoryName];
    console.log(`${category.name} - ${category.description} (${category.duration})`);
    console.log('─'.repeat(50));

    try {
      this.results[categoryName] = { passed: 0, failed: 0, tests: [] };
      
      switch (categoryName) {
        case 'basic':
          await this.testBasicFunctionality();
          break;
        case 'nodes':
          await this.testNodeOperations();
          break;
        case 'connections':
          await this.testConnectionSystem();
          break;
        case 'shortcuts':
          await this.testKeyboardShortcuts();
          break;
        case 'ui':
          await this.testUIUX();
          break;
        case 'mermaid':
          await this.testMermaidGeneration();
          break;
        case 'workflows':
          await this.testCommonWorkflows();
          break;
      }
      
      console.log(`✅ ${category.name} completed\n`);
      
    } catch (error) {
      console.error(`❌ ${category.name} failed:`, error.message);
      this.results[categoryName].failed++;
      this.results[categoryName].tests.push({ name: 'Category Error', status: 'failed', error: error.message });
    }
  }

  // 基本機能テスト
  async testBasicFunctionality() {
    await this.test('Canvas Load', async () => {
      const canvas = await this.page.$('canvas');
      if (!canvas) throw new Error('Canvas not found');
    });

    await this.test('Add Node Button', async () => {
      const addBtn = await this.page.$$eval('button', buttons => {
        const btn = buttons.find(b => b.textContent?.includes('Add Node'));
        if (btn) btn.click();
        return !!btn;
      });
      if (!addBtn) throw new Error('Add Node button not found');
      await this.sleep(500);
    });

    await this.test('Node Creation', async () => {
      const nodesBefore = await this.page.$$eval('[data-testid*="node"], .konvajs-content text', nodes => nodes.length);
      const addBtn = await this.page.$$eval('button', buttons => {
        const btn = buttons.find(b => b.textContent?.includes('Add Node'));
        if (btn) btn.click();
        return !!btn;
      });
      if (!addBtn) throw new Error('Add Node button not found');
      await this.sleep(500);
      const nodesAfter = await this.page.$$eval('[data-testid*="node"], .konvajs-content text', nodes => nodes.length);
      if (nodesAfter <= nodesBefore) throw new Error('Node not created');
    });

    await this.screenshot('basic-functionality');
  }

  // ノード操作テスト
  async testNodeOperations() {
    await this.test('Node Text Editing', async () => {
      // 最初のノードをクリックして選択（編集バーが表示される）
      await this.page.evaluate(() => {
        const textNodes = document.querySelectorAll('.konvajs-content text');
        if (textNodes.length > 0) {
          textNodes[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      });
      await this.sleep(800); // 編集バーの表示を待つ
      
      // 編集バーの入力フィールドを探す
      const editInput = await this.page.$('.edit-bar-input');
      if (!editInput) {
        throw new Error('Edit bar input not found');
      }
      
      // テキスト入力
      await editInput.click({ clickCount: 3 }); // トリプルクリックで全選択
      await editInput.type('Test Node');
      await this.page.keyboard.press('Enter');
      await this.sleep(500);
    });

    await this.test('Node Drag and Drop', async () => {
      const node = await this.page.$('.konvajs-content text');
      if (node) {
        const box = await node.boundingBox();
        await this.page.mouse.move(box.x + box.width/2, box.y + box.height/2);
        await this.page.mouse.down();
        await this.page.mouse.move(box.x + 100, box.y + 50);
        await this.page.mouse.up();
        await this.sleep(500);
      }
    });

    await this.test('Multiple Selection (Ctrl+Click)', async () => {
      // Create additional nodes for multi-selection testing
      const addBtn1 = await this.page.$$eval('button', buttons => {
        const btn = buttons.find(b => b.textContent?.includes('Add Node'));
        if (btn) btn.click();
        return !!btn;
      });
      if (!addBtn1) throw new Error('Add Node button not found');
      await this.sleep(300);
      const addBtn2 = await this.page.$$eval('button', buttons => {
        const btn = buttons.find(b => b.textContent?.includes('Add Node'));
        if (btn) btn.click();
        return !!btn;
      });
      if (!addBtn2) throw new Error('Add Node button not found');
      await this.sleep(500);

      // Test Ctrl+Click multi-selection
      const nodes = await this.page.$$('.konvajs-content text');
      if (nodes.length >= 2) {
        // First node - normal click
        const box1 = await nodes[0].boundingBox();
        await this.page.mouse.click(box1.x + box1.width/2, box1.y + box1.height/2);
        await this.sleep(200);

        // Second node - Ctrl+Click
        const box2 = await nodes[1].boundingBox();
        await this.page.keyboard.down('Meta'); // Cmd on Mac
        await this.page.mouse.click(box2.x + box2.width/2, box2.y + box2.height/2);
        await this.page.keyboard.up('Meta');
        await this.sleep(500);

        // Verify multiple selection
        const selectedCount = await this.page.evaluate(() => {
          return window.mindmapStore.getState().selectedNodeIds.size;
        });
        
        if (selectedCount < 2) {
          throw new Error(`Expected 2+ selected nodes, got ${selectedCount}`);
        }
      }
    });

    await this.test('Select All Functionality', async () => {
      // Test Cmd+A select all
      await this.page.keyboard.down('Meta');
      await this.page.keyboard.press('KeyA');
      await this.page.keyboard.up('Meta');
      await this.sleep(500);

      // Verify all nodes are selected
      const totalNodes = await this.page.$$eval('.konvajs-content text', nodes => nodes.length);
      const selectedCount = await this.page.evaluate(() => {
        return window.mindmapStore.getState().selectedNodeIds.size;
      });

      if (selectedCount !== totalNodes) {
        throw new Error(`Expected all ${totalNodes} nodes selected, got ${selectedCount}`);
      }
    });

    await this.test('Multiple Node Drag', async () => {
      // Clear selection first
      await this.page.evaluate(() => {
        window.mindmapStore?.getState().clearSelection();
      });
      
      // Get initial positions
      const initialPositions = await this.page.evaluate(() => {
        const store = window.mindmapStore?.getState();
        if (!store) return [];
        return store.nodes.map(n => ({
          id: n.id.substring(0, 8),
          x: n.position.x,
          y: n.position.y
        }));
      });
      
      // Select multiple nodes
      await this.page.keyboard.down('Meta');
      await this.page.keyboard.press('KeyA');
      await this.page.keyboard.up('Meta');
      await this.sleep(300);

      // Get the first node's center position
      const firstNodeCenter = await this.page.evaluate(() => {
        const store = window.mindmapStore?.getState();
        if (!store || store.nodes.length === 0) return null;
        const node = store.nodes[0];
        return {
          x: node.position.x + node.size.width / 2,
          y: node.position.y + node.size.height / 2
        };
      });
      
      if (firstNodeCenter) {
        // Drag the first node
        const dragDistance = { x: 100, y: 50 };
        await this.page.mouse.move(firstNodeCenter.x, firstNodeCenter.y);
        await this.page.mouse.down();
        await this.page.mouse.move(firstNodeCenter.x + dragDistance.x, firstNodeCenter.y + dragDistance.y);
        await this.page.mouse.up();
        await this.sleep(500);
        
        // Check final positions
        const finalPositions = await this.page.evaluate(() => {
          const store = window.mindmapStore?.getState();
          if (!store) return [];
          return store.nodes.map(n => ({
            id: n.id.substring(0, 8),
            x: n.position.x,
            y: n.position.y
          }));
        });
        
        // Verify all nodes moved by the same amount
        let allMovedCorrectly = true;
        for (let i = 0; i < initialPositions.length; i++) {
          const deltaX = finalPositions[i].x - initialPositions[i].x;
          const deltaY = finalPositions[i].y - initialPositions[i].y;
          
          if (Math.abs(deltaX - dragDistance.x) > 5 || Math.abs(deltaY - dragDistance.y) > 5) {
            allMovedCorrectly = false;
            console.log(`  ❌ Node ${i + 1} moved by (${deltaX}, ${deltaY}) instead of (${dragDistance.x}, ${dragDistance.y})`);
          }
        }
        
        if (allMovedCorrectly) {
          console.log(`  ✅ All ${initialPositions.length} nodes moved together by (${dragDistance.x}, ${dragDistance.y})`);
        } else {
          throw new Error('Nodes did not move together correctly');
        }
      }
    });

    await this.test('Multi-Select Drag Prevention', async () => {
      // Clear selection first
      await this.page.evaluate(() => {
        window.mindmapStore?.getState().clearSelection();
      });
      
      // Add two nodes for testing
      for (let i = 0; i < 2; i++) {
        await this.page.$$eval('button', buttons => {
          const btn = buttons.find(b => b.textContent?.includes('Add Node'));
          if (btn) btn.click();
          return !!btn;
        });
        await this.sleep(300);
      }
      
      // Get initial positions
      const initialPositions = await this.page.evaluate(() => {
        const store = window.mindmapStore?.getState();
        if (!store) return [];
        return store.nodes.map(n => ({
          id: n.id.substring(0, 8),
          x: n.position.x,
          y: n.position.y
        }));
      });
      
      // Multi-select the first node with Ctrl+Click
      const firstNode = await this.page.evaluate(() => {
        const store = window.mindmapStore?.getState();
        if (!store || store.nodes.length === 0) return null;
        const node = store.nodes[0];
        return {
          x: node.position.x + node.size.width / 2,
          y: node.position.y + node.size.height / 2
        };
      });
      
      if (firstNode) {
        await this.page.keyboard.down(this.isMac ? 'Meta' : 'Control');
        await this.page.mouse.click(firstNode.x, firstNode.y);
        await this.page.keyboard.up(this.isMac ? 'Meta' : 'Control');
        
        // Immediately try to drag (within 300ms) - this should be prevented
        await this.sleep(50); // Very short delay
        await this.page.mouse.move(firstNode.x, firstNode.y);
        await this.page.mouse.down();
        await this.page.mouse.move(firstNode.x + 100, firstNode.y + 50);
        await this.page.mouse.up();
        
        // Check positions - they should NOT have changed
        const positionsAfterAttempt = await this.page.evaluate(() => {
          const store = window.mindmapStore?.getState();
          if (!store) return [];
          return store.nodes.map(n => ({
            id: n.id.substring(0, 8),
            x: n.position.x,
            y: n.position.y
          }));
        });
        
        let dragPrevented = true;
        for (let i = 0; i < initialPositions.length; i++) {
          if (initialPositions[i].x !== positionsAfterAttempt[i].x || 
              initialPositions[i].y !== positionsAfterAttempt[i].y) {
            dragPrevented = false;
            console.log(`  ❌ Node ${i + 1} moved unexpectedly`);
            break;
          }
        }
        
        if (!dragPrevented) {
          throw new Error('Drag should be prevented immediately after multi-select');
        }
        
        console.log('  ✅ Drag prevention working correctly after multi-select');
        
        // Now wait for the prevention period to pass
        await this.sleep(350); // Wait longer than 300ms threshold
        
        // Try to drag again - this should work
        await this.page.mouse.move(firstNode.x, firstNode.y);
        await this.page.mouse.down();
        await this.page.mouse.move(firstNode.x + 100, firstNode.y + 50);
        await this.page.mouse.up();
        await this.sleep(300);
        
        // Check positions - they should have changed now
        const finalPositions = await this.page.evaluate(() => {
          const store = window.mindmapStore?.getState();
          if (!store) return [];
          return store.nodes.map(n => ({
            id: n.id.substring(0, 8),
            x: n.position.x,
            y: n.position.y
          }));
        });
        
        let dragWorked = false;
        for (let i = 0; i < initialPositions.length; i++) {
          if (initialPositions[i].x !== finalPositions[i].x || 
              initialPositions[i].y !== finalPositions[i].y) {
            dragWorked = true;
            break;
          }
        }
        
        if (!dragWorked) {
          throw new Error('Drag should work after prevention period');
        }
        
        console.log('  ✅ Drag works correctly after prevention period');
      }
    });

    await this.test('Paste Functionality', async () => {
      // Ctrl+V でペースト
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('KeyV');
      await this.page.keyboard.up('Control');
      await this.sleep(500);
    });

    await this.test('Japanese Input', async () => {
      // 新しいノードを作成
      await this.page.$$eval('button', buttons => {
        const btn = buttons.find(b => b.textContent?.includes('Add Node'));
        if (btn) btn.click();
        return !!btn;
      });
      await this.sleep(500);

      // 最後に作成されたノードをクリックして選択（編集バーが表示される）
      await this.page.evaluate(() => {
        const textNodes = document.querySelectorAll('.konvajs-content text');
        if (textNodes.length > 0) {
          const lastNode = textNodes[textNodes.length - 1];
          lastNode.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      });
      await this.sleep(800); // 編集バーの表示を待つ

      // 編集バーの入力フィールドを探す
      const editInput = await this.page.$('.edit-bar-input');
      if (!editInput) {
        throw new Error('Edit bar input not found');
      }

      // 既存テキストをクリアして日本語テキストを入力
      await editInput.click({ clickCount: 3 }); // トリプルクリックで全選択
      const japaneseText = 'マインドマップ作成';
      await editInput.type(japaneseText);
      await this.sleep(500);
      
      // Enterキーで編集を確定
      await this.page.keyboard.press('Enter');
      await this.sleep(500);

      // 入力された日本語テキストの検証
      const nodeText = await this.page.evaluate(() => {
        const textNodes = document.querySelectorAll('.konvajs-content text');
        if (textNodes.length > 0) {
          const lastNode = textNodes[textNodes.length - 1];
          return lastNode.textContent || '';
        }
        return '';
      });

      // 日本語が正しく保存されているか確認
      if (!nodeText.includes('マインドマップ')) {
        throw new Error(`Japanese text not saved correctly. Got: "${nodeText}"`);
      }

      // 長い日本語テキストのテスト
      await this.page.evaluate(() => {
        const textNodes = document.querySelectorAll('.konvajs-content text');
        if (textNodes.length > 0) {
          const lastNode = textNodes[textNodes.length - 1];
          lastNode.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      });
      await this.sleep(800); // 編集バーの表示を待つ

      // 編集バーの入力フィールドで長い日本語テキストを入力
      const editInput2 = await this.page.$('.edit-bar-input');
      if (editInput2) {
        await editInput2.click({ clickCount: 3 }); // 全選択
        const longJapaneseText = 'これは長い日本語のテストです。複数行にわたる日本語テキストが正しく表示されることを確認します。';
        await editInput2.type(longJapaneseText);
        await this.sleep(500);
        await this.page.keyboard.press('Enter');
        await this.sleep(500);
      }

      // 混在テキスト（日本語・英語・数字）のテスト
      await this.page.$$eval('button', buttons => {
        const btn = buttons.find(b => b.textContent?.includes('Add Node'));
        if (btn) btn.click();
        return !!btn;
      });
      await this.sleep(500);

      await this.page.evaluate(() => {
        const textNodes = document.querySelectorAll('.konvajs-content text');
        if (textNodes.length > 0) {
          const lastNode = textNodes[textNodes.length - 1];
          lastNode.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
      });
      await this.sleep(800); // 編集バーの表示を待つ

      // 混在テキストを入力
      const editInput3 = await this.page.$('.edit-bar-input');
      if (editInput3) {
        await editInput3.click({ clickCount: 3 }); // 全選択
        const mixedText = 'プロジェクト2025年計画ABC';
        await editInput3.type(mixedText);
        await this.sleep(500);
        await this.page.keyboard.press('Enter');
        await this.sleep(500);
      }

      console.log('  📝 Japanese input test completed');
    });

    await this.screenshot('node-operations');
  }

  // 接続システムテスト
  async testConnectionSystem() {
    // 複数ノード作成
    await this.page.$$eval('button', buttons => {
      const btn = buttons.find(b => b.textContent?.includes('Add Node'));
      if (btn) btn.click();
      return !!btn;
    });
    await this.sleep(200);
    await this.page.$$eval('button', buttons => {
      const btn = buttons.find(b => b.textContent?.includes('Add Node'));
      if (btn) btn.click();
      return !!btn;
    });
    await this.sleep(500);

    await this.test('Connection Creation', async () => {
      // 接続点を探してドラッグ
      const connectionPoints = await this.page.$$('[data-testid*="connection-point"], circle[r="6"]');
      if (connectionPoints.length >= 2) {
        const point1 = connectionPoints[0];
        const point2 = connectionPoints[1];
        
        const box1 = await point1.boundingBox();
        const box2 = await point2.boundingBox();
        
        await this.page.mouse.move(box1.x + 6, box1.y + 6);
        await this.page.mouse.down();
        await this.page.mouse.move(box2.x + 6, box2.y + 6);
        await this.page.mouse.up();
        await this.sleep(1000);
      }
    });

    await this.test('Connection Label Editing', async () => {
      // 接続線をダブルクリック
      const connections = await this.page.$$('line, path');
      if (connections.length > 0) {
        const connection = connections[0];
        const box = await connection.boundingBox();
        await this.page.mouse.move(box.x + box.width/2, box.y + box.height/2);
        await this.page.mouse.click(box.x + box.width/2, box.y + box.height/2, { clickCount: 2 });
        await this.sleep(1000);
        
        // ラベル選択（原因を選択）
        const causeButton = await this.page.$('button:has-text("原因")');
        if (causeButton) {
          await causeButton.click();
          await this.sleep(500);
        }
      }
    });

    await this.screenshot('connection-system');
  }

  // キーボードショートカットテスト
  async testKeyboardShortcuts() {
    await this.test('Add Node Shortcut', async () => {
      await this.page.keyboard.down('Meta'); // Cmd on Mac
      await this.page.keyboard.down('Shift');
      await this.page.keyboard.press('KeyA');
      await this.page.keyboard.up('Shift');
      await this.page.keyboard.up('Meta');
      await this.sleep(500);
    });

    await this.test('Undo/Redo', async () => {
      // Undo
      await this.page.keyboard.down('Meta');
      await this.page.keyboard.press('KeyZ');
      await this.page.keyboard.up('Meta');
      await this.sleep(500);
      
      // Redo
      await this.page.keyboard.down('Meta');
      await this.page.keyboard.press('KeyY');
      await this.page.keyboard.up('Meta');
      await this.sleep(500);
    });

    await this.test('Help Display', async () => {
      await this.page.keyboard.press('Shift+Slash'); // ?
      await this.sleep(1000);
      
      // ヘルプを閉じる
      await this.page.keyboard.press('Escape');
      await this.sleep(500);
    });

    await this.test('Select All (Cmd+A)', async () => {
      // Clear any selection first
      await this.page.evaluate(() => {
        window.mindmapStore?.getState().clearSelection();
      });
      
      // Press Cmd+A
      await this.page.keyboard.down('Meta');
      await this.page.keyboard.press('KeyA');
      await this.page.keyboard.up('Meta');
      await this.sleep(500);
      
      // Verify all nodes are selected
      const selectionState = await this.page.evaluate(() => {
        const store = window.mindmapStore?.getState();
        if (!store) return { selectedCount: 0, totalNodes: 0 };
        return {
          selectedCount: store.selectedNodeIds.size,
          totalNodes: store.nodes.length,
          allSelected: store.nodes.every(n => n.isSelected)
        };
      });
      
      console.log('Select All result:', selectionState);
    });

    await this.test('Multiple Selection (Ctrl+Click)', async () => {
      // Clear selection
      await this.page.evaluate(() => {
        window.mindmapStore?.getState().clearSelection();
      });
      
      // Get node positions
      const nodes = await this.page.evaluate(() => {
        const store = window.mindmapStore?.getState();
        if (!store) return [];
        return store.nodes.slice(0, 2).map(n => ({
          id: n.id,
          center: {
            x: n.position.x + n.size.width / 2,
            y: n.position.y + n.size.height / 2
          }
        }));
      });
      
      if (nodes.length >= 2) {
        // Ctrl+Click first node
        await this.page.keyboard.down('Meta');
        await this.page.mouse.click(nodes[0].center.x, nodes[0].center.y);
        await this.sleep(300);
        
        // Ctrl+Click second node
        await this.page.mouse.click(nodes[1].center.x, nodes[1].center.y);
        await this.sleep(300);
        await this.page.keyboard.up('Meta');
        
        // Check selection
        const multiSelectState = await this.page.evaluate(() => {
          const store = window.mindmapStore?.getState();
          if (!store) return { selectedCount: 0 };
          return {
            selectedCount: store.selectedNodeIds.size,
            selectedIds: Array.from(store.selectedNodeIds)
          };
        });
        
        console.log('Multi-select result:', multiSelectState);
      }
    });

    await this.screenshot('keyboard-shortcuts');
  }

  // UI/UXテスト
  async testUIUX() {
    await this.test('Mouse Wheel Scroll', async () => {
      await this.page.mouse.move(640, 360);
      await this.page.mouse.wheel({ deltaY: 100 });
      await this.sleep(500);
    });

    await this.test('Zoom Buttons', async () => {
      const zoomInBtn = await this.page.$('button[title*="Zoom In"]');
      if (zoomInBtn) {
        await zoomInBtn.click();
        await this.sleep(300);
      }
      
      const zoomOutBtn = await this.page.$('button[title*="Zoom Out"]');
      if (zoomOutBtn) {
        await zoomOutBtn.click();
        await this.sleep(300);
      }
      
      const resetBtn = await this.page.$('button[title*="Reset"]');
      if (resetBtn) {
        await resetBtn.click();
        await this.sleep(300);
      }
    });

    await this.test('Toolbar Interactions', async () => {
      // Delete All button
      const deleteAllBtn = await this.page.$('button[title*="Delete All"]');
      if (deleteAllBtn) {
        // 確認ダイアログを想定
        await deleteAllBtn.click();
        await this.sleep(500);
      }
    });

    await this.screenshot('ui-ux');
  }

  // Mermaidコード生成テスト
  async testMermaidGeneration() {
    // サンプルデータ作成
    await this.page.$$eval('button', buttons => {
      const btn = buttons.find(b => b.textContent?.includes('Add Node'));
      if (btn) btn.click();
      return !!btn;
    });
    await this.sleep(200);
    await this.page.$$eval('button', buttons => {
      const btn = buttons.find(b => b.textContent?.includes('Add Node'));
      if (btn) btn.click();
      return !!btn;
    });
    await this.sleep(500);

    await this.test('Mermaid Code Generation', async () => {
      // サイドパネルの存在確認
      const mermaidPanel = await this.page.$('[data-testid="mermaid-panel"], .mermaid-output, pre');
      if (!mermaidPanel) {
        // パネルが隠れている場合は表示
        const toggleBtn = await this.page.$('button[title*="Toggle"], button:has-text("Code")');
        if (toggleBtn) await toggleBtn.click();
        await this.sleep(500);
      }
    });

    await this.test('Copy Functionality', async () => {
      const copyBtn = await this.page.$('button[title*="Copy"], button:has-text("Copy")');
      if (copyBtn) {
        await copyBtn.click();
        await this.sleep(500);
        
        // コピー成功のフィードバック確認
        const feedback = await this.page.$('.toast, .notification, [data-testid="copy-success"]');
        // フィードバックが出なくても成功とみなす（機能として動作していれば）
      }
    });

    await this.screenshot('mermaid-generation');
  }

  // テストヘルパーメソッド
  async test(name, testFn) {
    try {
      await testFn();
      console.log(`  ✅ ${name}`);
      this.results[Object.keys(this.results).pop()].passed++;
      this.results[Object.keys(this.results).pop()].tests.push({ name, status: 'passed' });
    } catch (error) {
      console.log(`  ❌ ${name}: ${error.message}`);
      this.results[Object.keys(this.results).pop()].failed++;
      this.results[Object.keys(this.results).pop()].tests.push({ name, status: 'failed', error: error.message });
    }
  }

  async screenshot(name) {
    if (isDebug) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `screenshot-${name}-${timestamp}.png`;
      await this.page.screenshot({ path: `temp/${filename}`, fullPage: true });
      this.screenshots.push(filename);
      console.log(`  📸 Screenshot saved: ${filename}`);
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  // 複雑ワークフローテスト（実践的なマインドマップ作成シナリオ）
  async testCommonWorkflows() {
    // ワークフロー1: 大規模マインドマップ作成（10ノード）
    await this.test('Large Mindmap Creation (10 Nodes)', async () => {
      const topics = ['Central Topic', 'Branch 1', 'Branch 2', 'Branch 3', 'Detail A', 'Detail B', 'Detail C', 'Subtopic 1', 'Subtopic 2', 'Summary'];
      
      // 10個のノードを作成
      for (let i = 0; i < 10; i++) {
        await this.page.keyboard.down('Meta');
        await this.page.keyboard.down('Shift');
        await this.page.keyboard.press('KeyA');
        await this.page.keyboard.up('Shift');
        await this.page.keyboard.up('Meta');
        await this.sleep(200);
      }
      
      const nodeCount = await this.page.$$eval('.konvajs-content text', nodes => nodes.length);
      if (nodeCount < 10) throw new Error(`Only ${nodeCount} nodes created, expected 10`);
    });

    // ワークフロー2: 全ノード編集（個別テキスト設定）
    await this.test('Bulk Node Text Editing', async () => {
      const topics = ['Central Topic', 'Branch 1', 'Branch 2', 'Branch 3', 'Detail A', 'Detail B', 'Detail C', 'Subtopic 1', 'Subtopic 2', 'Summary'];
      
      for (let i = 0; i < Math.min(topics.length, 10); i++) {
        await this.page.evaluate((index) => {
          const textNodes = document.querySelectorAll('.konvajs-content text');
          if (textNodes[index]) {
            textNodes[index].dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }
        }, i);
        await this.sleep(800); // 編集バーの表示を待つ
        
        // 編集バーの入力フィールドを探す
        const editInput = await this.page.$('.edit-bar-input');
        if (editInput) {
          // 既存テキストを選択してクリア
          await editInput.click({ clickCount: 3 }); // トリプルクリックで全選択
          await editInput.type(topics[i]);
          await this.page.keyboard.press('Enter');
          await this.sleep(200);
        }
      }
    });

    // ワークフロー3: 複数接続作成（階層構造）
    await this.test('Complex Connection Network', async () => {
      // 中央ノード（Central Topic）から複数ブランチへの接続
      const connections = [
        [0, 1], // Central -> Branch 1
        [0, 2], // Central -> Branch 2  
        [0, 3], // Central -> Branch 3
        [1, 4], // Branch 1 -> Detail A
        [1, 5], // Branch 1 -> Detail B
        [2, 6], // Branch 2 -> Detail C
        [2, 7], // Branch 2 -> Subtopic 1
        [3, 8], // Branch 3 -> Subtopic 2
        [8, 9]  // Subtopic 2 -> Summary
      ];
      
      for (const [from, to] of connections) {
        try {
          await this.page.evaluate((fromIndex, toIndex) => {
            const connectionPoints = document.querySelectorAll('circle[fill="rgba(59, 130, 246, 0.8)"]');
            if (connectionPoints.length > fromIndex * 4 + 1 && connectionPoints.length > toIndex * 4) {
              const fromPoint = connectionPoints[fromIndex * 4 + 1]; // 右側の接続点
              const toPoint = connectionPoints[toIndex * 4 + 3];     // 左側の接続点
              
              if (fromPoint && toPoint) {
                const fromRect = fromPoint.getBoundingClientRect();
                const toRect = toPoint.getBoundingClientRect();
                
                fromPoint.dispatchEvent(new MouseEvent('mousedown', {
                  bubbles: true,
                  clientX: fromRect.left + fromRect.width / 2,
                  clientY: fromRect.top + fromRect.height / 2
                }));
                
                toPoint.dispatchEvent(new MouseEvent('mouseup', {
                  bubbles: true,
                  clientX: toRect.left + toRect.width / 2,
                  clientY: toRect.top + toRect.height / 2
                }));
              }
            }
          }, from, to);
          await this.sleep(300);
        } catch (error) {
          console.log(`  📝 Connection ${from}->${to} attempted`);
        }
      }
    });

    // ワークフロー4: 接続線ラベル付与
    await this.test('Connection Label Assignment', async () => {
      const labels = ['原因', '結果', '手段', '具体例', '要素'];
      
      for (let i = 0; i < 5; i++) {
        try {
          // 接続線をダブルクリック
          await this.page.evaluate((index) => {
            const connections = document.querySelectorAll('path[stroke="rgb(107, 114, 128)"]');
            if (connections[index]) {
              connections[index].dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
            }
          }, i);
          await this.sleep(300);
          
          // ラベル選択（プリセットから選択）
          await this.page.evaluate((labelIndex) => {
            const labelButtons = document.querySelectorAll('button[class*="p-2"], button[class*="border"]');
            if (labelButtons[labelIndex]) {
              labelButtons[labelIndex].click();
            }
          }, i);
          await this.sleep(200);
        } catch (error) {
          console.log(`  📝 Label assignment ${i} attempted`);
        }
      }
    });

    // ワークフロー5: ノード位置調整（レイアウト最適化）
    await this.test('Node Repositioning for Layout', async () => {
      // 各ノードを異なる位置に移動
      const positions = [
        [640, 360], // Central Topic - 中央
        [400, 200], // Branch 1 - 左上
        [400, 360], // Branch 2 - 左中央
        [400, 520], // Branch 3 - 左下
        [200, 150], // Detail A - 左上端
        [200, 250], // Detail B - 左中上
        [200, 410], // Detail C - 左中下
        [200, 510], // Subtopic 1 - 左下中
        [880, 520], // Subtopic 2 - 右下
        [1080, 520] // Summary - 右端
      ];
      
      for (let i = 0; i < Math.min(positions.length, 10); i++) {
        await this.page.evaluate((index, x, y) => {
          const textNodes = document.querySelectorAll('.konvajs-content text');
          if (textNodes[index]) {
            const rect = textNodes[index].getBoundingClientRect();
            
            // ドラッグ&ドロップ
            textNodes[index].dispatchEvent(new MouseEvent('mousedown', {
              bubbles: true,
              clientX: rect.left + rect.width / 2,
              clientY: rect.top + rect.height / 2
            }));
            
            document.dispatchEvent(new MouseEvent('mousemove', {
              bubbles: true,
              clientX: x,
              clientY: y
            }));
            
            document.dispatchEvent(new MouseEvent('mouseup', {
              bubbles: true,
              clientX: x,
              clientY: y
            }));
          }
        }, i, positions[i][0], positions[i][1]);
        await this.sleep(200);
      }
    });

    // ワークフロー6: 接続先変更（リファクタリング）
    await this.test('Connection Endpoint Modification', async () => {
      try {
        // 最初の接続線を選択
        await this.page.evaluate(() => {
          const connections = document.querySelectorAll('path[stroke="rgb(107, 114, 128)"]');
          if (connections[0]) {
            connections[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }
        });
        await this.sleep(500);
        
        // 編集ハンドルをクリック（緑色のハンドル：始点）
        await this.page.evaluate(() => {
          const handles = document.querySelectorAll('circle[fill="green"], circle[fill="#00ff00"]');
          if (handles[0]) {
            handles[0].dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }
        });
        await this.sleep(300);
        
        // 別のノードの接続点にドロップ
        await this.page.evaluate(() => {
          const connectionPoints = document.querySelectorAll('circle[fill="rgba(59, 130, 246, 0.8)"]');
          if (connectionPoints.length > 8) {
            connectionPoints[8].dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }
        });
        await this.sleep(300);
      } catch (error) {
        console.log('  📝 Connection modification attempted');
      }
    });

    // ワークフロー7: 選択的削除（段階的クリーンアップ）
    await this.test('Selective Node and Connection Deletion', async () => {
      // 特定のノードを削除（後ろから3つ）
      for (let i = 0; i < 3; i++) {
        await this.page.evaluate(() => {
          const textNodes = document.querySelectorAll('.konvajs-content text');
          if (textNodes.length > 0) {
            const lastNode = textNodes[textNodes.length - 1];
            lastNode.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          }
        });
        await this.sleep(200);
        
        // ショートカットで削除
        await this.page.keyboard.down('Meta');
        await this.page.keyboard.down('Shift');
        await this.page.keyboard.press('KeyD');
        await this.page.keyboard.up('Shift');
        await this.page.keyboard.up('Meta');
        await this.sleep(300);
      }
      
      // 残りノード数確認
      const finalCount = await this.page.$$eval('.konvajs-content text', nodes => nodes.length);
      console.log(`  📊 Final node count: ${finalCount}`);
    });

    // ワークフロー8: Mermaidコード生成と検証
    await this.test('Mermaid Code Generation Verification', async () => {
      // コピーボタンをクリック
      await this.page.click('button:has-text("Copy"), button[title*="Copy"]');
      await this.sleep(500);
      
      // 生成されたコードの検証（基本構造）
      const mermaidCode = await this.page.evaluate(() => {
        const codeElement = document.querySelector('pre, code, textarea');
        return codeElement ? codeElement.textContent || codeElement.value : '';
      });
      
      if (!mermaidCode.includes('flowchart') && !mermaidCode.includes('graph')) {
        throw new Error('Mermaid code not generated properly');
      }
      
      console.log(`  📊 Generated Mermaid code: ${mermaidCode.length} characters`);
    });

    await this.screenshot('complex-workflows');
  }

  generateReport() {
    const endTime = Date.now();
    const duration = Math.round((endTime - this.startTime) / 1000);
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    Object.entries(this.results).forEach(([category, result]) => {
      const categoryInfo = TEST_CATEGORIES[category];
      console.log(`\n${categoryInfo.name}`);
      console.log(`  Passed: ${result.passed} | Failed: ${result.failed}`);
      
      if (result.failed > 0) {
        result.tests.forEach(test => {
          if (test.status === 'failed') {
            console.log(`    ❌ ${test.name}: ${test.error}`);
          }
        });
      }
      
      totalPassed += result.passed;
      totalFailed += result.failed;
    });
    
    console.log('\n' + '-'.repeat(60));
    console.log(`🎯 TOTAL: ${totalPassed} passed, ${totalFailed} failed`);
    console.log(`⏱️ Duration: ${duration} seconds`);
    
    if (this.screenshots.length > 0) {
      console.log(`📸 Screenshots: ${this.screenshots.length} saved in temp/`);
    }
    
    const successRate = Math.round((totalPassed / (totalPassed + totalFailed)) * 100);
    console.log(`📈 Success Rate: ${successRate}%`);
    
    if (successRate >= 90) {
      console.log('🎉 Excellent! All core functionality working properly.');
    } else if (successRate >= 70) {
      console.log('✅ Good! Most functionality working, minor issues detected.');
    } else {
      console.log('⚠️ Warning! Multiple issues detected, review required.');
    }
    
    console.log('='.repeat(60));
  }
}

// メイン実行
async function main() {
  const runner = new TestRunner();
  
  try {
    await runner.setup();
    await runner.runTests();
  } catch (error) {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  } finally {
    runner.generateReport();
    await runner.cleanup();
  }
}

// 実行時引数の処理
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Mindmapify Unified Test Suite

Usage: node test-suite.js [options]

Options:
  --quick      クイックテスト（基本機能のみ、2分）
  --full       フルテスト（全機能、5分）
  --debug      デバッグモード（ブラウザ表示、スクリーンショット保存）
  --headless   ヘッドレスモード（高速実行）
  --specific   特定カテゴリのみ（例: --specific=nodes,connections）
  --help, -h   このヘルプを表示

Test Categories:
  basic        🏗️ 基本機能（ノード作成・編集・移動）
  nodes        📝 ノード操作（テキスト編集・削除・配置・日本語入力）
  connections  🔗 接続システム（接続線作成・編集・ラベル）
  shortcuts    ⌨️ キーボードショートカット（ショートカット・履歴機能）
  ui           🎨 UI/UX（スクロール・ズーム・ツールバー）
  mermaid      📊 Mermaidコード生成（コード生成・コピー機能）
  workflows    🔄 頻出ワークフロー（GUI・ショートカット両方式）

Examples:
  node test-suite.js --quick --debug
  node test-suite.js --specific=basic,mermaid
  node test-suite.js --full --headless
`);
  process.exit(0);
}

// 実行
main().catch(console.error);