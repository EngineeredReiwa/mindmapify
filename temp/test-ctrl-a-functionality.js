#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testCtrlAFunctionality() {
  console.log('⌨️ Ctrl+A Functionality Test Starting...\n');
  
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
            text: 'Original Text to Replace'
          });
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Take screenshot before editing
    await page.screenshot({ path: 'temp/ctrl-a-01-before.png' });
    console.log('📸 Screenshot saved: ctrl-a-01-before.png');
    
    // Double-click the node to start editing
    console.log('✏️ Starting node editing...');
    await page.click('canvas', { offsetX: 460, offsetY: 330, clickCount: 2 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot showing editing mode
    await page.screenshot({ path: 'temp/ctrl-a-02-editing.png' });
    console.log('📸 Screenshot saved: ctrl-a-02-editing.png');
    
    // Use Ctrl+A to select all text
    console.log('📝 Testing Ctrl+A (select all)...');
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Take screenshot after Ctrl+A
    await page.screenshot({ path: 'temp/ctrl-a-03-selected.png' });
    console.log('📸 Screenshot saved: ctrl-a-03-selected.png');
    
    // Type replacement text
    const replacementText = 'Completely New Text';
    console.log(`📝 Typing replacement text: "${replacementText}"`);
    for (const char of replacementText) {
      await page.keyboard.type(char);
      await new Promise(resolve => setTimeout(resolve, 30));
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Take screenshot with replaced text
    await page.screenshot({ path: 'temp/ctrl-a-04-replaced.png' });
    console.log('📸 Screenshot saved: ctrl-a-04-replaced.png');
    
    // Save using Ctrl+Enter
    console.log('💾 Saving with Ctrl+Enter...');
    await page.keyboard.down('Control');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Control');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take final screenshot
    await page.screenshot({ path: 'temp/ctrl-a-05-final.png' });
    console.log('📸 Screenshot saved: ctrl-a-05-final.png');
    
    // Check if the text was properly replaced
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
    
    if (nodeText === replacementText) {
      console.log('✅ SUCCESS: Ctrl+A + replace text functionality is working perfectly!');
    } else if (nodeText.includes(replacementText)) {
      console.log('⚠️ PARTIAL: Text was added but original text might not have been fully replaced');
    } else {
      console.log('❌ ISSUE: Ctrl+A + replace functionality not working properly');
    }
    
    console.log('\n⌨️ Ctrl+A test completed!');
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testCtrlAFunctionality().catch(console.error);