#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testUndoRedo() {
  console.log('↶↷ Testing Undo/Redo functionality...\n');
  
  const browser = await puppeteer.launch({ 
    headless: "new", // バックグラウンド実行（ブラウザ非表示）
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('canvas');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📝 Step 1: Creating a node...');
    await page.click('button[title="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const nodeCountAfterCreate = await page.evaluate(() => {
      return window.useMindmapStore.getState().nodes.length;
    });
    console.log('📊 Nodes after create:', nodeCountAfterCreate);
    
    console.log('🎯 Step 2: Selecting and moving the node...');
    // Click on the node to select it
    await page.click('canvas', { clickCount: 1 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Simulate drag to move the node
    const canvas = await page.$('canvas');
    const canvasBounds = await canvas.boundingBox();
    const centerX = canvasBounds.x + canvasBounds.width / 2;
    const centerY = canvasBounds.y + canvasBounds.height / 2;
    
    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + 100, centerY + 50); // Move 100px right, 50px down
    await page.mouse.up();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const positionAfterMove = await page.evaluate(() => {
      const state = window.useMindmapStore.getState();
      return state.nodes[0] ? state.nodes[0].position : null;
    });
    console.log('📊 Position after move:', positionAfterMove);
    
    console.log('📝 Step 3: Editing node text...');
    // Double click to enter edit mode
    await page.mouse.click(centerX + 100, centerY + 50, { clickCount: 2 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Type new text
    await page.keyboard.type('Updated Text');
    // Save with Ctrl+Enter
    await page.keyboard.down('Control');
    await page.keyboard.press('Enter');
    await page.keyboard.up('Control');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const textAfterEdit = await page.evaluate(() => {
      const state = window.useMindmapStore.getState();
      return state.nodes[0] ? state.nodes[0].text : null;
    });
    console.log('📊 Text after edit:', textAfterEdit);
    
    console.log('↶ Step 4: Testing Undo (should undo text change)...');
    await page.keyboard.down('Control');
    await page.keyboard.press('z');
    await page.keyboard.up('Control');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const stateAfterFirstUndo = await page.evaluate(() => {
      const state = window.useMindmapStore.getState();
      return {
        nodes: state.nodes.length,
        text: state.nodes[0] ? state.nodes[0].text : null,
        position: state.nodes[0] ? state.nodes[0].position : null
      };
    });
    console.log('📊 After first undo:', stateAfterFirstUndo);
    
    console.log('↶ Step 5: Testing second Undo (should undo position change)...');
    await page.keyboard.down('Control');
    await page.keyboard.press('z');
    await page.keyboard.up('Control');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const stateAfterSecondUndo = await page.evaluate(() => {
      const state = window.useMindmapStore.getState();
      return {
        nodes: state.nodes.length,
        text: state.nodes[0] ? state.nodes[0].text : null,
        position: state.nodes[0] ? state.nodes[0].position : null
      };
    });
    console.log('📊 After second undo:', stateAfterSecondUndo);
    
    console.log('↶ Step 6: Testing third Undo (should undo node creation)...');
    await page.keyboard.down('Control');
    await page.keyboard.press('z');
    await page.keyboard.up('Control');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const stateAfterThirdUndo = await page.evaluate(() => {
      const state = window.useMindmapStore.getState();
      return {
        nodes: state.nodes.length
      };
    });
    console.log('📊 After third undo:', stateAfterThirdUndo);
    
    console.log('↷ Step 7: Testing Redo...');
    await page.keyboard.down('Control');
    await page.keyboard.press('y');
    await page.keyboard.up('Control');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const stateAfterRedo = await page.evaluate(() => {
      const state = window.useMindmapStore.getState();
      return {
        nodes: state.nodes.length,
        text: state.nodes[0] ? state.nodes[0].text : null,
        position: state.nodes[0] ? state.nodes[0].position : null
      };
    });
    console.log('📊 After redo:', stateAfterRedo);
    
    // Analysis
    console.log('\\n🎉 Test Results Analysis:');
    
    if (stateAfterFirstUndo.text === 'New Node' && stateAfterFirstUndo.nodes === 1) {
      console.log('✅ First undo correctly reverted text change');
    } else {
      console.log('❌ First undo failed to revert text change');
    }
    
    if (stateAfterSecondUndo.nodes === 1) {
      console.log('✅ Second undo correctly reverted position change (node still exists)');
    } else {
      console.log('❌ Second undo incorrectly removed the node');
    }
    
    if (stateAfterThirdUndo.nodes === 0) {
      console.log('✅ Third undo correctly removed the node');
    } else {
      console.log('❌ Third undo failed to remove the node');
    }
    
    if (stateAfterRedo.nodes === 1) {
      console.log('✅ Redo correctly restored the node');
    } else {
      console.log('❌ Redo failed to restore the node');
    }
    
    console.log('\\n🎮 Browser will stay open for 10 seconds for manual testing...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testUndoRedo().catch(console.error);