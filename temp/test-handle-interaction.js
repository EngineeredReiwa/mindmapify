#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testHandleInteraction() {
  console.log('🔍 Testing handle click and drag interaction...\n');
  
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
      state.addNode({ x: 350, y: 350 }, 'Node C'); // Third node for testing
      
      state = store.getState();
      if (state.nodes.length >= 2) {
        state.addConnection(state.nodes[0].id, state.nodes[1].id);
        
        // Select the connection to show handles
        state = store.getState();
        if (state.connections.length > 0) {
          state.selectConnection(state.connections[0].id);
          console.log('Connection selected, handles should be visible');
        }
      }
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot showing handles
    await page.screenshot({ path: 'temp/interaction-01-setup.png' });
    console.log('📸 Setup complete: interaction-01-setup.png');
    
    // Test 1: Try clicking start handle (green one at x=200, y=200)
    console.log('🖱️ Test 1: Clicking start handle (green)...');
    await page.mouse.click(200, 200);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if editing mode activated
    const editingState1 = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return {
        isEditingConnection: state.canvas.isEditingConnection,
        editingConnectionId: state.canvas.editingConnectionId,
        editingEndpoint: state.canvas.editingEndpoint
      };
    });
    
    console.log('📊 After start handle click:', editingState1);
    
    if (editingState1.isEditingConnection) {
      console.log('✅ Start handle click worked!');
      
      // Test 2: Try dragging to Node C
      console.log('🖱️ Test 2: Dragging to Node C...');
      await page.mouse.click(350, 350); // Click on Node C
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if connection was updated
      const connectionState = await page.evaluate(() => {
        const store = window.useMindmapStore;
        const state = store.getState();
        const connection = state.connections[0];
        return {
          connectionFrom: connection?.from,
          connectionTo: connection?.to,
          nodeIds: state.nodes.map(n => ({ id: n.id, text: n.text }))
        };
      });
      
      console.log('📊 Connection after drag:', connectionState);
      
      await page.screenshot({ path: 'temp/interaction-02-after-drag.png' });
      console.log('📸 After drag: interaction-02-after-drag.png');
      
    } else {
      console.log('❌ Start handle click failed');
      
      // Try alternative: Click slightly offset from handle
      console.log('🖱️ Trying alternative click positions...');
      const positions = [
        { x: 198, y: 198, desc: 'slightly up-left' },
        { x: 202, y: 202, desc: 'slightly down-right' },
        { x: 200, y: 195, desc: 'above handle' },
        { x: 200, y: 205, desc: 'below handle' }
      ];
      
      for (const pos of positions) {
        console.log(`   Trying ${pos.desc} (${pos.x}, ${pos.y})...`);
        await page.mouse.click(pos.x, pos.y);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const testState = await page.evaluate(() => {
          const store = window.useMindmapStore;
          const state = store.getState();
          return state.canvas.isEditingConnection;
        });
        
        if (testState) {
          console.log(`✅ Success with ${pos.desc}!`);
          break;
        }
      }
    }
    
    // Test 3: Check event listeners and handle properties
    console.log('🔍 Test 3: Checking handle properties...');
    const handleInfo = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return { error: 'No canvas found' };
      
      // Get Konva stage
      const stage = canvas._konva_stage || canvas.stage;
      if (!stage) return { error: 'No Konva stage found' };
      
      // Find connection handles
      const handles = [];
      stage.find('.start-handle').forEach(handle => {
        handles.push({
          name: handle.name(),
          x: handle.x(),
          y: handle.y(),
          radius: handle.radius(),
          fill: handle.fill(),
          listening: handle.listening(),
          visible: handle.visible()
        });
      });
      
      stage.find('.end-handle').forEach(handle => {
        handles.push({
          name: handle.name(),
          x: handle.x(),
          y: handle.y(),
          radius: handle.radius(),
          fill: handle.fill(),
          listening: handle.listening(),
          visible: handle.visible()
        });
      });
      
      return { handles };
    });
    
    console.log('📊 Handle properties:', JSON.stringify(handleInfo, null, 2));
    
    console.log('\n🔍 Handle interaction test completed!');
    
    // Keep browser open for manual testing
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testHandleInteraction().catch(console.error);