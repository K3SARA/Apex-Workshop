const { execSync } = require('child_process');
const path = require('path');

console.log('====================================================');
console.log('  APEX GARAGE WORKSHOP OS - STARTUP SEQUENCE');
console.log('====================================================');

const schemaPath = path.join(__dirname, 'prisma/schema.prisma');
const seedPath = path.join(__dirname, 'prisma/seed.js');

async function initializeDatabase() {
  if (process.env.DATABASE_URL) {
    console.log('[DATABASE] DATABASE_URL detected.');
    console.log(`[DATABASE] Syncing PostgreSQL schema tables using: ${schemaPath}`);
    try {
      execSync(`npx prisma db push --schema="${schemaPath}" --accept-data-loss`, {
        stdio: 'inherit',
        env: { ...process.env }
      });
      console.log('[DATABASE] Schema is in sync with PostgreSQL.');

      // Check if the database needs initial seeding
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      try {
        const customerCount = await prisma.customer.count();
        if (customerCount === 0) {
          console.log('[DATABASE] Empty database detected. Seeding realistic sample garage data...');
          execSync(`node "${seedPath}"`, {
            stdio: 'inherit',
            env: { ...process.env }
          });
          console.log('[DATABASE] Database successfully seeded with 5 customers, 6 vehicles, 12 inventory items & 4 job cards.');
        } else {
          console.log(`[DATABASE] Existing data found (${customerCount} customers). Preserving database.`);
        }
      } catch (countErr) {
        console.warn('[DATABASE] Seed check notice:', countErr.message);
      } finally {
        await prisma.$disconnect();
      }
    } catch (err) {
      console.error('[DATABASE] Error during schema sync:', err.message);
    }
  } else {
    console.warn('[DATABASE] ⚠️ WARNING: No DATABASE_URL found in environment variables.');
    console.warn('[DATABASE] In your Railway Web Service, open the "Variables" tab and add a reference to DATABASE_URL from your PostgreSQL service.');
  }

  console.log('[SERVER] Booting Express server...');
  require('./src/index.js');
}

initializeDatabase();
