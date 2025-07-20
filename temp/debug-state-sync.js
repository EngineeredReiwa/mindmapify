#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function debugStateSync() {
  console.log('🔍 Testing connection state synchronization...\n');
  
  const browser = await puppeteer.launch({ 
    headless: "new", // バックグラウンド実行（ブラウザ非表示）
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
    
    // Setup test scenario step by step
    const stateCheck = await page.evaluate(() => {
      const store = window.useMindmapStore;
      let state = store.getState();
      
      console.log('Initial state - nodes:', state.nodes.length, 'connections:', state.connections.length);
      
      // Add two nodes
      state.addNode({ x: 200, y: 200 }, 'Node A');
      state.addNode({ x: 500, y: 200 }, 'Node B');
      
      // Refresh state after adding nodes
      state = store.getState();
      console.log('After adding nodes:', state.nodes.length);
      
      if (state.nodes.length >= 2) {
        const nodeA = state.nodes[0];
        const nodeB = state.nodes[1];
        
        console.log('Node IDs:', nodeA.id, nodeB.id);
        
        // Add connection
        state.addConnection(nodeA.id, nodeB.id);
        
        // Refresh state after adding connection
        state = store.getState();
        console.log('After adding connection:', state.connections.length);
        
        if (state.connections.length > 0) {
          const connection = state.connections[0];
          console.log('Connection created:', {
            id: connection.id,
            from: connection.from,
            to: connection.to,
            isSelected: connection.isSelected
          });
          
          // Select the connection
          console.log('Calling selectConnection...');
          state.selectConnection(connection.id);
          
          // Get fresh state
          const finalState = store.getState();
          const finalConnection = finalState.connections[0];
          
          console.log('Final state check:', {
            selectedConnectionId: finalState.selectedConnectionId,
            connectionIsSelected: finalConnection.isSelected,
            match: finalState.selectedConnectionId === connection.id && finalConnection.isSelected
          });
          
          return {
            success: true,
            selectedConnectionId: finalState.selectedConnectionId,
            connectionIsSelected: finalConnection.isSelected,
            connectionId: connection.id
          };
        }
      }
      
      return { success: false, error: 'Failed to create test scenario' };
    });
    
    console.log('📊 State check result:', stateCheck);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot to see visual state
    await page.screenshot({ path: 'temp/debug-state-sync.png' });
    console.log('📸 Screenshot saved: debug-state-sync.png');
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugStateSync().catch(console.error);