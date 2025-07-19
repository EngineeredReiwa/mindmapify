#!/usr/bin/env node

/**
 * Quick Test Script for Claude Code CLI
 * Simplified version for faster feedback
 */

import puppeteer from 'puppeteer';

async function quickTest() {
  console.log('⚡ Quick Mindmapify Test Starting...\n');
  
  const browser = await puppeteer.launch({ 
    headless: "new", // バックグラウンド実行（ブラウザ非表示）
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Load app
    console.log('🌐 Loading http://localhost:5173...');
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded' });
    
    // Quick checks
    const title = await page.title();
    console.log(`✅ Page: ${title}`);
    
    // Check main elements
    const header = await page.$('.header');
    const toolbar = await page.$('.toolbar');
    const canvas = await page.$('canvas');
    const sidebar = await page.$('.sidebar');
    
    console.log(`${header ? '✅' : '❌'} Header`);
    console.log(`${toolbar ? '✅' : '❌'} Toolbar`);
    console.log(`${canvas ? '✅' : '❌'} Canvas`);
    console.log(`${sidebar ? '✅' : '❌'} Sidebar`);
    
    // Test node creation
    const newNodeBtn = await page.$('.toolbar-btn.primary');
    if (newNodeBtn) {
      console.log('🖱️ Testing node creation...');
      await newNodeBtn.click();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const nodeCount = await page.$eval('.header-right span', el => el.textContent);
      console.log(`📊 ${nodeCount}`);
    }
    
    // Check Mermaid Mindmap code
    const code = await page.$eval('.code-preview code', el => el.textContent.substring(0, 50));
    console.log(`📝 Mermaid: ${code}...`);
    
    console.log('\n⚡ Quick test completed!');
    
    // Auto-close after 5 seconds
    setTimeout(async () => {
      await browser.close();
      console.log('🔒 Browser closed');
    }, 5000);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await browser.close();
  }
}

export { quickTest };

// Check if this module is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  quickTest().catch(console.error);
}