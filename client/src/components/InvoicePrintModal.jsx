import React, { useState } from 'react';
import { X, Printer, CheckCircle2, DollarSign, Wrench, FileText } from 'lucide-react';
import api from '../api';
import StatusBadge from './StatusBadge';

export default function InvoicePrintModal({
  isOpen,
  onClose,
  jobCard,
  invoice: initialInvoice,
  onInvoiceCreated
}) {
  if (!isOpen) return null;

  const [invoice, setInvoice] = useState(initialInvoice || jobCard?.invoice || null);
  const [discount, setDiscount] = useState('0');
  const [taxRate, setTaxRate] = useState('8');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const subtotal = jobCard?.totalCost || 0;
  const parsedDiscount = parseFloat(discount) || 0;
  const computedTax = Number((Math.max(0, subtotal - parsedDiscount) * (parseFloat(taxRate) / 100 || 0)).toFixed(2));
  const estimatedGrandTotal = Math.max(0, Number((subtotal - parsedDiscount + computedTax).toFixed(2)));

  const handleCreateInvoice = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.post('/invoices', {
        jobCardId: jobCard.id,
        discount: parsedDiscount,
        tax: computedTax,
        paymentMethod: 'CASH'
      });
      setInvoice(res.data);
      onInvoiceCreated?.(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const targetJob = invoice?.jobCard || jobCard;
  const customer = targetJob?.vehicle?.customer;
  const vehicle = targetJob?.vehicle;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-0 sm:my-8 max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        {/* Top Control Bar */}
        <div className="no-print px-4 md:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2 truncate">
            <FileText className="w-5 h-5 text-slate-700 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
              {invoice ? `Invoice: ${invoice.invoiceNumber}` : `Invoice: ${jobCard?.jobNumber}`}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {invoice && (
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl shadow-xs transition-all min-h-[38px]"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden xs:inline">Print</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Generate Invoice Form if not yet generated */}
        {!invoice && (
          <div className="no-print p-4 sm:p-6 border-b border-slate-200 bg-white space-y-3 shrink-0">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Invoice Settings
            </h4>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Subtotal (Parts + Labor)</label>
                <div className="px-3 py-2 bg-slate-100 rounded-xl text-xs font-mono font-semibold text-slate-900 min-h-[38px] flex items-center">
                  ${subtotal.toFixed(2)}
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Discount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tabular-nums min-h-[38px]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tabular-nums min-h-[38px]"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-600">
                Total:{' '}
                <strong className="text-slate-900 font-mono text-sm">${estimatedGrandTotal.toFixed(2)}</strong>
              </span>

              <button
                type="button"
                onClick={handleCreateInvoice}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl shadow-xs transition-all disabled:opacity-50 min-h-[44px]"
              >
                {loading ? 'Creating...' : 'Finalize & Generate Invoice'}
              </button>
            </div>
          </div>
        )}

        {/* Printable Invoice Document Area (Scrollable on small mobile screens) */}
        <div className="flex-1 overflow-y-auto">
          <div className="printable-area p-5 sm:p-8 bg-white text-slate-900 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-5 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900">Apex Precision Auto Works</h1>
                </div>
                <p className="text-xs text-slate-500 mt-1">104 Motor City Way • Tel: (555) 010-4589</p>
                <p className="text-xs text-slate-500">service@apexautoworks.com</p>
              </div>

              <div className="sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                <h2 className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-slate-900">
                  {invoice ? invoice.invoiceNumber : 'ESTIMATE'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Date: {invoice ? new Date(invoice.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}
                </p>
                <p className="text-xs text-slate-500">
                  Ref: <span className="font-mono font-medium">{targetJob?.jobNumber}</span>
                </p>
                {invoice && (
                  <div className="mt-1.5 inline-block">
                    <StatusBadge status={invoice.paymentStatus} size="sm" />
                  </div>
                )}
              </div>
            </div>

            {/* Customer & Vehicle Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 text-xs">
              <div className="space-y-1">
                <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                  Billed To
                </span>
                <p className="font-semibold text-slate-900 text-sm">{customer?.name || 'Valued Customer'}</p>
                <p className="text-slate-600 font-mono">{customer?.phone}</p>
                {customer?.email && <p className="text-slate-600">{customer.email}</p>}
                {customer?.address && <p className="text-slate-600">{customer.address}</p>}
              </div>

              <div className="space-y-1">
                <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px]">
                  Vehicle Particulars
                </span>
                <p className="font-semibold text-slate-900 text-sm">
                  {vehicle?.year ? `${vehicle.year} ` : ''}{vehicle?.make} {vehicle?.model}
                </p>
                <p className="text-slate-600">
                  Plate: <strong className="font-mono text-slate-900">{vehicle?.plateNumber}</strong>
                </p>
                <p className="text-slate-600 font-mono">
                  Odometer: {vehicle?.mileage?.toLocaleString()} km
                </p>
                {targetJob?.assignedMechanic && (
                  <p className="text-slate-600">Lead Tech: {targetJob.assignedMechanic}</p>
                )}
              </div>
            </div>

            {/* Complaint notes */}
            <div className="bg-slate-50 rounded-xl p-3 text-xs space-y-1 border border-slate-100">
              <p>
                <span className="font-semibold text-slate-700">Complaint:</span> {targetJob?.complaint}
              </p>
              {targetJob?.diagnosis && (
                <p>
                  <span className="font-semibold text-slate-700">Diagnosis:</span> {targetJob.diagnosis}
                </p>
              )}
            </div>

            {/* Itemized Line Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[340px]">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-[11px] font-semibold text-slate-900 uppercase">
                    <th className="py-2">Item Description</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {targetJob?.partsUsed?.map((part) => (
                    <tr key={part.id}>
                      <td className="py-2">
                        <span className="font-medium text-slate-900">{part.inventoryItem?.name}</span>
                        <span className="block text-[10px] font-mono text-slate-400">SKU: {part.inventoryItem?.sku}</span>
                      </td>
                      <td className="py-2 text-center font-mono tabular-nums">{part.quantity}</td>
                      <td className="py-2 text-right font-mono tabular-nums text-slate-600">${part.unitPrice?.toFixed(2)}</td>
                      <td className="py-2 text-right font-mono tabular-nums font-medium text-slate-900">
                        ${(part.quantity * part.unitPrice).toFixed(2)}
                      </td>
                    </tr>
                  ))}

                  {targetJob?.laborCost > 0 && (
                    <tr>
                      <td className="py-2">
                        <span className="font-medium text-slate-900">Labor & Diagnostics</span>
                      </td>
                      <td className="py-2 text-center font-mono">1</td>
                      <td className="py-2 text-right font-mono tabular-nums text-slate-600">${targetJob.laborCost?.toFixed(2)}</td>
                      <td className="py-2 text-right font-mono tabular-nums font-medium text-slate-900">
                        ${targetJob.laborCost?.toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-full sm:w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-mono tabular-nums">
                    ${(invoice ? invoice.subtotal : subtotal).toFixed(2)}
                  </span>
                </div>
                {(invoice ? invoice.discount : parsedDiscount) > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span className="font-mono tabular-nums">
                      -${(invoice ? invoice.discount : parsedDiscount).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Tax</span>
                  <span className="font-mono tabular-nums">
                    ${(invoice ? invoice.tax : computedTax).toFixed(2)}
                  </span>
                </div>
                <div className="border-t-2 border-slate-900 pt-1.5 flex justify-between items-baseline font-bold text-slate-900">
                  <span className="text-sm">Grand Total</span>
                  <span className="text-base font-mono tabular-nums">
                    ${(invoice ? invoice.grandTotal : estimatedGrandTotal).toFixed(2)}
                  </span>
                </div>

                {invoice && (
                  <>
                    <div className="flex justify-between text-emerald-600 pt-0.5">
                      <span>Paid</span>
                      <span className="font-mono tabular-nums">${invoice.paidAmount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-rose-600 font-semibold border-t border-slate-200 pt-1">
                      <span>Balance Due</span>
                      <span className="font-mono tabular-nums">
                        ${Math.max(0, invoice.grandTotal - invoice.paidAmount).toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400">
              <p>Apex Precision Auto Works • All parts & labor guaranteed for 90 days.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
