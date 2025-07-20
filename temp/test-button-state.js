#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testButtonState() {
  console.log('🔘 Testing button state management...\n');
  
  const browser = await puppeteer.launch({ 
    headless: "new", // バックグラウンド実行（ブラウザ非表示）
    defaultViewport: { width: 1280, height: 720 }
  });
  
  const page = await browser.newPage();
  
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForSelector('canvas');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('📝 Initial state - checking button states...');
    
    // Check initial button states (no nodes/connections)
    const initialButtonStates = await page.evaluate(() => {
      const deleteNodeBtn = document.querySelector('button[title="Delete selected node"]');
      const deleteLineBtn = document.querySelector('button[title="Delete selected connection"]');
      const deleteAllBtn = document.querySelector('button[title="Delete all nodes and connections"]');
      
      return {
        deleteNode: deleteNodeBtn ? deleteNodeBtn.disabled : null,
        deleteLine: deleteLineBtn ? deleteLineBtn.disabled : null,
        deleteAll: deleteAllBtn ? deleteAllBtn.disabled : null
      };
    });
    
    console.log('📊 Initial button states:', initialButtonStates);
    
    // Test 1: Create a node and check button states
    console.log('\\n📝 Creating a node...');
    await page.click('button[title="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const afterNodeStates = await page.evaluate(() => {
      const deleteNodeBtn = document.querySelector('button[title="Delete selected node"]');
      const deleteLineBtn = document.querySelector('button[title="Delete selected connection"]');
      const deleteAllBtn = document.querySelector('button[title="Delete all nodes and connections"]');
      
      return {
        deleteNode: deleteNodeBtn ? deleteNodeBtn.disabled : null,
        deleteLine: deleteLineBtn ? deleteLineBtn.disabled : null,
        deleteAll: deleteAllBtn ? deleteAllBtn.disabled : null
      };
    });
    
    console.log('📊 After creating node:', afterNodeStates);
    
    // Test 2: Create another node for connection testing
    console.log('\\n📝 Creating second node...');
    await page.click('button[title="Add new node"]');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Create a connection
    console.log('\\n🔗 Creating connection between nodes...');
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      if (state.nodes.length >= 2) {
        state.addConnection(state.nodes[0].id, state.nodes[1].id);
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Test 4: Select a connection and check button states
    console.log('\\n🎯 Selecting connection...');
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      if (state.connections.length > 0) {
        state.selectConnection(state.connections[0].id);
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const afterConnectionSelectStates = await page.evaluate(() => {
      const deleteNodeBtn = document.querySelector('button[title="Delete selected node"]');
      const deleteLineBtn = document.querySelector('button[title="Delete selected connection"]');
      const deleteAllBtn = document.querySelector('button[title="Delete all nodes and connections"]');
      
      return {
        deleteNode: deleteNodeBtn ? deleteNodeBtn.disabled : null,
        deleteLine: deleteLineBtn ? deleteLineBtn.disabled : null,
        deleteAll: deleteAllBtn ? deleteAllBtn.disabled : null
      };
    });
    
    console.log('📊 After selecting connection:', afterConnectionSelectStates);
    
    // Test 5: Select a node and check button states
    console.log('\\n🎯 Selecting node...');
    await page.evaluate(() => {
      const store = window.useMindmapStore;
      const state = store.getState();
      if (state.nodes.length > 0) {
        state.selectNode(state.nodes[0].id);
      }
    });
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const afterNodeSelectStates = await page.evaluate(() => {
      const deleteNodeBtn = document.querySelector('button[title="Delete selected node"]');
      const deleteLineBtn = document.querySelector('button[title="Delete selected connection"]');
      const deleteAllBtn = document.querySelector('button[title="Delete all nodes and connections"]');
      
      return {
        deleteNode: deleteNodeBtn ? deleteNodeBtn.disabled : null,
        deleteLine: deleteLineBtn ? deleteLineBtn.disabled : null,
        deleteAll: deleteAllBtn ? deleteAllBtn.disabled : null
      };
    });
    
    console.log('📊 After selecting node:', afterNodeSelectStates);
    
    // Analyze results
    console.log('\\n🎉 Test Results Analysis:');
    
    if (initialButtonStates.deleteNode && initialButtonStates.deleteLine && initialButtonStates.deleteAll) {
      console.log('✅ Initial state: All delete buttons properly disabled when empty');
    } else {
      console.log('❌ Initial state: Some buttons not properly disabled');
    }
    
    if (afterNodeStates.deleteAll === false) {
      console.log('✅ Delete All enabled when nodes exist');
    } else {
      console.log('❌ Delete All not enabled when nodes exist');
    }
    
    if (afterConnectionSelectStates.deleteLine === false) {
      console.log('✅ Delete Line enabled when connection selected');
    } else {
      console.log('❌ Delete Line not enabled when connection selected');
    }
    
    if (afterConnectionSelectStates.deleteNode === true) {
      console.log('✅ Delete Node disabled when connection selected');
    } else {
      console.log('❌ Delete Node not disabled when connection selected');
    }
    
    if (afterNodeSelectStates.deleteNode === false) {
      console.log('✅ Delete Node enabled when node selected');
    } else {
      console.log('❌ Delete Node not enabled when node selected');
    }
    
    if (afterNodeSelectStates.deleteLine === true) {
      console.log('✅ Delete Line disabled when node selected');
    } else {
      console.log('❌ Delete Line not disabled when node selected');
    }
    
    console.log('\\n🎮 Browser will stay open for 10 seconds for manual testing...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testButtonState().catch(console.error);