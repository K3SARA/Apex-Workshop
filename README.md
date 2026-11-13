# Apex Garage — Workshop Management System

A full-stack, production-ready automotive garage and workshop management platform built with an Apple-inspired, ultra-minimal aesthetic.

## Architecture & Tech Stack

- **Monorepo**:
  - `/client`: Frontend with React (Vite), Tailwind CSS, Lucide React icons, React Router DOM, and Axios.
  - `/server`: Backend with Node.js, Express, Zod validation, and Prisma ORM with SQLite (`dev.db`).
  - Root `package.json` with `concurrently` for running the full stack with a single command.

---

## Key Features

1. **Dashboard & Workshop Floor**
   - 4 Top KPI Cards: Active Repair Orders, Ready for Pickup, Today's Revenue, Outstanding Receivables.
   - Live Workshop Floor Board: Visual breakdown of jobs in *Pending Intake*, *On Bay / In Service*, and *Ready for Pickup*.
   - Low-Stock Alert Center: Threshold warnings with one-click inline restock (`+10`).

2. **Job Cards & Work Orders**
   - Status Tabs: `All`, `Pending`, `In Progress`, `Waiting Parts`, `Ready`, `Completed`.
   - Fast Search: Filter instantly by license plate, customer name, phone, or job number.
   - "New Job Card" Modal: Select an existing vehicle from registry OR quick-register a new customer and vehicle inline.
   - Slide-Over Job Detail Drawer:
     - Real-time status update switcher.
     - Editable mechanic assignment, complaint, and diagnosis inspection notes.
     - Parts inventory selector showing live available stock.
     - **Atomic Stock Deduction**: Automatically decreases inventory when parts are added; restores stock if a part is removed.
     - Live labor and materials cost breakdown.
     - One-click "Generate Invoice" trigger.

3. **Vehicles & Client Registry**
   - Dual-view directory for registered vehicles and client contacts.
   - Interactive **Service History Timeline**: Click any vehicle to inspect its chronological maintenance history, odometer progression, and lifetime investment.

4. **Spare Parts & Inventory Management**
   - Category filtering (`Oils & Fluids`, `Filters`, `Brakes`, `Engine Parts`, `Electrical`).
   - Live retail vs. cost margins and low-stock indicator badges.
   - Inline `+ / -` quick stock adjustment buttons for floor mechanics.
   - Modal to add new parts with SKU, category, and minimum stock threshold.

5. **Invoices & Billing Ledger**
   - Overview of total revenue invoiced, collected, and outstanding balance.
   - Payment status badges: `PAID`, `PARTIAL`, `UNPAID`.
   - "Record Payment" Modal: Supports Cash, Card, and Bank Transfer with automatic balance calculation.
   - Dedicated **Print Invoice View**: Formatted for A4 / receipt printing with `@media print` CSS (automatically hides sidebars, navigation, and controls).

---

## Getting Started

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Database Migration & Seed Data
```bash
npm run seed
```
This populates 5 realistic customers, 6 vehicles, 12 inventory items (including 2 low-stock warning items), and 4 sample job cards with invoices.

### 3. Start Development Servers
```bash
npm run dev
```
- **Frontend UI**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)

### 4. Run End-to-End Verification Test
```bash
node test-e2e.js
```

