import { useState, useEffect } from 'react';
import { FileText, Receipt, CheckCircle, Clock } from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState({
    pendingQuotations: 0,
    outstandingInvoices: 0,
    totalRevenue: 0,
  });
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [quotations, invoices] = await Promise.all([
          api.getDocuments('Quotation'),
          api.getDocuments('Invoice')
        ]);

        const pendingQuotations = quotations.filter(q => q.status === 'Sent' || q.status === 'Revised').length;
        const outstandingInvoices = invoices.filter(i => i.status === 'Invoiced').length;
        const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, current) => sum + current.total, 0);

        setStats({
          pendingQuotations,
          outstandingInvoices,
          totalRevenue
        });

        // Combine and sort by date descending for recent docs (mocking recent activity)
        const allDocs = [...quotations, ...invoices];
        allDocs.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecentDocs(allDocs.slice(0, 5));
        
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  if (loading) {
    return <div className="p-6 h-full flex items-center justify-center text-slate-500">Loading Dashboard...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">Overview of your quotations and invoices.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Card 1 */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-900/5 transition hover:shadow-md">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-brand-blue" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-slate-500">Pending Quotations</dt>
                  <dd>
                    <div className="text-2xl font-bold text-slate-900">{stats.pendingQuotations}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-900/5 transition hover:shadow-md">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-6 w-6 text-yellow-500" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-slate-500">Outstanding Invoices</dt>
                  <dd>
                    <div className="text-2xl font-bold text-slate-900">{stats.outstandingInvoices}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-900/5 transition hover:shadow-md">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-500" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-slate-500">Total Revenue</dt>
                  <dd>
                    <div className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalRevenue)}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <h2 className="text-lg font-medium leading-6 text-slate-900 mt-8 mb-4">Recent Documents</h2>
      <div className="overflow-hidden bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-lg">
        <ul role="list" className="divide-y divide-slate-100">
          {recentDocs.map((doc) => (
            <li key={`doc-${doc.type}-${doc.id}`} className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-slate-50 sm:px-6 transition">
              <div className="flex min-w-0 gap-x-4">
                <div className="min-w-0 flex-auto">
                  <p className="text-sm font-semibold leading-6 text-slate-900">
                    <a href={`/${doc.type.toLowerCase()}s/${doc.id}`}>
                      <span className="absolute inset-x-0 -top-px bottom-0" />
                      {doc.number}
                    </a>
                  </p>
                  <p className="mt-1 flex text-xs leading-5 text-slate-500">
                    {doc.client?.name} &bull; {doc.type}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-x-4">
                <div className="hidden sm:flex sm:flex-col sm:items-end">
                  <p className="text-sm leading-6 text-slate-900">{formatCurrency(doc.total)}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {new Date(doc.date).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric'})}
                  </p>
                </div>
                {/* Simple status badge */}
                <div className="hidden sm:flex sm:flex-col sm:items-end">
                   <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                     {doc.status}
                   </span>
                </div>
              </div>
            </li>
          ))}
          {recentDocs.length === 0 && (
            <li className="px-4 py-5 text-center text-sm text-slate-500">No recent activity found.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
