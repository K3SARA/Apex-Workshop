const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dashboardRouter = require('./routes/dashboard');
const customersRouter = require('./routes/customers');
const vehiclesRouter = require('./routes/vehicles');
const inventoryRouter = require('./routes/inventory');
const jobsRouter = require('./routes/jobs');
const invoicesRouter = require('./routes/invoices');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/dashboard', dashboardRouter);
app.use('/api/customers', customersRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/jobs', jobsRouter);
app.use('/api/invoices', invoicesRouter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let stats = null;
  if (process.env.DATABASE_URL) {
    try {
      const prisma = require('./lib/prisma');
      const [customers, vehicles, items, jobs] = await Promise.all([
        prisma.customer.count(),
        prisma.vehicle.count(),
        prisma.inventoryItem.count(),
        prisma.jobCard.count()
      ]);
      dbStatus = 'connected';
      stats = { customers, vehicles, items, jobs };
    } catch (e) {
      dbStatus = `error: ${e.message}`;
    }
  }

  res.json({
    status: dbStatus === 'connected' ? 'ok' : 'degraded',
    service: 'Garage Workshop Management API',
    database: dbStatus,
    stats,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    timestamp: new Date()
  });
});

// Manual database schema sync trigger (accessible via browser if needed)
app.get('/api/health/sync', async (req, res) => {
  if (!process.env.DATABASE_URL) {
    return res.status(400).json({
      error: 'DATABASE_URL environment variable is missing in Railway variables.'
    });
  }

  try {
    const { execSync } = require('child_process');
    const serverDir = path.resolve(__dirname, '..');
    const syncOutput = execSync('npx prisma db push --accept-data-loss', {
      cwd: serverDir,
      encoding: 'utf-8',
      env: { ...process.env }
    });

    const seedOutput = execSync('node prisma/seed.js', {
      cwd: serverDir,
      encoding: 'utf-8',
      env: { ...process.env }
    });

    res.json({
      success: true,
      message: 'Database synced and seeded successfully!',
      syncOutput: syncOutput.trim(),
      seedOutput: seedOutput.trim()
    });
  } catch (err) {
    res.status(500).json({
      error: err.message,
      output: err.stdout || err.stderr
    });
  }
});

// Serve frontend static build if available (production monorepo mode)
const clientDistPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`Serving static client files from ${clientDistPath}`);
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Centralized 404 handler for API routes
app.use((req, res, next) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

// Centralized Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
