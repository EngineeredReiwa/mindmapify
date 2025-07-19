#!/usr/bin/env node

/**
 * Debug Test Script - ブラウザを表示してデバッグ
 */

import puppeteer from 'puppeteer';

async function debugTest() {
  console.log('🔍 Debug Test Starting (ブラウザ表示モード)...\n');
  
  const browser = await puppeteer.launch({ 
    headless: "new", // バックグラウンド実行（ブラウザ非表示）
    devtools: true,   // 開発者ツールを開く
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🌐 Loading http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    
    const title = await page.title();
    console.log(`✅ Page: ${title}`);
    
    // スクリーンショット撮影
    await page.screenshot({ path: 'debug-screenshot.png' });
    console.log('📸 Screenshot saved: debug-screenshot.png');
    
    // New Nodeボタンをクリック
    const newNodeBtn = await page.$('.toolbar-btn.primary');
    if (newNodeBtn) {
      console.log('🖱️ Clicking New Node button...');
      await newNodeBtn.click();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // ノード作成後のスクリーンショット
      await page.screenshot({ path: 'debug-with-node.png' });
      console.log('📸 Screenshot with node saved: debug-with-node.png');
    }
    
    console.log('\n🔍 ブラウザは手動で閉じてください（10分後に自動終了）');
    
    // 10分後に自動終了
    setTimeout(async () => {
      await browser.close();
      console.log('⏰ タイムアウトで終了');
    }, 600000);
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
    await browser.close();
  }
}

export { debugTest };

if (import.meta.url === `file://${process.argv[1]}`) {
  debugTest().catch(console.error);
}