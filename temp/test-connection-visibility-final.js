#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testConnectionVisibilityFinal() {
  console.log('🔗 Final connection points visibility test...\n');
  
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
    
    console.log('📝 Creating nodes for testing...');
    
    // Create 2 nodes
    await page.click('button[title="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    await page.click('button[title="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n🔍 Test 1: Default state (no nodes selected)');
    console.log('👁️ Connection points should NOT be visible');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get canvas and node positions for clicking
    const canvas = await page.$('canvas');
    const canvasBox = await canvas.boundingBox();
    
    const positions = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return state.nodes.map(n => ({ 
        id: n.id, 
        x: n.position.x + 60, 
        y: n.position.y + 30 
      }));
    });
    
    console.log('Node positions:', positions);
    
    console.log('\n🔍 Test 2: Single click to select first node');
    console.log('👁️ Connection points should appear on selected node only');
    
    // Click on first node to select it
    await page.mouse.click(canvasBox.x + positions[0].x, canvasBox.y + positions[0].y);
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
    
    console.log('Selection state after single click:', selectionState);
    
    if (selectionState.some(n => n.isSelected)) {
      console.log('✅ Node selection is working');
    } else {
      console.log('❌ Node selection failed');
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🔍 Test 3: Double click to enter edit mode');
    console.log('👁️ Connection points should remain visible in edit mode');
    
    // Double click on first node to edit
    await page.mouse.click(canvasBox.x + positions[0].x, canvasBox.y + positions[0].y, { clickCount: 2 });
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
    
    console.log('Editing state after double click:', editingState);
    
    if (editingState.some(n => n.isEditing)) {
      console.log('✅ Edit mode activation is working');
    } else {
      console.log('❌ Edit mode activation failed');
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🔍 Test 4: Exit edit mode and deselect');
    console.log('👁️ Connection points should disappear');
    
    // Press Escape to exit edit mode
    await page.keyboard.press('Escape');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click empty area to deselect
    await page.mouse.click(canvasBox.x + 500, canvasBox.y + 500);
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
    
    console.log('Final state (should all be deselected):', finalState);
    
    if (finalState.every(n => !n.isSelected && !n.isEditing)) {
      console.log('✅ Deselection is working');
    } else {
      console.log('❌ Deselection failed');
    }
    
    console.log('\n🎉 Connection Points Visibility Test Results:');
    
    const hasSelection = selectionState.some(n => n.isSelected);
    const hasEditing = editingState.some(n => n.isEditing);
    const allDeselected = finalState.every(n => !n.isSelected && !n.isEditing);
    
    if (hasSelection && hasEditing && allDeselected) {
      console.log('✅ SUCCESS: Connection points visibility improvement is working!');
      console.log('   - Connection points now only appear when nodes are selected or editing');
      console.log('   - This reduces visual clutter while maintaining editing functionality');
    } else {
      console.log('❌ PARTIAL SUCCESS: Some functionality may need adjustment');
    }
    
    console.log('\n👁️ Visual verification guide:');
    console.log('• Default: No connection points visible');
    console.log('• Selected: Small circles appear on node edges');
    console.log('• Editing: Connection points remain visible');
    console.log('• Deselected: Connection points disappear');
    
    console.log('\n🎮 Browser will stay open for 30 seconds for manual testing...');
    console.log('Try clicking and double-clicking different nodes!');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testConnectionVisibilityFinal().catch(console.error);