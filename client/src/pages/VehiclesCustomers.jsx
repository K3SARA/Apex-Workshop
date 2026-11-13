import React, { useState, useEffect } from 'react';
import {
  Car,
  User,
  Search,
  Plus,
  History,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  ChevronRight,
  X
} from 'lucide-react';
import api from '../api';
import Header from '../components/Header';
import ServiceHistoryModal from '../components/ServiceHistoryModal';
import JobDrawer from '../components/JobDrawer';

export default function VehiclesCustomers({ onOpenMobileMenu }) {
  const [activeTab, setActiveTab] = useState('vehicles'); // 'vehicles' | 'customers'
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Service History Modal
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Job Drawer
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isJobDrawerOpen, setIsJobDrawerOpen] = useState(false);

  // Add modals
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Add vehicle form state
  const [newVehicle, setNewVehicle] = useState({
    plateNumber: '',
    make: '',
    model: '',
    year: '',
    mileage: '',
    customerId: ''
  });

  // Add customer form state
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: ''
  });

  useEffect(() => {
    loadData();
  }, [searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = searchQuery.trim() ? { q: searchQuery.trim() } : {};
      const [vRes, cRes] = await Promise.all([
        api.get('/vehicles', { params }),
        api.get('/customers', { params })
      ]);
      setVehicles(vRes.data);
      setCustomers(cRes.data);
    } catch (err) {
      setError('Failed to fetch vehicles & customers directory');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenHistory = (vehicleId) => {
    setSelectedVehicleId(vehicleId);
    setIsHistoryOpen(true);
  };

  const handleCreateVehicle = async (e) => {
    e.preventDefault();
    try {
      await api.post('/vehicles', {
        ...newVehicle,
        year: newVehicle.year ? parseInt(newVehicle.year) : null,
        mileage: parseInt(newVehicle.mileage || 0),
        customerId: parseInt(newVehicle.customerId)
      });
      setIsAddVehicleOpen(false);
      setNewVehicle({ plateNumber: '', make: '', model: '', year: '', mileage: '', customerId: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add vehicle');
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      await api.post('/customers', newCustomer);
      setIsAddCustomerOpen(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '' });
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add customer');
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8FAFC]">
      <Header
        title="Vehicles & Client Registry"
        subtitle="Complete fleet directory, service history timeline, and relationships"
        onRefresh={loadData}
        onOpenMobileMenu={onOpenMobileMenu}
        loading={loading}
      />

      <main className="p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Tab Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
                activeTab === 'vehicles'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Vehicles ({vehicles.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all min-h-[36px] ${
                activeTab === 'customers'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Clients ({customers.length})</span>
            </button>
          </div>

          {/* Search Box & Add Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder={
                  activeTab === 'vehicles'
                    ? 'Search plate, make, model...'
                    : 'Search client name, phone...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all min-h-[40px]"
              />
            </div>

            {activeTab === 'vehicles' ? (
              <button
                onClick={() => setIsAddVehicleOpen(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl shadow-xs inline-flex items-center gap-1.5 shrink-0 min-h-[40px]"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Vehicle</span>
                <span className="sm:hidden">Add</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAddCustomerOpen(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl shadow-xs inline-flex items-center gap-1.5 shrink-0 min-h-[40px]"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Client</span>
                <span className="sm:hidden">Add</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Directory Content */}
        {activeTab === 'vehicles' ? (
          /* Vehicles Table */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Plate</th>
                    <th className="py-3 px-4">Make & Model</th>
                    <th className="py-3 px-4">Year</th>
                    <th className="py-3 px-4 text-right">Odometer</th>
                    <th className="py-3 px-4">Owner</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4 text-center">Visits</th>
                    <th className="py-3 px-4 text-right">Total Spent</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {vehicles.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => handleOpenHistory(v.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold tracking-wider text-slate-900 shadow-2xs">
                          {v.plateNumber}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {v.make} {v.model}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {v.year || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700 font-medium">
                        {v.mileage?.toLocaleString()} km
                      </td>

                      <td className="py-3.5 px-4 text-slate-900 font-medium truncate max-w-[120px]">
                        {v.customer?.name}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono">
                        {v.customer?.phone}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-mono font-medium text-slate-700">
                          {v.stats?.totalServices || 0}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 tabular-nums">
                        ${v.stats?.totalSpent?.toFixed(2) || '0.00'}
                      </td>

                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenHistory(v.id)}
                          className="px-2.5 py-1.5 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors min-h-[34px]"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>History</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Customers Table */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Client Name</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Registered Vehicles</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4 text-center">Since</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {c.name}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-slate-700">
                        {c.phone}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        {c.email || '—'}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {c.vehicles?.map((v) => (
                            <button
                              key={v.id}
                              onClick={() => handleOpenHistory(v.id)}
                              className="px-2 py-0.5 bg-slate-100 border border-slate-200 hover:border-slate-900 rounded text-[11px] font-mono font-medium text-slate-800 transition-colors"
                              title="View vehicle history"
                            >
                              {v.plateNumber} ({v.make})
                            </button>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 max-w-[160px] truncate">
                        {c.address || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-center text-slate-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Service History Timeline Modal */}
      <ServiceHistoryModal
        vehicleId={selectedVehicleId}
        isOpen={isHistoryOpen}
        onClose={() => {
          setIsHistoryOpen(false);
          setSelectedVehicleId(null);
        }}
        onOpenJob={(jobId) => {
          setSelectedJobId(jobId);
          setIsJobDrawerOpen(true);
        }}
      />

      {/* Slide-over Job Drawer */}
      <JobDrawer
        jobId={selectedJobId}
        isOpen={isJobDrawerOpen}
        onClose={() => {
          setIsJobDrawerOpen(false);
          setSelectedJobId(null);
        }}
        onJobUpdated={() => loadData()}
      />

      {/* Add Vehicle Modal */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in pb-safe">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">Add New Vehicle</h3>
              <button onClick={() => setIsAddVehicleOpen(false)} className="p-2 -mr-2">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Select Customer *</label>
                <select
                  required
                  value={newVehicle.customerId}
                  onChange={(e) => setNewVehicle({ ...newVehicle, customerId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[40px]"
                >
                  <option value="">Select an owner...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Plate Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CAB-9921"
                    value={newVehicle.plateNumber}
                    onChange={(e) => setNewVehicle({ ...newVehicle, plateNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Make *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Toyota"
                    value={newVehicle.make}
                    onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[40px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-500 mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Camry"
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Year</label>
                  <input
                    type="number"
                    placeholder="2021"
                    value={newVehicle.year}
                    onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[40px]"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Mileage</label>
                  <input
                    type="number"
                    placeholder="30000"
                    value={newVehicle.mileage}
                    onChange={(e) => setNewVehicle({ ...newVehicle, mileage: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[40px]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 min-h-[44px]"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in pb-safe">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">Add New Customer</h3>
              <button onClick={() => setIsAddCustomerOpen(false)} className="p-2 -mr-2">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Hayes"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 555-0144"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="jordan@example.com"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1">Physical Address (Optional)</label>
                <input
                  type="text"
                  placeholder="123 Main St, City"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl min-h-[40px]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 min-h-[44px]"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
