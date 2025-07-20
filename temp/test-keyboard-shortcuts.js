const puppeteer = require('puppeteer');

async function testKeyboardShortcuts() {
  console.log('🎹 Testing Keyboard Shortcuts...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for visual verification
    devtools: false 
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to the app
    console.log('🌐 Loading http://localhost:5175...');
    await page.goto('http://localhost:5175', { waitUntil: 'networkidle0' });
    
    // Wait for the canvas to be ready
    await page.waitForSelector('canvas', { timeout: 10000 });
    console.log('✅ Canvas loaded');
    
    // Focus the body for keyboard events
    await page.click('body');
    
    // Test 1: Command+A+N (Add Node)
    console.log('\n🔹 Test 1: Command+A+N (Add Node)');
    await page.keyboard.down('Meta'); // Use 'Meta' for Mac Command key
    await page.keyboard.press('a');
    await page.keyboard.press('n');
    await page.keyboard.up('Meta');
    await page.waitForTimeout(1000);
    
    // Check if node was added by checking the node count in header
    const nodeCount1 = await page.$eval('.header-right span', el => el.textContent);
    console.log('   📊 Node count after Command+A+N:', nodeCount1);
    
    // Test 2: Command+A+N again (Add another node)
    console.log('\n🔹 Test 2: Command+A+N (Add second node)');
    await page.keyboard.down('Meta');
    await page.keyboard.press('a');
    await page.keyboard.press('n');
    await page.keyboard.up('Meta');
    await page.waitForTimeout(1000);
    
    const nodeCount2 = await page..$eval('.header-right span', el => el.textContent);
    console.log('   📊 Node count after second Command+A+N:', nodeCount2);
    
    // Test 3: Select a node and test Command+D+N (Delete Node)
    console.log('\n🔹 Test 3: Select node and Command+D+N (Delete Node)');
    
    // Click on canvas to select a node (click on a node position)
    await page.click('canvas', { x: 300, y: 200 }); // Approximate node position
    await page.waitForTimeout(500);
    
    await page.keyboard.down('Meta');
    await page.keyboard.press('d');
    await page.keyboard.press('n');
    await page.keyboard.up('Meta');
    await page.waitForTimeout(1000);
    
    const nodeCount3 = await page.$eval('.header-right span', el => el.textContent);
    console.log('   📊 Node count after Command+D+N:', nodeCount3);
    
    // Test 4: Command+Z (Undo)
    console.log('\n🔹 Test 4: Command+Z (Undo)');
    await page.keyboard.down('Meta');
    await page.keyboard.press('z');
    await page.keyboard.up('Meta');
    await page.waitForTimeout(1000);
    
    const nodeCount4 = await page.$eval('.header-right span', el => el.textContent);
    console.log('   📊 Node count after Command+Z (Undo):', nodeCount4);
    
    // Test 5: Command+Y (Redo)
    console.log('\n🔹 Test 5: Command+Y (Redo)');
    await page.keyboard.down('Meta');
    await page.keyboard.press('y');
    await page.keyboard.up('Meta');
    await page.waitForTimeout(1000);
    
    const nodeCount5 = await page.$eval('.header-right span', el => el.textContent);
    console.log('   📊 Node count after Command+Y (Redo):', nodeCount5);
    
    console.log('\n✅ Keyboard shortcut tests completed!');
    console.log('📌 Keep browser open for 10 seconds for visual verification...');
    
    // Keep browser open for visual verification
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testKeyboardShortcuts();