#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testQuickDoubleClick() {
  console.log('🔗 Quick double-click test...\n');
  
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
    
    // Create a node
    await page.click('button[title="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
    
    console.log('Node position:', positions[0]);
    
    console.log('\n🔍 Testing rapid double-click...');
    
    // Rapid double-click simulation
    const nodeX = canvasBox.x + positions[0].x;
    const nodeY = canvasBox.y + positions[0].y;
    
    await page.mouse.click(nodeX, nodeY);
    await new Promise(resolve => setTimeout(resolve, 50)); // Very short delay
    await page.mouse.click(nodeX, nodeY);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const state = await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      return state.nodes.map(n => ({ 
        id: n.id, 
        isSelected: n.isSelected,
        isEditing: n.isEditing 
      }));
    });
    
    console.log('State after rapid double-click:', state);
    
    if (state[0].isEditing) {
      console.log('✅ Double-click edit mode is working!');
    } else {
      console.log('❌ Double-click edit mode failed');
      
      // Let's try a different approach - manual testing
      console.log('\n📝 Please manually test double-clicking in the browser window');
      console.log('   The browser will stay open for manual testing...');
    }
    
    await new Promise(resolve => setTimeout(resolve, 20000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testQuickDoubleClick().catch(console.error);