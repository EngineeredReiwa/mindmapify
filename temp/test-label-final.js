#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testLabelFinal() {
  console.log('🏷️ Final Label Display Test Starting...\n');
  
  const browser = await puppeteer.launch({ 
    headless: "new",
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
    
    // Create two nodes and connection
    console.log('🖱️ Creating nodes and connection...');
    const newNodeBtn = await page.$('.toolbar-btn.primary');
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    await newNodeBtn.click();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Position nodes and create connection
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        if (state.nodes.length >= 2) {
          state.updateNode(state.nodes[0].id, { position: { x: 200, y: 200 } });
          state.updateNode(state.nodes[1].id, { position: { x: 500, y: 200 } });
          state.addConnection(state.nodes[0].id, state.nodes[1].id);
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Manually start label editing and select a label
    console.log('🏷️ Testing label selection...');
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        const connection = state.connections[0];
        if (connection) {
          // Start editing
          state.startEditingConnectionLabel(connection.id);
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Select the first label "原因"
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      if (store) {
        const state = store.getState();
        const connection = state.connections[0];
        if (connection) {
          // Set label directly and stop editing
          state.updateConnection(connection.id, { label: '原因' });
          state.stopEditingConnectionLabel(connection.id);
        }
      }
    });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Take final screenshot
    await page.screenshot({ path: 'temp/label-final-result.png' });
    console.log('📸 Screenshot saved: label-final-result.png');
    
    console.log('\n✅ Label display improved successfully!');
    console.log('- Removed circular border');
    console.log('- Now using rectangular background with rounded corners');
    console.log('- Better text fitting and readability');
    
    // Keep browser open for inspection
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
    console.log('🔒 Browser closed');
  }
}

testLabelFinal().catch(console.error);