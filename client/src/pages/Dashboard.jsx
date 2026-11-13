import React, { useState, useEffect } from 'react';
import {
  Wrench,
  CheckCircle,
  DollarSign,
  AlertOctagon,
  Clock,
  ArrowUpRight,
  Package,
  Plus,
  RefreshCw,
  Car
} from 'lucide-react';
import api from '../api';
import StatusBadge from '../components/StatusBadge';
import Header from '../components/Header';
import JobDrawer from '../components/JobDrawer';
import NewJobModal from '../components/NewJobModal';
import InvoicePrintModal from '../components/InvoicePrintModal';

export default function Dashboard({ onOpenMobileMenu }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals / Drawers
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isJobDrawerOpen, setIsJobDrawerOpen] = useState(false);
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  const [invoiceToView, setInvoiceToView] = useState(null);
  const [jobForInvoice, setJobForInvoice] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/dashboard');
      setData(res.data);
      if (res.data.warning) {
        setError(res.data.warning);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Database is connecting. Please ensure DATABASE_URL is set in Railway Variables.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRestock = async (itemId) => {
    try {
      await api.patch(`/inventory/${itemId}/stock`, { delta: 10 });
      loadDashboard();
    } catch (err) {
      alert('Failed to restock item');
    }
  };

  const openJob = (id) => {
    setSelectedJobId(id);
    setIsJobDrawerOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8FAFC]">
      <Header
        title="Workshop Command Center"
        subtitle="Real-time repair telemetry, inventory thresholds & billing"
        onRefresh={loadDashboard}
        onNewJob={() => setIsNewJobOpen(true)}
        onOpenMobileMenu={onOpenMobileMenu}
        loading={loading}
      />

      <main className="p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl">
            {error}
          </div>
        )}

        {/* 4 Top KPI Cards (2x2 on mobile, 4x1 on desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Active Jobs */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Active Jobs</span>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Wrench className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums">
              {data?.activeJobsCount ?? '—'}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">In service & bays</p>
          </div>

          {/* Ready for Pickup */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Ready Pickup</span>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl font-bold font-mono text-emerald-600 tabular-nums">
              {data?.readyJobsCount ?? '—'}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">Ready for client</p>
          </div>

          {/* Today's Revenue */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Today's Rev</span>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                <DollarSign className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl font-bold font-mono text-slate-900 tabular-nums truncate">
              ${data?.todayRevenue !== undefined ? data.todayRevenue.toFixed(2) : '—'}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">Settled today</p>
          </div>

          {/* Unpaid Balance */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between text-slate-500 mb-1.5 sm:mb-2">
              <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate">Unpaid Bal</span>
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertOctagon className="w-3 h-3 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="text-xl sm:text-3xl font-bold font-mono text-rose-600 tabular-nums truncate">
              ${data?.totalUnpaidBalance !== undefined ? data.totalUnpaidBalance.toFixed(2) : '—'}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5 sm:mt-1 truncate">Receivables due</p>
          </div>
        </div>

        {/* Workshop Floor & Low Stock Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Workshop Floor Live Board */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                  Workshop Floor Live Status
                </h3>
                <p className="text-xs text-slate-500">Active bays and intake orders</p>
              </div>
              <button
                onClick={() => setIsNewJobOpen(true)}
                className="text-xs text-slate-900 font-semibold hover:underline flex items-center gap-1 p-1"
              >
                <span>+ Create</span>
              </button>
            </div>

            {/* Live Board Stages (1 col on mobile, 3 cols on sm/desktop) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Pending */}
              <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase text-amber-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> Pending Intake
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {data?.recentJobCards?.filter((j) => j.status === 'PENDING').length || 0}
                  </span>
                </div>

                <div className="space-y-2">
                  {data?.recentJobCards?.filter((j) => j.status === 'PENDING').length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-2 text-center">No pending jobs</p>
                  ) : (
                    data?.recentJobCards
                      ?.filter((j) => j.status === 'PENDING')
                      .map((job) => (
                        <div
                          key={job.id}
                          onClick={() => openJob(job.id)}
                          className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-900 cursor-pointer transition-all space-y-1 active:scale-[0.99]"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {job.jobNumber}
                            </span>
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">
                              {job.vehicle?.plateNumber}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-1">{job.complaint}</p>
                          <p className="text-[10px] text-slate-400">
                            {job.vehicle?.customer?.name}
                          </p>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* In Progress */}
              <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase text-blue-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> On Bay / Service
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {data?.recentJobCards?.filter((j) => j.status === 'IN_PROGRESS' || j.status === 'WAITING_PARTS').length || 0}
                  </span>
                </div>

                <div className="space-y-2">
                  {data?.recentJobCards?.filter((j) => j.status === 'IN_PROGRESS' || j.status === 'WAITING_PARTS').length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-2 text-center">No jobs on bays</p>
                  ) : (
                    data?.recentJobCards
                      ?.filter((j) => j.status === 'IN_PROGRESS' || j.status === 'WAITING_PARTS')
                      .map((job) => (
                        <div
                          key={job.id}
                          onClick={() => openJob(job.id)}
                          className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-slate-900 cursor-pointer transition-all space-y-1 active:scale-[0.99]"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {job.jobNumber}
                            </span>
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">
                              {job.vehicle?.plateNumber}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-1">{job.complaint}</p>
                          <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                            <span>Tech: {job.assignedMechanic || 'Unassigned'}</span>
                            <span className="font-mono text-slate-800 font-semibold">${job.totalCost?.toFixed(2)}</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Ready */}
              <div className="bg-slate-50/70 border border-slate-200/60 rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase text-emerald-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Ready Pickup
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    {data?.recentJobCards?.filter((j) => j.status === 'READY').length || 0}
                  </span>
                </div>

                <div className="space-y-2">
                  {data?.recentJobCards?.filter((j) => j.status === 'READY').length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic py-2 text-center">No ready vehicles</p>
                  ) : (
                    data?.recentJobCards
                      ?.filter((j) => j.status === 'READY')
                      .map((job) => (
                        <div
                          key={job.id}
                          onClick={() => openJob(job.id)}
                          className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs hover:border-emerald-600 cursor-pointer transition-all space-y-1 active:scale-[0.99]"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              {job.jobNumber}
                            </span>
                            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 bg-slate-100 rounded text-slate-700">
                              {job.vehicle?.plateNumber}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-1">{job.complaint}</p>
                          <div className="flex justify-between items-center text-[10px] pt-1">
                            <span className="text-emerald-700 font-medium">Ready</span>
                            <span className="font-mono text-slate-900 font-semibold">${job.totalCost?.toFixed(2)}</span>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Low Stock Alerts Quick-Action Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <AlertOctagon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900">Low Stock Alerts</h3>
                    <p className="text-[11px] text-slate-500">Threshold alerts</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-mono font-bold rounded-full">
                  {data?.lowStockItems?.length || 0}
                </span>
              </div>

              <div className="space-y-2 mt-3">
                {data?.lowStockItems?.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    All parts inventory levels are healthy!
                  </div>
                ) : (
                  data?.lowStockItems?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{item.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">
                          {item.sku} • Min {item.minStockLevel}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs font-mono font-bold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleQuickRestock(item.id)}
                          className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium rounded-lg shadow-2xs transition-colors flex items-center gap-1 min-h-[34px]"
                          title="Restock +10 units"
                        >
                          <Plus className="w-3 h-3" />
                          <span>+10</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Threshold triggers auto alerts</span>
              <a href="/inventory" className="text-slate-900 font-medium hover:underline">
                Inventory →
              </a>
            </div>
          </div>
        </div>

        {/* Recent Job Cards Table (Scrollable container for mobile) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 tracking-tight">Recent Repair Orders</h3>
              <p className="text-xs text-slate-500">Latest vehicle admissions</p>
            </div>
            <a href="/jobs" className="text-xs text-slate-900 font-semibold hover:underline">
              View all →
            </a>
          </div>

          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3">Client</th>
                  <th className="py-2.5 px-3">Complaint</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Cost</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recentJobCards?.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {job.jobNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-mono font-semibold text-slate-800">
                          {job.vehicle?.plateNumber}
                        </span>
                        <span className="text-slate-600 truncate max-w-[100px]">
                          {job.vehicle?.make}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-medium text-slate-900 truncate max-w-[120px]">{job.vehicle?.customer?.name}</p>
                    </td>
                    <td className="py-3 px-3 max-w-[140px] truncate text-slate-600">
                      {job.complaint}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={job.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      ${job.totalCost?.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => openJob(job.id)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors min-h-[32px]"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Slide-Over Job Detail Drawer */}
      <JobDrawer
        jobId={selectedJobId}
        isOpen={isJobDrawerOpen}
        onClose={() => {
          setIsJobDrawerOpen(false);
          setSelectedJobId(null);
        }}
        onJobUpdated={() => loadDashboard()}
        onGenerateInvoice={(jobOrInvoice) => {
          if (jobOrInvoice.invoiceNumber) {
            setInvoiceToView(jobOrInvoice);
          } else {
            setJobForInvoice(jobOrInvoice);
          }
        }}
      />

      {/* New Job Modal */}
      <NewJobModal
        isOpen={isNewJobOpen}
        onClose={() => setIsNewJobOpen(false)}
        onJobCreated={(newJob) => {
          loadDashboard();
          openJob(newJob.id);
        }}
      />

      {/* Invoice View / Print Modal */}
      {(invoiceToView || jobForInvoice) && (
        <InvoicePrintModal
          isOpen={true}
          invoice={invoiceToView}
          jobCard={jobForInvoice}
          onClose={() => {
            setInvoiceToView(null);
            setJobForInvoice(null);
          }}
          onInvoiceCreated={() => {
            loadDashboard();
          }}
        />
      )}
    </div>
  );
}
