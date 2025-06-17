#!/usr/bin/env node

const express = require('express');
const fetch = require('node-fetch');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(endpoint, method = 'GET', body = null, headers = {}) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (response.ok) {
      log(`✅ ${method} ${endpoint} - Status: ${response.status}`, 'green');
      return { success: true, data, status: response.status };
    } else {
      log(`❌ ${method} ${endpoint} - Status: ${response.status}`, 'red');
      log(`   Error: ${data.message || 'Unknown error'}`, 'red');
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    log(`💥 ${method} ${endpoint} - Connection Error: ${error.message}`, 'red');
    return { success: false, error: error.message };
  }
}

async function validateKanbanSystem() {
  log('\n🔍 Validating Kanban System Integration...', 'cyan');
  
  // Testar endpoints básicos
  const tests = [
    { endpoint: '/', method: 'GET', name: 'API Root' },
    { endpoint: '/cors-debug', method: 'GET', name: 'CORS Debug' },
    { endpoint: '/api/kanban', method: 'GET', name: 'Kanban Boards List' },
    { endpoint: '/api/productivity-analytics', method: 'GET', name: 'Productivity Analytics' }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    const result = await testEndpoint(test.endpoint, test.method);
    if (result.success) {
      passedTests++;
    }
  }
  
  log(`\n📊 Test Results: ${passedTests}/${totalTests} passed`, 
      passedTests === totalTests ? 'green' : 'yellow');
  
  return passedTests === totalTests;
}

async function validateSystemHealth() {
  log('\n🏥 Validating System Health...', 'cyan');
  
  try {
    // Testar conexão com o servidor
    const healthCheck = await testEndpoint('/');
    
    if (healthCheck.success) {
      log('✅ API Server is responding', 'green');
      
      // Verificar endpoints principais
      const endpoints = [
        '/api/tasks',
        '/api/auth',
        '/api/goals',
        '/api/kanban',
        '/api/productivity-analytics',
        '/api/lumi'
      ];
      
      let workingEndpoints = 0;
      for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint);
        if (result.success || result.status === 401) { // 401 é esperado sem auth
          workingEndpoints++;
        }
      }
      
      log(`\n📡 Endpoints Status: ${workingEndpoints}/${endpoints.length} working`, 
          workingEndpoints === endpoints.length ? 'green' : 'yellow');
      
      return workingEndpoints === endpoints.length;
    } else {
      log('❌ API Server is not responding', 'red');
      return false;
    }
  } catch (error) {
    log(`💥 Health check failed: ${error.message}`, 'red');
    return false;
  }
}

async function validateCORSConfiguration() {
  log('\n🌐 Validating CORS Configuration...', 'cyan');
  
  try {
    const corsResult = await testEndpoint('/cors-debug');
    
    if (corsResult.success) {
      log('✅ CORS debug endpoint is working', 'green');
      log(`   Origin: ${corsResult.data.origin || 'Not specified'}`, 'blue');
      log(`   Headers: ${JSON.stringify(corsResult.data.headers)}`, 'blue');
      return true;
    } else {
      log('❌ CORS debug endpoint failed', 'red');
      return false;
    }
  } catch (error) {
    log(`💥 CORS validation failed: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('🚀 Starting Kanban System Validation...', 'magenta');
  log(`   API Base URL: ${API_BASE_URL}`, 'blue');
  
  const results = {
    health: await validateSystemHealth(),
    cors: await validateCORSConfiguration(),
    kanban: await validateKanbanSystem()
  };
  
  log('\n📋 Final Results:', 'magenta');
  log(`   System Health: ${results.health ? '✅ PASS' : '❌ FAIL'}`, 
      results.health ? 'green' : 'red');
  log(`   CORS Config: ${results.cors ? '✅ PASS' : '❌ FAIL'}`, 
      results.cors ? 'green' : 'red');
  log(`   Kanban System: ${results.kanban ? '✅ PASS' : '❌ FAIL'}`, 
      results.kanban ? 'green' : 'red');
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    log('\n🎉 All validations passed! System is ready for integration.', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Some validations failed. Please review the issues above.', 'yellow');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    log(`💥 Validation script failed: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { validateKanbanSystem, validateSystemHealth, validateCORSConfiguration };
