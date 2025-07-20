#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testEndpointFinal() {
  console.log('🎉 Final connection endpoint editing test...\n');
  
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
    
    // Manual test - setup and capture state
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      let state = store.getState();
      
      // Create simple test scenario
      state.addNode({ x: 200, y: 200 }, 'A');
      state.addNode({ x: 500, y: 200 }, 'B'); 
      state.addNode({ x: 350, y: 350 }, 'C');
      
      state = store.getState();
      state.addConnection(state.nodes[0].id, state.nodes[1].id);
      
      state = store.getState();
      state.selectConnection(state.connections[0].id);
      
      console.log('Initial connection: A → B');
      console.log('Connection from:', state.connections[0].from);
      console.log('Connection to:', state.connections[0].to);
      console.log('Nodes:', state.nodes.map(n => ({ id: n.id, text: n.text })));
    });
    
    console.log('\n📸 Taking screenshot of initial state...');
    await page.screenshot({ path: 'temp/final-test-initial.png' });
    
    console.log('\n🎯 Click start handle at screen position (320, 230)...');
    await page.mouse.click(320, 230);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const editingState = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return {
        isEditingConnection: state.canvas.isEditingConnection,
        editingEndpoint: state.canvas.editingEndpoint
      };
    });
    
    console.log('📊 Editing state:', editingState);
    
    if (editingState.isEditingConnection) {
      console.log('✅ Step 1 SUCCESS: Handle click activated editing mode');
      
      console.log('\n🎯 Click Node C at screen position (410, 380)...');
      await page.mouse.click(410, 380);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const finalState = await page.evaluate(() => {
        const store = window.useMindmapStore;
        const state = store.getState();
        const connection = state.connections[0];
        return {
          connectionFrom: connection?.from,
          connectionTo: connection?.to,
          isEditingConnection: state.canvas.isEditingConnection,
          nodeMap: state.nodes.reduce((map, node) => {
            map[node.id] = node.text;
            return map;
          }, {})
        };
      });
      
      console.log('📊 Final state:', finalState);
      
      const fromText = finalState.nodeMap[finalState.connectionFrom];
      const toText = finalState.nodeMap[finalState.connectionTo];
      console.log(`🔗 Final connection: ${fromText} → ${toText}`);
      
      if (fromText === 'C' && toText === 'B') {
        console.log('🎉 SUCCESS! Connection endpoint editing is working!');
        console.log('✅ Connection changed from A→B to C→B');
        console.log('✅ Editing mode properly exited:', !finalState.isEditingConnection);
      } else {
        console.log('❌ Connection endpoint was not changed correctly');
        console.log(`   Expected: C→B, Got: ${fromText}→${toText}`);
      }
      
    } else {
      console.log('❌ Step 1 FAILED: Handle click did not activate editing mode');
    }
    
    console.log('\n📸 Taking final screenshot...');
    await page.screenshot({ path: 'temp/final-test-result.png' });
    
    console.log('\n🎉 Test completed! Check screenshots for visual confirmation.');
    console.log('Browser will stay open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testEndpointFinal().catch(console.error);