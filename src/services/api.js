const API_BASE = '/api';

async function request(url, options = {}) {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  // Handle 401 — redirect to login
  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

export const api = {
  // --- Clients ---
  getClients: () => request('/clients'),

  createClient: (data) => request('/clients', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  updateClient: (id, data) => request(`/clients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  deleteClient: (id) => request(`/clients/${id}`, {
    method: 'DELETE',
  }),

  // --- Documents ---
  getDocuments: async (type = null) => {
    const query = type ? `?type=${type}` : '';
    return request(`/documents${query}`);
  },

  getDocumentById: (id) => request(`/documents/${id}`),

  createDocument: async (documentData, itemsData, laborCostsData) => {
    return request('/documents', {
      method: 'POST',
      body: JSON.stringify({
        ...documentData,
        items: itemsData,
        laborCosts: laborCostsData,
      }),
    });
  },

  updateDocument: async (id, documentData, itemsData, laborCostsData) => {
    return request(`/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...documentData,
        items: itemsData,
        laborCosts: laborCostsData,
      }),
    });
  },

  updateDocumentStatus: (id, newStatus) => request(`/documents/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: newStatus }),
  }),

  // --- Payments ---
  addPayment: (id, paymentData) => request(`/documents/${id}/payments`, {
    method: 'POST',
    body: JSON.stringify(paymentData),
  }),

  // --- Helper (same as before, runs client-side) ---
  calculateTotals: (items, laborCosts, discount = 0) => {
    const itemsTotal = items.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    const laborCostTotal = laborCosts ? laborCosts.reduce((sum, lc) => sum + lc.cost, 0) : 0;
    const subTotal = itemsTotal + laborCostTotal;
    const total = subTotal - discount;
    return { itemsTotal, laborCostTotal, subTotal, total };
  }
};
