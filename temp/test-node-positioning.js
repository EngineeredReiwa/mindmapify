#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testNodePositioning() {
  console.log('📍 Testing node positioning improvement...\n');
  
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
    
    console.log('📝 Creating multiple nodes to test positioning...');
    
    for (let i = 1; i <= 8; i++) {
      console.log(`📝 Creating node ${i}...`);
      await page.click('button[title="Add new node"]');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const nodePositions = await page.evaluate(() => {
        const store = window.useMindmapStore;
        const state = store.getState();
        return state.nodes.map(node => ({
          id: node.id,
          text: node.text,
          position: node.position,
          size: node.size
        }));
      });
      
      console.log(`📊 After node ${i}:`, 
        nodePositions.map(n => `${n.text}(${n.position.x.toFixed(0)}, ${n.position.y.toFixed(0)})`).join(', ')
      );
    }
    
    // Analysis: Check for overlaps
    console.log('\\n🔍 Analyzing node positions for overlaps...');
    
    const finalPositions = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return state.nodes.map(node => ({
        text: node.text,
        position: node.position,
        size: node.size
      }));
    });
    
    let overlapCount = 0;
    const spacing = 20;
    
    for (let i = 0; i < finalPositions.length; i++) {
      for (let j = i + 1; j < finalPositions.length; j++) {
        const nodeA = finalPositions[i];
        const nodeB = finalPositions[j];
        
        const dx = Math.abs(nodeA.position.x - nodeB.position.x);
        const dy = Math.abs(nodeA.position.y - nodeB.position.y);
        
        const minDistanceX = (nodeA.size.width + nodeB.size.width) / 2 + spacing;
        const minDistanceY = (nodeA.size.height + nodeB.size.height) / 2 + spacing;
        
        if (dx < minDistanceX && dy < minDistanceY) {
          overlapCount++;
          console.log(`❌ Overlap detected between ${nodeA.text} and ${nodeB.text}`);
          console.log(`   Distance: ${dx.toFixed(1)}x${dy.toFixed(1)}, Required: ${minDistanceX.toFixed(1)}x${minDistanceY.toFixed(1)}`);
        }
      }
    }
    
    console.log('\\n🎉 Test Results:');
    console.log(`📊 Total nodes created: ${finalPositions.length}`);
    console.log(`📊 Overlaps detected: ${overlapCount}`);
    
    if (overlapCount === 0) {
      console.log('✅ SUCCESS: No overlapping nodes detected!');
    } else {
      console.log('❌ FAIL: Some nodes are still overlapping');
    }
    
    // Check if nodes are positioned in a reasonable pattern
    const positions = finalPositions.map(n => n.position);
    const baseX = 300, baseY = 200;
    const maxDistance = Math.max(...positions.map(p => 
      Math.sqrt(Math.pow(p.x - baseX, 2) + Math.pow(p.y - baseY, 2))
    ));
    
    console.log(`📊 Maximum distance from center: ${maxDistance.toFixed(1)}px`);
    
    if (maxDistance < 500) {
      console.log('✅ Nodes are positioned within reasonable distance from center');
    } else {
      console.log('⚠️  Some nodes are quite far from the center');
    }
    
    console.log('\\n🎮 Browser will stay open for 15 seconds for visual inspection...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testNodePositioning().catch(console.error);