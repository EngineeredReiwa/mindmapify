#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testUndoDetailed() {
  console.log('🔍 Detailed Undo/Redo analysis...\n');
  
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
    
    // Helper function to get state
    const getState = async () => {
      return await page.evaluate(() => {
        const store = window.useMindmapStore;
        const state = store.getState();
        return {
          nodes: state.nodes.length,
          nodeDetails: state.nodes.map(n => ({
            text: n.text,
            position: { x: Math.round(n.position.x), y: Math.round(n.position.y) }
          })),
          history: {
            past: state.history.past.length,
            present: state.history.present ? {
              nodes: state.history.present.nodes.length,
              connections: state.history.present.connections.length
            } : null,
            future: state.history.future.length
          }
        };
      });
    };
    
    console.log('📝 Step 1: Creating first node...');
    await page.click('button[title="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const state1 = await getState();
    console.log('State after first node:', state1);
    
    console.log('📝 Step 2: Creating second node...');
    await page.click('button[title="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const state2 = await getState();
    console.log('State after second node:', state2);
    
    console.log('📝 Step 3: Moving first node...');
    // Click on first node area to select it, then drag
    await page.mouse.click(state2.nodeDetails[0].position.x + 60, state2.nodeDetails[0].position.y + 30);
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Drag the node
    await page.mouse.down();
    await page.mouse.move(state2.nodeDetails[0].position.x + 160, state2.nodeDetails[0].position.y + 80);
    await page.mouse.up();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const state3 = await getState();
    console.log('State after moving node:', state3);
    
    console.log('📝 Step 4: First Undo (should undo move)...');
    await page.keyboard.down('Control');
    await page.keyboard.press('z');
    await page.keyboard.up('Control');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const state4 = await getState();
    console.log('State after first undo:', state4);
    
    console.log('📝 Step 5: Second Undo (should undo second node creation)...');
    await page.keyboard.down('Control');
    await page.keyboard.press('z');
    await page.keyboard.up('Control');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const state5 = await getState();
    console.log('State after second undo:', state5);
    
    console.log('📝 Step 6: Redo (should restore second node)...');
    await page.keyboard.down('Control');
    await page.keyboard.press('y');
    await page.keyboard.up('Control');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const state6 = await getState();
    console.log('State after redo:', state6);
    
    // Analysis
    console.log('\\n🔍 Analysis:');
    
    // Check if move was properly recorded in history
    if (state3.nodeDetails[0].position.x !== state2.nodeDetails[0].position.x) {
      console.log('✅ Node was moved successfully');
      
      if (state4.nodeDetails[0].position.x === state2.nodeDetails[0].position.x) {
        console.log('✅ First undo correctly reverted the move');
      } else {
        console.log('❌ First undo did NOT revert the move');
        console.log(`   Expected: (${state2.nodeDetails[0].position.x}, ${state2.nodeDetails[0].position.y})`);
        console.log(`   Got: (${state4.nodeDetails[0].position.x}, ${state4.nodeDetails[0].position.y})`);
      }
    } else {
      console.log('❌ Node was not moved (drag failed)');
    }
    
    if (state5.nodes === 1) {
      console.log('✅ Second undo correctly removed second node');
    } else {
      console.log(`❌ Second undo failed - expected 1 node, got ${state5.nodes}`);
    }
    
    console.log('\\n📊 History tracking details:');
    console.log('After first node:', JSON.stringify(state1.history, null, 2));
    console.log('After second node:', JSON.stringify(state2.history, null, 2));
    console.log('After move:', JSON.stringify(state3.history, null, 2));
    
    console.log('\\n🎮 Browser will stay open for manual testing...');
    await new Promise(resolve => setTimeout(resolve, 20000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testUndoDetailed().catch(console.error);