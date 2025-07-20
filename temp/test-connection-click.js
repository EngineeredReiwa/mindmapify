import puppeteer from 'puppeteer';

async function testConnectionClick() {
  const browser = await puppeteer.launch({ 
    headless: "new", // バックグラウンド実行（ブラウザ非表示）
    defaultViewport: { width: 1280, height: 720 }
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    await page.goto('http://localhost:5174');
    await page.waitForSelector('canvas');
    console.log('✅ Page loaded');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Add two nodes
    console.log('🖱️  Adding first node...');
    await page.click('canvas', { offsetX: 200, offsetY: 200 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('🖱️  Adding second node...');
    await page.click('canvas', { offsetX: 400, offsetY: 300 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Try to create a connection by dragging from first node connection point
    console.log('🔗 Creating connection...');
    
    // First, we need to hover over the first node to see connection points
    await page.hover('canvas', { offsetX: 200, offsetY: 200 });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Try to drag from right side of first node to left side of second node
    await page.mouse.move(250, 200); // Right edge of first node
    await page.mouse.down();
    await page.mouse.move(350, 300); // Left edge of second node
    await page.mouse.up();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Now try to click on the connection line
    console.log('🖱️  Attempting to click connection line...');
    
    // Click in the middle area where the connection line should be
    await page.click('canvas', { offsetX: 300, offsetY: 250 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try another spot on the line
    await page.click('canvas', { offsetX: 320, offsetY: 260 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Connection click test completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Keep browser open to inspect
    await new Promise(resolve => setTimeout(resolve, 10000));
    await browser.close();
  }
}

testConnectionClick();