import React, { useState } from 'react';
import { X, DollarSign, CreditCard, Banknote, Building2, CheckCircle2 } from 'lucide-react';
import api from '../api';

export default function RecordPaymentModal({ isOpen, onClose, invoice, onPaymentRecorded }) {
  if (!isOpen || !invoice) return null;

  const remainingBalance = Math.max(0, Number((invoice.grandTotal - (invoice.paidAmount || 0)).toFixed(2)));
  const [amount, setAmount] = useState(remainingBalance.toString());
  const [paymentMethod, setPaymentMethod] = useState(invoice.paymentMethod || 'CASH');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payVal = parseFloat(amount);
    if (isNaN(payVal) || payVal <= 0) {
      setError('Please enter a valid payment amount.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.patch(`/invoices/${invoice.id}/pay`, {
        amount: payVal,
        paymentMethod
      });
      onPaymentRecorded?.(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden pb-safe">
        {/* Header */}
        <div className="px-4 md:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm md:text-base font-semibold text-slate-900">Record Payment</h3>
            <p className="text-[11px] text-slate-500 font-mono">Invoice {invoice.invoiceNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Invoice Summary */}
        <div className="p-4 md:p-6 space-y-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Customer</span>
              <span className="font-medium text-slate-900">
                {invoice.jobCard?.vehicle?.customer?.name || 'Customer'}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Grand Total</span>
              <span className="font-mono tabular-nums text-slate-900">${invoice.grandTotal?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Paid so far</span>
              <span className="font-mono tabular-nums text-emerald-600">${invoice.paidAmount?.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-semibold">
              <span className="text-slate-900">Balance Due</span>
              <span className="font-mono tabular-nums text-rose-600 text-sm">
                ${remainingBalance.toFixed(2)}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Amount ($)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remainingBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tabular-nums text-slate-900 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none min-h-[44px]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'CASH', label: 'Cash', icon: Banknote },
                  { id: 'CARD', label: 'Card', icon: CreditCard },
                  { id: 'BANK_TRANSFER', label: 'Bank', icon: Building2 },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = paymentMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPaymentMethod(item.id)}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 transition-all min-h-[50px] justify-center ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 sm:flex-initial px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl shadow-xs transition-all disabled:opacity-50 min-h-[44px]"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
