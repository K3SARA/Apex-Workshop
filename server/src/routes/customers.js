const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { z } = require('zod');

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(3, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal(''))
});

// GET /api/customers?q=...
router.get('/', async (req, res, next) => {
  try {
    const { q } = req.query;
    const where = q
      ? {
          OR: [
            { name: { contains: q } },
            { phone: { contains: q } },
            { email: { contains: q } },
            { vehicles: { some: { plateNumber: { contains: q } } } }
          ]
        }
      : {};

    const customers = await prisma.customer.findMany({
      where,
      include: {
        vehicles: {
          include: {
            jobCards: {
              select: {
                id: true,
                jobNumber: true,
                status: true,
                totalCost: true,
                createdAt: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(customers);
  } catch (error) {
    next(error);
  }
});

// GET /api/customers/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        vehicles: {
          include: {
            jobCards: {
              orderBy: { createdAt: 'desc' },
              include: { invoice: true }
            }
          }
        }
      }
    });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    next(error);
  }
});

// POST /api/customers
router.post('/', async (req, res, next) => {
  try {
    const parsed = customerSchema.parse(req.body);
    const existing = await prisma.customer.findUnique({
      where: { phone: parsed.phone }
    });
    if (existing) {
      return res.status(400).json({ error: 'A customer with this phone number already exists' });
    }

    const customer = await prisma.customer.create({
      data: {
        name: parsed.name,
        phone: parsed.phone,
        email: parsed.email || null,
        address: parsed.address || null
      }
    });
    res.status(201).json(customer);
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

// PUT /api/customers/:id
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const parsed = customerSchema.partial().parse(req.body);

    if (parsed.phone) {
      const existing = await prisma.customer.findFirst({
        where: { phone: parsed.phone, NOT: { id } }
      });
      if (existing) {
        return res.status(400).json({ error: 'Phone number is already used by another customer' });
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: parsed
    });
    res.json(customer);
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

// DELETE /api/customers/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.customer.delete({ where: { id } });
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

