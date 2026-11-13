const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { z } = require('zod');

const vehicleSchema = z.object({
  plateNumber: z.string().min(1, 'Plate number is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().int().optional().nullable(),
  mileage: z.number().int().nonnegative('Mileage must be non-negative'),
  customerId: z.number().int().positive('Customer is required')
});

// GET /api/vehicles?q=...
router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    const where = q
      ? {
          OR: [
            { plateNumber: { contains: q } },
            { make: { contains: q } },
            { model: { contains: q } },
            { customer: { name: { contains: q } } },
            { customer: { phone: { contains: q } } }
          ]
        }
      : {};

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        customer: true,
        jobCards: {
          orderBy: { createdAt: 'desc' },
          include: {
            partsUsed: {
              include: { inventoryItem: true }
            },
            invoice: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Compute service history stats per vehicle
    const enriched = vehicles.map(v => {
      const totalSpent = v.jobCards.reduce((sum, j) => sum + (j.totalCost || 0), 0);
      const totalServices = v.jobCards.length;
      const lastService = v.jobCards[0] ? v.jobCards[0].createdAt : null;
      return {
        ...v,
        stats: {
          totalSpent: Number(totalSpent.toFixed(2)),
          totalServices,
          lastService
        }
      };
    });

    res.json(enriched);
  } catch (error) {
    next(error);
  }
});

// GET /api/vehicles/:id (detailed service history timeline)
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        customer: true,
        jobCards: {
          orderBy: { createdAt: 'desc' },
          include: {
            partsUsed: {
              include: { inventoryItem: true }
            },
            invoice: true
          }
        }
      }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const totalSpent = vehicle.jobCards.reduce((sum, j) => sum + (j.totalCost || 0), 0);
    const paidSpent = vehicle.jobCards.reduce((sum, j) => sum + (j.invoice?.paidAmount || 0), 0);

    res.json({
      ...vehicle,
      stats: {
        totalSpent: Number(totalSpent.toFixed(2)),
        paidSpent: Number(paidSpent.toFixed(2)),
        totalServices: vehicle.jobCards.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/vehicles
router.post('/', async (req, res, next) => {
  try {
    const parsed = vehicleSchema.parse({
      ...req.body,
      year: req.body.year ? parseInt(req.body.year) : null,
      mileage: parseInt(req.body.mileage || 0),
      customerId: parseInt(req.body.customerId)
    });

    const existing = await prisma.vehicle.findUnique({
      where: { plateNumber: parsed.plateNumber.toUpperCase().trim() }
    });
    if (existing) {
      return res.status(400).json({ error: 'A vehicle with this license plate already exists' });
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        plateNumber: parsed.plateNumber.toUpperCase().trim(),
        make: parsed.make.trim(),
        model: parsed.model.trim(),
        year: parsed.year,
        mileage: parsed.mileage,
        customerId: parsed.customerId
      },
      include: { customer: true }
    });

    res.status(201).json(vehicle);
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

// PUT /api/vehicles/:id
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const body = { ...req.body };
    if (body.year !== undefined) body.year = body.year ? parseInt(body.year) : null;
    if (body.mileage !== undefined) body.mileage = parseInt(body.mileage);
    if (body.customerId !== undefined) body.customerId = parseInt(body.customerId);
    if (body.plateNumber) body.plateNumber = body.plateNumber.toUpperCase().trim();

    if (body.plateNumber) {
      const existing = await prisma.vehicle.findFirst({
        where: { plateNumber: body.plateNumber, NOT: { id } }
      });
      if (existing) {
        return res.status(400).json({ error: 'A vehicle with this license plate already exists' });
      }
    }

    const vehicle = await prisma.vehicle.update({
      where: { id },
      data: body,
      include: { customer: true }
    });
    res.json(vehicle);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/vehicles/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.vehicle.delete({ where: { id } });
    res.json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

