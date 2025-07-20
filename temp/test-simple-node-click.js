#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testSimpleNodeClick() {
  console.log('🎯 Simple Node Click Test Starting...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
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
    
    // Create a single node
    console.log('🖱️ Creating a node...');
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
            text: 'Test Node'
          });
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Take screenshot before node click
    await page.screenshot({ path: 'temp/simple-01-before-click.png' });
    console.log('📸 Screenshot saved: simple-01-before-click.png');
    
    // Check initial state - no connections should exist
    const initialConnections = await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        return store.getState().connections.length;
      }
      return 0;
    });
    
    console.log(`📊 Initial connections: ${initialConnections}`);
    
    // Test: Click on the node
    console.log('🖱️ Clicking on the node...');
    await page.click('canvas', { offsetX: 460, offsetY: 330 }); // Click on the node
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot after node click
    await page.screenshot({ path: 'temp/simple-02-after-click.png' });
    console.log('📸 Screenshot saved: simple-02-after-click.png');
    
    // Check if node is in editing mode
    const nodeEditingState = await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        return state.nodes.filter(node => node.isEditing).length;
      }
      return 0;
    });
    
    // Check if any connection label editors appeared (should still be 0)
    const labelEditorsAfterClick = await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        return state.connections.filter(conn => conn.isEditingLabel).length;
      }
      return 0;
    });
    
    console.log(`📊 Nodes in editing mode: ${nodeEditingState}`);
    console.log(`📊 Connection label editors: ${labelEditorsAfterClick}`);
    
    // Evaluate results
    console.log('\n📋 Test Results:');
    console.log(`✅ Node editing functionality: ${nodeEditingState > 0 ? 'WORKING ✓' : 'BROKEN ✗'}`);
    console.log(`✅ No spurious connection label editors: ${labelEditorsAfterClick === 0 ? 'FIXED ✓' : 'STILL BROKEN ✗'}`);
    
    if (nodeEditingState > 0 && labelEditorsAfterClick === 0) {
      console.log('\n🎉 SUCCESS: Node click is working correctly without interference!');
    } else {
      console.log('\n⚠️ ISSUE: Node click behavior needs further investigation');
    }
    
    console.log('\n🎯 Simple node click test completed!');
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testSimpleNodeClick().catch(console.error);