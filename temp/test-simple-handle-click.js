#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testSimpleHandleClick() {
  console.log('🔍 Testing simple handle click detection...\n');
  
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
      state.addNode({ x: 350, y: 350 }, 'Node C');
      
      state = store.getState();
      if (state.nodes.length >= 2) {
        state.addConnection(state.nodes[0].id, state.nodes[1].id);
        
        // Select the connection
        state = store.getState();
        if (state.connections.length > 0) {
          state.selectConnection(state.connections[0].id);
          console.log('Connection selected for handle testing');
        }
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot
    await page.screenshot({ path: 'temp/simple-handle-test.png' });
    console.log('📸 Screenshot: simple-handle-test.png');
    
    // Get exact handle coordinates
    const handleCoords = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      
      if (state.connections.length > 0 && state.nodes.length >= 2) {
        const nodeA = state.nodes[0];
        const nodeB = state.nodes[1];
        
        const startPoint = {
          x: nodeA.position.x + nodeA.size.width / 2,
          y: nodeA.position.y + nodeA.size.height / 2,
        };
        
        const endPoint = {
          x: nodeB.position.x + nodeB.size.width / 2,
          y: nodeB.position.y + nodeB.size.height / 2,
        };
        
        console.log('Handle coordinates calculated:');
        console.log('Start (red):', startPoint);
        console.log('End (blue):', endPoint);
        
        return { startPoint, endPoint };
      }
      
      return null;
    });
    
    if (handleCoords) {
      console.log('🎯 Testing start handle click...');
      
      // Click on start handle
      await page.mouse.click(handleCoords.startPoint.x, handleCoords.startPoint.y);
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
      
      console.log('📊 Editing state after start handle click:', editingState);
      
      if (editingState.isEditingConnection) {
        console.log('✅ SUCCESS! Start handle click worked!');
        
        // Test end point change by clicking Node C
        console.log('🎯 Testing connection endpoint change to Node C...');
        
        const nodeCCoords = await page.evaluate(() => {
          const store = window.useMindmapStore;
          const state = store.getState();
          const nodeC = state.nodes[2]; // Node C
          
          if (nodeC) {
            const centerC = {
              x: nodeC.position.x + nodeC.size.width / 2,
              y: nodeC.position.y + nodeC.size.height / 2,
            };
            console.log('Node C center:', centerC);
            return centerC;
          }
          return null;
        });
        
        if (nodeCCoords) {
          await page.mouse.click(nodeCCoords.x, nodeCCoords.y);
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check final connection state
          const finalState = await page.evaluate(() => {
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
          
          console.log('📊 Final connection state:', finalState);
          
          await page.screenshot({ path: 'temp/simple-handle-test-after.png' });
          console.log('📸 After screenshot: simple-handle-test-after.png');
          
          if (!finalState.isEditingConnection) {
            console.log('✅ CONNECTION ENDPOINT SUCCESSFULLY CHANGED!');
          }
        }
        
      } else {
        console.log('❌ Start handle click failed - no editing mode activated');
        
        // Test end handle as well
        console.log('🎯 Testing end handle click...');
        await page.mouse.click(handleCoords.endPoint.x, handleCoords.endPoint.y);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const endEditingState = await page.evaluate(() => {
          const store = window.useMindmapStore;
          const state = store.getState();
          return {
            isEditingConnection: state.canvas.isEditingConnection,
            editingConnectionId: state.canvas.editingConnectionId,
            editingEndpoint: state.canvas.editingEndpoint
          };
        });
        
        console.log('📊 Editing state after end handle click:', endEditingState);
        
        if (endEditingState.isEditingConnection) {
          console.log('✅ End handle click worked!');
        } else {
          console.log('❌ End handle click also failed');
        }
      }
    }
    
    console.log('\n🔍 Simple handle click test completed!');
    console.log('Browser will stay open for 10 seconds for manual inspection...');
    
    // Keep browser open for manual testing
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testSimpleHandleClick().catch(console.error);