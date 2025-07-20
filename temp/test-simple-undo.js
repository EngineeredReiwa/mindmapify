#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testSimpleUndo() {
  console.log('🔍 Simple Undo test...\n');
  
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
    
    console.log('📝 Test: Create node → Move via store → Undo...');
    
    // Create node via button
    await page.click('button[title="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Move node via store (direct manipulation)
    const moveResult = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      
      if (state.nodes.length === 0) return { error: 'No nodes found' };
      
      const nodeId = state.nodes[0].id;
      const originalPos = { ...state.nodes[0].position };
      
      console.log('Moving node from:', originalPos);
      
      // Move the node using updateNode with history save
      state.updateNode(nodeId, {
        position: { x: originalPos.x + 100, y: originalPos.y + 50 }
      }, true);
      
      const newState = store.getState();
      const newPos = newState.nodes[0].position;
      
      return {
        originalPos,
        newPos,
        historyLength: newState.history.past.length
      };
    });
    
    console.log('Move result:', moveResult);
    
    // Now test undo
    const undoResult = await page.evaluate(() => {
      const store = window.useMindmapStore;
      
      // Execute undo
      store.getState().undo();
      
      const state = store.getState();
      return {
        nodeCount: state.nodes.length,
        position: state.nodes.length > 0 ? state.nodes[0].position : null,
        historyLength: state.history.past.length,
        futureLength: state.history.future.length
      };
    });
    
    console.log('Undo result:', undoResult);
    
    // Analysis
    if (moveResult.originalPos && moveResult.newPos) {
      const moved = moveResult.newPos.x !== moveResult.originalPos.x || 
                   moveResult.newPos.y !== moveResult.originalPos.y;
      
      if (moved) {
        console.log('✅ Node was moved successfully');
        
        if (undoResult.position) {
          const undoWorked = undoResult.position.x === moveResult.originalPos.x && 
                           undoResult.position.y === moveResult.originalPos.y;
          
          if (undoWorked) {
            console.log('✅ Undo correctly reverted the move');
          } else {
            console.log('❌ Undo did not revert the move correctly');
            console.log(`Expected: (${moveResult.originalPos.x}, ${moveResult.originalPos.y})`);
            console.log(`Got: (${undoResult.position.x}, ${undoResult.position.y})`);
          }
        } else {
          console.log('❌ Node disappeared after undo');
        }
      } else {
        console.log('❌ Node was not moved');
      }
    }
    
    console.log('\\n🎮 Browser will stay open for manual testing...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testSimpleUndo().catch(console.error);