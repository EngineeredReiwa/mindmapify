#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testPasteManual() {
  console.log('📋 Manual Paste Test Starting...\n');
  
  const browser = await puppeteer.launch({ 
    headless: "new", // バックグラウンド実行（ブラウザ非表示）
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    // Grant clipboard permissions
    await page.evaluateOnNewDocument(() => {
      // Allow clipboard access
      Object.defineProperty(navigator, 'permissions', {
        value: {
          query: () => Promise.resolve({ state: 'granted' })
        }
      });
    });
    
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
    
    console.log('\n📋 MANUAL TEST INSTRUCTIONS:');
    console.log('1. Copy some text from anywhere (Ctrl+C)');
    console.log('2. Double-click the node to edit it');
    console.log('3. Press Ctrl+V to paste');
    console.log('4. Press Ctrl+Enter to save');
    console.log('5. Check the browser console for "Paste command detected!" message');
    console.log('\nBrowser will stay open for 30 seconds for manual testing...\n');
    
    // Keep browser open for manual testing
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testPasteManual().catch(console.error);