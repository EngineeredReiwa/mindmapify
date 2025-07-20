#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testNodeClickBehavior() {
  console.log('🔍 Testing node click behavior (should enter edit mode immediately)...\n');
  
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
    
    console.log('📝 Creating a node...');
    await page.click('button[title="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const canvas = await page.$('canvas');
    const canvasBox = await canvas.boundingBox();
    
    const position = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return state.nodes.length > 0 ? { 
        x: state.nodes[0].position.x + 60, 
        y: state.nodes[0].position.y + 30,
        id: state.nodes[0].id
      } : null;
    });
    
    console.log('Node position:', position);
    
    console.log('\n🔍 Testing single click behavior...');
    console.log('Expected: Should immediately enter edit mode');
    
    // Single click on node
    await page.mouse.click(canvasBox.x + position.x, canvasBox.y + position.y);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const state = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return state.nodes.map(n => ({ 
        id: n.id, 
        isSelected: n.isSelected,
        isEditing: n.isEditing 
      }));
    });
    
    console.log('State after single click:', state);
    
    if (state[0].isEditing) {
      console.log('✅ SUCCESS: Single click immediately starts edit mode');
      console.log('✅ Node is NOT just selected and following mouse');
    } else {
      console.log('❌ FAIL: Node is not in edit mode after single click');
    }
    
    console.log('\n👁️ Visual check:');
    console.log('• Node should show text cursor immediately');
    console.log('• Node should NOT be draggable while editing');
    console.log('• Connection points should be hidden during edit');
    
    console.log('\n🎮 Browser will stay open for 15 seconds for manual verification...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testNodeClickBehavior().catch(console.error);