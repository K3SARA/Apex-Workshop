const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma');

router.get('/', async (req, res, next) => {
  try {
    const [
      activeJobsCount,
      readyJobsCount,
      recentJobCards,
      inventoryItems,
      invoices
    ] = await Promise.all([
      prisma.jobCard.count({
        where: {
          status: {
            in: ['PENDING', 'IN_PROGRESS', 'WAITING_PARTS']
          }
        }
      }),
      prisma.jobCard.count({
        where: {
          status: 'READY'
        }
      }),
      prisma.jobCard.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: {
            include: { customer: true }
          },
          invoice: true
        }
      }),
      prisma.inventoryItem.findMany(),
      prisma.invoice.findMany()
    ]);

    // Calculate low stock items: quantity <= minStockLevel
    const lowStockItems = inventoryItems.filter(item => item.quantity <= item.minStockLevel);

    // Calculate today's revenue (invoices created today or paid)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayInvoices = invoices.filter(inv => new Date(inv.createdAt) >= today);
    const todayRevenue = todayInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

    // Total unpaid balance across all invoices
    const totalUnpaidBalance = invoices.reduce((sum, inv) => {
      const balance = Math.max(0, inv.grandTotal - (inv.paidAmount || 0));
      return sum + balance;
    }, 0);

    // Total revenue all time
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

    res.json({
      activeJobsCount,
      readyJobsCount,
      todayRevenue: Number(todayRevenue.toFixed(2)),
      totalUnpaidBalance: Number(totalUnpaidBalance.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      recentJobCards,
      lowStockItems
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

