import React, { useState, useEffect } from 'react';
import { X, Car, Calendar, DollarSign, Wrench, Clock, FileText, CheckCircle2 } from 'lucide-react';
import api from '../api';
import StatusBadge from './StatusBadge';

export default function ServiceHistoryModal({ vehicleId, isOpen, onClose, onOpenJob }) {
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && vehicleId) {
      loadVehicle();
    }
  }, [isOpen, vehicleId]);

  const loadVehicle = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get(`/vehicles/${vehicleId}`);
      setVehicle(res.data);
    } catch (err) {
      setError('Failed to load vehicle history');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden max-h-[92vh] sm:max-h-[88vh] flex flex-col">
        {/* Header */}
        <div className="px-4 md:px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="px-2.5 py-1 bg-slate-900 text-white rounded-lg font-mono font-bold text-xs tracking-wider shadow-xs shrink-0">
              {vehicle?.plateNumber || '...'}
            </div>
            <div className="min-w-0">
              <h2 className="text-sm md:text-base font-semibold text-slate-900 truncate">
                {vehicle?.year ? `${vehicle.year} ` : ''}{vehicle?.make} {vehicle?.model}
              </h2>
              <p className="text-[11px] text-slate-500 truncate">
                {vehicle?.customer?.name} • {vehicle?.customer?.phone}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-5 flex-1 pb-safe">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Loading service timeline...</div>
          ) : vehicle ? (
            <>
              {/* Vehicle Stats Overview */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4">
                <div className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 text-center sm:text-left">
                  <span className="text-[10px] sm:text-xs text-slate-500 block truncate">Odometer</span>
                  <div className="text-sm sm:text-lg font-bold font-mono text-slate-900 mt-0.5 sm:mt-1 tabular-nums truncate">
                    {vehicle.mileage?.toLocaleString()} km
                  </div>
                </div>

                <div className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 text-center sm:text-left">
                  <span className="text-[10px] sm:text-xs text-slate-500 block truncate">Visits</span>
                  <div className="text-sm sm:text-lg font-bold font-mono text-slate-900 mt-0.5 sm:mt-1 tabular-nums">
                    {vehicle.stats?.totalServices || 0}
                  </div>
                </div>

                <div className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-200 text-center sm:text-left">
                  <span className="text-[10px] sm:text-xs text-slate-500 block truncate">Spent</span>
                  <div className="text-sm sm:text-lg font-bold font-mono text-emerald-600 mt-0.5 sm:mt-1 tabular-nums truncate">
                    ${vehicle.stats?.totalSpent?.toFixed(2) || '0.00'}
                  </div>
                </div>
              </div>

              {/* Service History Timeline */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Service Timeline
                </h3>

                {vehicle.jobCards?.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    No service records found for this vehicle yet.
                  </div>
                ) : (
                  <div className="relative pl-5 sm:pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:sm:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                    {vehicle.jobCards?.map((job) => (
                      <div key={job.id} className="relative group">
                        {/* Timeline Node Dot */}
                        <div className="absolute -left-5 sm:-left-6 top-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                        </div>

                        {/* Service Card */}
                        <div className="p-3.5 sm:p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2 hover:border-slate-300 transition-colors">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900">
                                {job.jobNumber}
                              </span>
                              <StatusBadge status={job.status} size="sm" />
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="text-xs space-y-1">
                            <p className="text-slate-800">
                              <span className="font-semibold text-slate-600">Issue:</span> {job.complaint}
                            </p>
                            {job.diagnosis && (
                              <p className="text-slate-600">
                                <span className="font-semibold text-slate-600">Diagnosis:</span> {job.diagnosis}
                              </p>
                            )}
                          </div>

                          {/* Parts list */}
                          {job.partsUsed?.length > 0 && (
                            <div className="pt-1.5 border-t border-slate-100">
                              <div className="text-[10px] font-medium text-slate-400 mb-1">Installed Parts:</div>
                              <div className="flex flex-wrap gap-1">
                                {job.partsUsed.map((p) => (
                                  <span
                                    key={p.id}
                                    className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 font-mono"
                                  >
                                    {p.quantity}x {p.inventoryItem?.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Financials & Action */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                            <span className="font-semibold font-mono text-slate-900">
                              Total: ${job.totalCost?.toFixed(2)}
                            </span>

                            <button
                              onClick={() => {
                                onClose();
                                onOpenJob?.(job.id);
                              }}
                              className="text-xs text-slate-900 font-medium hover:underline p-1 min-h-[36px] flex items-center gap-1"
                            >
                              <span>Open Card →</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
