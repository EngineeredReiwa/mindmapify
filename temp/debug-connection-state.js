#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function debugConnectionState() {
  console.log('🔍 Debugging connection state in detail...\n');
  
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
    
    // Step by step debugging
    const debugResult = await page.evaluate(() => {
      const store = window.useMindmapStore;
      let state = store.getState();
      
      console.log('=== STEP 1: Initial state ===');
      console.log('Connections:', state.connections.length);
      console.log('Nodes:', state.nodes.length);
      
      // Add nodes
      state.addNode({ x: 200, y: 200 }, 'Node A');
      state.addNode({ x: 500, y: 200 }, 'Node B');
      
      state = store.getState();
      console.log('=== STEP 2: After adding nodes ===');
      console.log('Nodes:', state.nodes.length);
      
      if (state.nodes.length >= 2) {
        // Add connection
        state.addConnection(state.nodes[0].id, state.nodes[1].id);
        
        state = store.getState();
        console.log('=== STEP 3: After adding connection ===');
        console.log('Connections:', state.connections.length);
        
        if (state.connections.length > 0) {
          const connectionBefore = state.connections[0];
          console.log('Connection before selection:', {
            id: connectionBefore.id,
            isSelected: connectionBefore.isSelected,
            from: connectionBefore.from,
            to: connectionBefore.to
          });
          
          // Select connection
          console.log('=== STEP 4: Selecting connection ===');
          console.log('Calling selectConnection with ID:', connectionBefore.id);
          state.selectConnection(connectionBefore.id);
          
          // Get fresh state after selection
          const freshState = store.getState();
          console.log('=== STEP 5: After selection ===');
          console.log('selectedConnectionId:', freshState.selectedConnectionId);
          
          const connectionAfter = freshState.connections[0];
          console.log('Connection after selection:', {
            id: connectionAfter.id,
            isSelected: connectionAfter.isSelected,
            from: connectionAfter.from,
            to: connectionAfter.to
          });
          
          // Check if they are the same object
          console.log('Same connection object?', connectionBefore === connectionAfter);
          console.log('Same ID?', connectionBefore.id === connectionAfter.id);
          
          // Force re-render to see if component receives updated props
          console.log('=== STEP 6: Force component update ===');
          // Try manual update to see if it helps
          const manualConnection = freshState.connections.find(c => c.id === connectionBefore.id);
          if (manualConnection) {
            console.log('Manual find result:', {
              id: manualConnection.id,
              isSelected: manualConnection.isSelected
            });
          }
          
          return {
            beforeSelection: {
              id: connectionBefore.id,
              isSelected: connectionBefore.isSelected
            },
            afterSelection: {
              id: connectionAfter.id,
              isSelected: connectionAfter.isSelected,
              selectedConnectionId: freshState.selectedConnectionId
            },
            success: true
          };
        }
      }
      
      return { success: false, error: 'Failed to create connection' };
    });
    
    console.log('\n📊 Debug result:', debugResult);
    
    // Wait a bit and check the actual rendered state
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if ConnectionLine component is receiving correct props
    const componentState = await page.evaluate(() => {
      // Try to access React component state through dev tools
      const canvas = document.querySelector('canvas');
      if (canvas && window.React) {
        console.log('=== CHECKING COMPONENT STATE ===');
        // This is a simplified check - in real debugging we'd need React DevTools
        const store = window.useMindmapStore;
        const currentState = store.getState();
        
        if (currentState.connections.length > 0) {
          const connection = currentState.connections[0];
          console.log('Current connection state in component check:', {
            id: connection.id,
            isSelected: connection.isSelected,
            selectedConnectionId: currentState.selectedConnectionId,
            matches: currentState.selectedConnectionId === connection.id
          });
          
          return {
            connectionId: connection.id,
            isSelected: connection.isSelected,
            selectedConnectionId: currentState.selectedConnectionId,
            matches: currentState.selectedConnectionId === connection.id
          };
        }
      }
      
      return { error: 'Could not check component state' };
    });
    
    console.log('📊 Component state check:', componentState);
    
    console.log('\n🔍 Debug completed. Browser will close in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugConnectionState().catch(console.error);