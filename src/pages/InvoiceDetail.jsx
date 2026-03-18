import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, FileDown, Languages, Banknote, X, CreditCard } from 'lucide-react';
import { api } from '../services/api';
import { useReactToPrint } from 'react-to-print';

const translations = {
  en: {
    invoice: 'Invoice',
    billedTo: 'Billed To:',
    dateIssued: 'Date Issued:',
    dueDate: 'Due Date:',
    description: 'Description',
    qty: 'Qty',
    unitPrice: 'Unit Price',
    total: 'Total',
    laborConsulting: 'Labor & Consulting',
    subtotal: 'Subtotal',
    discount: 'Discount',
    totalDue: 'Total Due',
    paymentDetails: 'Payment Details',
    notes: 'Notes',
    paymentNote: 'Please include the invoice number',
    paymentNoteSuffix: 'in your payment reference.',
    thankYou: 'Thank you for your trust!',
    paymentHistory: 'Payment History',
    downPayment: 'Down Payment',
    finalPayment: 'Final Payment',
    totalPaid: 'Total Paid',
    remainingBalance: 'Remaining Balance',
  },
  id: {
    invoice: 'Tagihan',
    billedTo: 'Ditagihkan Kepada:',
    dateIssued: 'Tanggal Terbit:',
    dueDate: 'Jatuh Tempo:',
    description: 'Deskripsi',
    qty: 'Jml',
    unitPrice: 'Harga Satuan',
    total: 'Total',
    laborConsulting: 'Biaya Tenaga Kerja & Konsultasi',
    subtotal: 'Subtotal',
    discount: 'Diskon',
    totalDue: 'Total Tagihan',
    paymentDetails: 'Detail Pembayaran',
    notes: 'Catatan',
    paymentNote: 'Harap sertakan nomor tagihan',
    paymentNoteSuffix: 'pada referensi pembayaran Anda.',
    thankYou: 'Terima kasih atas kepercayaan Anda!',
    paymentHistory: 'Riwayat Pembayaran',
    downPayment: 'Uang Muka (DP)',
    finalPayment: 'Pelunasan',
    totalPaid: 'Total Dibayar',
    remainingBalance: 'Sisa Tagihan',
  }
};

function DPModal({ isOpen, onClose, onSubmit, maxAmount, formatCurrency }) {
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (isOpen) setAmount('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = Number(amount);
    if (val > 0 && val < maxAmount) {
      onSubmit(val);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl ring-1 ring-slate-900/5 w-full max-w-md mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Banknote size={20} className="text-amber-500" /> Pay Down Payment
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm text-slate-500 mb-3">
              Total invoice: <span className="font-bold text-slate-900">{formatCurrency(maxAmount)}</span>
            </p>
            <label className="block text-sm font-medium text-slate-700 mb-1">Down Payment Amount (IDR)</label>
            <input
              type="number"
              required
              min="1"
              max={maxAmount - 1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-amber-500 sm:text-sm"
              placeholder="Enter DP amount..."
            />
            {amount && Number(amount) > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                Remaining after DP: <span className="font-semibold text-slate-700">{formatCurrency(maxAmount - Number(amount))}</span>
              </p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white ring-1 ring-inset ring-slate-300 rounded-md hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-amber-500 rounded-md hover:bg-amber-600 shadow-sm transition"
            >
              Confirm DP
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [lang, setLang] = useState('en');
  const [dpModalOpen, setDpModalOpen] = useState(false);
  const documentRef = useRef();

  const t = translations[lang];

  useEffect(() => {
    api.getDocumentById(id).then(data => {
      setInvoice(data);
      setLoading(false);
    });
  }, [id]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
  };

  const formatDate = (dateStr) => {
    const locale = lang === 'id' ? 'id-ID' : 'en-US';
    return new Date(dateStr).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const payments = invoice?.payments || [];
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const remainingBalance = (invoice?.total || 0) - totalPaid;

  const handlePayDP = async (amount) => {
    setLoading(true);
    await api.addPayment(id, { amount, type: 'dp' });
    const updated = await api.getDocumentById(id);
    setInvoice(updated);
    setDpModalOpen(false);
    setLoading(false);
  };

  const handleMarkPaid = async () => {
    setLoading(true);
    await api.addPayment(id, { amount: remainingBalance, type: 'full' });
    const updated = await api.getDocumentById(id);
    setInvoice(updated);
    setLoading(false);
  };

  const handleDownloadPDF = useReactToPrint({
    contentRef: documentRef,
    documentTitle: `Invoice-${invoice?.number?.replace(/\//g, '-')}`,
    onBeforeGetContent: () => setIsPrinting(true),
    onBeforePrint: () => Promise.resolve(),
    onAfterPrint: () => setIsPrinting(false),
  });

  const statusColors = {
    'Invoiced': 'bg-yellow-100 text-yellow-800 ring-yellow-600/20',
    'DP Paid': 'bg-amber-100 text-amber-800 ring-amber-600/20',
    'Paid': 'bg-green-100 text-green-800 ring-green-600/20',
    'Completed': 'bg-blue-100 text-blue-800 ring-blue-600/20',
    'Cancelled': 'bg-red-100 text-red-800 ring-red-600/20'
  };

  if (loading) return <div className="p-6 text-slate-500">Loading invoice...</div>;
  if (!invoice) return <div className="p-6 text-red-500">Invoice not found.</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div className="flex items-start md:items-center gap-4">
          <Link to="/invoices" className="text-slate-400 hover:text-slate-600 transition mt-1 md:mt-0">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold leading-7 text-slate-900">
                Invoice {invoice.number}
              </h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ring-1 ring-inset ${statusColors[invoice.status]}`}>
                {invoice.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Due on {new Date(invoice.dueDate).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'id' : 'en')}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white ring-1 ring-inset ring-slate-300 rounded-md hover:bg-slate-50 shadow-sm transition"
          >
            <Languages size={16} /> <span className="hidden sm:inline">{lang === 'en' ? 'ID' : 'EN'}</span>
          </button>

          {/* Pay DP - only when Invoiced and no DP yet */}
          {invoice.status === 'Invoiced' && (
            <button
              onClick={() => setDpModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-amber-500 rounded-md hover:bg-amber-600 shadow-sm transition"
            >
              <Banknote size={16} /> <span className="hidden sm:inline">Pay DP</span>
            </button>
          )}

          {/* Mark as Paid - when Invoiced (full) or DP Paid (remaining) */}
          {(invoice.status === 'Invoiced' || invoice.status === 'DP Paid') && (
            <button
              onClick={handleMarkPaid}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 shadow-sm transition"
            >
              <CheckCircle size={16} /> <span className="hidden sm:inline">{invoice.status === 'DP Paid' ? 'Pay Remaining' : 'Mark as Paid'}</span>
            </button>
          )}

          <button
            onClick={handleDownloadPDF}
            disabled={isPrinting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white ring-1 ring-inset ring-slate-300 rounded-md hover:bg-slate-50 shadow-sm transition disabled:opacity-50"
          >
            <FileDown size={16} /> <span className="hidden sm:inline">{isPrinting ? 'PDF...' : 'Print PDF'}</span>
          </button>
        </div>
      </div>

      <div ref={documentRef} className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl overflow-hidden p-0 m-0">
        {/* Header Section */}
        <div className="px-6 py-8 border-b border-slate-200 sm:px-8">
          <div className="flex justify-between items-start">
            <div>
              <img src="/icon.png" alt="Bewhy Logo" className="h-12 w-auto mb-4" />
              <h2 className="text-lg font-bold text-slate-900">Bewhy Indonesia</h2>
              <p className="text-sm text-slate-500 mt-1 max-w-xs">
                Professional Web Apps Development
              </p>
              <div className="mt-3 text-sm text-slate-500 space-y-0.5">
                <p>Duta Pakis Residence</p>
                <p>Bogor, Indonesia 16120</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight uppercase">{t.invoice}</h2>
              <p className="text-slate-500 mt-1">{invoice.number}</p>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{t.billedTo}</h3>
              <p className="mt-2 text-base font-medium text-slate-900">{invoice.client.name}</p>
              <p className="text-sm text-slate-500">{invoice.client.address}</p>
              <p className="text-sm text-slate-500">ATTN: {invoice.client.pic}</p>
            </div>
            <div className="text-right">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-900">{t.dateIssued}</h3>
                <p className="mt-1 text-sm text-slate-500">{formatDate(invoice.date)}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">{t.dueDate}</h3>
                <p className="mt-1 text-sm text-slate-500 font-medium text-red-600">{formatDate(invoice.dueDate)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="px-6 py-8 sm:px-8">
          <div className="flow-root">
            <div className="-mx-6 -my-2 sm:-mx-8 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-8 lg:px-8">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead>
                    <tr>
                      <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-900 sm:pl-0">{t.description}</th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900">{t.qty}</th>
                      <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-slate-900">{t.unitPrice}</th>
                      <th scope="col" className="py-3.5 pl-3 pr-4 text-right text-sm font-semibold text-slate-900 sm:pr-0">{t.total}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {invoice.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-0">{item.description}</td>
                        <td className="px-3 py-4 text-sm text-slate-500 text-right">{item.qty}</td>
                        <td className="px-3 py-4 text-sm text-slate-500 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-4 pl-3 pr-4 text-sm text-slate-900 text-right font-medium sm:pr-0">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                    {invoice.laborCosts && invoice.laborCosts.length > 0 && (
                      <>
                        <tr>
                          <td colSpan="4" className="bg-slate-50 py-2 pl-4 text-xs font-semibold text-slate-700 sm:pl-0 uppercase">{t.laborConsulting}</td>
                        </tr>
                        {invoice.laborCosts.map((labor) => (
                          <tr key={`labor-${labor.id}`}>
                            <td colSpan="3" className="py-4 pl-4 pr-3 text-sm font-medium text-slate-600 sm:pl-0">{labor.description}</td>
                            <td className="py-4 pl-3 pr-4 text-sm text-slate-900 text-right font-medium sm:pr-0">{formatCurrency(labor.cost)}</td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row" colSpan="3" className="hidden pl-4 pr-3 pt-6 text-right text-sm font-normal text-slate-500 sm:table-cell sm:pl-0">{t.subtotal}</th>
                      <th scope="row" className="pl-4 pr-3 pt-6 text-left text-sm font-normal text-slate-500 sm:hidden">{t.subtotal}</th>
                      <td className="pl-3 pr-4 pt-6 text-right text-sm text-slate-500 sm:pr-0">{formatCurrency(invoice.subTotal)}</td>
                    </tr>
                    {invoice.discount > 0 && (
                      <tr>
                        <th scope="row" colSpan="3" className="hidden pl-4 pr-3 pt-4 text-right text-sm font-normal text-slate-500 sm:table-cell sm:pl-0">{t.discount}</th>
                        <th scope="row" className="pl-4 pr-3 pt-4 text-left text-sm font-normal text-slate-500 sm:hidden">{t.discount}</th>
                        <td className="pl-3 pr-4 pt-4 text-right text-sm text-red-500 sm:pr-0">-{formatCurrency(invoice.discount)}</td>
                      </tr>
                    )}
                    <tr>
                      <th scope="row" colSpan="3" className="hidden pl-4 pr-3 pt-4 text-right text-sm font-semibold text-slate-900 sm:table-cell sm:pl-0">{t.totalDue}</th>
                      <th scope="row" className="pl-4 pr-3 pt-4 text-left text-sm font-semibold text-slate-900 sm:hidden">{t.totalDue}</th>
                      <td className="pl-3 pr-4 pt-4 text-right text-lg font-bold text-slate-900 sm:pr-0">{formatCurrency(invoice.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Payment History Section */}
        {payments.length > 0 && (
          <div className="px-6 py-6 sm:px-8 border-t border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard size={16} className="text-slate-400" />
              {t.paymentHistory}
            </h3>
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 ring-1 ring-slate-200">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${payment.type === 'dp' ? 'bg-amber-400' : 'bg-green-400'}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {payment.type === 'dp' ? t.downPayment : t.finalPayment}
                      </p>
                      <p className="text-xs text-slate-500">{formatDate(payment.date)}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(payment.amount)}</p>
                </div>
              ))}

              {/* Summary */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">{t.totalPaid}</span>
                  <span className="font-bold text-green-600">{formatCurrency(totalPaid)}</span>
                </div>
                {remainingBalance > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t.remainingBalance}</span>
                    <span className="font-bold text-red-600">{formatCurrency(remainingBalance)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Area with Bank Details */}
        <div className="bg-gray-800 text-white px-6 py-6 border-t border-gray-700 sm:px-8 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">{t.paymentDetails}</h4>
              <p className="text-gray-300 text-sm">Bank BCA</p>
              <p className="text-gray-300 text-sm">A/N: Barod Manggala Y A</p>
              <p className="text-white text-lg font-mono tracking-widest mt-1">603-040-6425</p>
            </div>
            <div className="text-left md:text-right">
              <h4 className="font-semibold mb-2">{t.notes}</h4>
              <p className="text-gray-400 text-sm">{t.paymentNote} ({invoice.number}) {t.paymentNoteSuffix}</p>
            </div>
          </div>
        </div>

        {/* Simple Footer / Contact */}
        <div className="bg-slate-50 px-6 py-8 border-t border-slate-200 sm:px-8 rounded-b-xl">
          <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start text-sm text-slate-500 gap-6">
            <div className="text-center sm:text-left">
              <p className="font-bold text-slate-700 mb-2">{t.thankYou}</p>
              <p className="font-bold text-slate-700">Bewhy Indonesia</p>
              <p className="font-medium">PT BAHASA YOEDHISTIRA DIGITAL</p>
            </div>
            <div className="text-center sm:text-right space-y-0.5 bg-white px-4 py-3 rounded-md ring-1 ring-slate-200 shadow-sm">
              <p>Website: <span className="font-medium text-slate-700">bewhy.id</span></p>
              <p>Phone: <span className="font-medium text-slate-700">+62 819-9993-4451</span></p>
              <p>Email: <span className="font-medium text-slate-700">gmail@bewhy.id</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* DP Modal */}
      <DPModal
        isOpen={dpModalOpen}
        onClose={() => setDpModalOpen(false)}
        onSubmit={handlePayDP}
        maxAmount={invoice.total}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}
