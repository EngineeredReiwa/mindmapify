#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testConnectionClick() {
  console.log('🔗 Connection Click Test Starting...\n');
  
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
    
    // Create two nodes using toolbar button
    console.log('🖱️ Creating first node...');
    const newNodeBtn = await page.$('.toolbar-btn.primary');
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('🖱️ Creating second node...');
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Move nodes to different positions so they don't overlap
    console.log('📦 Positioning nodes...');
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        if (state.nodes.length >= 2) {
          // Move first node to left
          state.updateNode(state.nodes[0].id, { 
            position: { x: 200, y: 200 } 
          });
          // Move second node to right
          state.updateNode(state.nodes[1].id, { 
            position: { x: 500, y: 200 } 
          });
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Manually create connection using store
    console.log('📝 Creating connection via store...');
    const result = await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        if (state.nodes.length >= 2) {
          const node1 = state.nodes[0];
          const node2 = state.nodes[1];
          
          // Create connection
          state.addConnection(node1.id, node2.id);
          
          const newState = store.getState();
          console.log('Connections created:', newState.connections.length);
          return { success: true, connections: newState.connections.length };
        }
      }
      return { success: false };
    });
    
    console.log('Connection creation result:', result);
    
    if (result.success) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Take a screenshot to see the debug rectangle
      await page.screenshot({ path: 'temp/connection-debug.png' });
      console.log('📸 Screenshot saved to temp/connection-debug.png');
      
      // Try clicking on the red debug rectangle area
      console.log('🖱️ Attempting to click connection (looking for red rectangle)...');
      
      // Click in several spots where connections might be (between nodes at 200,200 and 500,200)
      const clickAreas = [
        { x: 350, y: 200 },  // Middle of connection line
        { x: 300, y: 200 },  // Left side of connection
        { x: 400, y: 200 },  // Right side of connection
        { x: 350, y: 180 },  // Above connection (curve area)
        { x: 350, y: 220 },  // Below connection
      ];
      
      for (const area of clickAreas) {
        console.log(`🖱️ Clicking at (${area.x}, ${area.y})`);
        await page.click('canvas', { offsetX: area.x, offsetY: area.y });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Check if any connection got selected
        const isSelected = await page.evaluate(() => {
          const store = window.useMindmapStore;
          if (store) {
            const state = store.getState();
            return state.connections.some(conn => conn.isSelected);
          }
          return false;
        });
        
        if (isSelected) {
          console.log('✅ Connection successfully selected!');
          break;
        }
      }
    }
    
    console.log('\n🔗 Connection click test completed!');
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testConnectionClick().catch(console.error);