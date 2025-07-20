#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function debugHandleCoordinates() {
  console.log('🔍 Debugging handle coordinate calculations...\n');
  
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
    
    // Setup test scenario
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      let state = store.getState();
      
      // Add nodes and connection
      state.addNode({ x: 200, y: 200 }, 'Node A');
      state.addNode({ x: 500, y: 200 }, 'Node B');
      
      state = store.getState();
      if (state.nodes.length >= 2) {
        state.addConnection(state.nodes[0].id, state.nodes[1].id);
        
        // Select the connection
        state = store.getState();
        if (state.connections.length > 0) {
          state.selectConnection(state.connections[0].id);
          console.log('Connection selected for coordinate debugging');
        }
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Get detailed coordinate information
    const coordinateInfo = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      
      if (state.connections.length > 0 && state.nodes.length >= 2) {
        const nodeA = state.nodes[0];
        const nodeB = state.nodes[1];
        const canvasState = state.canvas;
        
        console.log('=== NODE POSITIONS ===');
        console.log('Node A:', { 
          position: nodeA.position, 
          size: nodeA.size,
          text: nodeA.text 
        });
        console.log('Node B:', { 
          position: nodeB.position, 
          size: nodeB.size,
          text: nodeB.text 
        });
        
        console.log('=== CANVAS STATE ===');
        console.log('Canvas offset:', canvasState.offset);
        console.log('Canvas zoom:', canvasState.zoom);
        
        // Calculate centers
        const fromCenter = {
          x: nodeA.position.x + nodeA.size.width / 2,
          y: nodeA.position.y + nodeA.size.height / 2,
        };
        const toCenter = {
          x: nodeB.position.x + nodeB.size.width / 2,
          y: nodeB.position.y + nodeB.size.height / 2,
        };
        
        console.log('=== CENTER POSITIONS ===');
        console.log('From center:', fromCenter);
        console.log('To center:', toCenter);
        
        // Calculate edge points (same as Canvas.tsx logic)
        const dx = toCenter.x - fromCenter.x;
        const dy = toCenter.y - fromCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        console.log('=== DISTANCE CALCULATION ===');
        console.log('dx:', dx, 'dy:', dy, 'distance:', distance);
        
        if (distance > 0) {
          const unitX = dx / distance;
          const unitY = dy / distance;
          
          console.log('Unit vector:', { unitX, unitY });
          
          // Calculate edge offset (half node size)
          const fromEdgeOffset = {
            x: unitX * (nodeA.size.width / 2),
            y: unitY * (nodeA.size.height / 2),
          };
          
          const toEdgeOffset = {
            x: unitX * (nodeB.size.width / 2),
            y: unitY * (nodeB.size.height / 2),
          };
          
          console.log('Edge offsets:', { fromEdgeOffset, toEdgeOffset });
          
          const startPoint = {
            x: fromCenter.x + fromEdgeOffset.x,
            y: fromCenter.y + fromEdgeOffset.y,
          };
          
          const endPoint = {
            x: toCenter.x - toEdgeOffset.x,
            y: toCenter.y - toEdgeOffset.y,
          };
          
          console.log('=== HANDLE POSITIONS (Canvas coordinates) ===');
          console.log('Start handle:', startPoint);
          console.log('End handle:', endPoint);
          
          // Convert to screen coordinates
          const startScreen = {
            x: startPoint.x * canvasState.zoom + canvasState.offset.x,
            y: startPoint.y * canvasState.zoom + canvasState.offset.y,
          };
          
          const endScreen = {
            x: endPoint.x * canvasState.zoom + canvasState.offset.x,
            y: endPoint.y * canvasState.zoom + canvasState.offset.y,
          };
          
          console.log('=== HANDLE POSITIONS (Screen coordinates) ===');
          console.log('Start handle screen:', startScreen);
          console.log('End handle screen:', endScreen);
          
          return {
            nodeA: { position: nodeA.position, size: nodeA.size },
            nodeB: { position: nodeB.position, size: nodeB.size },
            canvasState: { offset: canvasState.offset, zoom: canvasState.zoom },
            centers: { fromCenter, toCenter },
            handles: { startPoint, endPoint },
            handleScreen: { startScreen, endScreen }
          };
        }
      }
      
      return null;
    });
    
    if (coordinateInfo) {
      console.log('\n🎯 Now testing clicks at calculated screen coordinates...');
      
      // Test clicking at exact screen coordinates
      const { startScreen, endScreen } = coordinateInfo.handleScreen;
      
      console.log(`\n🟢 Testing click at start handle screen position: (${startScreen.x.toFixed(1)}, ${startScreen.y.toFixed(1)})`);
      await page.mouse.click(startScreen.x, startScreen.y);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check editing state
      const editingState = await page.evaluate(() => {
        const store = window.useMindmapStore;
        const state = store.getState();
        return {
          isEditingConnection: state.canvas.isEditingConnection,
          editingConnectionId: state.canvas.editingConnectionId,
          editingEndpoint: state.canvas.editingEndpoint
        };
      });
      
      console.log('📊 Editing state after start handle click:', editingState);
      
      if (editingState.isEditingConnection) {
        console.log('✅ SUCCESS! Handle click detection is working!');
      } else {
        console.log('❌ Still not working - debugging further...');
      }
    }
    
    console.log('\n🔍 Coordinate debugging completed!');
    console.log('Browser will stay open for 30 seconds for manual inspection...');
    
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugHandleCoordinates().catch(console.error);