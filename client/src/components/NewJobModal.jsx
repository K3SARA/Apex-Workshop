import React, { useState, useEffect } from 'react';
import { X, Car, User, Wrench, AlertCircle, Search, PlusCircle } from 'lucide-react';
import api from '../api';

export default function NewJobModal({ isOpen, onClose, onJobCreated }) {
  const [mode, setMode] = useState('existing'); // 'existing' | 'new'
  const [vehicles, setVehicles] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    plateNumber: '',
    make: '',
    model: '',
    year: '',
    mileage: '',
    complaint: '',
    diagnosis: '',
    assignedMechanic: '',
    laborCost: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchVehicles();
      setError('');
    }
  }, [isOpen]);

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      v.plateNumber.toLowerCase().includes(q) ||
      v.make.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      v.customer?.name.toLowerCase().includes(q) ||
      v.customer?.phone.includes(q)
    );
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'existing' && !selectedVehicle) {
      setError('Please select a vehicle from the list.');
      return;
    }

    if (!formData.complaint.trim()) {
      setError('Please specify the customer complaint.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        complaint: formData.complaint.trim(),
        diagnosis: formData.diagnosis.trim() || undefined,
        assignedMechanic: formData.assignedMechanic.trim() || undefined,
        laborCost: formData.laborCost ? parseFloat(formData.laborCost) : 0,
      };

      if (mode === 'existing') {
        payload.vehicleId = selectedVehicle.id;
        if (formData.mileage) {
          payload.mileage = parseInt(formData.mileage);
        }
      } else {
        payload.customerName = formData.customerName.trim();
        payload.customerPhone = formData.customerPhone.trim();
        payload.customerEmail = formData.customerEmail.trim() || undefined;
        payload.plateNumber = formData.plateNumber.trim();
        payload.make = formData.make.trim();
        payload.model = formData.model.trim();
        payload.year = formData.year ? parseInt(formData.year) : undefined;
        payload.mileage = formData.mileage ? parseInt(formData.mileage) : 0;
      }

      const res = await api.post('/jobs', payload);
      onJobCreated(res.data);
      onClose();
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        plateNumber: '',
        make: '',
        model: '',
        year: '',
        mileage: '',
        complaint: '',
        diagnosis: '',
        assignedMechanic: '',
        laborCost: ''
      });
      setSelectedVehicle(null);
      setSearchQuery('');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to create job card');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]">
        {/* Modal Header */}
        <div className="px-4 md:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm md:text-base font-semibold text-slate-900">Create New Job Card</h2>
              <p className="text-[11px] text-slate-500">Initiate repair order for workshop floor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-4 md:px-6 pt-3 pb-1 shrink-0">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setMode('existing'); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all min-h-[36px] ${
                mode === 'existing'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Existing Vehicle
            </button>
            <button
              type="button"
              onClick={() => { setMode('new'); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all min-h-[36px] ${
                mode === 'new'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              + Quick Register Inline
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 md:px-6 py-3 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === 'existing' ? (
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700">
                Search & Select Vehicle
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search license plate, make, or owner..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all min-h-[40px]"
                />
              </div>

              {/* Vehicle Selection List */}
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {filteredVehicles.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    No vehicles found. Try switching to "Quick Register".
                  </div>
                ) : (
                  filteredVehicles.map((v) => {
                    const isSelected = selectedVehicle?.id === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => setSelectedVehicle(v)}
                        className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold tracking-wider ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-slate-100 text-slate-900 border border-slate-200'
                            }`}
                          >
                            {v.plateNumber}
                          </span>
                          <div>
                            <p className="text-xs font-medium">
                              {v.year ? `${v.year} ` : ''}{v.make} {v.model}
                            </p>
                            <p className={`text-[10px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                              {v.customer?.name} ({v.customer?.phone})
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-[11px] font-mono tabular-nums ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                            {v.mileage?.toLocaleString()} km
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {selectedVehicle && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Selected Vehicle:</span>
                    <span className="font-semibold text-slate-900">
                      {selectedVehicle.plateNumber} ({selectedVehicle.make} {selectedVehicle.model})
                    </span>
                  </div>
                  <div className="pt-2">
                    <label className="block text-[11px] text-slate-500 mb-1">Update Mileage (Optional):</label>
                    <input
                      type="number"
                      placeholder={selectedVehicle.mileage?.toString()}
                      value={formData.mileage}
                      onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs min-h-[38px]"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* New Customer & Vehicle Form (Mobile Responsive Grid) */
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-500" /> Customer Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alex Morgan"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white min-h-[38px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 555-0199"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white min-h-[38px]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="alex@example.com"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white min-h-[38px]"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-slate-500" /> Vehicle Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Plate # *</label>
                    <input
                      type="text"
                      required
                      placeholder="CAB-1234"
                      value={formData.plateNumber}
                      onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-mono min-h-[38px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Make *</label>
                    <input
                      type="text"
                      required
                      placeholder="Toyota"
                      value={formData.make}
                      onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs min-h-[38px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Model *</label>
                    <input
                      type="text"
                      required
                      placeholder="Corolla"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs min-h-[38px]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Year</label>
                    <input
                      type="number"
                      placeholder="2020"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs min-h-[38px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">Current Mileage</label>
                    <input
                      type="number"
                      placeholder="45000"
                      value={formData.mileage}
                      onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs min-h-[38px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Job Details Section */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-slate-500" /> Work Order Details
            </span>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Customer Complaint / Issue *</label>
              <textarea
                required
                rows={2}
                placeholder="Describe reported noise, service needed..."
                value={formData.complaint}
                onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 mb-1">Initial Diagnosis (Optional)</label>
              <textarea
                rows={2}
                placeholder="Preliminary inspection notes..."
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-900 focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Assigned Mechanic</label>
                <input
                  type="text"
                  placeholder="e.g. Marcus Bradley"
                  value={formData.assignedMechanic}
                  onChange={(e) => setFormData({ ...formData, assignedMechanic: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs min-h-[38px]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">Initial Labor Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.laborCost}
                  onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono tabular-nums min-h-[38px]"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2 pb-safe">
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
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
            >
              {loading ? (
                <span>Creating...</span>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Job Card</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
