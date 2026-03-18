import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { api } from '../services/api';

function ClientModal({ isOpen, onClose, onSave, client }) {
  const [form, setForm] = useState({ name: '', address: '', email: '', pic: '' });

  useEffect(() => {
    if (client) {
      setForm({ name: client.name, address: client.address, email: client.email, pic: client.pic });
    } else {
      setForm({ name: '', address: '', email: '', pic: '' });
    }
  }, [client, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl ring-1 ring-slate-900/5 w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">
            {client ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company / Client Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-blue sm:text-sm"
              placeholder="PT Example Corp"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">PIC (Person in Charge)</label>
            <input
              type="text"
              required
              value={form.pic}
              onChange={(e) => setForm({ ...form, pic: e.target.value })}
              className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-blue sm:text-sm"
              placeholder="John Doe"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-blue sm:text-sm"
              placeholder="contact@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <input
              type="text"
              required
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="block w-full rounded-md border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-brand-blue sm:text-sm"
              placeholder="Jl. Example No. 1, Jakarta"
            />
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
              className="px-4 py-2 text-sm font-semibold text-white bg-brand-blue rounded-md hover:bg-brand-navy shadow-sm transition"
            >
              {client ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ isOpen, onClose, onConfirm, clientName }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl ring-1 ring-slate-900/5 w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
            <Trash2 className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Client</h3>
          <p className="text-sm text-slate-500">
            Are you sure you want to delete <span className="font-semibold text-slate-700">{clientName}</span>? This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-6 justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white ring-1 ring-inset ring-slate-300 rounded-md hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 shadow-sm transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClientsList() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ open: false, client: null });

  const fetchClients = async () => {
    const data = await api.getClients();
    setClients(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAdd = () => {
    setEditingClient(null);
    setModalOpen(true);
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setModalOpen(true);
  };

  const handleSave = async (formData) => {
    if (editingClient) {
      await api.updateClient(editingClient.id, formData);
    } else {
      await api.createClient(formData);
    }
    setModalOpen(false);
    setEditingClient(null);
    await fetchClients();
  };

  const handleDeleteClick = (client) => {
    setDeleteModal({ open: true, client });
  };

  const handleDeleteConfirm = async () => {
    if (deleteModal.client) {
      await api.deleteClient(deleteModal.client.id);
      setDeleteModal({ open: false, client: null });
      await fetchClients();
    }
  };

  if (loading) return <div className="p-6 text-center text-slate-500">Loading clients...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold leading-7 text-slate-900">Clients</h1>
          <p className="mt-2 text-sm text-slate-500">A list of all your registered clients.</p>
        </div>
        <button
          onClick={handleAdd}
          className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-brand-blue rounded-md hover:bg-brand-navy shadow-sm transition"
        >
          <Plus size={16} /> Add Client
        </button>
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Name</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">PIC</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Address</th>
                    <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 sm:pr-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                        {client.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{client.pic}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{client.email}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{client.address}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-right sm:pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(client)}
                            className="p-1.5 text-slate-400 hover:text-brand-blue transition rounded-md hover:bg-slate-100"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(client)}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition rounded-md hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {clients.length === 0 && (
                    <tr>
                      <td colSpan="5" className="px-3 py-8 text-center text-sm text-gray-500">
                        No clients found. Click "Add Client" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <ClientModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingClient(null); }}
        onSave={handleSave}
        client={editingClient}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, client: null })}
        onConfirm={handleDeleteConfirm}
        clientName={deleteModal.client?.name}
      />
    </div>
  );
}
