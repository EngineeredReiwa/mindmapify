import puppeteer from 'puppeteer';

async function simpleTest() {
  const browser = await puppeteer.launch({
    headless: "new",
    defaultViewport: { width: 1280, height: 720 }
  });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5174');
    await page.waitForSelector('canvas');
    
    // Take initial screenshot
    await page.screenshot({ path: './temp/test-01-initial.png', fullPage: true });
    console.log('Initial screenshot taken');
    
    // Click on canvas to add node
    await page.click('canvas', { offsetX: 200, offsetY: 200 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.screenshot({ path: './temp/test-02-after-canvas-click.png', fullPage: true });
    console.log('After canvas click screenshot taken');
    
    // Click again to enter edit mode  
    await page.click('canvas', { offsetX: 200, offsetY: 200 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.screenshot({ path: './temp/test-03-editing-mode.png', fullPage: true });
    console.log('Editing mode screenshot taken');
    
    // Check if textarea exists
    const textarea = await page.$('textarea');
    if (textarea) {
      console.log('✅ Textarea found!');
      await textarea.type('Hello World Test');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await page.screenshot({ path: './temp/test-04-with-text.png', fullPage: true });
      console.log('With text screenshot taken');
    } else {
      console.log('❌ No textarea found');
    }
    
    console.log('Test completed!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

simpleTest();