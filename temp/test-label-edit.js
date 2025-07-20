#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testLabelEdit() {
  console.log('🏷️ Connection Label Edit Test Starting...\n');
  
  const browser = await puppeteer.launch({ 
    headless: "new",
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
    
    // Create connection between nodes
    console.log('🔗 Creating connection...');
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        if (state.nodes.length >= 2) {
          const node1 = state.nodes[0];
          const node2 = state.nodes[1];
          state.addConnection(node1.id, node2.id);
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take a screenshot
    await page.screenshot({ path: 'temp/label-edit-01-initial.png' });
    console.log('📸 Screenshot saved: label-edit-01-initial.png');
    
    // Double-click on connection to open label editor
    console.log('🖱️ Double-clicking on connection line...');
    // Debug: Get connection info
    const connectionInfo = await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        const connection = state.connections[0];
        if (connection) {
          const fromNode = state.nodes.find(n => n.id === connection.from);
          const toNode = state.nodes.find(n => n.id === connection.to);
          return {
            connectionId: connection.id,
            fromPos: fromNode?.position,
            toPos: toNode?.position
          };
        }
      }
      return null;
    });
    console.log('Connection info:', connectionInfo);
    
    // Get canvas state to account for offset and zoom
    const canvasState = await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        return state.canvas;
      }
      return null;
    });
    console.log('Canvas state:', canvasState);
    
    // Calculate the screen position accounting for canvas transformation
    const nodeWidth = 120;
    const nodeHeight = 60;
    const fromCenterX = connectionInfo.fromPos.x + nodeWidth / 2;
    const fromCenterY = connectionInfo.fromPos.y + nodeHeight / 2;
    const toCenterX = connectionInfo.toPos.x + nodeWidth / 2;
    const toCenterY = connectionInfo.toPos.y + nodeHeight / 2;
    
    const canvasMidX = (fromCenterX + toCenterX) / 2;
    const canvasMidY = (fromCenterY + toCenterY) / 2;
    
    // Convert canvas coordinates to screen coordinates
    const screenX = canvasMidX * canvasState.zoom + canvasState.offset.x;
    const screenY = canvasMidY * canvasState.zoom + canvasState.offset.y;
    
    console.log(`Canvas position: (${canvasMidX}, ${canvasMidY})`);
    console.log(`Screen position: (${screenX}, ${screenY})`);
    
    // Manually trigger label editing for testing
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
    
    // Take a screenshot with editor open
    await page.screenshot({ path: 'temp/label-edit-02-editor.png' });
    console.log('📸 Screenshot saved: label-edit-02-editor.png');
    
    // Click on a preset label
    console.log('🖱️ Clicking on "contains" label...');
    await page.click('canvas', { offsetX: 295, offsetY: 235 }); // "contains" button position
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take a screenshot with label
    await page.screenshot({ path: 'temp/label-edit-03-labeled.png' });
    console.log('📸 Screenshot saved: label-edit-03-labeled.png');
    
    console.log('\n🏷️ Label edit test completed!');
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testLabelEdit().catch(console.error);