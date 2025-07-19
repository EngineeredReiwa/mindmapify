import puppeteer from 'puppeteer';

async function testNodeEditing() {
  console.log('📝 Node Editing Test Starting...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1400, height: 900 }
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to app
    console.log('🌐 Loading http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    
    const title = await page.title();
    console.log(`✅ Page: ${title}`);
    
    // Wait for app to be ready
    await page.waitForSelector('.toolbar', { timeout: 5000 });
    await page.waitForSelector('canvas', { timeout: 5000 });
    
    // Create a new node
    console.log('🖱️ Creating new node...');
    await page.click('.toolbar-btn.primary');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if node was created
    const nodeCount = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return canvas ? 1 : 0;
    });
    console.log(`📊 Canvas found: ${nodeCount}`);
    
    // Try to double-click on the node to edit
    console.log('✏️ Testing double-click editing...');
    
    // Get the canvas element and simulate double-click in center
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for node to fully render
    
    const canvas = await page.$('canvas');
    if (canvas) {
      const box = await canvas.boundingBox();
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      
      // Double-click in center of canvas where node should be
      await page.mouse.click(centerX, centerY, { clickCount: 2 });
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if text editor appeared
      const textInput = await page.$('input[type="text"]');
      if (textInput) {
        console.log('✅ Text editor appeared');
        
        // Type new text
        await textInput.click({ clickCount: 3 }); // Select all
        await page.type('input[type="text"]', 'Edited Node Text');
        console.log('⌨️ Typed new text');
        
        // Press Enter to save
        await page.keyboard.press('Enter');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('💾 Saved text with Enter key');
        
        // Check if Mermaid Mindmap code updated
        const mermaidCode = await page.$eval('.mermaid-content pre code', el => el.textContent);
        if (mermaidCode.includes('Edited Node Text')) {
          console.log('✅ Mermaid Mindmap code updated with new text');
        } else {
          console.log('❌ Mermaid Mindmap code not updated');
        }
        
      } else {
        console.log('❌ Text editor did not appear');
        
        // Take screenshot for debugging
        await page.screenshot({ path: 'edit-test-debug.png', fullPage: true });
        console.log('📸 Debug screenshot saved as edit-test-debug.png');
      }
    }
    
    // Test canceling edit with Escape
    console.log('\n🔄 Testing edit cancellation...');
    if (canvas) {
      const box = await canvas.boundingBox();
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      
      await page.mouse.click(centerX, centerY, { clickCount: 2 });
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const textInput = await page.$('input[type="text"]');
      if (textInput) {
        await textInput.click({ clickCount: 3 });
        await page.type('input[type="text"]', 'Should be cancelled');
        await page.keyboard.press('Escape');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('✅ Tested Escape key cancellation');
      }
    }
    
    console.log('\n✅ Node editing test completed!');
    
    // Keep browser open for manual inspection
    console.log('🔍 Browser kept open for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'edit-test-error.png', fullPage: true });
    console.log('📸 Error screenshot saved');
  } finally {
    if (browser) {
      await browser.close();
      console.log('🔒 Browser closed');
    }
  }
}

testNodeEditing().catch(console.error);