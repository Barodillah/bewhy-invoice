import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { api } from '../services/api';

export default function QuotationEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    clientId: '',
    date: '',
    discount: 0,
    number: '',
    status: 'Draft',
  });

  const [benefits, setBenefits] = useState([]);
  const [terms, setTerms] = useState([]);
  const [items, setItems] = useState([]);
  const [laborCosts, setLaborCosts] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      const [clientsData, quotation] = await Promise.all([
        api.getClients(),
        api.getDocumentById(id)
      ]);

      setClients(clientsData);

      if (quotation) {
        setFormData({
          clientId: quotation.clientId,
          date: quotation.date,
          discount: quotation.discount || 0,
          number: quotation.number,
          status: quotation.status,
        });

        // Map items with local IDs
        setItems(
          quotation.items.map((item, i) => ({
            id: Date.now() + i,
            description: item.description,
            qty: item.qty,
            unitPrice: item.unitPrice,
          }))
        );

        // Map labor costs with local IDs
        setLaborCosts(
          (quotation.laborCosts || []).map((lc, i) => ({
            id: Date.now() + 100 + i,
            description: lc.description,
            cost: lc.cost,
          }))
        );

        // Map benefits
        setBenefits(
          (quotation.benefits || []).length > 0
            ? quotation.benefits.map((b, i) => ({ id: Date.now() + 200 + i, text: b }))
            : [{ id: Date.now(), text: '' }]
        );

        // Map terms
        setTerms(
          (quotation.terms || []).length > 0
            ? quotation.terms.map((t, i) => ({ id: Date.now() + 300 + i, text: t }))
            : [{ id: Date.now() + 1, text: '' }]
        );
      }

      setLoading(false);
    };

    loadData();
  }, [id]);

  const handleItemChange = (itemId, field, value) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const parsedValue = field === 'qty' || field === 'unitPrice' ? Number(value) : value;
        return { ...item, [field]: parsedValue };
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: '', qty: 1, unitPrice: 0 }]);
  };

  const removeItem = (itemId) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== itemId));
    }
  };

  const handleLaborChange = (laborId, field, value) => {
    setLaborCosts(laborCosts.map(labor => {
      if (labor.id === laborId) {
        const parsedValue = field === 'cost' ? Number(value) : value;
        return { ...labor, [field]: parsedValue };
      }
      return labor;
    }));
  };

  const addLabor = () => {
    setLaborCosts([...laborCosts, { id: Date.now(), description: '', cost: 0 }]);
  };

  const removeLabor = (laborId) => {
    setLaborCosts(laborCosts.filter(labor => labor.id !== laborId));
  };

  const handleBenefitChange = (benefitId, value) => {
    setBenefits(benefits.map(b => b.id === benefitId ? { ...b, text: value } : b));
  };

  const addBenefit = () => {
    setBenefits([...benefits, { id: Date.now(), text: '' }]);
  };

  const removeBenefit = (benefitId) => {
    setBenefits(benefits.filter(b => b.id !== benefitId));
  };

  const handleTermChange = (termId, value) => {
    setTerms(terms.map(t => t.id === termId ? { ...t, text: value } : t));
  };

  const addTerm = () => {
    setTerms([...terms, { id: Date.now(), text: '' }]);
  };

  const removeTerm = (termId) => {
    setTerms(terms.filter(t => t.id !== termId));
  };

  // Calculations
  const itemsTotal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
  const laborTotal = laborCosts.reduce((sum, lc) => sum + lc.cost, 0);
  const subTotal = itemsTotal + laborTotal;
  const total = subTotal - Number(formData.discount);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updatedDoc = {
      date: formData.date,
      discount: Number(formData.discount),
      subTotal,
      total,
      clientId: Number(formData.clientId),
      itemsTotal,
      laborCostTotal: laborTotal,
      benefits: benefits.filter(b => b.text.trim() !== '').map(b => b.text),
      terms: terms.filter(t => t.text.trim() !== '').map(t => t.text)
    };

    const finalItems = items.map(item => ({
      description: item.description,
      qty: item.qty,
      unitPrice: item.unitPrice,
      total: item.qty * item.unitPrice
    }));

    const finalLabor = laborCosts.map(lc => ({
      description: lc.description,
      cost: lc.cost
    }));

    await api.updateDocument(id, updatedDoc, finalItems, finalLabor);
    navigate(`/quotations/${id}`);
  };

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600 transition">
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold leading-7 text-slate-900">Edit Quotation</h1>
          <p className="mt-1 text-sm text-slate-500">{formData.number} &middot; {formData.status}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Basic Info */}
        <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl p-6">
          <h2 className="text-base font-semibold leading-7 text-slate-900 mb-4">Client Information</h2>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <label htmlFor="clientId" className="block text-sm font-medium leading-6 text-slate-900">Select Client</label>
              <div className="mt-2">
                <select
                  id="clientId"
                  value={formData.clientId}
                  onChange={(e) => setFormData({...formData, clientId: e.target.value})}
                  className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-blue sm:text-sm sm:leading-6"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="date" className="block text-sm font-medium leading-6 text-slate-900">Date</label>
              <div className="mt-2">
                <input
                  type="date"
                  id="date"
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-blue sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold leading-7 text-slate-900">Items & Services</h2>
          </div>

          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="flex gap-4 items-end bg-slate-50 p-4 rounded-lg ring-1 ring-slate-200">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                  <input
                    type="text"
                    required
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-blue sm:text-sm sm:leading-6"
                    placeholder="E.g. Website Design"
                  />
                </div>
                <div className="w-24">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Qty</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={item.qty}
                    onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-blue sm:text-sm sm:leading-6"
                  />
                </div>
                <div className="w-40">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Unit Price (IDR)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-blue sm:text-sm sm:leading-6"
                  />
                </div>
                <div className="w-40">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Total</label>
                  <div className="py-1.5 text-sm font-semibold text-slate-900">
                    {(item.qty * item.unitPrice).toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="pb-1">
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length === 1}
                    className="p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-50 transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:text-brand-navy transition"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>

        {/* Labor Costs */}
        <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold leading-7 text-slate-900">Labor Costs (Optional)</h2>
          </div>

          <div className="space-y-4">
            {laborCosts.map((labor) => (
              <div key={labor.id} className="flex gap-4 items-end bg-slate-50 p-4 rounded-lg ring-1 ring-slate-200">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Role / Description</label>
                  <input
                    type="text"
                    required
                    value={labor.description}
                    onChange={(e) => handleLaborChange(labor.id, 'description', e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-blue sm:text-sm sm:leading-6"
                    placeholder="E.g. Project Manager (40hrs)"
                  />
                </div>
                <div className="w-48">
                  <label className="block text-xs font-medium text-slate-700 mb-1">Cost (IDR)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={labor.cost}
                    onChange={(e) => handleLaborChange(labor.id, 'cost', e.target.value)}
                    className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-blue sm:text-sm sm:leading-6"
                  />
                </div>
                <div className="pb-1">
                  <button
                    type="button"
                    onClick={() => removeLabor(labor.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 transition"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))}

            {laborCosts.length === 0 && (
              <p className="text-sm text-slate-500 italic">No labor costs added.</p>
            )}
          </div>

          <button
            type="button"
            onClick={addLabor}
            className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:text-brand-navy transition"
          >
            <Plus size={16} /> Add Labor Cost
          </button>
        </div>

        {/* Additional Info */}
        <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl p-6">
          <h2 className="text-base font-semibold leading-7 text-slate-900 mb-4">Additional Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Benefits */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium leading-6 text-slate-900">Benefits</label>
              </div>
              <div className="space-y-3">
                {benefits.map((benefit) => (
                  <div key={benefit.id} className="flex gap-2 items-start">
                    <input
                      type="text"
                      value={benefit.text}
                      onChange={(e) => handleBenefitChange(benefit.id, e.target.value)}
                      className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-blue sm:text-sm sm:leading-6"
                      placeholder="Enter benefit item..."
                    />
                    <button
                      type="button"
                      onClick={() => removeBenefit(benefit.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition mt-0.5"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addBenefit}
                className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:text-brand-navy transition"
              >
                <Plus size={16} /> Add Benefit
              </button>
            </div>

            {/* Terms & Conditions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium leading-6 text-slate-900">Terms & Conditions</label>
              </div>
              <div className="space-y-3">
                {terms.map((term) => (
                  <div key={term.id} className="flex gap-2 items-start">
                    <input
                      type="text"
                      value={term.text}
                      onChange={(e) => handleTermChange(term.id, e.target.value)}
                      className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-blue sm:text-sm sm:leading-6"
                      placeholder="Enter term condition..."
                    />
                    <button
                      type="button"
                      onClick={() => removeTerm(term.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition mt-0.5"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addTerm}
                className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-brand-blue hover:text-brand-navy transition"
              >
                <Plus size={16} /> Add Term
              </button>
            </div>
          </div>
        </div>

        {/* Summary & Submit */}
        <div className="bg-white shadow-sm ring-1 ring-slate-900/5 sm:rounded-xl p-6">
          <div className="flex flex-col md:flex-row gap-8 justify-between">
            <div className="flex-1 max-w-sm">
              <label htmlFor="discount" className="block text-sm font-medium leading-6 text-slate-900">Discount (Nominal IDR)</label>
              <div className="mt-2 text-red-500 flex items-center gap-2">
                <span>-</span>
                <input
                  type="number"
                  id="discount"
                  min="0"
                  value={formData.discount}
                  onChange={(e) => setFormData({...formData, discount: e.target.value})}
                  className="block w-full rounded-md border-0 py-1.5 text-red-600 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6 font-medium"
                />
              </div>
            </div>

            <div className="w-full md:w-80 space-y-3">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-medium">{itemsTotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Labor Costs</span>
                <span className="font-medium">{laborTotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-600">
                <span>Total Before Discount</span>
                <span className="font-medium">{subTotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm text-red-500">
                <span>Discount</span>
                <span className="font-medium">-{Number(formData.discount).toLocaleString('id-ID')}</span>
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-between text-lg font-bold text-slate-900">
                <span>Grand Total</span>
                <span>IDR {total.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-6">
            <button
              type="button"
              onClick={() => navigate(`/quotations/${id}`)}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white ring-1 ring-inset ring-slate-300 rounded-md hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-blue rounded-md hover:bg-brand-navy shadow-sm transition"
            >
              <Save size={16} />
              Update Quotation
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
