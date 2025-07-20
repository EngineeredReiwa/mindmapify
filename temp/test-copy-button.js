#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testCopyButton() {
  console.log('📋 Copy Button Test Starting...\n');
  
  const browser = await puppeteer.launch({ 
    headless: "new", // バックグラウンド実行（ブラウザ非表示）
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    // Load app
    console.log('🌐 Loading http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    
    // Wait for app to load
    await page.waitForSelector('canvas');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create some content to copy
    console.log('🖱️ Creating nodes and connections...');
    const newNodeBtn = await page.$('.toolbar-btn.primary');
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Position nodes and create connection
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        if (state.nodes.length >= 2) {
          state.updateNode(state.nodes[0].id, { 
            position: { x: 200, y: 200 },
            text: 'Test Node 1'
          });
          state.updateNode(state.nodes[1].id, { 
            position: { x: 500, y: 200 },
            text: 'Test Node 2'
          });
          state.addConnection(state.nodes[0].id, state.nodes[1].id);
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot before copy
    await page.screenshot({ path: 'temp/copy-test-01-before.png' });
    console.log('📸 Screenshot saved: copy-test-01-before.png');
    
    // Click the copy button
    console.log('📋 Clicking Copy button...');
    const copyButton = await page.$('.copy-btn');
    await copyButton.click();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot after copy (should show success state)
    await page.screenshot({ path: 'temp/copy-test-02-after.png' });
    console.log('📸 Screenshot saved: copy-test-02-after.png');
    
    // Test clipboard content (note: this might not work in headless due to permissions)
    try {
      const clipboardContent = await page.evaluate(async () => {
        try {
          return await navigator.clipboard.readText();
        } catch (e) {
          return 'Clipboard read failed (permissions)';
        }
      });
      console.log('📋 Clipboard content:', clipboardContent.substring(0, 100) + '...');
    } catch (e) {
      console.log('📋 Clipboard read test skipped (browser limitations)');
    }
    
    console.log('\n✅ Copy button test completed!');
    console.log('Check screenshots to verify success feedback appears');
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testCopyButton().catch(console.error);