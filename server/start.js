const { execSync } = require('child_process');
const path = require('path');

console.log('====================================================');
console.log('  APEX GARAGE WORKSHOP OS - STARTUP SEQUENCE');
console.log('====================================================');

const serverDir = path.resolve(__dirname);
console.log(`[BOOT] Working directory: ${serverDir}`);

if (process.env.DATABASE_URL) {
  console.log('[DATABASE] DATABASE_URL detected.');
  console.log('[DATABASE] Running schema synchronization (prisma db push)...');
  try {
    execSync('npx prisma db push --accept-data-loss', {
      cwd: serverDir,
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('[DATABASE] PostgreSQL schema tables successfully synchronized.');

    // Auto-seed if empty
    try {
      console.log('[DATABASE] Checking if initial seed data is required...');
      execSync('node prisma/seed.js', {
        cwd: serverDir,
        stdio: 'inherit',
        env: { ...process.env }
      });
    } catch (seedErr) {
      console.warn('[DATABASE] Seed execution notice:', seedErr.message);
    }
  } catch (err) {
    console.error('[DATABASE] Error during schema sync:', err.message);
  }
} else {
  console.warn('[DATABASE] ⚠️ WARNING: No DATABASE_URL found in environment variables.');
  console.warn('[DATABASE] In your Railway Web Service, open the "Variables" tab and add a reference to DATABASE_URL from your PostgreSQL service.');
}

console.log('[SERVER] Booting Express application...');
require('./src/index.js');
