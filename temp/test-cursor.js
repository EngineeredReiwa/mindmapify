import puppeteer from 'puppeteer';
import fs from 'fs';

async function testCursorAlignment() {
  console.log('Starting Puppeteer test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });
    
    console.log('Navigating to localhost:5174...');
    await page.goto('http://localhost:5174', { waitUntil: 'networkidle0' });
    
    // Wait for the app to load
    await page.waitForSelector('canvas', { timeout: 10000 });
    console.log('Canvas found, app loaded');
    
    // Wait a bit more for everything to render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take initial screenshot
    await page.screenshot({ path: './temp/01-initial.png', fullPage: true });
    console.log('Initial screenshot taken');
    
    // Click on empty canvas to add node
    console.log('Clicking on canvas to add node...');
    const canvas = await page.$('canvas');
    const canvasBox = await canvas.boundingBox();
    await page.click(canvasBox.x + 200, canvasBox.y + 200);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    await page.screenshot({ path: './temp/02-after-add-node.png', fullPage: true });
    console.log('Screenshot after adding node');
    
    // Look for any nodes and click on one to start editing
    console.log('Looking for nodes to click...');
    
    // Try to click on a node area (approximate location)
    const canvasEl = await page.$('canvas');
    const canvasBox2 = await canvasEl.boundingBox();
    
    // Click in the center area where nodes might be
    await page.click(canvasBox2.x + 200, canvasBox2.y + 200);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await page.screenshot({ path: './temp/03-after-click-node.png', fullPage: true });
    console.log('Screenshot after clicking potential node');
    
    // Check if there's a textarea visible (editing mode)
    const textarea = await page.$('textarea');
    if (textarea) {
      console.log('Textarea found - editing mode active!');
      
      // Get textarea and text positions
      const textareaBox = await textarea.boundingBox();
      console.log('Textarea position:', textareaBox);
      
      // Take focused screenshot
      await page.screenshot({ path: './temp/04-editing-mode.png', fullPage: true });
      console.log('Screenshot in editing mode');
      
      // Type some text to see cursor behavior
      await textarea.type('Test text for cursor alignment');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await page.screenshot({ path: './temp/05-with-text.png', fullPage: true });
      console.log('Screenshot with typed text');
      
      // Try arrow keys to move cursor
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await page.screenshot({ path: './temp/06-cursor-moved.png', fullPage: true });
      console.log('Screenshot with cursor moved');
      
    } else {
      console.log('No textarea found - not in editing mode');
    }
    
    // Get console logs
    page.on('console', msg => {
      console.log('Browser console:', msg.text());
    });
    
    console.log('Test completed! Check the screenshots in ./temp/');
    
  } catch (error) {
    console.error('Error during test:', error);
    try {
      await page.screenshot({ path: './temp/error.png', fullPage: true });
    } catch (e) {
      console.log('Could not take error screenshot');
    }
  } finally {
    await browser.close();
  }
}

testCursorAlignment();