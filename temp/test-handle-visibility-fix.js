#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testHandleVisibilityFix() {
  console.log('🔍 Testing handle visibility fix...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Setup nodes and connection
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      let state = store.getState();
      
      // Add nodes
      state.addNode({ x: 200, y: 200 }, 'Node A');
      state.addNode({ x: 500, y: 200 }, 'Node B');
      
      // Refresh state and add connection
      state = store.getState();
      if (state.nodes.length >= 2) {
        state.addConnection(state.nodes[0].id, state.nodes[1].id);
        console.log('Setup complete - nodes and connection created');
      } else {
        console.log('Failed to create nodes');
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot before selection
    await page.screenshot({ path: 'temp/handles-01-before-selection.png' });
    console.log('📸 Before selection: handles-01-before-selection.png');
    
    // Select the connection
    console.log('🎯 Selecting connection...');
    await page.click('canvas', { offsetX: 350, offsetY: 200 }); // Click on connection line
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Take screenshot after selection to see handles
    await page.screenshot({ path: 'temp/handles-02-after-selection.png' });
    console.log('📸 After selection: handles-02-after-selection.png');
    
    // Check state
    const state = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const currentState = store.getState();
      return {
        selectedConnectionId: currentState.selectedConnectionId,
        connectionSelected: currentState.connections[0]?.isSelected,
        connectionsCount: currentState.connections.length
      };
    });
    
    console.log('📊 State after selection:', state);
    
    // Test handle click
    console.log('🖱️ Testing start handle click (should be green)...');
    await page.click('canvas', { offsetX: 200, offsetY: 200 }); // Click on start handle
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if editing mode activated
    const editingState = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const currentState = store.getState();
      return {
        isEditingConnection: currentState.canvas.isEditingConnection,
        editingConnectionId: currentState.canvas.editingConnectionId,
        editingEndpoint: currentState.canvas.editingEndpoint
      };
    });
    
    console.log('📊 Editing state after handle click:', editingState);
    
    // Take screenshot after handle click
    await page.screenshot({ path: 'temp/handles-03-after-handle-click.png' });
    console.log('📸 After handle click: handles-03-after-handle-click.png');
    
    if (editingState.isEditingConnection) {
      console.log('✅ SUCCESS: Handle click activated editing mode!');
      console.log(`   - Editing connection: ${editingState.editingConnectionId}`);
      console.log(`   - Editing endpoint: ${editingState.editingEndpoint}`);
    } else {
      console.log('❌ PROBLEM: Handle click did not activate editing mode');
    }
    
    console.log('\n🔍 Handle visibility test completed!');
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 8000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testHandleVisibilityFix().catch(console.error);