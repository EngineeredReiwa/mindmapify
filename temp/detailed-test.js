import puppeteer from 'puppeteer';

async function detailedTest() {
  const browser = await puppeteer.launch({ 
    headless: "new",
    defaultViewport: { width: 1280, height: 720 },
    devtools: true,
  });
  const page = await browser.newPage();
  
  // Set up console logging
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    await page.goto('http://localhost:5174');
    await page.waitForSelector('canvas');
    console.log('✅ Page loaded successfully');
    
    // Wait for React to fully load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take initial screenshot
    await page.screenshot({ path: './temp/detail-01-initial.png', fullPage: true });
    console.log('📸 Initial screenshot taken');
    
    // Check if there are existing nodes
    const nodeCount = await page.evaluate(() => {
      // Look for any rendered text elements that might be nodes
      const canvasElements = document.querySelectorAll('canvas');
      console.log('Canvas elements found:', canvasElements.length);
      return canvasElements.length;
    });
    console.log('Canvas elements:', nodeCount);
    
    // Click on canvas to add a node
    console.log('🖱️  Clicking canvas to add node...');
    await page.click('canvas', { offsetX: 200, offsetY: 200 });
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    await page.screenshot({ path: './temp/detail-02-after-add.png', fullPage: true });
    console.log('📸 After add node screenshot taken');
    
    // Try clicking on the same area again to select/edit the node
    console.log('🖱️  Clicking same area to edit node...');
    await page.click('canvas', { offsetX: 200, offsetY: 200 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.screenshot({ path: './temp/detail-03-after-click.png', fullPage: true });
    console.log('📸 After click for edit screenshot taken');
    
    // Check for textarea
    const textarea = await page.$('textarea');
    if (textarea) {
      console.log('✅ Textarea found! Editing mode is active');
      
      // Get textarea properties
      const textareaProps = await page.evaluate(() => {
        const ta = document.querySelector('textarea');
        if (ta) {
          const rect = ta.getBoundingClientRect();
          const styles = window.getComputedStyle(ta);
          return {
            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            styles: {
              position: styles.position,
              top: styles.top,
              left: styles.left,
              fontSize: styles.fontSize,
              fontFamily: styles.fontFamily,
              textAlign: styles.textAlign,
              lineHeight: styles.lineHeight,
              padding: styles.padding,
              color: styles.color,
              backgroundColor: styles.backgroundColor,
              caretColor: styles.caretColor
            }
          };
        }
        return null;
      });
      
      console.log('📋 Textarea properties:', JSON.stringify(textareaProps, null, 2));
      
      // Type some text
      await textarea.focus();
      await textarea.type('Test cursor position');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await page.screenshot({ path: './temp/detail-04-with-text.png', fullPage: true });
      console.log('📸 With text screenshot taken');
      
      // Move cursor with arrow keys
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await page.screenshot({ path: './temp/detail-05-cursor-moved.png', fullPage: true });
      console.log('📸 Cursor moved screenshot taken');
      
    } else {
      console.log('❌ No textarea found - editing mode not active');
      
      // Check what elements exist
      const elements = await page.evaluate(() => {
        const allElements = Array.from(document.querySelectorAll('*'))
          .filter(el => el.tagName.toLowerCase() !== 'script' && el.tagName.toLowerCase() !== 'style')
          .slice(0, 20) // Limit to first 20 elements
          .map(el => ({
            tag: el.tagName.toLowerCase(),
            className: el.className,
            id: el.id,
            text: el.innerText ? el.innerText.substring(0, 50) : ''
          }));
        return allElements;
      });
      
      console.log('🔍 Available elements:', JSON.stringify(elements, null, 2));
    }
    
    // Check React state
    const reactState = await page.evaluate(() => {
      // Try to access React state if possible
      return {
        hasReact: typeof window.React !== 'undefined',
        bodyChildren: document.body.children.length,
        hasCanvas: !!document.querySelector('canvas')
      };
    });
    
    console.log('⚛️  React state:', reactState);
    
    console.log('✅ Detailed test completed!');
    
  } catch (error) {
    console.error('❌ Error during detailed test:', error);
    await page.screenshot({ path: './temp/detail-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

detailedTest();