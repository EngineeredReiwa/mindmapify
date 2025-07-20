#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testExactCoordinates() {
  console.log('🔍 Testing with exact handle coordinates...\n');
  
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
    
    // Setup and get exact coordinates
    const coords = await page.evaluate(() => {
      const store = window.useMindmapStore;
      let state = store.getState();
      
      // Add nodes and connection
      state.addNode({ x: 200, y: 200 }, 'Node A');
      state.addNode({ x: 500, y: 200 }, 'Node B');
      state.addNode({ x: 350, y: 350 }, 'Node C');
      
      state = store.getState();
      if (state.nodes.length >= 2) {
        state.addConnection(state.nodes[0].id, state.nodes[1].id);
        
        // Select the connection
        state = store.getState();
        if (state.connections.length > 0) {
          state.selectConnection(state.connections[0].id);
          
          // Get final state with exact coordinates
          const finalState = store.getState();
          const nodeA = finalState.nodes[0];
          const nodeB = finalState.nodes[1];
          
          // Calculate exact handle positions (same logic as Canvas.tsx)
          const startPoint = {
            x: nodeA.position.x + nodeA.size.width / 2,
            y: nodeA.position.y + nodeA.size.height / 2,
          };
          
          const endPoint = {
            x: nodeB.position.x + nodeB.size.width / 2,
            y: nodeB.position.y + nodeB.size.height / 2,
          };
          
          // Account for canvas offset and zoom
          const canvasOffset = finalState.canvas.offset;
          const canvasZoom = finalState.canvas.zoom;
          
          const screenStartPoint = {
            x: startPoint.x * canvasZoom + canvasOffset.x,
            y: startPoint.y * canvasZoom + canvasOffset.y,
          };
          
          const screenEndPoint = {
            x: endPoint.x * canvasZoom + canvasOffset.x,
            y: endPoint.y * canvasZoom + canvasOffset.y,
          };
          
          console.log('Canvas coordinates:', { startPoint, endPoint });
          console.log('Screen coordinates:', { screenStartPoint, screenEndPoint });
          console.log('Canvas state:', { offset: canvasOffset, zoom: canvasZoom });
          
          return { 
            success: true,
            startPoint,
            endPoint,
            screenStartPoint,
            screenEndPoint,
            canvasOffset,
            canvasZoom
          };
        }
      }
      
      return { success: false };
    });
    
    console.log('📊 Coordinate calculation result:', coords);
    
    if (coords.success) {
      // Take screenshot before click
      await page.screenshot({ path: 'temp/exact-coords-01-before.png' });
      console.log('📸 Before click: exact-coords-01-before.png');
      
      // Click on start handle using screen coordinates
      console.log('🖱️ Clicking start handle at screen coords:', coords.screenStartPoint);
      await page.mouse.click(coords.screenStartPoint.x, coords.screenStartPoint.y);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if editing mode activated
      const editingState = await page.evaluate(() => {
        const store = window.useMindmapStore;
        const state = store.getState();
        return {
          isEditingConnection: state.canvas.isEditingConnection,
          editingConnectionId: state.canvas.editingConnectionId,
          editingEndpoint: state.canvas.editingEndpoint
        };
      });
      
      console.log('📊 Editing state after click:', editingState);
      
      if (editingState.isEditingConnection) {
        console.log('✅ SUCCESS: Start handle click worked!');
        
        // Test drag to Node C
        console.log('🖱️ Testing drag to Node C...');
        const nodeCCoords = await page.evaluate(() => {
          const store = window.useMindmapStore;
          const state = store.getState();
          const nodeC = state.nodes[2]; // Node C
          
          if (nodeC) {
            const canvasCenterC = {
              x: nodeC.position.x + nodeC.size.width / 2,
              y: nodeC.position.y + nodeC.size.height / 2,
            };
            
            const screenCenterC = {
              x: canvasCenterC.x * state.canvas.zoom + state.canvas.offset.x,
              y: canvasCenterC.y * state.canvas.zoom + state.canvas.offset.y,
            };
            
            return { canvasCenterC, screenCenterC };
          }
          return null;
        });
        
        if (nodeCCoords) {
          console.log('Clicking on Node C at:', nodeCCoords.screenCenterC);
          await page.mouse.click(nodeCCoords.screenCenterC.x, nodeCCoords.screenCenterC.y);
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check if connection was updated
          const finalConnectionState = await page.evaluate(() => {
            const store = window.useMindmapStore;
            const state = store.getState();
            const connection = state.connections[0];
            return {
              connectionFrom: connection?.from,
              connectionTo: connection?.to,
              nodeIds: state.nodes.map(n => ({ id: n.id, text: n.text })),
              isEditingConnection: state.canvas.isEditingConnection
            };
          });
          
          console.log('📊 Final connection state:', finalConnectionState);
          
          await page.screenshot({ path: 'temp/exact-coords-02-after-drag.png' });
          console.log('📸 After drag: exact-coords-02-after-drag.png');
          
          if (!finalConnectionState.isEditingConnection) {
            console.log('✅ CONNECTION SUCCESSFULLY UPDATED!');
          }
        }
        
      } else {
        console.log('❌ Handle click still not working');
      }
    }
    
    console.log('\n🔍 Exact coordinates test completed!');
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 8000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testExactCoordinates().catch(console.error);