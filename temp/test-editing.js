import puppeteer from 'puppeteer';

async function testEditing() {
  const browser = await puppeteer.launch({ 
    headless: "new",
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
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Click "New Node" button
    console.log('🖱️  Clicking New Node button...');
    await page.click('button.primary');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    await page.screenshot({ path: './temp/edit-01-after-new-node.png', fullPage: true });
    console.log('📸 After New Node button click');
    
    // Try clicking on the node to enter edit mode
    console.log('🖱️  Clicking on node area to edit...');
    await page.click('canvas', { offsetX: 400, offsetY: 300 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.screenshot({ path: './temp/edit-02-after-node-click.png', fullPage: true });
    console.log('📸 After node click for editing');
    
    // Check if we can see any indication of editing mode in browser logs
    console.log('✅ Basic editing test completed');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await browser.close();
  }
}

testEditing();