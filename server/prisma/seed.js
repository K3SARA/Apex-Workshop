const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing database records...');
  await prisma.invoice.deleteMany();
  await prisma.jobPart.deleteMany();
  await prisma.jobCard.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();

  console.log('Seeding Customers and Vehicles...');
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Michael Vance',
      phone: '555-0142',
      email: 'michael.vance@example.com',
      address: '742 Evergreen Terrace, Springfield',
      vehicles: {
        create: [
          {
            plateNumber: 'CAB-4589',
            make: 'Toyota',
            model: 'Corolla',
            year: 2019,
            mileage: 45200
          }
        ]
      }
    },
    include: { vehicles: true }
  });

  const customer2 = await prisma.customer.create({
    data: {
      name: 'Sarah Jenkins',
      phone: '555-0189',
      email: 'sarah.j@example.com',
      address: '12 Oak Ridge Lane, Mill Valley',
      vehicles: {
        create: [
          {
            plateNumber: 'KDX-8921',
            make: 'Honda',
            model: 'Civic',
            year: 2021,
            mileage: 28400
          },
          {
            plateNumber: 'WP-3012',
            make: 'Subaru',
            model: 'Outback',
            year: 2018,
            mileage: 71500
          }
        ]
      }
    },
    include: { vehicles: true }
  });

  const customer3 = await prisma.customer.create({
    data: {
      name: 'David Miller',
      phone: '555-0234',
      email: 'dmiller@techcorp.io',
      address: '88 Pine Street, Suite 4B',
      vehicles: {
        create: [
          {
            plateNumber: 'BD-7740',
            make: 'Ford',
            model: 'F-150',
            year: 2020,
            mileage: 52100
          }
        ]
      }
    },
    include: { vehicles: true }
  });

  const customer4 = await prisma.customer.create({
    data: {
      name: 'Elena Rostova',
      phone: '555-0377',
      email: 'elena.r@designstudio.org',
      address: '304 Riverside Blvd, Apt 11C',
      vehicles: {
        create: [
          {
            plateNumber: 'NY-6601',
            make: 'BMW',
            model: '330i',
            year: 2022,
            mileage: 19800
          }
        ]
      }
    },
    include: { vehicles: true }
  });

  const customer5 = await prisma.customer.create({
    data: {
      name: 'Robert Chen',
      phone: '555-0491',
      email: 'rchen@fastmail.com',
      address: '55 Industrial Way',
      vehicles: {
        create: [
          {
            plateNumber: 'CA-9182',
            make: 'Tesla',
            model: 'Model 3',
            year: 2021,
            mileage: 34200
          }
        ]
      }
    },
    include: { vehicles: true }
  });

  console.log('Seeding Inventory Items...');
  const inventoryItemsData = [
    { sku: 'OIL-5W30-SYN', name: 'Synthetic Engine Oil 5W-30 (1L)', category: 'Oils & Fluids', quantity: 38, buyPrice: 7.50, sellPrice: 14.00, minStockLevel: 10 },
    { sku: 'OIL-0W20-SYN', name: 'Full Synthetic Engine Oil 0W-20 (1L)', category: 'Oils & Fluids', quantity: 3, buyPrice: 9.00, sellPrice: 17.50, minStockLevel: 8 }, // Low stock
    { sku: 'FLT-OIL-TY01', name: 'OEM Oil Filter - Toyota/Lexus', category: 'Filters', quantity: 24, buyPrice: 4.20, sellPrice: 9.99, minStockLevel: 6 },
    { sku: 'FLT-AIR-UNIV', name: 'High Flow Air Filter Element', category: 'Filters', quantity: 2, buyPrice: 11.00, sellPrice: 22.00, minStockLevel: 5 }, // Low stock
    { sku: 'FLT-CAB-AC01', name: 'Activated Carbon Cabin Air Filter', category: 'Filters', quantity: 15, buyPrice: 8.50, sellPrice: 18.00, minStockLevel: 5 },
    { sku: 'BRK-PAD-FR01', name: 'Ceramic Front Brake Pads (Set)', category: 'Brakes', quantity: 12, buyPrice: 28.00, sellPrice: 59.99, minStockLevel: 4 },
    { sku: 'BRK-PAD-RR01', name: 'Ceramic Rear Brake Pads (Set)', category: 'Brakes', quantity: 9, buyPrice: 22.00, sellPrice: 48.00, minStockLevel: 4 },
    { sku: 'BRK-ROT-VT01', name: 'Vented Front Brake Rotor', category: 'Brakes', quantity: 8, buyPrice: 35.00, sellPrice: 75.00, minStockLevel: 4 },
    { sku: 'SPK-IRID-NGK', name: 'NGK Laser Iridium Spark Plug', category: 'Engine Parts', quantity: 32, buyPrice: 6.00, sellPrice: 13.50, minStockLevel: 12 },
    { sku: 'BLT-SERP-6PK', name: 'Multi-Rib Serpentine Drive Belt', category: 'Engine Parts', quantity: 7, buyPrice: 14.00, sellPrice: 32.00, minStockLevel: 3 },
    { sku: 'BAT-AGM-12V', name: 'Heavy Duty AGM Battery 12V 70Ah', category: 'Electrical', quantity: 6, buyPrice: 85.00, sellPrice: 165.00, minStockLevel: 3 },
    { sku: 'WPR-BLD-HYB', name: 'All-Weather Hybrid Wiper Blade 24"', category: 'Electrical', quantity: 18, buyPrice: 5.50, sellPrice: 16.00, minStockLevel: 6 }
  ];

  const inventoryMap = {};
  for (const item of inventoryItemsData) {
    const created = await prisma.inventoryItem.create({ data: item });
    inventoryMap[created.sku] = created;
  }

  console.log('Seeding Job Cards & Parts...');

  // 1. Job Card 1 - COMPLETED with Invoice
  const vehicle1 = customer1.vehicles[0]; // CAB-4589
  const completedDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

  const job1Parts = [
    { item: inventoryMap['OIL-5W30-SYN'], qty: 4 },
    { item: inventoryMap['FLT-OIL-TY01'], qty: 1 },
    { item: inventoryMap['BRK-PAD-FR01'], qty: 1 }
  ];
  const job1PartsTotal = job1Parts.reduce((s, p) => s + p.qty * p.item.sellPrice, 0);
  const job1Labor = 120.00;
  const job1Total = job1PartsTotal + job1Labor;

  const job1 = await prisma.jobCard.create({
    data: {
      jobNumber: 'JOB-1001',
      vehicleId: vehicle1.id,
      assignedMechanic: 'Marcus Bradley',
      complaint: 'Scheduled 45,000-mile comprehensive service and strange squeaking noise when braking',
      diagnosis: 'Worn front brake pads at 2mm thickness. Engine oil degraded. Replaced oil, filter, and front brake pads.',
      status: 'COMPLETED',
      laborCost: job1Labor,
      partsTotal: Number(job1PartsTotal.toFixed(2)),
      totalCost: Number(job1Total.toFixed(2)),
      completedAt: completedDate,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      partsUsed: {
        create: job1Parts.map(p => ({
          inventoryItemId: p.item.id,
          quantity: p.qty,
          unitPrice: p.item.sellPrice
        }))
      }
    }
  });

  // Invoice for Job 1
  const discount1 = 15.00;
  const tax1 = Number(((job1Total - discount1) * 0.08).toFixed(2));
  const grandTotal1 = Number((job1Total - discount1 + tax1).toFixed(2));

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-1001',
      jobCardId: job1.id,
      subtotal: job1Total,
      discount: discount1,
      tax: tax1,
      grandTotal: grandTotal1,
      paymentMethod: 'CARD',
      paymentStatus: 'PAID',
      paidAmount: grandTotal1,
      createdAt: completedDate
    }
  });

  // 2. Job Card 2 - READY
  const vehicle2 = customer2.vehicles[0]; // KDX-8921
  const job2Parts = [
    { item: inventoryMap['SPK-IRID-NGK'], qty: 4 }
  ];
  const job2PartsTotal = job2Parts.reduce((s, p) => s + p.qty * p.item.sellPrice, 0);
  const job2Labor = 95.00;
  const job2Total = job2PartsTotal + job2Labor;

  await prisma.jobCard.create({
    data: {
      jobNumber: 'JOB-1002',
      vehicleId: vehicle2.id,
      assignedMechanic: 'Leo Carter',
      complaint: 'Engine misfiring at idle, check engine light illuminated on dash',
      diagnosis: 'OBD code P0302 cylinder 2 misfire. Spark plugs fouled due to age. Replaced 4 iridium plugs and tested compression.',
      status: 'READY',
      laborCost: job2Labor,
      partsTotal: Number(job2PartsTotal.toFixed(2)),
      totalCost: Number(job2Total.toFixed(2)),
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      partsUsed: {
        create: job2Parts.map(p => ({
          inventoryItemId: p.item.id,
          quantity: p.qty,
          unitPrice: p.item.sellPrice
        }))
      }
    }
  });

  // 3. Job Card 3 - IN_PROGRESS
  const vehicle3 = customer3.vehicles[0]; // BD-7740
  const job3Parts = [
    { item: inventoryMap['BRK-ROT-VT01'], qty: 2 },
    { item: inventoryMap['BRK-PAD-FR01'], qty: 1 }
  ];
  const job3PartsTotal = job3Parts.reduce((s, p) => s + p.qty * p.item.sellPrice, 0);
  const job3Labor = 140.00;
  const job3Total = job3PartsTotal + job3Labor;

  await prisma.jobCard.create({
    data: {
      jobNumber: 'JOB-1003',
      vehicleId: vehicle3.id,
      assignedMechanic: 'Marcus Bradley',
      complaint: 'Vehicle pulls sharply to right during highway cruising; steering wheel vibration under braking',
      diagnosis: 'Front right brake rotor warped and uneven pad wear. Undergoing rotor replacement and front end alignment.',
      status: 'IN_PROGRESS',
      laborCost: job3Labor,
      partsTotal: Number(job3PartsTotal.toFixed(2)),
      totalCost: Number(job3Total.toFixed(2)),
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      partsUsed: {
        create: job3Parts.map(p => ({
          inventoryItemId: p.item.id,
          quantity: p.qty,
          unitPrice: p.item.sellPrice
        }))
      }
    }
  });

  // 4. Job Card 4 - PENDING
  const vehicle4 = customer2.vehicles[1]; // WP-3012
  await prisma.jobCard.create({
    data: {
      jobNumber: 'JOB-1004',
      vehicleId: vehicle4.id,
      assignedMechanic: null,
      complaint: 'A/C blower intermittently cutting out, unpleasant musty smell from vents on start',
      diagnosis: null,
      status: 'PENDING',
      laborCost: 0,
      partsTotal: 0,
      totalCost: 0,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    }
  });

  console.log('Seed database completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

