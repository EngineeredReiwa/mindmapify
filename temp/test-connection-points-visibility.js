#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testConnectionPointsVisibility() {
  console.log('🔗 Testing connection points visibility improvement...\n');
  
  const browser = await puppeteer.launch({ 
    headless: "new", // バックグラウンド実行（ブラウザ非表示）
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
    
    console.log('📝 Creating multiple nodes to test connection point visibility...');
    
    // Create 3 nodes
    for (let i = 1; i <= 3; i++) {
      await page.click('button[title="Add new node"]');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\\n🔍 Test 1: Default state (no selection)...');
    console.log('Expected: Connection points should NOT be visible');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\\n🔍 Test 2: Selecting a node...');
    console.log('Expected: Connection points should be visible ONLY on selected node');
    
    // Click on first node to select it
    const nodePositions = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return state.nodes.map(n => ({ 
        id: n.id, 
        x: n.position.x + 60, 
        y: n.position.y + 30 
      }));
    });
    
    console.log('Node positions:', nodePositions);
    
    // Click on first node
    await page.mouse.click(nodePositions[0].x, nodePositions[0].y);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const selectionState = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return state.nodes.map(n => ({ 
        id: n.id, 
        isSelected: n.isSelected,
        isEditing: n.isEditing 
      }));
    });
    
    console.log('Selection state:', selectionState);
    
    console.log('\\n🔍 Test 3: Entering edit mode...');
    console.log('Expected: Connection points should be visible on editing node');
    
    // Double click to enter edit mode
    await page.mouse.click(nodePositions[0].x, nodePositions[0].y, { clickCount: 2 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const editingState = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return state.nodes.map(n => ({ 
        id: n.id, 
        isSelected: n.isSelected,
        isEditing: n.isEditing 
      }));
    });
    
    console.log('Editing state:', editingState);
    
    console.log('\\n🔍 Test 4: Exiting edit mode...');
    console.log('Expected: Connection points should disappear after exiting edit');
    
    // Press Escape to exit edit mode
    await page.keyboard.press('Escape');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click empty area to deselect
    await page.mouse.click(500, 500);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const finalState = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return state.nodes.map(n => ({ 
        id: n.id, 
        isSelected: n.isSelected,
        isEditing: n.isEditing 
      }));
    });
    
    console.log('Final state (all deselected):', finalState);
    
    // Analysis
    console.log('\\n🎉 Test Results:');
    
    const hasSelectedNode = selectionState.some(n => n.isSelected);
    const hasEditingNode = editingState.some(n => n.isEditing);
    const allDeselected = finalState.every(n => !n.isSelected && !n.isEditing);
    
    if (hasSelectedNode) {
      console.log('✅ Node selection is working');
    } else {
      console.log('❌ Node selection failed');
    }
    
    if (hasEditingNode) {
      console.log('✅ Edit mode activation is working');
    } else {
      console.log('❌ Edit mode activation failed');
    }
    
    if (allDeselected) {
      console.log('✅ Deselection is working');
    } else {
      console.log('❌ Deselection failed');
    }
    
    console.log('\\n👁️ Visual verification needed:');
    console.log('- Connection points should only appear when nodes are selected/editing');
    console.log('- This improves visual clarity by reducing clutter');
    console.log('- Better balance between editing capability and visual cleanliness');
    
    console.log('\\n🎮 Browser will stay open for 20 seconds for visual inspection...');
    console.log('Try selecting different nodes and entering edit mode to see the effect!');
    await new Promise(resolve => setTimeout(resolve, 20000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testConnectionPointsVisibility().catch(console.error);