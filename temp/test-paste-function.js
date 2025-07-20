#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testPasteFunction() {
  console.log('📋 Paste Function Test Starting...\n');
  
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
    
    // Put some text in clipboard first (simulate copying from elsewhere)
    const textToPaste = 'Pasted Content from Clipboard';
    await page.evaluate((text) => {
      return navigator.clipboard.writeText(text);
    }, textToPaste);
    console.log(`📋 Set clipboard content: "${textToPaste}"`);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Take screenshot before editing
    await page.screenshot({ path: 'temp/paste-test-01-before.png' });
    console.log('📸 Screenshot saved: paste-test-01-before.png');
    
    // Double-click the node to start editing
    console.log('✏️ Starting node editing...');
    await page.click('canvas', { offsetX: 460, offsetY: 330, clickCount: 2 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clear existing text first
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA'); // Select all
    await page.keyboard.up('Control');
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Take screenshot while editing
    await page.screenshot({ path: 'temp/paste-test-02-editing.png' });
    console.log('📸 Screenshot saved: paste-test-02-editing.png');
    
    // Test paste functionality
    console.log('📋 Testing Ctrl+V paste...');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyV'); // Paste
    await page.keyboard.up('Control');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot after paste
    await page.screenshot({ path: 'temp/paste-test-03-after-paste.png' });
    console.log('📸 Screenshot saved: paste-test-03-after-paste.png');
    
    // Save the editing
    console.log('💾 Saving editing...');
    await page.keyboard.down('Control');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Control');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take final screenshot
    await page.screenshot({ path: 'temp/paste-test-04-final.png' });
    console.log('📸 Screenshot saved: paste-test-04-final.png');
    
    // Check if paste worked by examining node text
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
    
    if (nodeText.includes('Pasted Content')) {
      console.log('✅ SUCCESS: Paste functionality is working!');
    } else {
      console.log('❌ ISSUE: Paste might not have worked as expected');
    }
    
    console.log('\n📋 Paste function test completed!');
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testPasteFunction().catch(console.error);