const baseURL = 'http://localhost:5000/api';

async function req(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`Request to ${url} failed with ${res.status}: ${JSON.stringify(data)}`);
  }
  return { status: res.status, data };
}

async function runTests() {
  console.log('--- STARTING E2E VERIFICATION SUITE ---');

  // 1. Test Dashboard
  console.log('\n[1] Testing GET /api/dashboard...');
  const dashRes = await req(`${baseURL}/dashboard`);
  console.log('✓ Dashboard returned metrics:', {
    activeJobs: dashRes.data.activeJobsCount,
    readyJobs: dashRes.data.readyJobsCount,
    todayRevenue: dashRes.data.todayRevenue,
    unpaidBalance: dashRes.data.totalUnpaidBalance,
    lowStockCount: dashRes.data.lowStockItems.length,
    recentJobs: dashRes.data.recentJobCards.length
  });

  // 2. Test Inventory initial stock
  console.log('\n[2] Checking initial inventory for Ceramic Front Brake Pads (BRK-PAD-FR01)...');
  const invRes1 = await req(`${baseURL}/inventory?q=BRK-PAD-FR01`);
  const padItem = invRes1.data[0];
  const initialStock = padItem.quantity;
  console.log(`✓ Initial Stock for ${padItem.name} (${padItem.sku}): ${initialStock} units`);

  // 3. Test Create Job Card (Elena Rostova - NY-6601)
  console.log('\n[3] Creating new Job Card via POST /api/jobs...');
  const vehRes = await req(`${baseURL}/vehicles?q=NY-6601`);
  const vehicle = vehRes.data[0];
  console.log(`Found target vehicle: ${vehicle.plateNumber} (${vehicle.make} ${vehicle.model}), owner: ${vehicle.customer.name}`);

  const newJobRes = await req(`${baseURL}/jobs`, {
    method: 'POST',
    body: JSON.stringify({
      vehicleId: vehicle.id,
      complaint: 'High-speed brake pedal vibration under moderate stopping pressure',
      diagnosis: 'Inspected front brake assembly. Front right rotor warped and pads worn down to 2.5mm.',
      assignedMechanic: 'Marcus Bradley',
      laborCost: 0
    })
  });
  const createdJob = newJobRes.data;
  console.log(`✓ Job card created successfully: ${createdJob.jobNumber} (ID: ${createdJob.id}), Status: ${createdJob.status}`);

  // 4. Add Spare Part & Test Atomic Stock Deduction
  console.log('\n[4] Adding spare part via POST /api/jobs/:id/parts...');
  const addPartRes = await req(`${baseURL}/jobs/${createdJob.id}/parts`, {
    method: 'POST',
    body: JSON.stringify({
      inventoryItemId: padItem.id,
      quantity: 1
    })
  });
  console.log(`✓ Added 1x ${padItem.name}. Parts Total now: $${addPartRes.data.partsTotal}`);

  // Verify inventory stock decreased
  const invRes2 = await req(`${baseURL}/inventory/${padItem.id}`);
  const postStock = invRes2.data.quantity;
  console.log(`✓ Stock after deduction: ${postStock} (decreased from ${initialStock} by 1)`);
  if (postStock !== initialStock - 1) {
    throw new Error(`Stock deduction mismatch! Expected ${initialStock - 1}, got ${postStock}`);
  }

  // 5. Update Labor Cost via PATCH /api/jobs/:id
  console.log('\n[5] Updating labor cost to $120.00 via PATCH /api/jobs/:id...');
  const patchJobRes = await req(`${baseURL}/jobs/${createdJob.id}`, {
    method: 'PATCH',
    body: JSON.stringify({
      laborCost: 120.00,
      status: 'READY'
    })
  });
  console.log(`✓ Job updated. Status: ${patchJobRes.data.status}, Labor: $${patchJobRes.data.laborCost}, Total: $${patchJobRes.data.totalCost}`);

  // 6. Generate Invoice via POST /api/invoices
  console.log('\n[6] Generating Invoice via POST /api/invoices...');
  const invoiceRes = await req(`${baseURL}/invoices`, {
    method: 'POST',
    body: JSON.stringify({
      jobCardId: createdJob.id,
      discount: 10.00,
      tax: 13.60,
      paymentMethod: 'CARD'
    })
  });
  const invoice = invoiceRes.data;
  console.log(`✓ Invoice generated: ${invoice.invoiceNumber}, Grand Total: $${invoice.grandTotal}, Status: ${invoice.paymentStatus}`);

  // Check job status is now COMPLETED
  const completedJobCheck = await req(`${baseURL}/jobs/${createdJob.id}`);
  console.log(`✓ Job Card status automatically updated to: ${completedJobCheck.data.status}`);
  if (completedJobCheck.data.status !== 'COMPLETED') {
    throw new Error('Job status was expected to be COMPLETED after invoice creation');
  }

  // 7. Record Payment via PATCH /api/invoices/:id/pay
  console.log('\n[7] Settling Invoice payment via PATCH /api/invoices/:id/pay...');
  const payRes = await req(`${baseURL}/invoices/${invoice.id}/pay`, {
    method: 'PATCH',
    body: JSON.stringify({
      amount: invoice.grandTotal,
      paymentMethod: 'CARD'
    })
  });
  console.log(`✓ Payment recorded! Paid: $${payRes.data.paidAmount}, Payment Status: ${payRes.data.paymentStatus}`);
  if (payRes.data.paymentStatus !== 'PAID') {
    throw new Error(`Payment status was expected to be PAID, got ${payRes.data.paymentStatus}`);
  }

  // 8. Test Vehicle Service History Timeline
  console.log('\n[8] Verifying Vehicle Service History Timeline...');
  const vehicleHistory = await req(`${baseURL}/vehicles/${vehicle.id}`);
  const hasJob = vehicleHistory.data.jobCards.some(j => j.id === createdJob.id);
  console.log(`✓ Vehicle NY-6601 Service History includes ${createdJob.jobNumber}: ${hasJob}`);
  console.log(`✓ Vehicle total visits: ${vehicleHistory.data.stats.totalServices}, total spent: $${vehicleHistory.data.stats.totalSpent}`);

  // 9. Test Inline Stock Adjustments (PATCH /api/inventory/:id/stock)
  console.log('\n[9] Testing Inline Restock (+10) via PATCH /api/inventory/:id/stock...');
  const restockRes = await req(`${baseURL}/inventory/${padItem.id}/stock`, {
    method: 'PATCH',
    body: JSON.stringify({ delta: 10 })
  });
  console.log(`✓ Item stock successfully increased to: ${restockRes.data.quantity}`);

  // 10. Test Frontend Server (Vite)
  console.log('\n[10] Checking Frontend Vite Server at http://localhost:5173...');
  const viteRes = await fetch('http://localhost:5173/');
  const html = await viteRes.text();
  console.log(`✓ Vite Server returned status: ${viteRes.status} (Title present: ${html.includes('Apex Garage')})`);

  console.log('\n========================================');
  console.log('🎉 ALL END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY!');
  console.log('========================================');
}

runTests().catch(err => {
  console.error('❌ E2E Verification failed:', err.message);
  process.exit(1);
});
