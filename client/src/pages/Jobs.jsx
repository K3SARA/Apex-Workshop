import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Search,
  Plus,
  Filter,
  Car,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import api from '../api';
import Header from '../components/Header';
import StatusBadge from '../components/StatusBadge';
import JobDrawer from '../components/JobDrawer';
import NewJobModal from '../components/NewJobModal';
import InvoicePrintModal from '../components/InvoicePrintModal';

const STATUS_TABS = [
  { id: 'ALL', label: 'All Jobs' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'WAITING_PARTS', label: 'Waiting' },
  { id: 'READY', label: 'Ready' },
  { id: 'COMPLETED', label: 'Completed' },
];

export default function Jobs({ onOpenMobileMenu }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  // Modals
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [isJobDrawerOpen, setIsJobDrawerOpen] = useState(false);
  const [isNewJobOpen, setIsNewJobOpen] = useState(false);
  const [invoiceToView, setInvoiceToView] = useState(null);
  const [jobForInvoice, setJobForInvoice] = useState(null);

  useEffect(() => {
    loadJobs();
  }, [activeTab, searchQuery]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (activeTab !== 'ALL') params.status = activeTab;
      if (searchQuery.trim()) params.q = searchQuery.trim();

      const res = await api.get('/jobs', { params });
      setJobs(res.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch job cards');
    } finally {
      setLoading(false);
    }
  };

  const openJob = (id) => {
    setSelectedJobId(id);
    setIsJobDrawerOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#F8FAFC]">
      <Header
        title="Repair Orders & Job Cards"
        subtitle="Manage diagnostic cards, mechanic assignments & billing"
        onRefresh={loadJobs}
        onNewJob={() => setIsNewJobOpen(true)}
        onOpenMobileMenu={onOpenMobileMenu}
        loading={loading}
      />

      <main className="p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6">
        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          {/* Status Tabs (Mobile Swipeable Pills) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0 -mx-1 px-1">
            {STATUS_TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all min-h-[34px] ${
                    isSelected
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search plate, job #, client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all min-h-[40px]"
            />
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={loadJobs}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium ml-3 shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Jobs List / Table */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading && jobs.length === 0 ? (
            <div className="p-16 text-center text-xs text-slate-400">Loading work orders...</div>
          ) : jobs.length === 0 ? (
            <div className="p-12 sm:p-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <Wrench className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900">No Job Cards found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No orders match your filter. Create a new repair order or change your search terms.
              </p>
              <button
                onClick={() => setIsNewJobOpen(true)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-xl shadow-xs inline-flex items-center gap-1.5 min-h-[42px]"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Job Card</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50 text-[11px] text-slate-500 uppercase font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Vehicle</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Reported Issue</th>
                    <th className="py-3 px-4">Tech</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Parts</th>
                    <th className="py-3 px-4 text-right">Total ($)</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {jobs.map((job) => (
                    <tr
                      key={job.id}
                      onClick={() => openJob(job.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {job.jobNumber}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded text-[11px] font-mono font-bold text-slate-800">
                            {job.vehicle?.plateNumber}
                          </span>
                          <span className="text-slate-600 font-medium truncate max-w-[110px]">
                            {job.vehicle?.make}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900 truncate max-w-[120px]">{job.vehicle?.customer?.name}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{job.vehicle?.customer?.phone}</p>
                      </td>

                      <td className="py-3.5 px-4 max-w-[160px] truncate text-slate-600">
                        {job.complaint}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 truncate max-w-[100px]">
                        {job.assignedMechanic || <span className="text-slate-400 italic">Unassigned</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        <StatusBadge status={job.status} size="sm" />
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono tabular-nums text-slate-600">
                        {job.partsUsed?.length > 0 ? (
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium text-slate-800">
                            {job.partsUsed.length}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 tabular-nums">
                        ${job.totalCost?.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openJob(job.id)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg transition-colors min-h-[34px]"
                          >
                            Inspect
                          </button>
                          {job.invoice ? (
                            <button
                              onClick={() => setInvoiceToView(job.invoice)}
                              className="px-2 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-xs font-medium rounded-lg transition-colors min-h-[34px]"
                              title="View Invoice"
                            >
                              <FileText className="w-3.5 h-3.5 inline mr-1" />
                              {job.invoice.invoiceNumber}
                            </button>
                          ) : (
                            <button
                              onClick={() => setJobForInvoice(job)}
                              className="px-2 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-medium rounded-lg transition-colors min-h-[34px]"
                              title="Generate Invoice"
                            >
                              <FileText className="w-3.5 h-3.5 inline mr-1" />
                              Invoice
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Slide-over Job Drawer */}
      <JobDrawer
        jobId={selectedJobId}
        isOpen={isJobDrawerOpen}
        onClose={() => {
          setIsJobDrawerOpen(false);
          setSelectedJobId(null);
        }}
        onJobUpdated={() => loadJobs()}
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
          loadJobs();
          openJob(newJob.id);
        }}
      />

      {/* Invoice Modal */}
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
            loadJobs();
          }}
        />
      )}
    </div>
  );
}
