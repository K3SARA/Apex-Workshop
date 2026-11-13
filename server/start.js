const { execSync } = require('child_process');

console.log('====================================================');
console.log('  APEX GARAGE WORKSHOP OS - STARTUP SEQUENCE');
console.log('====================================================');

if (process.env.DATABASE_URL) {
  console.log('[DATABASE] PostgreSQL connection string detected.');
  console.log('[DATABASE] Running "npx prisma db push" to verify/sync schema tables...');
  try {
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('[DATABASE] Schema is synchronized with PostgreSQL.');
  } catch (err) {
    console.error('[DATABASE] Warning during schema sync:', err.message);
  }
} else {
  console.warn('[DATABASE] WARNING: No DATABASE_URL found in environment variables.');
  console.warn('[DATABASE] In your Railway Web Service, go to the "Variables" tab and add a reference to DATABASE_URL from your PostgreSQL service.');
}

console.log('[SERVER] Booting Express server...');
require('./src/index.js');
