#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testHandleClickDebug() {
  console.log('🔍 Handle Click Debug Test Starting...\n');
  
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create and setup nodes
    console.log('🖱️ Setting up test scenario...');
    const newNodeBtn = await page.$('.toolbar-btn.primary');
    
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 300));
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      
      if (state.nodes.length >= 2) {
        console.log('Setting up nodes and connection...');
        state.updateNode(state.nodes[0].id, { 
          position: { x: 200, y: 200 },
          text: 'Node A'
        });
        state.updateNode(state.nodes[1].id, { 
          position: { x: 500, y: 200 },
          text: 'Node B'
        });
        
        // Create and select connection
        state.addConnection(state.nodes[0].id, state.nodes[1].id);
        setTimeout(() => {
          if (state.connections.length > 0) {
            state.selectConnection(state.connections[0].id);
            console.log('Connection selected, handles should be visible');
          }
        }, 100);
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Take screenshot before click
    await page.screenshot({ path: 'temp/handle-click-01-before.png' });
    console.log('📸 Screenshot saved: handle-click-01-before.png');
    
    // Check state before click
    const beforeState = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return {
        canvasState: {
          isEditingConnection: state.canvas.isEditingConnection,
          editingConnectionId: state.canvas.editingConnectionId,
          editingEndpoint: state.canvas.editingEndpoint,
          isConnecting: state.canvas.isConnecting
        },
        selectedConnectionId: state.selectedConnectionId,
        connectionSelected: state.connections.length > 0 ? state.connections[0].isSelected : false
      };
    });
    
    console.log('📊 State before handle click:', beforeState);
    
    // Attempt to click on the end point handle (right side)
    console.log('🎯 Clicking on end point handle...');
    await page.click('canvas', { offsetX: 460, offsetY: 225 }); // End point handle position (Node B left edge)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check state after click
    const afterState = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return {
        canvasState: {
          isEditingConnection: state.canvas.isEditingConnection,
          editingConnectionId: state.canvas.editingConnectionId,
          editingEndpoint: state.canvas.editingEndpoint,
          isConnecting: state.canvas.isConnecting,
          connectionStartPoint: state.canvas.connectionStartPoint
        },
        selectedConnectionId: state.selectedConnectionId,
        connectionSelected: state.connections.length > 0 ? state.connections[0].isSelected : false
      };
    });
    
    console.log('📊 State after handle click:', afterState);
    
    // Take screenshot after click
    await page.screenshot({ path: 'temp/handle-click-02-after.png' });
    console.log('📸 Screenshot saved: handle-click-02-after.png');
    
    // Analyze what happened
    console.log('\n📋 Analysis:');
    
    if (afterState.canvasState.isEditingConnection) {
      console.log('✅ SUCCESS: Connection editing mode activated!');
      console.log(`   - Editing connection: ${afterState.canvasState.editingConnectionId}`);
      console.log(`   - Editing endpoint: ${afterState.canvasState.editingEndpoint}`);
    } else if (afterState.canvasState.isConnecting) {
      console.log('❌ PROBLEM: New connection mode activated instead of editing!');
      console.log(`   - Connection start point: ${afterState.canvasState.connectionStartPoint}`);
      console.log('   - This means the node connection point was clicked, not the handle');
    } else {
      console.log('❓ UNKNOWN: No editing or connecting mode activated');
    }
    
    console.log('\n🔍 Handle click debug completed!');
    
    // Keep browser open for manual inspection
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testHandleClickDebug().catch(console.error);