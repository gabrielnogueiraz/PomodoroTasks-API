#!/usr/bin/env node

/**
 * Railway Deployment Health Check
 * Verifica se todas as configurações necessárias estão presentes
 */

console.log('🚄 Railway Deployment Health Check');
console.log('=====================================');

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV'
];

const optionalEnvVars = [
  'PORT',
  'FRONTEND_URL',
  'RAILWAY_ENVIRONMENT'
];

let hasErrors = false;

console.log('\n📋 Checking required environment variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: MISSING`);
    hasErrors = true;
  } else {
    const displayValue = varName.includes('SECRET') || varName.includes('URL') 
      ? '***HIDDEN***' 
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

console.log('\n📋 Checking optional environment variables:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  const displayValue = value || 'NOT SET';
  console.log(`ℹ️  ${varName}: ${displayValue}`);
});

console.log('\n📊 System Information:');
console.log(`- Node.js version: ${process.version}`);
console.log(`- Platform: ${process.platform}`);
console.log(`- Architecture: ${process.arch}`);
console.log(`- Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);

if (process.env.RAILWAY_ENVIRONMENT) {
  console.log('\n🚄 Railway Environment Detected:');
  console.log(`- Railway Environment: ${process.env.RAILWAY_ENVIRONMENT}`);
  console.log(`- Railway Git Commit: ${process.env.RAILWAY_GIT_COMMIT_SHA || 'N/A'}`);
  console.log(`- Railway Service ID: ${process.env.RAILWAY_SERVICE_ID || 'N/A'}`);
}

console.log('\n🏥 Health Check Results:');
if (hasErrors) {
  console.log('❌ DEPLOYMENT FAILED - Missing required environment variables');
  console.log('\n📖 Setup Instructions:');
  console.log('1. Go to your Railway project dashboard');
  console.log('2. Navigate to Variables tab');
  console.log('3. Add the missing environment variables');
  console.log('4. Redeploy your service');
  process.exit(1);
} else {
  console.log('✅ ALL CHECKS PASSED - Ready for deployment!');
  console.log('\n🚀 Starting Toivo server...');
}
