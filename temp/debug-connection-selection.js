#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function debugConnectionSelection() {
  console.log('🔍 Debug Connection Selection Starting...\n');
  
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
    
    // Create two nodes
    console.log('🖱️ Creating two nodes...');
    const newNodeBtn = await page.$('.toolbar-btn.primary');
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 300));
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Position and setup nodes
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
          
          // Manually create a connection for testing
          state.addConnection(state.nodes[0].id, state.nodes[1].id);
          console.log('Connection created programmatically');
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if connection exists
    const connectionState = await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        return {
          connectionCount: state.connections.length,
          connections: state.connections.map(c => ({
            id: c.id,
            from: c.from,
            to: c.to,
            isSelected: c.isSelected
          }))
        };
      }
      return { connectionCount: 0, connections: [] };
    });
    
    console.log('📊 Connection state:', connectionState);
    
    // Take screenshot before selection
    await page.screenshot({ path: 'temp/debug-connection-selection.png' });
    console.log('📸 Screenshot saved: debug-connection-selection.png');
    
    if (connectionState.connectionCount > 0) {
      // Try clicking on the connection line
      console.log('🖱️ Attempting to select connection...');
      await page.click('canvas', { offsetX: 350, offsetY: 225 }); // Middle of connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check selection state after click
      const selectionAfterClick = await page.evaluate(() => {
        const store = window.useMindmapStore;
        if (store) {
          const state = store.getState();
          return {
            selectedConnectionId: state.selectedConnectionId,
            connections: state.connections.map(c => ({
              id: c.id,
              isSelected: c.isSelected
            })),
            canvasState: {
              isEditingConnection: state.canvas.isEditingConnection,
              editingConnectionId: state.canvas.editingConnectionId,
              editingEndpoint: state.canvas.editingEndpoint
            }
          };
        }
        return null;
      });
      
      console.log('📊 Selection after click:', selectionAfterClick);
      
      // Take screenshot after selection attempt
      await page.screenshot({ path: 'temp/debug-after-selection-attempt.png' });
      console.log('📸 Screenshot saved: debug-after-selection-attempt.png');
      
      // If selection didn't work, try manual selection
      if (!selectionAfterClick?.connections.some(c => c.isSelected)) {
        console.log('🔧 Manual selection attempt...');
        await page.evaluate(() => {
          const store = window.useMindmapStore;
          if (store) {
            const state = store.getState();
            if (state.connections.length > 0) {
              console.log('Manually selecting connection:', state.connections[0].id);
              state.selectConnection(state.connections[0].id);
            }
          }
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Take screenshot after manual selection
        await page.screenshot({ path: 'temp/debug-after-manual-selection.png' });
        console.log('📸 Screenshot saved: debug-after-manual-selection.png');
        
        // Check final state
        const finalState = await page.evaluate(() => {
          const store = window.useMindmapStore;
          if (store) {
            const state = store.getState();
            return {
              selectedConnectionId: state.selectedConnectionId,
              connections: state.connections.map(c => ({
                id: c.id,
                isSelected: c.isSelected
              }))
            };
          }
          return null;
        });
        
        console.log('📊 Final state:', finalState);
      }
    } else {
      console.log('❌ No connections found to test with');
    }
    
    console.log('\n🔍 Debug session completed!');
    
    // Keep browser open for manual inspection
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

debugConnectionSelection().catch(console.error);