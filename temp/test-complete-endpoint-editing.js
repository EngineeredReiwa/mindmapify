#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testCompleteEndpointEditing() {
  console.log('🔄 Testing complete connection endpoint editing workflow...\n');
  
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
    
    // Setup test scenario - create 3 nodes with 1 connection
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      let state = store.getState();
      
      // Clear any existing state - reset to initial state
      
      // Add 3 nodes
      state.addNode({ x: 200, y: 200 }, 'Node A');
      state.addNode({ x: 500, y: 200 }, 'Node B');
      state.addNode({ x: 350, y: 350 }, 'Node C');
      
      state = store.getState();
      console.log('Added 3 nodes:', state.nodes.map(n => ({ id: n.id, text: n.text })));
      
      // Create connection A → B
      if (state.nodes.length >= 2) {
        state.addConnection(state.nodes[0].id, state.nodes[1].id);
        console.log('Created connection A → B');
        
        // Select the connection
        state = store.getState();
        if (state.connections.length > 0) {
          state.selectConnection(state.connections[0].id);
          console.log('Connection selected');
        }
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: 'temp/endpoint-test-initial.png' });
    console.log('📸 Initial state: endpoint-test-initial.png');
    
    // Get initial connection state
    const initialState = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      const connection = state.connections[0];
      return {
        connectionId: connection.id,
        fromNodeId: connection.from,
        toNodeId: connection.to,
        nodeIds: state.nodes.map(n => ({ id: n.id, text: n.text }))
      };
    });
    
    console.log('📊 Initial connection state:');
    console.log('- Connection from:', initialState.fromNodeId);
    console.log('- Connection to:', initialState.toNodeId);
    console.log('- Available nodes:', initialState.nodeIds);
    
    // Test 1: Click start handle to enter editing mode
    console.log('\n🎯 Test 1: Clicking start handle to edit endpoint...');
    
    const handleCoords = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      const canvasState = state.canvas;
      
      if (state.nodes.length >= 2) {
        const nodeA = state.nodes[0];
        const nodeB = state.nodes[1];
        
        // Calculate start handle screen position
        const fromCenter = {
          x: nodeA.position.x + nodeA.size.width / 2,
          y: nodeA.position.y + nodeA.size.height / 2,
        };
        const toCenter = {
          x: nodeB.position.x + nodeB.size.width / 2,
          y: nodeB.position.y + nodeB.size.height / 2,
        };
        
        const dx = toCenter.x - fromCenter.x;
        const dy = toCenter.y - fromCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const unitX = dx / distance;
          const unitY = dy / distance;
          
          const startPoint = {
            x: fromCenter.x + unitX * (nodeA.size.width / 2),
            y: fromCenter.y + unitY * (nodeA.size.height / 2),
          };
          
          // Convert to screen coordinates
          const startScreen = {
            x: startPoint.x * canvasState.zoom + canvasState.offset.x,
            y: startPoint.y * canvasState.zoom + canvasState.offset.y,
          };
          
          return startScreen;
        }
      }
      return null;
    });
    
    if (handleCoords) {
      console.log(`   Clicking start handle at (${handleCoords.x.toFixed(1)}, ${handleCoords.y.toFixed(1)})`);
      await page.mouse.click(handleCoords.x, handleCoords.y);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if editing mode is active
      const editingState = await page.evaluate(() => {
        const store = window.useMindmapStore;
        const state = store.getState();
        return {
          isEditingConnection: state.canvas.isEditingConnection,
          editingConnectionId: state.canvas.editingConnectionId,
          editingEndpoint: state.canvas.editingEndpoint
        };
      });
      
      console.log('📊 Editing state:', editingState);
      
      if (editingState.isEditingConnection && editingState.editingEndpoint === 'start') {
        console.log('✅ Step 1 SUCCESS: Endpoint editing mode activated!');
        
        // Test 2: Click on Node C to change the start point
        console.log('\n🎯 Test 2: Clicking Node C to change connection start point...');
        
        const nodeCCoords = await page.evaluate(() => {
          const store = window.useMindmapStore;
          const state = store.getState();
          const nodeC = state.nodes[2]; // Node C
          const canvasState = state.canvas;
          
          if (nodeC) {
            const centerC = {
              x: nodeC.position.x + nodeC.size.width / 2,
              y: nodeC.position.y + nodeC.size.height / 2,
            };
            
            // Convert to screen coordinates
            const centerScreen = {
              x: centerC.x * canvasState.zoom + canvasState.offset.x,
              y: centerC.y * canvasState.zoom + canvasState.offset.y,
            };
            
            return centerScreen;
          }
          return null;
        });
        
        if (nodeCCoords) {
          console.log(`   Clicking Node C at (${nodeCCoords.x.toFixed(1)}, ${nodeCCoords.y.toFixed(1)})`);
          await page.mouse.click(nodeCCoords.x, nodeCCoords.y);
          await new Promise(resolve => setTimeout(resolve, 1500)); // Increased delay to allow state update
          
          // Check final connection state
          const finalState = await page.evaluate(() => {
            const store = window.useMindmapStore;
            const state = store.getState();
            const connection = state.connections[0];
            return {
              connectionFrom: connection?.from,
              connectionTo: connection?.to,
              isEditingConnection: state.canvas.isEditingConnection,
              nodeTexts: state.nodes.map(n => ({ id: n.id, text: n.text }))
            };
          });
          
          console.log('📊 Final connection state:', finalState);
          
          await page.screenshot({ path: 'temp/endpoint-test-final.png' });
          console.log('📸 Final state: endpoint-test-final.png');
          
          // Verify the connection changed
          const nodeCId = finalState.nodeTexts.find(n => n.text === 'Node C')?.id;
          const nodeBId = finalState.nodeTexts.find(n => n.text === 'Node B')?.id;
          
          if (finalState.connectionFrom === nodeCId && finalState.connectionTo === nodeBId) {
            console.log('✅ Step 2 SUCCESS: Connection endpoint successfully changed from A→B to C→B!');
            console.log('✅ COMPLETE WORKFLOW SUCCESS: Connection endpoint editing is fully functional!');
          } else {
            console.log('❌ Step 2 FAILED: Connection endpoint was not changed correctly');
            console.log('   Expected: C→B, Got:', 
              finalState.nodeTexts.find(n => n.id === finalState.connectionFrom)?.text + '→' +
              finalState.nodeTexts.find(n => n.id === finalState.connectionTo)?.text
            );
          }
          
          if (!finalState.isEditingConnection) {
            console.log('✅ Editing mode properly exited after endpoint change');
          } else {
            console.log('⚠️  Editing mode still active - should have exited');
          }
        }
        
      } else {
        console.log('❌ Step 1 FAILED: Endpoint editing mode not activated');
      }
    }
    
    console.log('\n🔄 Complete endpoint editing test completed!');
    console.log('Browser will stay open for 10 seconds for manual inspection...');
    
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testCompleteEndpointEditing().catch(console.error);