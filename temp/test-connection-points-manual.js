#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testConnectionPointsManual() {
  console.log('🔗 Manual connection points visibility test...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    await page.goto('http://localhost:5174', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('canvas');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📝 Creating 2 nodes for testing...');
    
    // Create 2 nodes
    await page.click('button[title="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.click('button[title="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('\n🔍 Test: Manual verification of connection points visibility...');
    console.log('👁️ Look for connection points (small circles) on the nodes');
    console.log('🎯 They should only appear when nodes are selected or in edit mode');
    
    // Get node positions for manual clicking
    const positions = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return state.nodes.map(n => ({ 
        id: n.id, 
        x: n.position.x + 60, 
        y: n.position.y + 30 
      }));
    });
    
    console.log('Node click areas:', positions);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n📝 Clicking on first node to select it...');
    
    // Use evaluate to click the node directly in the canvas
    await page.evaluate((nodeX, nodeY) => {
      const canvas = document.querySelector('canvas');
      const rect = canvas.getBoundingClientRect();
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + nodeX,
        clientY: rect.top + nodeY
      });
      canvas.dispatchEvent(event);
    }, positions[0].x, positions[0].y);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check selection state
    const selectionState = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return state.nodes.map(n => ({ 
        id: n.id, 
        isSelected: n.isSelected,
        isEditing: n.isEditing 
      }));
    });
    
    console.log('Selection state after click:', selectionState);
    
    console.log('\n👁️ Now check if connection points appear only on the selected node!');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n📝 Double-clicking to enter edit mode...');
    
    // Double click to enter edit mode
    await page.evaluate((nodeX, nodeY) => {
      const canvas = document.querySelector('canvas');
      const rect = canvas.getBoundingClientRect();
      const event = new MouseEvent('dblclick', {
        bubbles: true,
        cancelable: true,
        clientX: rect.left + nodeX,
        clientY: rect.top + nodeY
      });
      canvas.dispatchEvent(event);
    }, positions[0].x, positions[0].y);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const editingState = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return state.nodes.map(n => ({ 
        id: n.id, 
        isSelected: n.isSelected,
        isEditing: n.isEditing 
      }));
    });
    
    console.log('Editing state after double-click:', editingState);
    
    console.log('\n👁️ Check if connection points are still visible in edit mode!');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\n📝 Pressing Escape to exit edit mode...');
    await page.keyboard.press('Escape');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n📝 Clicking empty area to deselect...');
    await page.mouse.click(500, 500);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const finalState = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return state.nodes.map(n => ({ 
        id: n.id, 
        isSelected: n.isSelected,
        isEditing: n.isEditing 
      }));
    });
    
    console.log('Final state (should all be deselected):', finalState);
    console.log('\n👁️ Check that connection points are now hidden!');
    
    console.log('\n🎉 Summary of what to check:');
    console.log('✅ Connection points should be hidden when no node is selected');
    console.log('✅ Connection points should appear when node is selected');
    console.log('✅ Connection points should remain visible when node is in edit mode');
    console.log('✅ Connection points should disappear when node is deselected');
    
    console.log('\n🎮 Browser will stay open for 30 seconds for manual verification...');
    console.log('Try clicking on different nodes to see the connection points appear/disappear!');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testConnectionPointsManual().catch(console.error);