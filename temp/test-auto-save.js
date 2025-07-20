#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testAutoSave() {
  console.log('💾 Auto-save Test Starting...\n');
  
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
    
    // Create a node
    console.log('🖱️ Creating a test node...');
    const newNodeBtn = await page.$('.toolbar-btn.primary');
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Position the node
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        if (state.nodes.length >= 1) {
          state.updateNode(state.nodes[0].id, { 
            position: { x: 400, y: 300 },
            text: 'Original Text'
          });
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Take screenshot before editing
    await page.screenshot({ path: 'temp/auto-save-01-before.png' });
    console.log('📸 Screenshot saved: auto-save-01-before.png');
    
    // Double-click the node to start editing
    console.log('✏️ Starting node editing...');
    await page.click('canvas', { offsetX: 460, offsetY: 330, clickCount: 2 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot showing editing mode with hints
    await page.screenshot({ path: 'temp/auto-save-02-editing-with-hints.png' });
    console.log('📸 Screenshot saved: auto-save-02-editing-with-hints.png');
    
    // Clear existing text and type new text
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA'); // Select all
    await page.keyboard.up('Control');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const newText = 'Modified Text via Auto-save';
    for (const char of newText) {
      await page.keyboard.type(char);
      await new Promise(resolve => setTimeout(resolve, 50)); // Slow typing for visibility
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Take screenshot with new text
    await page.screenshot({ path: 'temp/auto-save-03-text-changed.png' });
    console.log('📸 Screenshot saved: auto-save-03-text-changed.png');
    
    // Test auto-save by clicking outside the node (empty canvas area)
    console.log('💾 Testing auto-save by clicking outside...');
    await page.click('canvas', { offsetX: 200, offsetY: 200 }); // Click on empty space
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot after auto-save
    await page.screenshot({ path: 'temp/auto-save-04-after-auto-save.png' });
    console.log('📸 Screenshot saved: auto-save-04-after-auto-save.png');
    
    // Check if the text was saved
    const nodeText = await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        if (state.nodes.length >= 1) {
          return state.nodes[0].text;
        }
      }
      return '';
    });
    
    console.log(`📝 Final node text: "${nodeText}"`);
    
    if (nodeText.includes('Modified Text')) {
      console.log('✅ SUCCESS: Auto-save is working!');
    } else {
      console.log('❌ ISSUE: Auto-save might not have worked');
    }
    
    console.log('\n💾 Auto-save test completed!');
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testAutoSave().catch(console.error);