import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  DollarSign,
  Printer,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import api from '../api';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import RecordPaymentModal from '../components/RecordPaymentModal';
import InvoicePrintModal from '../components/InvoicePrintModal';

export default function Invoices({ onOpenMobileMenu }) {
  const [invoices, setInvoices] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [printInvoice, setPrintInvoice] = useState(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices');
      setInvoices(res.data);
    } catch (err) {
      setError('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== 'ALL' && inv.paymentStatus !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const numMatch = inv.invoiceNumber.toLowerCase().includes(q);
      const jobMatch = inv.jobCard?.jobNumber.toLowerCase().includes(q);
      const clientMatch = inv.jobCard?.vehicle?.customer?.name?.toLowerCase().includes(q);
      const plateMatch = inv.jobCard?.vehicle?.plateNumber?.toLowerCase().includes(q);
      return numMatch || jobMatch || clientMatch || plateMatch;
    }
    return true;
  });

  const totalInvoiced = invoices.reduce((s, i) => s + (i.grandTotal || 0), 0);
  const totalCollected = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
  const totalOutstanding = Math.max(0, totalInvoiced - totalCollected);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8FAFC]">
      <Header
        title="Invoices & Settlement Ledger"
        subtitle="Customer billing histories, payment reconciliation, and tax receipts"
        onRefresh={loadInvoices}
        onOpenMobileMenu={onOpenMobileMenu}
        loading={loading}
      />

      <main className="p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6">
        {/* KPI Row (3 across or stacked on mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] sm:text-xs text-slate-500 uppercase font-semibold">Total Invoiced</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 mt-1 tabular-nums">
              ${totalInvoiced.toFixed(2)}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{invoices.length} invoices generated</p>
          </div>

          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] sm:text-xs text-slate-500 uppercase font-semibold">Collected</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-600 mt-1 tabular-nums">
              ${totalCollected.toFixed(2)}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Settled into workshop ledger</p>
          </div>

          <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] sm:text-xs text-slate-500 uppercase font-semibold">Outstanding Due</span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-rose-600 mt-1 tabular-nums">
              ${totalOutstanding.toFixed(2)}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Receivables pending</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 -mx-1 px-1">
            {['ALL', 'PAID', 'PARTIAL', 'UNPAID'].map((st) => {
              const isSelected = statusFilter === st;
              return (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[34px] ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {st === 'ALL' ? 'All Invoices' : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search invoice #, plate, client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all min-h-[40px]"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Invoices Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400">
              No invoices match your current filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Client & Vehicle</th>
                    <th className="py-3 px-4">Ref Order</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Balance</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => {
                    const balance = Math.max(0, inv.grandTotal - (inv.paidAmount || 0));
                    const isFullyPaid = inv.paymentStatus === 'PAID';

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {inv.invoiceNumber}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-900 truncate max-w-[130px]">
                            {inv.jobCard?.vehicle?.customer?.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono font-bold text-slate-800">
                              {inv.jobCard?.vehicle?.plateNumber}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {inv.jobCard?.vehicle?.make}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-slate-600">
                          {inv.jobCard?.jobNumber}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                          ${inv.grandTotal?.toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono text-emerald-600 tabular-nums">
                          ${inv.paidAmount?.toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums">
                          <span className={balance > 0 ? 'text-rose-600' : 'text-slate-400'}>
                            ${balance.toFixed(2)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <StatusBadge status={inv.paymentStatus} size="sm" />
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {!isFullyPaid && (
                              <button
                                onClick={() => setPaymentInvoice(inv)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors min-h-[34px]"
                              >
                                Pay
                              </button>
                            )}

                            <button
                              onClick={() => setPrintInvoice(inv)}
                              className="px-2.5 py-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors min-h-[34px]"
                              title="Print Invoice"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Print</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={!!paymentInvoice}
        invoice={paymentInvoice}
        onClose={() => setPaymentInvoice(null)}
        onPaymentRecorded={() => {
          loadInvoices();
        }}
      />

      {/* Dedicated Print Invoice View Modal */}
      <InvoicePrintModal
        isOpen={!!printInvoice}
        invoice={printInvoice}
        onClose={() => setPrintInvoice(null)}
      />
    </div>
  );
}
