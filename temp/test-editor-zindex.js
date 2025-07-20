#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testEditorZIndex() {
  console.log('🏷️ Label Editor Z-Index Test Starting...\n');
  
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
    
    // Create two nodes close together to overlap with editor
    console.log('🖱️ Creating overlapping nodes and connection...');
    const newNodeBtn = await page.$('.toolbar-btn.primary');
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Position nodes close together
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        if (state.nodes.length >= 2) {
          // Position nodes close to where editor will appear
          state.updateNode(state.nodes[0].id, { position: { x: 300, y: 200 } });
          state.updateNode(state.nodes[1].id, { position: { x: 500, y: 200 } });
          state.addConnection(state.nodes[0].id, state.nodes[1].id);
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create additional nodes that might overlap editor
    await newNodeBtn.click();
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        if (state.nodes.length >= 3) {
          // Position this node where editor will appear
          state.updateNode(state.nodes[2].id, { position: { x: 380, y: 150 } });
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Take screenshot before editing
    await page.screenshot({ path: 'temp/editor-zindex-01-before.png' });
    console.log('📸 Screenshot saved: editor-zindex-01-before.png');
    
    // Start label editing
    console.log('🏷️ Opening label editor...');
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        const connection = state.connections[0];
        if (connection) {
          state.startEditingConnectionLabel(connection.id);
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot with editor open
    await page.screenshot({ path: 'temp/editor-zindex-02-editor-open.png' });
    console.log('📸 Screenshot saved: editor-zindex-02-editor-open.png');
    
    console.log('\n✅ Z-index test completed!');
    console.log('Check screenshots to verify editor appears in front of nodes');
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testEditorZIndex().catch(console.error);