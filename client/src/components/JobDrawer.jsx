import React, { useState, useEffect } from 'react';
import {
  X,
  Wrench,
  Car,
  User,
  Plus,
  Trash2,
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Package,
  Clock
} from 'lucide-react';
import api from '../api';
import StatusBadge from './StatusBadge';

export default function JobDrawer({
  jobId,
  isOpen,
  onClose,
  onJobUpdated,
  onGenerateInvoice
}) {
  const [job, setJob] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingField, setSavingField] = useState(false);
  const [addingPart, setAddingPart] = useState(false);
  const [error, setError] = useState('');

  // Editable fields
  const [status, setStatus] = useState('');
  const [mechanic, setMechanic] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [complaint, setComplaint] = useState('');
  const [laborCost, setLaborCost] = useState('');

  // Add part inputs
  const [selectedItemId, setSelectedItemId] = useState('');
  const [partQuantity, setPartQuantity] = useState(1);

  useEffect(() => {
    if (isOpen && jobId) {
      loadJobDetails();
      loadInventory();
      setError('');
    }
  }, [isOpen, jobId]);

  const loadJobDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/jobs/${jobId}`);
      const data = res.data;
      setJob(data);
      setStatus(data.status);
      setMechanic(data.assignedMechanic || '');
      setDiagnosis(data.diagnosis || '');
      setComplaint(data.complaint || '');
      setLaborCost(data.laborCost?.toString() || '0');
    } catch (err) {
      setError('Failed to fetch job details');
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setInventory(res.data);
      if (res.data.length > 0 && !selectedItemId) {
        setSelectedItemId(res.data[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load inventory for drawer:', err);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setSavingField(true);
      const res = await api.patch(`/jobs/${jobId}`, { status: newStatus });
      setJob(res.data);
      setStatus(newStatus);
      onJobUpdated?.(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    } finally {
      setSavingField(false);
    }
  };

  const handleSaveDetails = async () => {
    try {
      setSavingField(true);
      setError('');
      const res = await api.patch(`/jobs/${jobId}`, {
        assignedMechanic: mechanic.trim() || null,
        diagnosis: diagnosis.trim() || null,
        complaint: complaint.trim(),
        laborCost: parseFloat(laborCost) || 0
      });
      setJob(res.data);
      onJobUpdated?.(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save job details');
    } finally {
      setSavingField(false);
    }
  };

  const handleAddPart = async (e) => {
    e.preventDefault();
    if (!selectedItemId || partQuantity <= 0) return;

    try {
      setAddingPart(true);
      setError('');
      const res = await api.post(`/jobs/${jobId}/parts`, {
        inventoryItemId: parseInt(selectedItemId),
        quantity: parseInt(partQuantity)
      });
      setJob(res.data);
      setPartQuantity(1);
      loadInventory();
      onJobUpdated?.(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add spare part');
    } finally {
      setAddingPart(false);
    }
  };

  const handleRemovePart = async (partId) => {
    if (!window.confirm('Remove this part from the job card and restore stock to inventory?')) {
      return;
    }

    try {
      setError('');
      const res = await api.delete(`/jobs/${jobId}/parts/${partId}`);
      setJob(res.data);
      loadInventory();
      onJobUpdated?.(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove part');
    }
  };

  if (!isOpen) return null;

  const isCompleted = job?.status === 'COMPLETED' || !!job?.invoice;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex md:pl-10 w-full">
        <div className="w-full md:max-w-2xl bg-white shadow-2xl flex flex-col h-full">
          {/* Drawer Header */}
          <div className="px-4 md:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono text-xs font-semibold shrink-0">
                {job?.jobNumber || '...'}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm md:text-base font-semibold text-slate-900">{job?.jobNumber}</h2>
                  {job && <StatusBadge status={job.status} size="sm" />}
                </div>
                <p className="text-[11px] text-slate-500">
                  {job?.createdAt ? new Date(job.createdAt).toLocaleDateString() : ''}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center -mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 pb-24 md:pb-6">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400">Loading job details...</div>
            ) : job ? (
              <>
                {/* Vehicle & Customer Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold tracking-wider text-slate-900 shadow-2xs">
                        {job.vehicle?.plateNumber}
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-slate-900">
                          {job.vehicle?.year ? `${job.vehicle.year} ` : ''}
                          {job.vehicle?.make} {job.vehicle?.model}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {job.vehicle?.mileage?.toLocaleString()} km
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right text-xs pt-1 sm:pt-0 border-t sm:border-0 border-slate-200/60">
                      <p className="font-semibold text-slate-900">{job.vehicle?.customer?.name}</p>
                      <p className="text-slate-500 font-mono">{job.vehicle?.customer?.phone}</p>
                    </div>
                  </div>
                </div>

                {/* Status Switcher Bar (Mobile Horizontal Swipe) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Workshop Status</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 p-1 bg-slate-100 rounded-xl">
                    {['PENDING', 'IN_PROGRESS', 'WAITING_PARTS', 'READY', 'COMPLETED'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleUpdateStatus(st)}
                        disabled={savingField}
                        className={`py-2 px-1 text-[11px] font-medium rounded-lg text-center transition-all truncate min-h-[38px] ${
                          job.status === st
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                        }`}
                      >
                        {st === 'IN_PROGRESS'
                          ? 'In Prog'
                          : st === 'WAITING_PARTS'
                          ? 'Waiting'
                          : st === 'READY'
                          ? 'Ready'
                          : st.charAt(0) + st.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Complaint, Diagnosis & Mechanic */}
                <div className="space-y-3.5 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Customer Reported Complaint
                    </label>
                    <textarea
                      rows={2}
                      value={complaint}
                      onChange={(e) => setComplaint(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mechanic Diagnosis & Inspection Notes
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Add diagnostic notes, inspection findings..."
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Assigned Mechanic
                      </label>
                      <input
                        type="text"
                        placeholder="Mechanic name"
                        value={mechanic}
                        onChange={(e) => setMechanic(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Labor Cost ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={laborCost}
                        onChange={(e) => setLaborCost(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tabular-nums text-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveDetails}
                      disabled={savingField}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-xl transition-colors disabled:opacity-50 min-h-[42px]"
                    >
                      {savingField ? 'Saving...' : 'Save Notes & Labor'}
                    </button>
                  </div>
                </div>

                {/* Spare Parts Section */}
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-slate-500" /> Spare Parts & Consumables
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Atomically deducted from workshop inventory
                      </p>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-900 tabular-nums">
                      Parts Subtotal: ${job.partsTotal?.toFixed(2)}
                    </span>
                  </div>

                  {/* Parts List Table */}
                  <div className="border border-slate-200 rounded-xl overflow-x-auto bg-white">
                    {job.partsUsed?.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No spare parts added yet. Select an item below.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs min-w-[340px]">
                        <thead className="bg-slate-50 text-[11px] text-slate-500 border-b border-slate-200 uppercase font-medium">
                          <tr>
                            <th className="py-2 px-3">Item</th>
                            <th className="py-2 px-2 text-center">Qty</th>
                            <th className="py-2 px-2 text-right">Price</th>
                            <th className="py-2 px-3 text-right">Total</th>
                            {!isCompleted && <th className="py-2 px-2 text-center"></th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {job.partsUsed?.map((part) => (
                            <tr key={part.id} className="hover:bg-slate-50">
                              <td className="py-2 px-3">
                                <p className="font-medium text-slate-900 truncate max-w-[140px] sm:max-w-none">{part.inventoryItem?.name}</p>
                                <p className="text-[10px] font-mono text-slate-400">{part.inventoryItem?.sku}</p>
                              </td>
                              <td className="py-2 px-2 text-center font-mono tabular-nums">{part.quantity}</td>
                              <td className="py-2 px-2 text-right font-mono tabular-nums text-slate-600">
                                ${part.unitPrice?.toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-medium text-slate-900 tabular-nums">
                                ${(part.quantity * part.unitPrice).toFixed(2)}
                              </td>
                              {!isCompleted && (
                                <td className="py-2 px-2 text-center">
                                  <button
                                    onClick={() => handleRemovePart(part.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
                                    title="Remove part"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Add Part Form (Mobile Stack) */}
                  {!isCompleted && (
                    <form onSubmit={handleAddPart} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="text-[11px] font-semibold text-slate-700">Add Part from Stock</div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={selectedItemId}
                          onChange={(e) => setSelectedItemId(e.target.value)}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 min-h-[40px]"
                        >
                          {inventory.map((item) => (
                            <option key={item.id} value={item.id} disabled={item.quantity <= 0}>
                              [{item.sku}] {item.name} (${item.sellPrice.toFixed(2)}) — {item.quantity > 0 ? `${item.quantity} in stock` : 'Out of Stock'}
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            min="1"
                            max={inventory.find(i => i.id === parseInt(selectedItemId))?.quantity || 99}
                            value={partQuantity}
                            onChange={(e) => setPartQuantity(e.target.value)}
                            className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-center font-mono min-h-[40px]"
                          />
                          <button
                            type="submit"
                            disabled={addingPart || !selectedItemId}
                            className="flex-1 sm:flex-initial px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 min-h-[40px]"
                          >
                            <Plus className="w-4 h-4" />
                            <span>{addingPart ? 'Adding...' : 'Add Part'}</span>
                          </button>
                        </div>
                      </div>
                    </form>
                  )}
                </div>

                {/* Cost Breakdown & Total */}
                <div className="bg-slate-900 text-white rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Labor Charges</span>
                    <span className="font-mono tabular-nums">${job.laborCost?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>Parts & Materials</span>
                    <span className="font-mono tabular-nums">${job.partsTotal?.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between items-baseline">
                    <span className="text-xs font-semibold text-white">Estimated / Total Cost</span>
                    <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
                      ${job.totalCost?.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Existing Invoice Notice */}
                {job.invoice && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        Invoice: {job.invoice.invoiceNumber}
                      </span>
                      <p className="text-[11px] text-emerald-700">
                        Total ${job.invoice.grandTotal?.toFixed(2)} • {job.invoice.paymentStatus}
                      </p>
                    </div>
                    <button
                      onClick={() => onGenerateInvoice?.(job.invoice)}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl shadow-xs transition-colors min-h-[38px]"
                    >
                      View / Print
                    </button>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Drawer Footer Actions (Mobile Sticky at bottom) */}
          {job && !job.invoice && (
            <div className="p-3.5 md:p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0 pb-safe">
              <div className="text-[11px] text-slate-500 hidden sm:block">
                Finalize order and issue customer invoice.
              </div>
              <button
                type="button"
                onClick={() => onGenerateInvoice?.(job)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 min-h-[44px]"
              >
                <FileText className="w-4 h-4" />
                <span>Generate Invoice</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
