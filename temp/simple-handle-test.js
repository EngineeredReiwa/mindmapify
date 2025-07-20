#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function simpleHandleTest() {
  console.log('🎯 Simple Handle Test Starting...\n');
  
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step by step setup
    console.log('🖱️ Step 1: Creating nodes...');
    const newNodeBtn = await page.$('.toolbar-btn.primary');
    
    // Create Node A
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create Node B  
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Position nodes
    console.log('📍 Step 2: Positioning nodes...');
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      
      if (state.nodes.length >= 2) {
        console.log('Setting positions for', state.nodes.length, 'nodes');
        state.updateNode(state.nodes[0].id, { 
          position: { x: 200, y: 200 },
          text: 'Node A'
        });
        state.updateNode(state.nodes[1].id, { 
          position: { x: 500, y: 200 },
          text: 'Node B'
        });
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create connection
    console.log('🔗 Step 3: Creating connection...');
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      
      if (state.nodes.length >= 2) {
        console.log('Creating connection between:', state.nodes[0].id, '->', state.nodes[1].id);
        state.addConnection(state.nodes[0].id, state.nodes[1].id);
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Select connection
    console.log('🎯 Step 4: Selecting connection...');
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      
      if (state.connections.length > 0) {
        console.log('Selecting connection:', state.connections[0].id);
        state.selectConnection(state.connections[0].id);
      } else {
        console.log('No connections found!');
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot showing handles
    await page.screenshot({ path: 'temp/simple-handles-visible.png' });
    console.log('📸 Screenshot saved: simple-handles-visible.png');
    
    // Check final state
    const state = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const currentState = store.getState();
      
      return {
        nodeCount: currentState.nodes.length,
        connectionCount: currentState.connections.length,
        selectedConnectionId: currentState.selectedConnectionId,
        isConnectionSelected: currentState.connections.length > 0 ? currentState.connections[0].isSelected : false,
        canvasState: {
          isEditingConnection: currentState.canvas.isEditingConnection,
          editingConnectionId: currentState.canvas.editingConnectionId
        }
      };
    });
    
    console.log('📊 Final state:', state);
    
    if (state.isConnectionSelected) {
      console.log('✅ SUCCESS: Connection is selected and handles should be visible!');
      console.log('👀 Check the screenshot to see the green and red handles on the connection line');
    } else {
      console.log('❌ Connection selection failed');
    }
    
    console.log('\n🎯 Simple handle test completed!');
    console.log('📝 Instructions for manual testing:');
    console.log('   1. Look for green (start) and red/blue (end) circles on the connection line');
    console.log('   2. Try clicking on these handles to enter editing mode');
    console.log('   3. The handle should turn yellow when editing mode is active');
    
    // Keep browser open for manual testing
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

simpleHandleTest().catch(console.error);