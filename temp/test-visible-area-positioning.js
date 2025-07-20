#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testVisibleAreaPositioning() {
  console.log('👁️ Testing visible area node positioning...\n');
  
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
    
    console.log('📝 Test 1: Creating nodes at default view...');
    
    for (let i = 1; i <= 5; i++) {
      console.log(`📝 Creating node ${i}...`);
      await page.click('button[title="Add new node"]');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Check if all nodes are visible (within reasonable screen bounds)
    const positions1 = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return {
        nodes: state.nodes.map(n => ({ x: n.position.x, y: n.position.y })),
        canvas: state.canvas
      };
    });
    
    console.log('📊 Nodes at default view:', positions1.nodes);
    
    // Test 2: Scroll and zoom, then create more nodes
    console.log('\\n🔍 Test 2: After scrolling and zooming...');
    
    // Scroll to a different area
    const canvas = await page.$('canvas');
    await page.mouse.move(640, 360); // Center of screen
    
    // Scroll down and right
    await page.mouse.wheel({ deltaX: 200, deltaY: 200 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Zoom in
    await page.click('button[title="Zoom In"]');
    await page.click('button[title="Zoom In"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Create more nodes
    for (let i = 6; i <= 8; i++) {
      console.log(`📝 Creating node ${i} after scroll/zoom...`);
      await page.click('button[title="Add new node"]');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const positions2 = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return {
        nodes: state.nodes.map((n, i) => ({ 
          index: i + 1, 
          x: n.position.x, 
          y: n.position.y 
        })),
        canvas: {
          zoom: state.canvas.zoom,
          offset: state.canvas.offset
        }
      };
    });
    
    console.log('📊 Canvas state:', positions2.canvas);
    console.log('📊 All nodes:', positions2.nodes);
    
    // Analysis: Check if new nodes (6-8) are within the visible area
    const zoom = positions2.canvas.zoom;
    const offset = positions2.canvas.offset;
    const margin = 100;
    
    const visibleBounds = {
      left: (-offset.x / zoom) + margin,
      top: (-offset.y / zoom) + margin,
      right: (-offset.x + 1280) / zoom - margin,
      bottom: (-offset.y + 720) / zoom - margin
    };
    
    console.log('\\n🔍 Analysis:');
    console.log('📊 Calculated visible bounds:', visibleBounds);
    
    const newNodes = positions2.nodes.slice(5); // Nodes 6-8
    let visibleCount = 0;
    
    for (const node of newNodes) {
      const isVisible = node.x >= visibleBounds.left && 
                       node.x <= visibleBounds.right && 
                       node.y >= visibleBounds.top && 
                       node.y <= visibleBounds.bottom;
      
      console.log(`📊 Node ${node.index}: (${node.x.toFixed(0)}, ${node.y.toFixed(0)}) - ${isVisible ? 'VISIBLE' : 'NOT VISIBLE'}`);
      if (isVisible) visibleCount++;
    }
    
    console.log('\\n🎉 Test Results:');
    console.log(`📊 New nodes created after scroll/zoom: ${newNodes.length}`);
    console.log(`📊 Nodes within visible area: ${visibleCount}`);
    
    if (visibleCount === newNodes.length) {
      console.log('✅ SUCCESS: All new nodes are within visible area!');
    } else {
      console.log('❌ FAIL: Some nodes are outside visible area');
    }
    
    // Test 3: Extreme zoom test
    console.log('\\n🔍 Test 3: Extreme zoom test...');
    await page.click('button[title="Zoom In"]');
    await page.click('button[title="Zoom In"]');
    await page.click('button[title="Zoom In"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await page.click('button[title="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const extremeZoomState = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return {
        zoom: state.canvas.zoom,
        lastNode: state.nodes[state.nodes.length - 1]
      };
    });
    
    console.log(`📊 Extreme zoom (${extremeZoomState.zoom.toFixed(2)}x): Last node at (${extremeZoomState.lastNode.position.x.toFixed(0)}, ${extremeZoomState.lastNode.position.y.toFixed(0)})`);
    
    console.log('\\n🎮 Browser will stay open for 15 seconds for visual inspection...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testVisibleAreaPositioning().catch(console.error);