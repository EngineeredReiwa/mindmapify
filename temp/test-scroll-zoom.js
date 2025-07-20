#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testScrollZoom() {
  console.log('🎮 Testing scroll and zoom functionality...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for visual confirmation
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('canvas');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Create a node first
    console.log('📝 Creating a test node...');
    await page.click('button[title="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test zoom buttons
    console.log('🔍 Testing Zoom In button...');
    await page.click('button[title="Zoom In"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const zoomAfterIn = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().canvas.zoom;
    });
    console.log('📊 Zoom after Zoom In:', zoomAfterIn);
    
    console.log('🔍 Testing Zoom Out button...');
    await page.click('button[title="Zoom Out"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const zoomAfterOut = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().canvas.zoom;
    });
    console.log('📊 Zoom after Zoom Out:', zoomAfterOut);
    
    console.log('🎯 Testing Reset Zoom button...');
    await page.click('button[title="Reset Zoom"]');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const zoomAfterReset = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().canvas.zoom;
    });
    console.log('📊 Zoom after Reset:', zoomAfterReset);
    
    // Test mouse wheel scroll (simulated)
    console.log('🖱️ Testing mouse wheel scroll (simulated)...');
    const canvasElement = await page.$('canvas');
    const canvasBounds = await canvasElement.boundingBox();
    
    const offsetBefore = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().canvas.offset;
    });
    console.log('📊 Offset before scroll:', offsetBefore);
    
    // Simulate wheel event for vertical scroll
    await page.mouse.move(canvasBounds.x + canvasBounds.width / 2, canvasBounds.y + canvasBounds.height / 2);
    await page.mouse.wheel({ deltaY: 100 }); // Scroll down
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const offsetAfterScroll = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().canvas.offset;
    });
    console.log('📊 Offset after scroll:', offsetAfterScroll);
    
    // Verify that scrolling changed the offset (not zoom)
    const zoomAfterScroll = await page.evaluate(() => {
      const store = window.useMindmapStore;
      return store.getState().canvas.zoom;
    });
    console.log('📊 Zoom after scroll (should be unchanged):', zoomAfterScroll);
    
    console.log('\\n🎉 Test Results:');
    if (zoomAfterIn > 1) {
      console.log('✅ Zoom In button works');
    } else {
      console.log('❌ Zoom In button failed');
    }
    
    if (zoomAfterOut < zoomAfterIn) {
      console.log('✅ Zoom Out button works');
    } else {
      console.log('❌ Zoom Out button failed');
    }
    
    if (Math.abs(zoomAfterReset - 1) < 0.01) {
      console.log('✅ Reset Zoom button works');
    } else {
      console.log('❌ Reset Zoom button failed');
    }
    
    if (offsetAfterScroll.y !== offsetBefore.y) {
      console.log('✅ Mouse wheel scrolling works');
    } else {
      console.log('❌ Mouse wheel scrolling failed');
    }
    
    if (Math.abs(zoomAfterScroll - zoomAfterReset) < 0.01) {
      console.log('✅ Mouse wheel doesn\'t zoom (correct behavior)');
    } else {
      console.log('❌ Mouse wheel still zooms (incorrect behavior)');
    }
    
    console.log('\\n🎮 Browser will stay open for 10 seconds for manual testing...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testScrollZoom().catch(console.error);