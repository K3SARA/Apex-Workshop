const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { z } = require('zod');

const itemSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Item name is required'),
  category: z.string().min(1, 'Category is required'),
  quantity: z.number().int().min(0, 'Quantity must be at least 0'),
  buyPrice: z.number().min(0, 'Buy price must be non-negative'),
  sellPrice: z.number().min(0, 'Sell price must be non-negative'),
  minStockLevel: z.number().int().min(0).default(5)
});

// GET /api/inventory?q=...&category=...
router.get('/', async (req, res, next) => {
  try {
    const { q, category } = req.query;
    const where = {};

    if (q) {
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
        { category: { contains: q } }
      ];
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json(items);
  } catch (error) {
    next(error);
  }
});

// GET /api/inventory/categories
router.get('/categories', async (req, res, next) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      select: { category: true },
      distinct: ['category']
    });
    res.json(items.map(i => i.category));
  } catch (error) {
    next(error);
  }
});

// GET /api/inventory/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        jobParts: {
          take: 10,
          include: { jobCard: true }
        }
      }
    });
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// POST /api/inventory
router.post('/', async (req, res, next) => {
  try {
    const parsed = itemSchema.parse({
      ...req.body,
      quantity: parseInt(req.body.quantity),
      buyPrice: parseFloat(req.body.buyPrice),
      sellPrice: parseFloat(req.body.sellPrice),
      minStockLevel: req.body.minStockLevel ? parseInt(req.body.minStockLevel) : 5
    });

    const existing = await prisma.inventoryItem.findUnique({
      where: { sku: parsed.sku.toUpperCase().trim() }
    });
    if (existing) {
      return res.status(400).json({ error: 'An item with this SKU already exists' });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        ...parsed,
        sku: parsed.sku.toUpperCase().trim()
      }
    });
    res.status(201).json(item);
  } catch (error) {
    if (error.errors) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

// PUT /api/inventory/:id
router.put('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const body = { ...req.body };
    if (body.quantity !== undefined) body.quantity = parseInt(body.quantity);
    if (body.buyPrice !== undefined) body.buyPrice = parseFloat(body.buyPrice);
    if (body.sellPrice !== undefined) body.sellPrice = parseFloat(body.sellPrice);
    if (body.minStockLevel !== undefined) body.minStockLevel = parseInt(body.minStockLevel);
    if (body.sku) body.sku = body.sku.toUpperCase().trim();

    if (body.sku) {
      const existing = await prisma.inventoryItem.findFirst({
        where: { sku: body.sku, NOT: { id } }
      });
      if (existing) {
        return res.status(400).json({ error: 'An item with this SKU already exists' });
      }
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: body
    });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/inventory/:id/stock (quick stock increment/decrement/adjustment)
router.patch('/:id/stock', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { delta, newQuantity } = req.body;

    const item = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    let updatedQuantity = item.quantity;
    if (delta !== undefined) {
      updatedQuantity = item.quantity + parseInt(delta);
    } else if (newQuantity !== undefined) {
      updatedQuantity = parseInt(newQuantity);
    }

    if (updatedQuantity < 0) {
      return res.status(400).json({ error: 'Stock quantity cannot be negative' });
    }

    const updated = await prisma.inventoryItem.update({
      where: { id },
      data: { quantity: updatedQuantity }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/inventory/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.inventoryItem.delete({ where: { id } });
    res.json({ success: true, message: 'Item deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

