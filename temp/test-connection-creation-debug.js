#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testConnectionCreation() {
  console.log('🔗 Connection Creation Debug Test Starting...\n');
  
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
    
    // Create two nodes using "New Node" button
    console.log('🖱️ Creating two nodes...');
    const newNodeBtn = await page.$('.toolbar-btn.primary');
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Position the nodes
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        if (state.nodes.length >= 2) {
          state.updateNode(state.nodes[0].id, { 
            position: { x: 200, y: 200 },
            text: 'Node A'
          });
          state.updateNode(state.nodes[1].id, { 
            position: { x: 500, y: 200 },
            text: 'Node B'
          });
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Take screenshot before connection
    await page.screenshot({ path: 'temp/debug-01-before-connection.png' });
    console.log('📸 Screenshot saved: debug-01-before-connection.png');
    
    // Try connection creation by dragging from connection point to connection point
    console.log('🔗 Attempting connection creation via drag...');
    
    // Click and drag from Node A right connection point to Node B left connection point
    await page.mouse.move(320, 225); // Node A right connection point
    await page.mouse.down();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Move to Node B left connection point
    await page.mouse.move(500, 225); // Node B left connection point
    await new Promise(resolve => setTimeout(resolve, 100));
    await page.mouse.up();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot after drag attempt
    await page.screenshot({ path: 'temp/debug-02-after-drag.png' });
    console.log('📸 Screenshot saved: debug-02-after-drag.png');
    
    // Check if connection was created
    const connectionAfterDrag = await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        return {
          connectionCount: state.connections.length,
          connections: state.connections.map(c => ({ id: c.id, from: c.from, to: c.to }))
        };
      }
      return { connectionCount: 0, connections: [] };
    });
    
    console.log('📊 Connections after drag:', connectionAfterDrag);
    
    if (connectionAfterDrag.connectionCount === 0) {
      console.log('🔄 Drag failed, trying alternative method...');
      
      // Alternative: Use MouseDown/MouseMove/MouseUp events directly on connection points
      await page.evaluate(() => {
        console.log('Attempting programmatic connection creation...');
        const store = window.useMindmapStore;
        if (store) {
          const state = store.getState();
          if (state.nodes.length >= 2) {
            // Manually create connection
            store.getState().addConnection(state.nodes[0].id, state.nodes[1].id);
          }
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Final check
    const finalConnections = await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        return {
          connectionCount: state.connections.length,
          connections: state.connections.map(c => ({ id: c.id, from: c.from, to: c.to }))
        };
      }
      return { connectionCount: 0, connections: [] };
    });
    
    console.log('📊 Final connections:', finalConnections);
    
    // Take final screenshot
    await page.screenshot({ path: 'temp/debug-03-final-state.png' });
    console.log('📸 Screenshot saved: debug-03-final-state.png');
    
    if (finalConnections.connectionCount > 0) {
      console.log('✅ Connection creation successful!');
      
      // Now test selection
      console.log('🖱️ Testing connection selection...');
      await page.click('canvas', { offsetX: 360, offsetY: 225 }); // Click on connection line
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const selectionState = await page.evaluate(() => {
        const store = window.useMindmapStore;
        if (store) {
          const state = store.getState();
          const selectedConn = state.connections.find(c => c.isSelected);
          return {
            selectedConnectionId: state.selectedConnectionId,
            hasSelectedConnection: !!selectedConn
          };
        }
        return { selectedConnectionId: null, hasSelectedConnection: false };
      });
      
      console.log('📊 Selection state:', selectionState);
      
      // Take screenshot of selected connection
      await page.screenshot({ path: 'temp/debug-04-selected-connection.png' });
      console.log('📸 Screenshot saved: debug-04-selected-connection.png');
      
    } else {
      console.log('❌ Connection creation failed');
    }
    
    console.log('\n🔗 Connection creation debug completed!');
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testConnectionCreation().catch(console.error);