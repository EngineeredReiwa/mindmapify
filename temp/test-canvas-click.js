import puppeteer from 'puppeteer';

async function testCanvasClick() {
  const browser = await puppeteer.launch({ 
    headless: "new",
    defaultViewport: { width: 1280, height: 720 }
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    await page.goto('http://localhost:5176');
    await page.waitForSelector('canvas');
    console.log('✅ Page loaded');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try clicking directly on canvas to add node
    console.log('🖱️  Clicking on canvas to add node...');
    await page.click('canvas', { offsetX: 400, offsetY: 300 });
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    await page.screenshot({ path: './temp/canvas-01-after-canvas-click.png', fullPage: true });
    console.log('📸 After canvas click');
    
    // Click same area again to potentially edit
    console.log('🖱️  Clicking same area again...');
    await page.click('canvas', { offsetX: 400, offsetY: 300 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.screenshot({ path: './temp/canvas-02-after-second-click.png', fullPage: true });
    console.log('📸 After second click');
    
    console.log('✅ Canvas click test completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

testCanvasClick();