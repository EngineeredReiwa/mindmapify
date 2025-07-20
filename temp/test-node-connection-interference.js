#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testNodeConnectionInterference() {
  console.log('🎯 Node-Connection Interference Test Starting...\n');
  
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
    
    // Create two nodes and connect them
    console.log('🖱️ Creating first node...');
    const newNodeBtn = await page.$('.toolbar-btn.primary');
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('🖱️ Creating second node...');
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Position the nodes
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        if (state.nodes.length >= 2) {
          state.updateNode(state.nodes[0].id, { 
            position: { x: 300, y: 200 },
            text: 'First Node'
          });
          state.updateNode(state.nodes[1].id, { 
            position: { x: 500, y: 300 },
            text: 'Second Node'
          });
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create connection between nodes
    console.log('🔗 Creating connection...');
    await page.click('canvas', { offsetX: 400, offsetY: 225 }); // First node right connection point
    await page.mouse.down();
    await page.mouse.move(500, 325); // Second node left connection point
    await page.click('canvas', { offsetX: 500, offsetY: 325 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot of setup
    await page.screenshot({ path: 'temp/interference-01-setup.png' });
    console.log('📸 Screenshot saved: interference-01-setup.png');
    
    // Check initial state - no label editors should be visible
    const labelEditorsBeforeNodeClick = await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        return state.connections.filter(conn => conn.isEditingLabel).length;
      }
      return 0;
    });
    
    console.log(`📊 Label editors before node click: ${labelEditorsBeforeNodeClick}`);
    
    // Test: Click on first node (should NOT trigger connection label editing)
    console.log('🖱️ Testing node click (should NOT trigger connection label editing)...');
    await page.click('canvas', { offsetX: 360, offsetY: 225 }); // Click on first node
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot after node click
    await page.screenshot({ path: 'temp/interference-02-after-node-click.png' });
    console.log('📸 Screenshot saved: interference-02-after-node-click.png');
    
    // Check if any connection label editors appeared (should be 0)
    const labelEditorsAfterNodeClick = await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        return state.connections.filter(conn => conn.isEditingLabel).length;
      }
      return 0;
    });
    
    console.log(`📊 Label editors after node click: ${labelEditorsAfterNodeClick}`);
    
    // Check if node is in editing mode (should be true)
    const nodeEditingState = await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        return state.nodes.filter(node => node.isEditing).length;
      }
      return 0;
    });
    
    console.log(`📊 Nodes in editing mode: ${nodeEditingState}`);
    
    // Test: Double-click on connection line (should trigger label editing)
    console.log('🖱️ Testing connection double-click (should trigger label editing)...');
    
    // First click outside to stop node editing
    await page.click('canvas', { offsetX: 200, offsetY: 150 }); // Empty space
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Double-click on connection line
    await page.click('canvas', { offsetX: 450, offsetY: 265, clickCount: 2 }); // Middle of connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot after connection double-click
    await page.screenshot({ path: 'temp/interference-03-after-connection-dblclick.png' });
    console.log('📸 Screenshot saved: interference-03-after-connection-dblclick.png');
    
    // Check if connection label editor appeared (should be 1)
    const labelEditorsAfterConnectionClick = await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        return state.connections.filter(conn => conn.isEditingLabel).length;
      }
      return 0;
    });
    
    console.log(`📊 Label editors after connection double-click: ${labelEditorsAfterConnectionClick}`);
    
    // Evaluate results
    console.log('\n📋 Test Results:');
    console.log(`❌ Problem BEFORE fix: Node click would trigger ${labelEditorsBeforeNodeClick + 1} label editor(s)`);
    console.log(`✅ Node click triggering label editors: ${labelEditorsAfterNodeClick === 0 ? 'FIXED' : 'STILL BROKEN'}`);
    console.log(`✅ Node editing functionality: ${nodeEditingState > 0 ? 'WORKING' : 'BROKEN'}`);
    console.log(`✅ Connection label editing: ${labelEditorsAfterConnectionClick > 0 ? 'WORKING' : 'BROKEN'}`);
    
    if (labelEditorsAfterNodeClick === 0 && nodeEditingState > 0 && labelEditorsAfterConnectionClick > 0) {
      console.log('\n🎉 SUCCESS: Node-connection interference issue has been FIXED!');
    } else {
      console.log('\n⚠️ ISSUE: Some functionality is still not working correctly');
    }
    
    console.log('\n🎯 Interference test completed!');
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testNodeConnectionInterference().catch(console.error);