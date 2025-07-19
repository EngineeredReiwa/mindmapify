#!/usr/bin/env node

/**
 * ドラッグ移動問題のデバッグテスト
 */

import puppeteer from 'puppeteer';

async function dragDebugTest() {
  console.log('🔍 ドラッグ移動問題のデバッグテスト開始...\n');
  
  const browser = await puppeteer.launch({ 
    headless: "new", // バックグラウンド実行（ブラウザ非表示）
    devtools: true,   // 開発者ツールを開く
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🌐 Loading application...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    
    // 初期状態のスクリーンショット
    await page.screenshot({ path: 'debug-step1-initial.png' });
    console.log('📸 Step 1: Initial state screenshot saved');
    
    // New Nodeボタンをクリック
    console.log('🖱️ Step 2: Creating new node...');
    const newNodeBtn = await page.$('.toolbar-btn.primary');
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // ノード作成後のスクリーンショット
    await page.screenshot({ path: 'debug-step2-node-created.png' });
    console.log('📸 Step 2: Node created screenshot saved');
    
    // キャンバス状態を確認
    const canvasInfo = await page.evaluate(() => {
      const stage = document.querySelector('canvas')?._konvajs;
      return {
        stageExists: !!stage,
        stagePosition: stage ? { x: stage.x(), y: stage.y() } : null,
        stageScale: stage ? { x: stage.scaleX(), y: stage.scaleY() } : null,
      };
    });
    console.log('📊 Canvas state:', canvasInfo);
    
    // ノードの位置を確認
    const nodeInfo = await page.evaluate(() => {
      const nodeElements = document.querySelectorAll('.konvajs-content');
      const nodes = [];
      
      // Konvaのノード情報を取得
      if (window.Konva) {
        const stage = window.Konva.stages[0];
        if (stage) {
          const layer = stage.children[0];
          if (layer) {
            layer.children.forEach((group, index) => {
              if (group.className === 'Group') {
                nodes.push({
                  index,
                  position: { x: group.x(), y: group.y() },
                  draggable: group.draggable(),
                });
              }
            });
          }
        }
      }
      
      return {
        nodeCount: nodeElements.length,
        konvaNodes: nodes,
      };
    });
    console.log('📊 Node info before drag:', nodeInfo);
    
    // ドラッグテストの準備
    console.log('🖱️ Step 3: Testing drag behavior...');
    
    // キャンバス要素を取得
    const canvas = await page.$('canvas');
    const canvasBox = await canvas.boundingBox();
    
    console.log('📐 Canvas bounding box:', canvasBox);
    
    // ノードの中央位置を計算（推定）
    const nodeX = canvasBox.x + 300; // ノードは中央付近に作成される
    const nodeY = canvasBox.y + 200;
    
    console.log(`📍 Estimated node position: (${nodeX}, ${nodeY})`);
    
    // ドラッグ前の状態を記録
    await page.screenshot({ path: 'debug-step3-before-drag.png' });
    
    // マウスをノード位置に移動
    await page.mouse.move(nodeX, nodeY);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('🖱️ Mouse moved to node position');
    
    // ドラッグ開始
    await page.mouse.down();
    console.log('🖱️ Mouse down (drag start)');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 50px右に移動
    const targetX = nodeX + 50;
    const targetY = nodeY;
    
    console.log(`📍 Dragging to: (${targetX}, ${targetY})`);
    await page.mouse.move(targetX, targetY);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // ドラッグ中のスクリーンショット
    await page.screenshot({ path: 'debug-step3-during-drag.png' });
    console.log('📸 Step 3: During drag screenshot saved');
    
    // ドラッグ終了
    await page.mouse.up();
    console.log('🖱️ Mouse up (drag end)');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // ドラッグ後の状態を記録
    await page.screenshot({ path: 'debug-step3-after-drag.png' });
    console.log('📸 Step 3: After drag screenshot saved');
    
    // ドラッグ後のノード位置を確認
    const nodeInfoAfter = await page.evaluate(() => {
      const nodes = [];
      
      if (window.Konva) {
        const stage = window.Konva.stages[0];
        if (stage) {
          const layer = stage.children[0];
          if (layer) {
            layer.children.forEach((group, index) => {
              if (group.className === 'Group') {
                nodes.push({
                  index,
                  position: { x: group.x(), y: group.y() },
                  draggable: group.draggable(),
                });
              }
            });
          }
        }
      }
      
      return { konvaNodes: nodes };
    });
    console.log('📊 Node info after drag:', nodeInfoAfter);
    
    // 移動距離を計算
    if (nodeInfo.konvaNodes.length > 0 && nodeInfoAfter.konvaNodes.length > 0) {
      const beforePos = nodeInfo.konvaNodes[0].position;
      const afterPos = nodeInfoAfter.konvaNodes[0].position;
      
      const actualMovement = {
        x: afterPos.x - beforePos.x,
        y: afterPos.y - beforePos.y,
      };
      
      const expectedMovement = { x: 50, y: 0 };
      
      console.log('\n📊 移動距離の分析:');
      console.log(`   期待値: dx=${expectedMovement.x}, dy=${expectedMovement.y}`);
      console.log(`   実際値: dx=${actualMovement.x.toFixed(1)}, dy=${actualMovement.y.toFixed(1)}`);
      console.log(`   倍率: x=${(actualMovement.x / expectedMovement.x).toFixed(2)}, y=${actualMovement.y === 0 ? 'N/A' : (actualMovement.y / expectedMovement.y).toFixed(2)}`);
      
      if (Math.abs(actualMovement.x) > Math.abs(expectedMovement.x) * 1.5) {
        console.log('❌ 問題確認: ノードが期待以上に移動しています！');
        console.log('   → 座標変換の重複適用またはキャンバス移動との競合の可能性');
      } else {
        console.log('✅ ノードの移動距離は正常範囲内です');
      }
    }
    
    console.log('\n🔍 ブラウザを手動で確認してください（1分後に自動終了）');
    console.log('   - ノードが期待通りの位置に移動したか？');
    console.log('   - キャンバス背景も一緒に動いていないか？');
    
    // 1分後に自動終了
    setTimeout(async () => {
      await browser.close();
      console.log('⏰ デバッグテスト終了');
    }, 60000);
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
    await browser.close();
  }
}

export { dragDebugTest };

if (import.meta.url === `file://${process.argv[1]}`) {
  dragDebugTest().catch(console.error);
}