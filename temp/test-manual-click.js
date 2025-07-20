#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testManualClick() {
  console.log('🔍 Manual click test with real browser interaction...\n');
  
  const browser = await puppeteer.launch({ 
    headless: "new", // バックグラウンド実行（ブラウザ非表示）
    defaultViewport: { width: 1280, height: 720 },
    devtools: true // Open DevTools for debugging
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Setup test scenario
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      let state = store.getState();
      
      // Add nodes and connection
      state.addNode({ x: 200, y: 200 }, 'Node A');
      state.addNode({ x: 500, y: 200 }, 'Node B');
      state.addNode({ x: 350, y: 350 }, 'Node C');
      
      state = store.getState();
      if (state.nodes.length >= 2) {
        state.addConnection(state.nodes[0].id, state.nodes[1].id);
        
        // Select the connection
        state = store.getState();
        if (state.connections.length > 0) {
          state.selectConnection(state.connections[0].id);
          console.log('=== CONNECTION SELECTED ===');
          console.log('Connection ID:', state.connections[0].id);
          console.log('Connection selected:', state.connections[0].isSelected);
        }
      }
    });
    
    console.log('📸 Setup complete. Browser will stay open for 60 seconds for manual testing.');
    console.log('👆 Try clicking the red (start) and blue (end) handles manually.');
    console.log('📊 Watch browser console for click event logs.');
    
    // Add click event listener to canvas for debugging
    await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.addEventListener('click', (e) => {
          console.log('=== CANVAS CLICK EVENT ===');
          console.log('Event target:', e.target);
          console.log('Mouse position:', { x: e.clientX, y: e.clientY });
          console.log('Canvas position:', { x: e.offsetX, y: e.offsetY });
        });
        
        // Add global Konva event debugging
        if (window.Konva && window.Konva.stages && window.Konva.stages.length > 0) {
          const stage = window.Konva.stages[0];
          
          stage.on('click', (e) => {
            console.log('=== KONVA STAGE CLICK ===');
            console.log('Target type:', e.target.getType?.());
            console.log('Target name:', e.target.name?.());
            console.log('Target position:', { x: e.target.x?.(), y: e.target.y?.() });
            console.log('Pointer position:', stage.getPointerPosition());
          });
          
          // Find all handle circles and add listeners
          const handleCircles = stage.find('Circle').filter(circle => {
            const name = circle.name();
            return name && name.includes('handle');
          });
          
          console.log('=== FOUND HANDLE CIRCLES ===');
          handleCircles.forEach((circle, index) => {
            console.log(`Handle ${index}:`, {
              name: circle.name(),
              position: { x: circle.x(), y: circle.y() },
              radius: circle.radius(),
              listening: circle.listening()
            });
            
            // Add explicit event listeners
            circle.on('click', () => {
              console.log('🔥 HANDLE CIRCLE CLICKED:', circle.name());
            });
            
            circle.on('mousedown', () => {
              console.log('🔥 HANDLE CIRCLE MOUSE DOWN:', circle.name());
            });
          });
        }
      }
    });
    
    // Keep browser open for manual testing
    console.log('\n⏳ Browser will close automatically in 60 seconds...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testManualClick().catch(console.error);