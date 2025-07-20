#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testDirectSelection() {
  console.log('🔍 Testing direct connection selection...\n');
  
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
    
    // Setup and directly select connection
    const result = await page.evaluate(() => {
      const store = window.useMindmapStore;
      let state = store.getState();
      
      // Add nodes and connection
      state.addNode({ x: 200, y: 200 }, 'Node A');
      state.addNode({ x: 500, y: 200 }, 'Node B');
      
      state = store.getState();
      if (state.nodes.length >= 2) {
        state.addConnection(state.nodes[0].id, state.nodes[1].id);
        
        // Get the connection ID
        state = store.getState();
        const connectionId = state.connections[0]?.id;
        
        if (connectionId) {
          console.log('Before selection:', {
            selectedConnectionId: state.selectedConnectionId,
            connectionIsSelected: state.connections[0].isSelected
          });
          
          // Directly select the connection
          state.selectConnection(connectionId);
          
          // Check final state
          const finalState = store.getState();
          console.log('After selection:', {
            selectedConnectionId: finalState.selectedConnectionId,
            connectionIsSelected: finalState.connections[0].isSelected
          });
          
          return {
            success: true,
            connectionId: connectionId,
            selectedConnectionId: finalState.selectedConnectionId,
            connectionIsSelected: finalState.connections[0].isSelected
          };
        }
      }
      
      return { success: false };
    });
    
    console.log('📊 Direct selection result:', result);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Take screenshot to see handles
    await page.screenshot({ path: 'temp/direct-selection-result.png' });
    console.log('📸 Screenshot: direct-selection-result.png');
    
    if (result.success && result.connectionIsSelected) {
      console.log('✅ SUCCESS: Connection selected and handles should be visible!');
      
      // Test handle click by evaluating directly
      console.log('🖱️ Testing handle click directly...');
      const handleResult = await page.evaluate(() => {
        const store = window.useMindmapStore;
        const state = store.getState();
        
        if (state.selectedConnectionId) {
          console.log('Calling startEditingConnectionEndpoint for start point...');
          state.startEditingConnectionEndpoint(state.selectedConnectionId, 'start');
          
          const newState = store.getState();
          return {
            isEditingConnection: newState.canvas.isEditingConnection,
            editingConnectionId: newState.canvas.editingConnectionId,
            editingEndpoint: newState.canvas.editingEndpoint
          };
        }
        return { error: 'No selected connection' };
      });
      
      console.log('📊 Handle click result:', handleResult);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      await page.screenshot({ path: 'temp/direct-editing-result.png' });
      console.log('📸 Editing state: direct-editing-result.png');
      
    } else {
      console.log('❌ PROBLEM: Connection not properly selected');
    }
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testDirectSelection().catch(console.error);