const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

// Helper to generate the next invoice number
async function generateInvoiceNumber() {
  const lastInvoice = await prisma.invoice.findFirst({
    orderBy: { id: 'desc' }
  });
  if (!lastInvoice) return 'INV-1001';
  const match = lastInvoice.invoiceNumber.match(/INV-(\d+)/);
  if (match) {
    const nextNum = parseInt(match[1]) + 1;
    return `INV-${nextNum}`;
  }
  return `INV-${lastInvoice.id + 1001}`;
}

// GET /api/invoices
router.get('/', async (req, res, next) => {
  try {
    const invoices = await prisma.invoice.findMany({
      include: {
        jobCard: {
          include: {
            vehicle: {
              include: { customer: true }
            },
            partsUsed: {
              include: { inventoryItem: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(invoices);
  } catch (error) {
    next(error);
  }
});

// GET /api/invoices/:id
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        jobCard: {
          include: {
            vehicle: {
              include: { customer: true }
            },
            partsUsed: {
              include: { inventoryItem: true }
            }
          }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    next(error);
  }
});

// POST /api/invoices
// Generates invoice from job card, marks jobCard as COMPLETED
router.post('/', async (req, res, next) => {
  try {
    const { jobCardId, discount = 0, tax = 0, paymentMethod = 'CASH' } = req.body;

    if (!jobCardId) {
      return res.status(400).json({ error: 'Job Card ID is required' });
    }

    const jid = parseInt(jobCardId);

    const invoice = await prisma.$transaction(async (tx) => {
      const job = await tx.jobCard.findUnique({
        where: { id: jid },
        include: { invoice: true }
      });

      if (!job) {
        throw new Error('Job Card not found');
      }

      if (job.invoice) {
        throw new Error(`Invoice ${job.invoice.invoiceNumber} already exists for this Job Card`);
      }

      const subtotal = job.totalCost;
      const parsedDiscount = parseFloat(discount) || 0;
      const parsedTax = parseFloat(tax) || 0;
      const grandTotal = Math.max(0, Number((subtotal - parsedDiscount + parsedTax).toFixed(2)));

      const invoiceNumber = await generateInvoiceNumber();

      // Create invoice
      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          jobCardId: jid,
          subtotal: Number(subtotal.toFixed(2)),
          discount: Number(parsedDiscount.toFixed(2)),
          tax: Number(parsedTax.toFixed(2)),
          grandTotal,
          paymentMethod,
          paymentStatus: 'UNPAID',
          paidAmount: 0
        }
      });

      // Mark Job Card as COMPLETED
      await tx.jobCard.update({
        where: { id: jid },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      return newInvoice;
    });

    // Fetch complete invoice with relations
    const completeInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        jobCard: {
          include: {
            vehicle: {
              include: { customer: true }
            },
            partsUsed: {
              include: { inventoryItem: true }
            }
          }
        }
      }
    });

    res.status(201).json(completeInvoice);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// PATCH /api/invoices/:id/pay
// Records payment amount and method, updates paidAmount and paymentStatus
router.patch('/:id/pay', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { amount, paymentMethod } = req.body;

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be a positive number' });
    }

    const currentInvoice = await prisma.invoice.findUnique({ where: { id } });
    if (!currentInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const newPaidAmount = Number((currentInvoice.paidAmount + paymentAmount).toFixed(2));
    let paymentStatus = 'PARTIAL';
    if (newPaidAmount >= currentInvoice.grandTotal) {
      paymentStatus = 'PAID';
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        paymentStatus,
        ...(paymentMethod ? { paymentMethod } : {})
      },
      include: {
        jobCard: {
          include: {
            vehicle: {
              include: { customer: true }
            },
            partsUsed: {
              include: { inventoryItem: true }
            }
          }
        }
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

module.exports = router;

