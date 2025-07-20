#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testConnectionEndpointEditing() {
  console.log('🔗 Connection Endpoint Editing Test Starting...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
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
    
    // Create three nodes
    console.log('🖱️ Creating three nodes...');
    const newNodeBtn = await page.$('.toolbar-btn.primary');
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 300));
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 300));
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Position the nodes
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        if (state.nodes.length >= 3) {
          state.updateNode(state.nodes[0].id, { 
            position: { x: 200, y: 200 },
            text: 'Node A'
          });
          state.updateNode(state.nodes[1].id, { 
            position: { x: 400, y: 200 },
            text: 'Node B'
          });
          state.updateNode(state.nodes[2].id, { 
            position: { x: 600, y: 300 },
            text: 'Node C'
          });
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create connection: A -> B
    console.log('🔗 Creating connection A -> B...');
    await page.click('canvas', { offsetX: 320, offsetY: 225 }); // Node A right connection point
    await new Promise(resolve => setTimeout(resolve, 100));
    await page.click('canvas', { offsetX: 400, offsetY: 225 }); // Node B left connection point
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot of initial setup
    await page.screenshot({ path: 'temp/endpoint-01-initial-setup.png' });
    console.log('📸 Screenshot saved: endpoint-01-initial-setup.png');
    
    // Check initial connection
    const initialConnection = await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        const conn = state.connections[0];
        return conn ? { from: conn.from, to: conn.to } : null;
      }
      return null;
    });
    
    console.log('📊 Initial connection:', initialConnection);
    
    // Select the connection by clicking on it
    console.log('🖱️ Selecting the connection...');
    await page.click('canvas', { offsetX: 360, offsetY: 225 }); // Middle of connection line
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot showing selected connection with handles
    await page.screenshot({ path: 'temp/endpoint-02-connection-selected.png' });
    console.log('📸 Screenshot saved: endpoint-02-connection-selected.png');
    
    // Click on the end point handle (right side, red handle)
    console.log('🎯 Clicking on end point handle...');
    await page.click('canvas', { offsetX: 460, offsetY: 225 }); // End point handle
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot showing editing mode
    await page.screenshot({ path: 'temp/endpoint-03-editing-mode.png' });
    console.log('📸 Screenshot saved: endpoint-03-editing-mode.png');
    
    // Click on Node C to change the connection endpoint
    console.log('🔄 Changing connection endpoint to Node C...');
    await page.click('canvas', { offsetX: 600, offsetY: 325 }); // Node C left connection point
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take screenshot showing updated connection
    await page.screenshot({ path: 'temp/endpoint-04-connection-updated.png' });
    console.log('📸 Screenshot saved: endpoint-04-connection-updated.png');
    
    // Check final connection
    const finalConnection = await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        const conn = state.connections[0];
        return conn ? { from: conn.from, to: conn.to } : null;
      }
      return null;
    });
    
    console.log('📊 Final connection:', finalConnection);
    
    // Evaluate results
    console.log('\n📋 Test Results:');
    console.log(`✅ Initial connection created: ${initialConnection ? 'YES' : 'NO'}`);
    console.log(`✅ Connection handles visible when selected: Visual confirmation needed`);
    console.log(`✅ Endpoint successfully changed: ${
      initialConnection && finalConnection && 
      initialConnection.from === finalConnection.from && 
      initialConnection.to !== finalConnection.to ? 'YES' : 'NO'
    }`);
    
    if (initialConnection && finalConnection && 
        initialConnection.from === finalConnection.from && 
        initialConnection.to !== finalConnection.to) {
      console.log('\n🎉 SUCCESS: Connection endpoint editing is working!');
      console.log(`📊 Connection changed from: ${initialConnection.from} -> ${initialConnection.to}`);
      console.log(`📊 Connection changed to: ${finalConnection.from} -> ${finalConnection.to}`);
    } else {
      console.log('\n⚠️ ISSUE: Connection endpoint editing needs verification');
    }
    
    console.log('\n🔗 Connection endpoint editing test completed!');
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testConnectionEndpointEditing().catch(console.error);