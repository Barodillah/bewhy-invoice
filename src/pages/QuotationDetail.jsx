import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, FileCheck, FileDown, ExternalLink, Languages } from 'lucide-react';
import { api } from '../services/api';
import { useReactToPrint } from 'react-to-print';

const translations = {
  en: {
    quotation: 'Quotation',
    quotationTo: 'Quotation To:',
    dateIssued: 'Date Issued:',
    description: 'Description',
    qty: 'Qty',
    unitPrice: 'Unit Price',
    total: 'Total',
    laborConsulting: 'Labor & Consulting',
    itemsSubtotal: 'Items Subtotal',
    laborCosts: 'Labor Costs',
    totalBeforeDiscount: 'Total Before Discount',
    discount: 'Discount',
    grandTotal: 'Grand Total',
    benefits: 'Benefits',
    termsConditions: 'Terms & Conditions',
    acceptance1: 'Customers will be billed after they agree to this offer and are required to pay the specified down payment.',
    acceptance2: 'Customers must accept and comply with the benefits and terms stated.',
    acceptance3: 'Please send the signed offer via email or other contact.',
    signatureLabel: 'Customer Acceptance (signature below):',
    thankYou: 'Thank you for your trust!',
  },
  id: {
    quotation: 'Penawaran',
    quotationTo: 'Penawaran Kepada:',
    dateIssued: 'Tanggal Terbit:',
    description: 'Deskripsi',
    qty: 'Jml',
    unitPrice: 'Harga Satuan',
    total: 'Total',
    laborConsulting: 'Biaya Tenaga Kerja & Konsultasi',
    itemsSubtotal: 'Subtotal Item',
    laborCosts: 'Biaya Tenaga Kerja',
    totalBeforeDiscount: 'Total Sebelum Diskon',
    discount: 'Diskon',
    grandTotal: 'Total Keseluruhan',
    benefits: 'Keuntungan',
    termsConditions: 'Syarat & Ketentuan',
    acceptance1: 'Pelanggan akan ditagih setelah menyetujui penawaran ini dan wajib membayar uang muka yang ditentukan.',
    acceptance2: 'Pelanggan harus menerima dan mematuhi keuntungan serta syarat yang tercantum.',
    acceptance3: 'Silakan kirim penawaran yang telah ditandatangani melalui email atau kontak lainnya.',
    signatureLabel: 'Persetujuan Pelanggan (tanda tangan di bawah):',
    thankYou: 'Terima kasih atas kepercayaan Anda!',
  }
};

export default function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [lang, setLang] = useState('en');
  const documentRef = useRef();

  const t = translations[lang];

  useEffect(() => {
    api.getDocumentById(id).then(data => {
      setQuotation(data);
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

  const handleApprove = async () => {
    setLoading(true);
    await api.updateDocumentStatus(id, 'Approved');
    const updated = await api.getDocumentById(id);
    setQuotation(updated);
    setLoading(false);
  };

  const handleConvertToInvoice = async () => {
    setConverting(true);
    try {
      const dateObj = new Date();
      const romanMonths = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
      const monthRoman = romanMonths[dateObj.getMonth()];
      const year = dateObj.getFullYear();

      const invoices = await api.getDocuments('Invoice');
      const seqNum = String(invoices.length + 1).padStart(3, '0');
      const invoiceNumber = `${seqNum}/INV/BYD/${monthRoman}/${year}`;

      const dueDateObj = new Date();
      dueDateObj.setDate(dueDateObj.getDate() + 14);

      const newInvoiceData = {
        type: 'Invoice',
        number: invoiceNumber,
        status: 'Invoiced',
        date: dateObj.toISOString().split('T')[0],
        dueDate: dueDateObj.toISOString().split('T')[0],
        discount: quotation.discount,
        subTotal: quotation.subTotal,
        total: quotation.total,
        clientId: quotation.clientId,
        itemsTotal: quotation.itemsTotal,
        laborCostTotal: quotation.laborCostTotal,
        benefits: quotation.benefits,
        terms: quotation.terms
      };

      const itemsData = quotation.items.map(i => ({ description: i.description, qty: i.qty, unitPrice: i.unitPrice, total: i.total }));
      const laborData = quotation.laborCosts.map(l => ({ description: l.description, cost: l.cost }));

      const createdInvoice = await api.createDocument(newInvoiceData, itemsData, laborData);

      navigate(`/invoices/${createdInvoice.id}`);
    } catch (error) {
      console.error("Failed to convert:", error);
    } finally {
      setConverting(false);
    }
  };

  const handleDownloadPDF = useReactToPrint({
    contentRef: documentRef,
    documentTitle: `Quotation-${quotation?.number?.replace(/\//g, '-')}`,
    onBeforeGetContent: () => setIsPrinting(true),
    onBeforePrint: () => Promise.resolve(),
    onAfterPrint: async () => {
      setIsPrinting(false);
      // Auto update Draft → Sent on print
      if (quotation.status === 'Draft') {
        await api.updateDocumentStatus(id, 'Sent');
        const updated = await api.getDocumentById(id);
        setQuotation(updated);
      }
    },
  });

  const statusColors = {
    'Draft': 'bg-gray-100 text-gray-800',
    'Sent': 'bg-blue-100 text-blue-800',
    'Revised': 'bg-yellow-100 text-yellow-800',
    'Approved': 'bg-green-100 text-green-800',
    'Cancelled': 'bg-red-100 text-red-800'
  };

  if (loading) return <div className="p-6 text-slate-500">Loading quotation...</div>;
  if (!quotation) return <div className="p-6 text-red-500">Quotation not found.</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
        <div className="flex items-start md:items-center gap-4">
          <Link to="/quotations" className="text-slate-400 hover:text-slate-600 transition mt-1 md:mt-0">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold leading-7 text-slate-900">
                Quotation {quotation.number}
              </h1>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColors[quotation.status]}`}>
                {quotation.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">Issued on {new Date(quotation.date).toLocaleDateString('id-ID')}</p>
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

          {/* Edit Button */}
          <Link
            to={`/quotations/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white ring-1 ring-inset ring-slate-300 rounded-md hover:bg-slate-50 shadow-sm transition"
          >
            <Edit size={16} /> <span className="hidden sm:inline">Edit</span>
          </Link>

          {quotation.status === 'Sent' && (
            <button
              onClick={handleApprove}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 shadow-sm transition"
            >
              <FileCheck size={16} /> <span className="hidden sm:inline">Mark Approved</span>
            </button>
          )}
          {quotation.status === 'Approved' && (
            <button
              onClick={handleConvertToInvoice}
              disabled={converting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-blue rounded-md hover:bg-brand-navy shadow-sm transition disabled:opacity-50"
            >
              <ExternalLink size={16} /> <span className="hidden sm:inline">{converting ? 'Converting...' : 'Convert to Invoice'}</span>
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
              <h2 className="text-xl font-bold text-slate-900 tracking-tight uppercase">{t.quotation}</h2>
              <p className="text-slate-500 mt-1">{quotation.number}</p>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{t.quotationTo}</h3>
              <p className="mt-2 text-base font-medium text-slate-900">{quotation.client.name}</p>
              <p className="text-sm text-slate-500">{quotation.client.address}</p>
              <p className="text-sm text-slate-500">ATTN: {quotation.client.pic}</p>
            </div>
            <div className="text-right">
              <h3 className="text-sm font-semibold text-slate-900">{t.dateIssued}</h3>
              <p className="mt-1 text-sm text-slate-500">{formatDate(quotation.date)}</p>
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
                    {quotation.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-4 pl-4 pr-3 text-sm font-medium text-slate-900 sm:pl-0">{item.description}</td>
                        <td className="px-3 py-4 text-sm text-slate-500 text-right">{item.qty}</td>
                        <td className="px-3 py-4 text-sm text-slate-500 text-right">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-4 pl-3 pr-4 text-sm text-slate-900 text-right font-medium sm:pr-0">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}

                    {quotation.laborCosts && quotation.laborCosts.length > 0 && (
                      <>
                        <tr>
                          <td colSpan="4" className="bg-slate-50 py-2 pl-4 text-xs font-semibold text-slate-700 sm:pl-0 uppercase">{t.laborConsulting}</td>
                        </tr>
                        {quotation.laborCosts.map((labor) => (
                          <tr key={`labor-${labor.id}`}>
                            <td colSpan="3" className="py-4 pl-4 pr-3 text-sm font-medium text-slate-600 sm:pl-0">{labor.description}</td>
                            <td className="py-4 pl-3 pr-4 text-sm text-slate-900 text-right font-medium sm:pr-0">{formatCurrency(labor.cost)}</td>
                          </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Totals & Customer Acceptance */}
        <div className="px-6 pb-8 sm:px-8 bg-white">
          <div className="flex flex-col md:flex-row gap-8 justify-between">
            {/* Customer Acceptance Area */}
            <div className="flex-1 max-w-lg">
              <div className="w-full border border-slate-200 rounded-lg p-6 bg-white shadow-sm ring-1 ring-slate-900/5">
                <div className="mb-8">
                  <ol className="list-decimal pl-4 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                    <li>{t.acceptance1}</li>
                    <li>{t.acceptance2}</li>
                    <li>{t.acceptance3}</li>
                  </ol>
                </div>
                <div className="text-center w-56 mx-auto md:mx-0">
                  <p className="text-xs font-semibold text-slate-900 mb-10">{t.signatureLabel}</p>
                  <div className="border-b border-slate-400 w-full mb-2"></div>
                  <p className="text-sm font-bold text-slate-900">{quotation.client.pic}</p>
                </div>
              </div>
            </div>

            {/* Totals Block */}
            <div className="w-full md:w-80 space-y-3">
              <div className="flex justify-between text-sm text-slate-600">
                <span>{t.itemsSubtotal}</span>
                <span className="font-medium">{formatCurrency(quotation.itemsTotal || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>{t.laborCosts}</span>
                <span className="font-medium">{formatCurrency(quotation.laborCostTotal || 0)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>{t.totalBeforeDiscount}</span>
                <span className="font-medium">{formatCurrency(quotation.subTotal)}</span>
              </div>
              {quotation.discount > 0 && (
                <div className="flex justify-between text-sm text-red-500">
                  <span>{t.discount}</span>
                  <span className="font-medium">-{formatCurrency(quotation.discount)}</span>
                </div>
              )}
              <div className="pt-4 border-t border-slate-200 flex justify-between text-lg font-bold text-slate-900">
                <span>{t.grandTotal}</span>
                <span>{formatCurrency(quotation.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info Section */}
        {((quotation.benefits && quotation.benefits.length > 0) || (quotation.terms && quotation.terms.length > 0)) && (
          <div className="px-6 py-6 border-t border-slate-200 sm:px-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              {quotation.benefits && quotation.benefits.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">{t.benefits}</h3>
                  <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4">
                    {quotation.benefits.map((benefit, index) => (
                      <li key={index} className="pl-1">{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}
              {quotation.terms && quotation.terms.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">{t.termsConditions}</h3>
                  <ul className="text-sm text-slate-600 space-y-2 list-disc pl-4">
                    {quotation.terms.map((term, index) => (
                      <li key={index} className="pl-1">{term}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Area */}
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
    </div>
  );
}
