const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');
const { z } = require('zod');

// Helper to generate the next job number
async function generateJobNumber() {
  const lastJob = await prisma.jobCard.findFirst({
    orderBy: { id: 'desc' }
  });
  if (!lastJob) return 'JOB-1001';
  const match = lastJob.jobNumber.match(/JOB-(\d+)/);
  if (match) {
    const nextNum = parseInt(match[1]) + 1;
    return `JOB-${nextNum}`;
  }
  return `JOB-${lastJob.id + 1001}`;
}

// GET /api/jobs?status=...&q=...
router.get('/', async (req, res, next) => {
  try {
    const { status, q } = req.query;
    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (q) {
      where.OR = [
        { jobNumber: { contains: q } },
        { complaint: { contains: q } },
        { assignedMechanic: { contains: q } },
        { vehicle: { plateNumber: { contains: q } } },
        { vehicle: { make: { contains: q } } },
        { vehicle: { model: { contains: q } } },
        { vehicle: { customer: { name: { contains: q } } } },
        { vehicle: { customer: { phone: { contains: q } } } }
      ];
    }

    const jobs = await prisma.jobCard.findMany({
      where,
      include: {
        vehicle: {
          include: { customer: true }
        },
        partsUsed: {
          include: { inventoryItem: true }
        },
        invoice: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(jobs);
  } catch (error) {
    next(error);
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const job = await prisma.jobCard.findUnique({
      where: { id },
      include: {
        vehicle: {
          include: { customer: true }
        },
        partsUsed: {
          include: { inventoryItem: true }
        },
        invoice: true
      }
    });

    if (!job) {
      return res.status(404).json({ error: 'Job card not found' });
    }

    res.json(job);
  } catch (error) {
    next(error);
  }
});

// POST /api/jobs
// Accepts existing vehicleId OR inline customer & vehicle creation
router.post('/', async (req, res, next) => {
  try {
    const {
      vehicleId,
      customerName,
      customerPhone,
      customerEmail,
      plateNumber,
      make,
      model,
      year,
      mileage,
      complaint,
      diagnosis,
      assignedMechanic,
      status,
      laborCost
    } = req.body;

    if (!complaint) {
      return res.status(400).json({ error: 'Customer complaint is required' });
    }

    const jobNumber = await generateJobNumber();

    const result = await prisma.$transaction(async (tx) => {
      let targetVehicleId = vehicleId ? parseInt(vehicleId) : null;

      if (!targetVehicleId) {
        if (!plateNumber || !make || !model || !customerName || !customerPhone) {
          throw new Error('Vehicle and customer details (plate, make, model, name, phone) are required when not selecting an existing vehicle.');
        }

        // Check or create customer
        let customer = await tx.customer.findUnique({
          where: { phone: customerPhone.trim() }
        });

        if (!customer) {
          customer = await tx.customer.create({
            data: {
              name: customerName.trim(),
              phone: customerPhone.trim(),
              email: customerEmail?.trim() || null
            }
          });
        }

        // Check or create vehicle
        const cleanPlate = plateNumber.toUpperCase().trim();
        let vehicle = await tx.vehicle.findUnique({
          where: { plateNumber: cleanPlate }
        });

        if (vehicle) {
          targetVehicleId = vehicle.id;
          // Update mileage if provided
          if (mileage) {
            await tx.vehicle.update({
              where: { id: vehicle.id },
              data: { mileage: parseInt(mileage) }
            });
          }
        } else {
          vehicle = await tx.vehicle.create({
            data: {
              plateNumber: cleanPlate,
              make: make.trim(),
              model: model.trim(),
              year: year ? parseInt(year) : null,
              mileage: mileage ? parseInt(mileage) : 0,
              customerId: customer.id
            }
          });
          targetVehicleId = vehicle.id;
        }
      } else {
        // If mileage was passed, update vehicle mileage
        if (mileage) {
          await tx.vehicle.update({
            where: { id: targetVehicleId },
            data: { mileage: parseInt(mileage) }
          });
        }
      }

      const parsedLabor = laborCost ? parseFloat(laborCost) : 0;

      const jobCard = await tx.jobCard.create({
        data: {
          jobNumber,
          vehicleId: targetVehicleId,
          complaint: complaint.trim(),
          diagnosis: diagnosis?.trim() || null,
          assignedMechanic: assignedMechanic?.trim() || null,
          status: status || 'PENDING',
          laborCost: parsedLabor,
          partsTotal: 0,
          totalCost: parsedLabor
        },
        include: {
          vehicle: {
            include: { customer: true }
          },
          partsUsed: {
            include: { inventoryItem: true }
          },
          invoice: true
        }
      });

      return jobCard;
    });

    res.status(201).json(result);
  } catch (error) {
    if (error.message) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

// POST /api/jobs/:id/parts
// Atomically deducts stock from InventoryItem and recalculates totals
router.post('/:id/parts', async (req, res, next) => {
  try {
    const jobCardId = parseInt(req.params.id);
    const { inventoryItemId, quantity } = req.body;

    const qty = parseInt(quantity);
    if (!inventoryItemId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Valid inventory item and positive quantity are required' });
    }

    const updatedJob = await prisma.$transaction(async (tx) => {
      // 1. Check job card existence and status
      const job = await tx.jobCard.findUnique({
        where: { id: jobCardId }
      });
      if (!job) {
        throw new Error('Job card not found');
      }
      if (job.status === 'COMPLETED') {
        throw new Error('Cannot add parts to a completed job card');
      }

      // 2. Fetch inventory item with current stock
      const item = await tx.inventoryItem.findUnique({
        where: { id: parseInt(inventoryItemId) }
      });
      if (!item) {
        throw new Error('Inventory item not found');
      }

      if (item.quantity < qty) {
        throw new Error(`Insufficient stock for "${item.name}". Available: ${item.quantity}, Requested: ${qty}`);
      }

      // 3. Atomically decrement inventory stock
      await tx.inventoryItem.update({
        where: { id: item.id },
        data: { quantity: item.quantity - qty }
      });

      // 4. Create JobPart record with snapshot sellPrice
      await tx.jobPart.create({
        data: {
          jobCardId,
          inventoryItemId: item.id,
          quantity: qty,
          unitPrice: item.sellPrice
        }
      });

      // 5. Recalculate partsTotal & totalCost
      const allParts = await tx.jobPart.findMany({
        where: { jobCardId }
      });
      const partsTotal = allParts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
      const totalCost = partsTotal + job.laborCost;

      const updated = await tx.jobCard.update({
        where: { id: jobCardId },
        data: {
          partsTotal: Number(partsTotal.toFixed(2)),
          totalCost: Number(totalCost.toFixed(2))
        },
        include: {
          vehicle: {
            include: { customer: true }
          },
          partsUsed: {
            include: { inventoryItem: true }
          },
          invoice: true
        }
      });

      return updated;
    });

    res.status(201).json(updatedJob);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// DELETE /api/jobs/:id/parts/:partId
// Removes the part, restores stock back to InventoryItem, recalculates totals
router.delete('/:id/parts/:partId', async (req, res, next) => {
  try {
    const jobCardId = parseInt(req.params.id);
    const partId = parseInt(req.params.partId);

    const updatedJob = await prisma.$transaction(async (tx) => {
      const job = await tx.jobCard.findUnique({
        where: { id: jobCardId }
      });
      if (!job) {
        throw new Error('Job card not found');
      }
      if (job.status === 'COMPLETED') {
        throw new Error('Cannot modify parts of a completed job card');
      }

      const part = await tx.jobPart.findUnique({
        where: { id: partId }
      });
      if (!part || part.jobCardId !== jobCardId) {
        throw new Error('Job part record not found on this job card');
      }

      // Restore stock
      await tx.inventoryItem.update({
        where: { id: part.inventoryItemId },
        data: {
          quantity: { increment: part.quantity }
        }
      });

      // Delete part record
      await tx.jobPart.delete({
        where: { id: partId }
      });

      // Recalculate totals
      const remainingParts = await tx.jobPart.findMany({
        where: { jobCardId }
      });
      const partsTotal = remainingParts.reduce((sum, p) => sum + p.quantity * p.unitPrice, 0);
      const totalCost = partsTotal + job.laborCost;

      const updated = await tx.jobCard.update({
        where: { id: jobCardId },
        data: {
          partsTotal: Number(partsTotal.toFixed(2)),
          totalCost: Number(totalCost.toFixed(2))
        },
        include: {
          vehicle: {
            include: { customer: true }
          },
          partsUsed: {
            include: { inventoryItem: true }
          },
          invoice: true
        }
      });

      return updated;
    });

    res.json(updatedJob);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// PATCH /api/jobs/:id
// Updates status, diagnosis, assignedMechanic, or laborCost (recalculating totalCost)
router.patch('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { status, diagnosis, assignedMechanic, laborCost, complaint } = req.body;

    const currentJob = await prisma.jobCard.findUnique({
      where: { id }
    });
    if (!currentJob) {
      return res.status(404).json({ error: 'Job card not found' });
    }

    const dataToUpdate = {};
    if (status !== undefined) {
      dataToUpdate.status = status;
      if (status === 'COMPLETED' && !currentJob.completedAt) {
        dataToUpdate.completedAt = new Date();
      }
    }
    if (diagnosis !== undefined) dataToUpdate.diagnosis = diagnosis;
    if (assignedMechanic !== undefined) dataToUpdate.assignedMechanic = assignedMechanic;
    if (complaint !== undefined) dataToUpdate.complaint = complaint;

    if (laborCost !== undefined) {
      const newLabor = parseFloat(laborCost);
      dataToUpdate.laborCost = newLabor;
      dataToUpdate.totalCost = Number((currentJob.partsTotal + newLabor).toFixed(2));
    }

    const updatedJob = await prisma.jobCard.update({
      where: { id },
      data: dataToUpdate,
      include: {
        vehicle: {
          include: { customer: true }
        },
        partsUsed: {
          include: { inventoryItem: true }
        },
        invoice: true
      }
    });

    res.json(updatedJob);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/jobs/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.jobCard.delete({ where: { id } });
    res.json({ success: true, message: 'Job card deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

